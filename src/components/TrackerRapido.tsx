import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type {
  AccionMesa,
  CalleAccion,
  JugadorAccion,
  TableState,
  TipoAccionMesa,
} from "../types/poker";

const calleOptions: CalleAccion[] = ["Preflop", "Flop", "Turn", "River"];
const jugadorOptions: JugadorAccion[] = ["Hero", "Rival 1", "Rival 2", "Rival 3"];
const tipoAccionOptions: TipoAccionMesa[] = ["Fold", "Check", "Call", "Bet", "Raise", "All in"];
const tamanoRapidoOptions = ["2.2 BB", "1/3 pot", "1/2 pot", "Pot", "All in"];

type TrackerRapidoProps = {
  table: TableState;
  onUpdate: (next: TableState) => void;
};

export function TrackerRapido({ table, onUpdate }: TrackerRapidoProps) {
  const addAccionMesa = () => {
    if (!table.tipoAccion) return;

    const nextAction: AccionMesa = {
      id: Date.now(),
      calle: table.calleActual,
      jugador: table.jugadorAccion || "Hero",
      accion: table.tipoAccion,
      tamano: table.tamanoAccion,
    
      nota: "",};

    onUpdate({
      ...table,
      accionesMano: [...table.accionesMano, nextAction],
      tamanoAccion: "",
      tipoAccion: "",
    });
  };

  const removeAccionMesa = (id: number) => {
    onUpdate({
      ...table,
      accionesMano: table.accionesMano.filter((accion) => accion.id !== id),
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-neutral-700 bg-black/35 p-2">
      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-[0.24em] text-blue-300/90">
          Tracker rápido
        </div>
        <div className="text-xs text-neutral-400">
          Cargá acciones con botones, sin escribir toda la mano
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Calle</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {calleOptions.map((calle) => (
              <button
                key={calle}
                onClick={() => onUpdate({ ...table, calleActual: calle })}
                className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                  table.calleActual === calle
                    ? "border-blue-500 bg-blue-700 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {calle}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Jugador</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {jugadorOptions.map((jugador) => (
              <button
                key={jugador}
                onClick={() => onUpdate({ ...table, jugadorAccion: jugador })}
                className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                  table.jugadorAccion === jugador
                    ? "border-blue-500 bg-blue-700 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {jugador}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Acción</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {tipoAccionOptions.map((accion) => (
              <button
                key={accion}
                onClick={() => onUpdate({ ...table, tipoAccion: accion })}
                className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                  table.tipoAccion === accion
                    ? "border-blue-500 bg-blue-700 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {accion}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Tamaño</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {tamanoRapidoOptions.map((tamano) => (
              <button
                key={tamano}
                onClick={() => onUpdate({ ...table, tamanoAccion: tamano })}
                className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                  table.tamanoAccion === tamano
                    ? "border-blue-500 bg-blue-700 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {tamano}
              </button>
            ))}
          </div>

          <Input
            placeholder="Custom"
            value={table.tamanoAccion}
            onChange={(e) => onUpdate({ ...table, tamanoAccion: e.target.value })}
            className="mt-2 w-full border-neutral-700 bg-neutral-900 text-white"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="border-emerald-600 bg-emerald-800 text-white hover:bg-emerald-700"
          onClick={addAccionMesa}
        >
          Agregar acción
        </Button>

        <Button
          variant="outline"
          className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          onClick={() => onUpdate({ ...table, accionesMano: [] })}
        >
          Limpiar acciones
        </Button>
      </div>

      {table.accionesMano.length > 0 && (
        <div className="mt-3 space-y-2">
          {table.accionesMano.map((accion, index) => (
            <div
              key={accion.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-black/25 px-3 py-2 text-sm"
            >
              <div className="text-neutral-200">
                <span className="text-neutral-500">{index + 1}.</span>{" "}
                <span className="font-semibold text-blue-300">{accion.calle}</span>{" "}
                - {accion.jugador} - {accion.accion}
                {accion.tamano ? ` - ${accion.tamano}` : ""}
              </div>

              <button
                onClick={() => removeAccionMesa(accion.id)}
                className="text-xs font-semibold text-red-300 hover:text-red-200"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

