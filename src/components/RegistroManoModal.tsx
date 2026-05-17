import { Button } from "./ui/button";

export type JugadorMano = {
  id: number;
  nombre: string;
  posicion: string;
  stackBb: string;
  cartas: string;
};

export type AccionCalle = {
  id: number;
  calle: "Preflop" | "Flop" | "Turn" | "River";
  jugador: string;
  accion: "Fold" | "Check" | "Call" | "Bet" | "Raise" | "All in" | "";
  tamano: string;
  nota: string;
};

export type RegistroMano = {
  pozoBb: string;
  jugadores: JugadorMano[];
  acciones: AccionCalle[];
  ganador: string;
  resumenResultado: string;
};

type RegistroManoPanelProps = {
  registro: RegistroMano;
  onChange: (next: RegistroMano) => void;
};

const calles: AccionCalle["calle"][] = ["Preflop", "Flop", "Turn", "River"];
const acciones: AccionCalle["accion"][] = ["", "Fold", "Check", "Call", "Bet", "Raise", "All in"];

export function RegistroManoPanel({ registro, onChange }: RegistroManoPanelProps) {
  const updateJugador = (id: number, field: keyof JugadorMano, value: string) => {
    onChange({
      ...registro,
      jugadores: registro.jugadores.map((jugador) =>
        jugador.id === id ? { ...jugador, [field]: value } : jugador
      ),
    });
  };

  const addJugador = () => {
    const nextId = Math.max(0, ...registro.jugadores.map((jugador) => jugador.id)) + 1;

    onChange({
      ...registro,
      jugadores: [
        ...registro.jugadores,
        { id: nextId, nombre: `Rival ${nextId}`, posicion: "", stackBb: "", cartas: "" },
      ],
    });
  };

  const removeJugador = (id: number) => {
    onChange({
      ...registro,
      jugadores: registro.jugadores.filter((jugador) => jugador.id !== id),
    });
  };

  const updateAccion = (id: number, field: keyof AccionCalle, value: string) => {
    onChange({
      ...registro,
      acciones: registro.acciones.map((accion) =>
        accion.id === id ? { ...accion, [field]: value } : accion
      ),
    });
  };

  const addAccion = () => {
    const nextId = Math.max(0, ...registro.acciones.map((accion) => accion.id)) + 1;

    onChange({
      ...registro,
      acciones: [
        ...registro.acciones,
        {
          id: nextId,
          calle: "Preflop",
          jugador: "",
          accion: "",
          tamano: "",
          nota: "",
        },
      ],
    });
  };

  const removeAccion = (id: number) => {
    onChange({
      ...registro,
      acciones: registro.acciones.filter((accion) => accion.id !== id),
    });
  };

  return (
    <div className="mt-4 rounded-2xl border border-neutral-800 bg-[#0b0f14] p-3 text-white">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold tracking-wide">Registro de mano</div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/80">
            Datos completos de la mano
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
            Pozo final en BB
          </div>
          <input
            value={registro.pozoBb}
            onChange={(event) => onChange({ ...registro, pozoBb: event.target.value })}
            placeholder="Ej: 18.5"
            className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
          />
        </div>

        <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
            Ganador
          </div>
          <input
            value={registro.ganador}
            onChange={(event) => onChange({ ...registro, ganador: event.target.value })}
            placeholder="Hero / Rival 1"
            className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-neutral-700 bg-black/25 p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Jugadores / rivales</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Stacks y cartas vistas
            </div>
          </div>

          <Button
            variant="outline"
            className="border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
            onClick={addJugador}
          >
            Agregar rival
          </Button>
        </div>

        <div className="space-y-2">
          {registro.jugadores.map((jugador) => (
            <div key={jugador.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_120px_1fr_auto]">
              <input
                value={jugador.nombre}
                onChange={(event) => updateJugador(jugador.id, "nombre", event.target.value)}
                placeholder="Rival 1"
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />
              <input
                value={jugador.posicion}
                onChange={(event) => updateJugador(jugador.id, "posicion", event.target.value)}
                placeholder="BTN / SB"
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />
              <input
                value={jugador.stackBb}
                onChange={(event) => updateJugador(jugador.id, "stackBb", event.target.value)}
                placeholder="BB"
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />
              <input
                value={jugador.cartas}
                onChange={(event) => updateJugador(jugador.id, "cartas", event.target.value)}
                placeholder="Ah Ks / desconocidas"
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />
              <Button
                variant="outline"
                className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                onClick={() => removeJugador(jugador.id)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-neutral-700 bg-black/25 p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Acciones paso a paso</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Preflop, flop, turn y river
            </div>
          </div>

          <Button
            variant="outline"
            className="border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
            onClick={addAccion}
          >
            Agregar acción
          </Button>
        </div>

        <div className="space-y-2">
          {registro.acciones.map((accion) => (
            <div key={accion.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[130px_1fr_120px_120px_1fr_auto]">
              <select
                value={accion.calle}
                onChange={(event) => updateAccion(accion.id, "calle", event.target.value)}
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              >
                {calles.map((calle) => (
                  <option key={calle} value={calle}>
                    {calle}
                  </option>
                ))}
              </select>

              <input
                value={accion.jugador}
                onChange={(event) => updateAccion(accion.id, "jugador", event.target.value)}
                placeholder="Hero / Rival 1"
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />

              <select
                value={accion.accion}
                onChange={(event) => updateAccion(accion.id, "accion", event.target.value)}
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              >
                {acciones.map((item) => (
                  <option key={item || "empty"} value={item}>
                    {item || "Acción"}
                  </option>
                ))}
              </select>

              <input
                value={accion.tamano}
                onChange={(event) => updateAccion(accion.id, "tamano", event.target.value)}
                placeholder="2.2 BB / 50%"
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />

              <input
                value={accion.nota}
                onChange={(event) => updateAccion(accion.id, "nota", event.target.value)}
                placeholder="Pagaron 2, rival tanqueó, etc."
                className="border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              />

              <Button
                variant="outline"
                className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                onClick={() => removeAccion(accion.id)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-neutral-700 bg-black/25 p-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
          Resumen final
        </div>
        <textarea
          value={registro.resumenResultado}
          onChange={(event) => onChange({ ...registro, resumenResultado: event.target.value })}
          placeholder="Gané +12 BB con trips / perdí contra color / dudas para revisar..."
          className="mt-1 min-h-[80px] w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
        />
      </div>
    </div>
  );
}
