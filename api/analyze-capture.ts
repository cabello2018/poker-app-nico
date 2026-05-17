declare const process: {
  env: {
    OPENAI_API_KEY?: string;
  };
};

type VercelRequest = {
  method?: string;
  body?: {
    imageBase64?: string;
  };
};

type VercelResponse = {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Falta OPENAI_API_KEY en variables de entorno." });
  }

  const imageBase64 = req.body?.imageBase64;

  if (!imageBase64) {
    return res.status(400).json({ error: "Falta la imagen." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analizá esta captura de mesa de poker solo para revisión/entrenamiento.

Devolvé SOLO JSON válido, sin markdown.

Formato:
{
  "hero": ["", ""],
  "board": ["", "", "", "", ""],
  "position": "",
  "heroBb": "",
  "playersLeft": "",
  "paidPlaces": "",
  "blinds": "",
  "pot": "",
  "notes": "",
  "someoneRaised": false,
  "nobodyTalked": true,
  "threeBet": false,
  "allIn": false,
  "resultadoFinal": "",
  "resultadoBb": "",
  "accionFinalHero": "",
  "huboShowdown": false,
  "contraQuePerdimos": "",
  "rivales": [
    { "id": 1, "nombre": "Rival 1", "bb": "", "cartas": "" },
    { "id": 2, "nombre": "Rival 2", "bb": "", "cartas": "" },
    { "id": 3, "nombre": "Rival 3", "bb": "", "cartas": "" }
  ],
  "accionesMano": []
}

Si no estás seguro de un dato, dejalo vacío.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `OpenAI rechazó la captura. Detalle: ${raw}`,
      });
    }

    const data = JSON.parse(raw);
    const text = data.choices?.[0]?.message?.content || "";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
