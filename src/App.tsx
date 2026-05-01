import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "./components/ui/button.tsx";
import { AuthScreen } from "./components/AuthScreen";
import { PickerModal } from "./components/PickerModal";
import { PokerTable } from "./components/PokerTable";
import { buildAdvice } from "./lib/adviceEngine";
import { supabase } from "./lib/supabase";
import type { PickerTarget, TableState } from "./types/poker";

const emptyTable = (id: number): TableState => ({
  id,
  pot: "",
  hero: ["", ""],
  board: ["", "", "", "", ""],
  notes: "",
  playersLeft: "",
  paidPlaces: "",
  heroBb: "",
  position: "",
  blinds: "",
  someoneRaised: false,
  nobodyTalked: true,
  threeBet: false,
  allIn: false,
  adviceAction: "CHECK",
  adviceBb: "",
  adviceReason: "Completá los datos de la mano para recibir una recomendación seria.",
  adviceProbability: "0%",
  proVerdict: "Spot neutro",
  positionWarning: "Cargá cartas, stack, posición y contexto para afinar el spot.",
  beatenBy: "Cargá flop o más contexto para estimar qué rangos te superan.",
});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tables, setTables] = useState<TableState[]>([
    emptyTable(1),
    emptyTable(2),
    emptyTable(3),
    emptyTable(4),
  ]);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [visibleTables, setVisibleTables] = useState<number>(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logHand = () => {
    const currentTables = tables.slice(0, visibleTables);

    console.log(
      "Manos actuales:",
      currentTables.map((table) => ({
        tableId: table.id,
        hero: table.hero,
        board: table.board,
        position: table.position,
        heroBb: table.heroBb,
        playersLeft: table.playersLeft,
        paidPlaces: table.paidPlaces,
        blinds: table.blinds,
        actions: {
          someoneRaised: table.someoneRaised,
          nobodyTalked: table.nobodyTalked,
          threeBet: table.threeBet,
          allIn: table.allIn,
        },
        advice: buildAdvice(table),
      }))
    );
  };

  useEffect(() => {
    window.logHand = logHand;
  }, [tables, visibleTables]);

  const update = (id: number, data: TableState) => {
    setTables((prev) => prev.map((table) => (table.id === id ? data : table)));
  };

  const applyCard = (card: string) => {
    if (!picker) return;

    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== picker.tableId) return table;

        if (picker.zone === "hero") {
          const hero = [...table.hero] as [string, string];
          hero[picker.index] = card;
          return { ...table, hero };
        }

        const board = [...table.board] as [string, string, string, string, string];
        board[picker.index] = card;
        return { ...table, board };
      })
    );

    setPicker(null);
  };

  const clearCard = () => {
    if (!picker) return;

    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== picker.tableId) return table;

        if (picker.zone === "hero") {
          const hero = [...table.hero] as [string, string];
          hero[picker.index] = "";
          return { ...table, hero };
        }

        const board = [...table.board] as [string, string, string, string, string];
        board[picker.index] = "";
        return { ...table, board };
      })
    );

    setPicker(null);
  };

  const shownTables = useMemo(() => tables.slice(0, visibleTables), [tables, visibleTables]);
  const gridClass = visibleTables === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Cargando...
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-black p-2 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-800 bg-[#0b0f14] p-3">
        <div className="mr-2 text-sm font-semibold text-white">Mesas visibles</div>
        {[1, 2, 3, 4].map((count) => (
          <Button
            key={count}
            variant="outline"
            className={visibleTables === count ? "border-blue-500 bg-blue-700 text-white hover:bg-blue-600" : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"}
            onClick={() => setVisibleTables(count)}
          >
            {count} mesa{count > 1 ? "s" : ""}
          </Button>
        ))}

        <Button
          variant="outline"
          className="ml-auto border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          onClick={() => supabase.auth.signOut()}
        >
          Salir
        </Button>
      </div>

      <div className={`grid ${gridClass} gap-4`}>
        {shownTables.map((table) => (
          <PokerTable
            key={table.id}
            table={table}
            onUpdate={(data) => update(table.id, data)}
            onOpenPicker={(zone, index) => setPicker({ tableId: table.id, zone, index })}
            onReset={() => update(table.id, emptyTable(table.id))}
          />
        ))}
      </div>

      {picker && <PickerModal onPick={applyCard} onClear={clearCard} onClose={() => setPicker(null)} />}
    </div>
  );
}
