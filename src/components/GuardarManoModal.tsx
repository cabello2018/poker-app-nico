import { useState } from "react";

export type HistorialAccion = {
  orden: number;
  calle: "Preflop" | "Flop" | "Turn" | "River";
  texto: string;
};

export type DatosCierreMano = {
  resultado: "Gané" | "Perdí" | "Split" | "Foldeé" | "";
  accionHero: "Check" | "Fold" | "Call" | "Raise" | "All in" | "";
  bbNetas: string;
  cartasRival: string;
  huboShowdown: boolean;
  notasFinales: string;
  historial: HistorialAccion[];
};

type GuardarManoModalProps = {
  abierto: boolean;
  guardando: boolean;
  cantidadMesas: number;
  onCerrar: () => void;
  onGuardar: (datos: DatosCierreMano) => void;
};

const calles: HistorialAccion["calle"][] = ["Preflop", "Flop", "Turn", "River"];

export function GuardarManoModal({
  abierto,
  guardando,
  cantidadMesas,
  onCerrar,
  onGuardar,
}: GuardarManoModalProps) {
  const [resultado, setResultado] = useState<DatosCierreMano["resultado"]>("");
  const [accionHero, setAccionHero] = useState<DatosCierreMano["accionHero"]>("");
  const [bbNetas, setBbNetas] = useState("");
  const [cartasRival, setCartasRival] = useState("");
  const [huboShowdown, setHuboShowdown] = useState(false);
  const [notasFinales, setNotasFinales] = useState("");
  const [historial, setHistorial] = useState<HistorialAccion[]>([
    { orden: 1, calle: "Preflop", texto: "" },
  ]);

  if (!abierto) return null;

  const agregarAccion = () => {
    setHistorial((actual) => [
      ...actual,
      {
        orden: actual.length + 1,
        calle: "Flop",
        texto: "",
      },
    ]);
  };

  const actualizarAccion = (orden: number, cambios: Partial<HistorialAccion>) => {
    setHistorial((actual) =>
      actual.map((accion) => (accion.orden === orden ? { ...accion, ...cambios } : accion))
    );
  };

  const quitarAccion = (orden: number) => {
    setHistorial((actual) =>
      actual
        .filter((accion) => accion.orden !== orden)
        .map((accion, index) => ({ ...accion, orden: index + 1 }))
    );
  };

  const guardar = () => {
    onGuardar({
      resultado,
      accionHero,
      bbNetas,
      cartasRival,
      huboShowdown,
      notasFinales,
      historial: historial.filter((accion) => accion.texto.trim().length > 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 text-white">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-neutral-800 bg-[#0b0f14] p-4 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold tracking-wide">Guardar mano</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/80">
              {cantidadMesas === 1 ? "Cierre de mano" : `Cierre de ${cantidadMesas} manos visibles`}
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Resultado</div>
            <select
              value={resultado}
              onChange={(event) => setResultado(event.target.value as DatosCierreMano["resultado"])}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
            >
              <option value="">Seleccionar</option>
              <option value="Gané">Gané</option>
              <option value="Perdí">Perdí</option>
              <option value="Split">Split</option>
              <option value="Foldeé">Foldeé</option>
            </select>
          </div>

          <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Mi acción final</div>
            <select
              value={accionHero}
              onChange={(event) => setAccionHero(event.target.value as DatosCierreMano["accionHero"])}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
            >
              <option value="">Seleccionar</option>
              <option value="Check">Check</option>
              <option value="Fold">Fold</option>
              <option value="Call">Call</option>
              <option value="Raise">Raise</option>
              <option value="All in">All in</option>
            </select>
          </div>

          <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Resultado en BB</div>
            <input
              value={bbNetas}
              onChange={(event) => setBbNetas(event.target.value)}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              placeholder="+12 / -5 / 0"
            />
          </div>

          <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Cartas rivales</div>
            <input
              value={cartasRival}
              onChange={(event) => setCartasRival(event.target.value)}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              placeholder="Ah Ks / desconocidas"
            />
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-700 bg-black/25 p-2 text-sm text-neutral-200">
          <input
            checked={huboShowdown}
            onChange={(event) => setHuboShowdown(event.target.checked)}
            type="checkbox"
          />
          Hubo showdown
        </label>

        <div className="mt-3 rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Notas finales</div>
          <textarea
            value={notasFinales}
            onChange={(event) => setNotasFinales(event.target.value)}
            className="mt-1 min-h-20 w-full resize-y border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
            placeholder="Cómo terminó la mano, lectura del rival, dudas para revisar..."
          />
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-800 bg-black/35 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold tracking-wide">Paso a paso</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                Línea de tiempo de la mano
              </div>
            </div>
            <button
              onClick={agregarAccion}
              className="rounded-xl border border-blue-500 bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600"
            >
              Agregar acción
            </button>
          </div>

          <div className="space-y-2">
            {historial.map((accion) => (
              <div key={accion.orden} className="grid grid-cols-1 gap-2 rounded-xl border border-neutral-800 bg-black/30 p-2 md:grid-cols-[120px_1fr_auto]">
                <select
                  value={accion.calle}
                  onChange={(event) =>
                    actualizarAccion(accion.orden, {
                      calle: event.target.value as HistorialAccion["calle"],
                    })
                  }
                  className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
                >
                  {calles.map((calle) => (
                    <option key={calle} value={calle}>
                      {calle}
                    </option>
                  ))}
                </select>

                <input
                  value={accion.texto}
                  onChange={(event) => actualizarAccion(accion.orden, { texto: event.target.value })}
                  className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
                  placeholder={`Acción ${accion.orden}: ejemplo, hice raise y pagaron 3`}
                />

                <button
                  onClick={() => quitarAccion(accion.orden)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 rounded-xl border border-emerald-500 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar mano"}
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
