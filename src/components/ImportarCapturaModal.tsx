import { useMemo, useState } from "react";
import { createWorker } from "tesseract.js";
import { Button } from "./ui/button.tsx";
import type { AccionFinalHero, Position, ResultadoFinal } from "../types/poker";

type RivalDetectado = {
  id: number;
  nombre: string;
  bb: string;
  cartas: string;
};

export type DatosCapturaDetectados = {
  hero?: [string, string];
  board?: [string, string, string, string, string];
  position?: Position;
  heroBb?: string;
  playersLeft?: string;
  paidPlaces?: string;
  blinds?: string;
  pot?: string;
  notes?: string;
  someoneRaised?: boolean;
  nobodyTalked?: boolean;
  threeBet?: boolean;
  allIn?: boolean;
  resultadoFinal?: ResultadoFinal;
  resultadoBb?: string;
  accionFinalHero?: AccionFinalHero;
  huboShowdown?: boolean;
  contraQuePerdimos?: string;
  rivales?: RivalDetectado[];
  accionesMano?: string[];
};

type ImportarCapturaModalProps = {
  onClose: () => void;
  onApply: (datos: DatosCapturaDetectados) => void;
};

type CardValue = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2" | "";
type CardSuit = "s" | "h" | "d" | "c" | "";

type DetectedCard = {
  label: string;
  value: CardValue;
  suit: CardSuit;
  image: string;
  isVisible: boolean;
};

const values: CardValue[] = ["", "A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

const suits: { value: CardSuit; label: string }[] = [
  { value: "", label: "-" },
  { value: "s", label: "♠" },
  { value: "h", label: "♥" },
  { value: "d", label: "♦" },
  { value: "c", label: "♣" },
];

function toCard(value: CardValue, suit: CardSuit) {
  if (!value || !suit) return "";
  return `${value}${suit}`;
}

function normalizeRank(text: string): CardValue {
  const upper = text.toUpperCase();

  if (upper.includes("10") || upper.includes("IO") || upper.includes("1O") || upper.includes("T")) return "T";
  if (upper.includes("A")) return "A";
  if (upper.includes("K")) return "K";
  if (upper.includes("Q") || upper.includes("O")) return "Q";
  if (upper.includes("J")) return "J";
  if (upper.includes("9")) return "9";
  if (upper.includes("8") || upper.includes("B")) return "8";
  if (upper.includes("7")) return "7";
  if (upper.includes("6")) return "6";
  if (upper.includes("5") || upper.includes("S")) return "5";
  if (upper.includes("4")) return "4";
  if (upper.includes("3")) return "3";
  if (upper.includes("2") || upper.includes("Z")) return "2";

  return "";
}

function cropCanvas(source: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(source, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBase64(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

function prepareForOcr(canvas: HTMLCanvasElement) {
  const scale = 5;
  const prepared = document.createElement("canvas");
  prepared.width = canvas.width * scale;
  prepared.height = canvas.height * scale;

  const ctx = prepared.getContext("2d");
  if (!ctx) return canvasToBase64(canvas);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, prepared.width, prepared.height);

  const imageData = ctx.getImageData(0, 0, prepared.width, prepared.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const darkText = r < 120 && g < 120 && b < 120;
    const redText = r > 135 && g < 100 && b < 100;

    if (darkText || redText) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    } else {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return prepared.toDataURL("image/png");
}

function cardLooksVisible(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let brightPixels = 0;
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    totalPixels += 1;

    if (r > 170 && g > 170 && b > 165) {
      brightPixels += 1;
    }
  }

  return brightPixels / totalPixels > 0.16;
}

function detectSuitFromPixels(canvas: HTMLCanvasElement): CardSuit {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let redScore = 0;
  let blackScore = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r > 135 && g < 100 && b < 100) redScore += 1;
    if (r < 85 && g < 85 && b < 85) blackScore += 1;
  }

  if (redScore > 16 && redScore > blackScore * 0.35) return "h";
  if (blackScore > 16) return "s";

  return "";
}

async function readRankFromCard(cardCanvas: HTMLCanvasElement): Promise<CardValue> {
  const corner = document.createElement("canvas");
  corner.width = Math.round(cardCanvas.width * 0.58);
  corner.height = Math.round(cardCanvas.height * 0.42);

  const cornerCtx = corner.getContext("2d");
  if (!cornerCtx) return "";

  cornerCtx.drawImage(
    cardCanvas,
    0,
    0,
    corner.width,
    corner.height,
    0,
    0,
    corner.width,
    corner.height
  );

  const worker = await createWorker("eng");

  await worker.setParameters({
    tessedit_char_whitelist: "AKQJT9876543210IOBZS",
    tessedit_pageseg_mode: 7 as never,

  });

  const result = await worker.recognize(prepareForOcr(corner));
  await worker.terminate();

  return normalizeRank(result.data.text);
}

function getGgPokerCardRects(width: number, height: number) {
  return [
    {
      label: "Hero 1",
      index: 0,
      x: width * 0.438,
      y: height * 0.676,
      w: width * 0.065,
      h: height * 0.175,
    },
    {
      label: "Hero 2",
      index: 1,
      x: width * 0.504,
      y: height * 0.676,
      w: width * 0.065,
      h: height * 0.175,
    },
    {
      label: "Board 1",
      index: 2,
      x: width * 0.310,
      y: height * 0.315,
      w: width * 0.074,
      h: height * 0.17,
    },
    {
      label: "Board 2",
      index: 3,
      x: width * 0.397,
      y: height * 0.315,
      w: width * 0.074,
      h: height * 0.17,
    },
    {
      label: "Board 3",
      index: 4,
      x: width * 0.484,
      y: height * 0.315,
      w: width * 0.074,
      h: height * 0.17,
    },
    {
      label: "Board 4",
      index: 5,
      x: width * 0.571,
      y: height * 0.315,
      w: width * 0.074,
      h: height * 0.17,
    },
    {
      label: "Board 5",
      index: 6,
      x: width * 0.658,
      y: height * 0.315,
      w: width * 0.074,
      h: height * 0.17,
    },
  ];
}

async function analyzeCards(imageBase64: string): Promise<{
  datos: DatosCapturaDetectados;
  cards: DetectedCard[];
  message: string;
}> {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = imageBase64;
  });

  const rects = getGgPokerCardRects(image.naturalWidth, image.naturalHeight);
  const cards: DetectedCard[] = [];

  for (const rect of rects) {
    const cardCanvas = cropCanvas(image, rect.x, rect.y, rect.w, rect.h);
    const imageCrop = canvasToBase64(cardCanvas);
    const visible = cardLooksVisible(cardCanvas);

    let value: CardValue = "";
    let suit: CardSuit = "";

    if (visible) {
      try {
        value = await readRankFromCard(cardCanvas);
        suit = detectSuitFromPixels(cardCanvas);
      } catch {
        value = "";
        suit = "";
      }
    }

    cards.push({
      label: rect.label,
      value,
      suit,
      image: imageCrop,
      isVisible: visible,
    });
  }

  const hero: [string, string] = [
    toCard(cards[0].value, cards[0].suit),
    toCard(cards[1].value, cards[1].suit),
  ];

  const board: [string, string, string, string, string] = [
    toCard(cards[2].value, cards[2].suit),
    toCard(cards[3].value, cards[3].suit),
    toCard(cards[4].value, cards[4].suit),
    toCard(cards[5].value, cards[5].suit),
    toCard(cards[6].value, cards[6].suit),
  ];

  const message = [
    `Hero 1: ${hero[0] || "no leída"}`,
    `Hero 2: ${hero[1] || "no leída"}`,
    `Board 1: ${board[0] || "vacía/no leída"}`,
    `Board 2: ${board[1] || "vacía/no leída"}`,
    `Board 3: ${board[2] || "vacía/no leída"}`,
    `Board 4: ${board[3] || "vacía/no leída"}`,
    `Board 5: ${board[4] || "vacía/no leída"}`,
  ].join(" / ");

  return {
    cards,
    message,
    datos: {
      hero,
      board,
      notes: "OCR local: cartas detectadas por zonas fijas GG Poker.",
      accionesMano: ["Captura analizada en Fase A: solo cartas."],
    },
  };
}

export function ImportarCapturaModal({ onClose, onApply }: ImportarCapturaModalProps) {
  const [preview, setPreview] = useState("");
  const [datos, setDatos] = useState<DatosCapturaDetectados | null>(null);
  const [cards, setCards] = useState<DetectedCard[]>([]);
  const [message, setMessage] = useState("Todavía no hay datos detectados.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canApply = useMemo(() => Boolean(datos), [datos]);

  const rebuildDatosFromCards = (nextCards: DetectedCard[]) => {
    const hero: [string, string] = [
      toCard(nextCards[0]?.value || "", nextCards[0]?.suit || ""),
      toCard(nextCards[1]?.value || "", nextCards[1]?.suit || ""),
    ];

    const board: [string, string, string, string, string] = [
      toCard(nextCards[2]?.value || "", nextCards[2]?.suit || ""),
      toCard(nextCards[3]?.value || "", nextCards[3]?.suit || ""),
      toCard(nextCards[4]?.value || "", nextCards[4]?.suit || ""),
      toCard(nextCards[5]?.value || "", nextCards[5]?.suit || ""),
      toCard(nextCards[6]?.value || "", nextCards[6]?.suit || ""),
    ];

    setDatos({
      hero,
      board,
      notes: "OCR local: cartas detectadas/revisadas por zonas fijas GG Poker.",
      accionesMano: ["Cartas importadas desde captura en Fase A."],
    });
  };

  const handleFile = (file: File | null) => {
    setError("");
    setDatos(null);
    setCards([]);
    setMessage("Todavía no hay datos detectados.");

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(String(reader.result || ""));
    };

    reader.readAsDataURL(file);
  };

  const analyzeLocal = async () => {
    setError("");

    if (!preview) {
      setError("Primero seleccioná una captura.");
      return;
    }

    setLoading(true);
    setMessage("Analizando cartas...");

    try {
      const result = await analyzeCards(preview);
      setCards(result.cards);
      setDatos(result.datos);
      setMessage(`Análisis listo. ${result.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo analizar la captura.");
      setMessage("Todavía no hay datos detectados.");
    } finally {
      setLoading(false);
    }
  };

  const updateCard = (index: number, field: "value" | "suit", value: string) => {
    setCards((prev) => {
      const next = prev.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card
      );

      rebuildDatosFromCards(next);
      return next;
    });
  };

  const apply = () => {
    if (!datos) return;
    onApply(datos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/75 p-4">
      <div className="w-full max-w-6xl rounded-2xl border border-neutral-800 bg-[#0b0f14] p-4 text-white shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold">Importar captura</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-yellow-300">
              Fase A / solo cartas
            </div>
          </div>

          <Button
            variant="outline"
            className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-700 bg-black/25 p-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Captura
            </div>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleFile(event.target.files?.[0] || null)}
              className="mb-3 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
            />

            {preview && (
              <img
                src={preview}
                alt="Captura importada"
                className="max-h-[360px] w-full rounded-lg border border-neutral-700 object-contain"
              />
            )}

            <div className="mt-3 rounded-xl border border-amber-700 bg-amber-950/30 p-3 text-xs leading-5 text-amber-200">
              Consejo: para esta fase subí una captura limpia de GG Poker. Si subís una captura donde aparece esta app o el modal, puede leer mal.
            </div>
          </div>

          <div className="rounded-xl border border-neutral-700 bg-black/25 p-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Datos detectados
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-red-600 bg-red-950/40 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mb-3 rounded-xl border border-neutral-700 bg-black/30 p-3 text-sm text-neutral-300">
              {message}
            </div>

            <div className="mb-4 flex gap-2">
              <Button
                className="flex-1 border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
                onClick={analyzeLocal}
                disabled={loading}
              >
                {loading ? "Analizando..." : "Analizar cartas"}
              </Button>

              <Button
                className="flex-1 border-emerald-500 bg-emerald-700 text-white hover:bg-emerald-600"
                onClick={apply}
                disabled={!canApply || loading}
              >
                Aplicar a mesa
              </Button>
            </div>

            {cards.length > 0 && (
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {cards.map((card, index) => (
                  <div key={card.label} className="rounded-xl border border-neutral-700 bg-black/35 p-2">
                    <div className="mb-2 text-center text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                      {card.label}
                    </div>

                    {card.image && (
                      <img
                        src={card.image}
                        alt={card.label}
                        className="mx-auto mb-2 h-24 rounded border border-neutral-700 object-contain"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={card.value}
                        onChange={(event) => updateCard(index, "value", event.target.value)}
                        className="rounded-md border border-neutral-700 bg-neutral-900 p-2 text-white"
                      >
                        {values.map((value) => (
                          <option key={value || "empty"} value={value}>
                            {value || "-"}
                          </option>
                        ))}
                      </select>

                      <select
                        value={card.suit}
                        onChange={(event) => updateCard(index, "suit", event.target.value)}
                        className="rounded-md border border-neutral-700 bg-neutral-900 p-2 text-white"
                      >
                        {suits.map((suit) => (
                          <option key={suit.value || "empty"} value={suit.value}>
                            {suit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {datos && (
              <pre className="mt-4 max-h-[220px] overflow-auto rounded-xl border border-neutral-700 bg-black/40 p-3 text-xs text-emerald-200">
                {JSON.stringify(datos, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
