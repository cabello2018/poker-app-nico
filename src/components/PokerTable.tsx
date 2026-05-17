import { Card, CardContent } from "./ui/card.tsx";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { buildAdvice, getAdviceColor } from "../lib/adviceEngine";
import type {
  AccionFinalHero,
  CalleAccion,
  Position,
  ResultadoFinal,
  TableState,
  TipoAccionMesa,
} from "../types/poker";
import { CardSlot } from "./CardSlot";
import { PlayerSeat } from "./PlayerSeat";
import { ToggleChip } from "./ToggleChip";

const positionOptions: { value: Position; label: string }[] = [
  { value: "UTG", label: "UTG" },
  { value: "MP", label: "Posición media" },
  { value: "CO", label: "Cutoff" },
  { value: "BTN", label: "Botón" },
  { value: "SB", label: "Ciega chica" },
  { value: "BB", label: "Ciega grande" },
];

const calleOptions: CalleAccion[] = ["Preflop", "Flop", "Turn", "River"];
const accionOptions: TipoAccionMesa[] = ["", "Check", "Call", "Raise", "Bet", "Fold", "All in"];
const accionFinalOptions: AccionFinalHero[] = ["", "CHECK", "CALL", "RAISE", "ALL IN", "FOLD"];

type PokerTableProps = {
  table: TableState;
  onUpdate: (next: TableState) => void;
  onOpenPicker: (zone: "hero" | "board", index: number) => void;
  onReset: () => void;
  onImportCapture?: () => void;
};

export function PokerTable({
  table,
  onUpdate,
  onOpenPicker,
  onReset,
  onImportCapture,
}: PokerTableProps) {
  const advice = buildAdvice(table);

  const addAccionMesa = () => {
    const accion = table.tipoAccion || "Check";

    onUpdate({
      ...table,
      accionesMano: [
        ...table.accionesMano,
        {
          id: Date.now(),
          calle: table.calleActual,
          jugador: table.jugadorAccion || "Hero",
          accion,
          tamano: table.tamanoAccion,
          nota: `${table.calleActual}: ${table.jugadorAccion || "Hero"} hizo ${accion}${
            table.tamanoAccion ? ` ${table.tamanoAccion}` : ""
          }`,
        },
      ],
      tipoAccion: "",
      tamanoAccion: "",
    });
  };

  const removeAccionMesa = (id: number) => {
    onUpdate({
      ...table,
      accionesMano: table.accionesMano.filter((accion) => accion.id !== id),
    });
  };

  return (
    <Card className="rounded-3xl border-neutral-800 bg-[#0b0f14] text-white shadow-2xl">
      <CardContent className="p-3">
        <div className="mb-3 overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-r from-[#171f2d] via-[#111723] to-[#171f2d]">
          <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
            <div>
              <div className="text-sm font-bold tracking-wide">Mesa {table.id}</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/80">
                {table.board.filter(Boolean).length < 3
                  ? "Preflop"
                  : table.board.filter(Boolean).length === 3
                    ? "Flop"
                    : table.board.filter(Boolean).length === 4
                      ? "Turn"
                      : "River"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onImportCapture && (
                <Button
                  variant="outline"
                  className="border-fuchsia-700 bg-fuchsia-900/40 text-fuchsia-200 hover:bg-fuchsia-800"
                  onClick={onImportCapture}
                >
                  Importar captura
                </Button>
              )}

              <Button variant="outline" size="icon" onClick={onReset}>
                ↺
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Jugadores restantes
              </div>
              <Input
                placeholder="Quedan"
                value={table.playersLeft}
                onChange={(e) => onUpdate({ ...table, playersLeft: e.target.value })}
                className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
              />
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Mi posición
              </div>
              <Input
                placeholder="1261 / 1456"
                value={table.tournamentPosition || ""}
                onChange={(e) => onUpdate({ ...table, tournamentPosition: e.target.value })}
                className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
              />
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Puestos pagados
              </div>
              <Input
                placeholder="ITM"
                value={table.paidPlaces}
                onChange={(e) => onUpdate({ ...table, paidPlaces: e.target.value })}
                className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
              />
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Ciegas
              </div>
              <Input
                placeholder="100/200"
                value={table.blinds}
                onChange={(e) => onUpdate({ ...table, blinds: e.target.value })}
                className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
              />
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Notas
              </div>
              <Input
                placeholder="Notas"
                value={table.notes}
                onChange={(e) => onUpdate({ ...table, notes: e.target.value })}
                className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="order-2 grid grid-cols-2 gap-2 rounded-2xl border border-neutral-800 bg-black/55 p-2 sm:grid-cols-4 lg:order-1 lg:w-[170px] lg:flex lg:flex-col">
            <ToggleChip
              active={table.nobodyTalked}
              label="Nadie habló"
              activeClass="border-emerald-500 bg-emerald-700 text-white hover:bg-emerald-600"
              onClick={() => onUpdate({ ...table, nobodyTalked: !table.nobodyTalked })}
            />
            <ToggleChip
              active={table.someoneRaised}
              label="Hicieron raise"
              activeClass="border-amber-500 bg-amber-700 text-white hover:bg-amber-600"
              onClick={() => onUpdate({ ...table, someoneRaised: !table.someoneRaised })}
            />
            <ToggleChip
              active={table.threeBet}
              label="Hicieron 3bet"
              activeClass="border-fuchsia-500 bg-fuchsia-700 text-white hover:bg-fuchsia-600"
              onClick={() => onUpdate({ ...table, threeBet: !table.threeBet })}
            />
            <ToggleChip
              active={table.allIn}
              label="Fueron all in"
              activeClass="border-red-500 bg-red-700 text-white hover:bg-red-600"
              onClick={() => onUpdate({ ...table, allIn: !table.allIn })}
            />
          </div>

          <div className="relative order-1 mx-auto aspect-[52/41] w-full max-w-[520px] lg:order-2 lg:h-[410px]">
            <div className="absolute inset-0 rounded-[170px] border border-emerald-900 bg-[radial-gradient(circle_at_center,_#1b6a4a_0%,_#0f3f2e_60%,_#08241b_100%)] shadow-inner" />

            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl bg-black/40 px-3 py-1 text-xs">
              Pote: {table.pot || 0}
            </div>

            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1.5 sm:gap-2">
              {table.board.map((card, index) => (
                <CardSlot
                  key={index}
                  card={card}
                  onClick={() => onOpenPicker("board", index)}
                />
              ))}
            </div>

            <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-start gap-2 sm:bottom-16 sm:gap-3">
              <div className="flex gap-1.5 sm:gap-2">
                {table.hero.map((card, index) => (
                  <CardSlot
                    key={index}
                    card={card}
                    onClick={() => onOpenPicker("hero", index)}
                  />
                ))}
              </div>

              <div className="min-w-[100px] rounded-xl border border-neutral-700 bg-black/35 p-2 sm:min-w-[110px]">
                <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                  Mis BB
                </div>
                <Input
                  placeholder="BB"
                  value={table.heroBb}
                  onChange={(e) => onUpdate({ ...table, heroBb: e.target.value })}
                  className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0">
              <PlayerSeat className="left-1/2 top-2 -translate-x-[140px] max-sm:-translate-x-[110px]" />
              <PlayerSeat className="left-1/2 top-2 translate-x-[70px] max-sm:translate-x-[55px]" />
              <PlayerSeat className="right-2 top-1/2 -translate-y-[105px] max-sm:-translate-y-[82px]" />
              <PlayerSeat className="right-2 top-1/2 translate-y-[20px] max-sm:translate-y-[12px]" />
              <PlayerSeat className="left-1/2 bottom-2 translate-x-[70px] max-sm:translate-x-[55px]" />
              <PlayerSeat className="left-1/2 bottom-2 -translate-x-[140px] max-sm:-translate-x-[110px]" />
              <PlayerSeat className="left-2 top-1/2 translate-y-[20px] max-sm:translate-y-[12px]" />
              <PlayerSeat className="left-2 top-1/2 -translate-y-[105px] max-sm:-translate-y-[82px]" />
            </div>
          </div>

          <div className="order-3 grid grid-cols-2 gap-2 rounded-2xl border border-neutral-800 bg-black/55 p-2 sm:grid-cols-3 lg:w-[170px] lg:flex lg:flex-col">
            {positionOptions.map((position) => (
              <button
                key={position.value}
                onClick={() => onUpdate({ ...table, position: position.value })}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                  table.position === position.value
                    ? "border-blue-500 bg-blue-700 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {position.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-4 rounded-2xl border p-3 ${getAdviceColor(advice.adviceAction)}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
                Consejo
              </div>
              <div className="text-xl font-bold">{advice.adviceAction}</div>
            </div>

            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
                Tamaño
              </div>
              <div className="text-lg font-semibold">{advice.adviceBb || "-"}</div>
            </div>
          </div>

          <div className="rounded-xl bg-black/20 p-2 text-sm leading-5">
            {advice.adviceReason}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
                Probabilidad
              </div>
              <div className="mt-1 text-lg font-semibold">{advice.adviceProbability}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
                Lectura pro
              </div>
              <div className="mt-1 text-sm font-medium">{advice.proVerdict}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
                Contexto
              </div>
              <div className="mt-1 text-sm leading-5">{advice.positionWarning}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
                Qué te gana
              </div>
              <div className="mt-1 text-sm leading-5">{advice.beatenBy}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-800 bg-black/45 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/80">
                Cierre de mano
              </div>
              <div className="text-xs text-neutral-400">
                Resultado, rivales y cartas vistas al final
              </div>
            </div>

            <Button
              variant="outline"
              className={
                table.trackerVisible
                  ? "border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
                  : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              }
              onClick={() => onUpdate({ ...table, trackerVisible: !table.trackerVisible })}
            >
              Tracker rápido
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Resultado final
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["Gané", "Perdí", "Foldeé"] as ResultadoFinal[]).map((resultado) => (
                  <button
                    key={resultado}
                    onClick={() => onUpdate({ ...table, resultadoFinal: resultado })}
                    className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                      table.resultadoFinal === resultado
                        ? "border-blue-500 bg-blue-700 text-white"
                        : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    {resultado}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Resultado BB
              </div>
              <Input
                placeholder="+18 / -7.5"
                value={table.resultadoBb}
                onChange={(e) => onUpdate({ ...table, resultadoBb: e.target.value })}
                className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
              />
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Acción final
              </div>
              <select
                value={table.accionFinalHero}
                onChange={(e) =>
                  onUpdate({
                    ...table,
                    accionFinalHero: e.target.value as AccionFinalHero,
                  })
                }
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
              >
                {accionFinalOptions.map((accion) => (
                  <option key={accion || "empty"} value={accion}>
                    {accion || "Acción"}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Showdown
              </div>
              <button
                onClick={() => onUpdate({ ...table, huboShowdown: !table.huboShowdown })}
                className={`mt-1 w-full rounded-md border px-2 py-2 text-xs font-semibold ${
                  table.huboShowdown
                    ? "border-emerald-500 bg-emerald-700 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {table.huboShowdown ? "Sí" : "No"}
              </button>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Contra qué perdimos
            </div>
            <Input
              placeholder="Color A alto / full house / escalera / set"
              value={table.contraQuePerdimos}
              onChange={(e) => onUpdate({ ...table, contraQuePerdimos: e.target.value })}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 text-white"
            />
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3">
            {table.rivales.map((rival) => (
              <div key={rival.id} className="rounded-xl border border-neutral-700 bg-black/25 p-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                  {rival.nombre}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="BB rival"
                    value={rival.bb}
                    onChange={(e) =>
                      onUpdate({
                        ...table,
                        rivales: table.rivales.map((item) =>
                          item.id === rival.id ? { ...item, bb: e.target.value } : item
                        ),
                      })
                    }
                    className="w-full border-neutral-700 bg-neutral-900 text-white"
                  />
                  <Input
                    placeholder="Cartas"
                    value={rival.cartas}
                    onChange={(e) =>
                      onUpdate({
                        ...table,
                        rivales: table.rivales.map((item) =>
                          item.id === rival.id ? { ...item, cartas: e.target.value } : item
                        ),
                      })
                    }
                    className="w-full border-neutral-700 bg-neutral-900 text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {table.trackerVisible && (
            <div className="mt-3 rounded-xl border border-neutral-700 bg-black/25 p-2">
              <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                Acciones paso a paso
              </div>

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[120px_140px_140px_1fr_auto]">
                <select
                  value={table.calleActual}
                  onChange={(e) =>
                    onUpdate({ ...table, calleActual: e.target.value as CalleAccion })
                  }
                  className="rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
                >
                  {calleOptions.map((calle) => (
                    <option key={calle} value={calle}>
                      {calle}
                    </option>
                  ))}
                </select>

                <Input
                  placeholder="Jugador"
                  value={table.jugadorAccion}
                  onChange={(e) => onUpdate({ ...table, jugadorAccion: e.target.value })}
                  className="border-neutral-700 bg-neutral-900 text-white"
                />

                <select
                  value={table.tipoAccion}
                  onChange={(e) =>
                    onUpdate({ ...table, tipoAccion: e.target.value as TipoAccionMesa })
                  }
                  className="rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-white"
                >
                  {accionOptions.map((accion) => (
                    <option key={accion || "empty"} value={accion}>
                      {accion || "Acción"}
                    </option>
                  ))}
                </select>

                <Input
                  placeholder="Tamaño / nota"
                  value={table.tamanoAccion}
                  onChange={(e) => onUpdate({ ...table, tamanoAccion: e.target.value })}
                  className="border-neutral-700 bg-neutral-900 text-white"
                />

                <Button
                  className="border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
                  onClick={addAccionMesa}
                >
                  Agregar
                </Button>
              </div>

              {table.accionesMano.length > 0 && (
                <div className="mt-3 space-y-2">
                  {table.accionesMano.map((accion) => (
                    <div
                      key={accion.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-black/35 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-amber-200">{accion.calle}</span>{" "}
                        <span className="text-neutral-300">
                          {accion.jugador} - {accion.accion} {accion.tamano}
                        </span>
                        {accion.nota && (
                          <span className="ml-2 text-neutral-500">{accion.nota}</span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                        onClick={() => removeAccionMesa(accion.id)}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
