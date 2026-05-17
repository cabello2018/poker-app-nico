import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "./components/ui/button.tsx";
import { AuthScreen } from "./components/AuthScreen";
import { PickerModal } from "./components/PickerModal";
import { PokerTable } from "./components/PokerTable";
import { RegistroManoPanel, type RegistroMano } from "./components/RegistroManoModal";
import {
  ImportarCapturaModal,
  type DatosCapturaDetectados,
} from "./components/ImportarCapturaModal";
import { buildAdvice } from "./lib/adviceEngine";
import { saveHand, supabase } from "./lib/supabase";
import type { PickerTarget, TableState } from "./types/poker";

const emptyTable = (id: number): TableState => ({
  id,
  pot: "",
  hero: ["", ""],
  board: ["", "", "", "", ""],
  notes: "",
  playersLeft: "",
  paidPlaces: "",
  tournamentPosition: "",
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
  resultadoFinal: "",
  resultadoBb: "",
  accionFinalHero: "",
  huboShowdown: false,
  contraQuePerdimos: "",
  rivales: [
    { id: 1, nombre: "Rival 1", bb: "", cartas: "" },
    { id: 2, nombre: "Rival 2", bb: "", cartas: "" },
    { id: 3, nombre: "Rival 3", bb: "", cartas: "" },
  ],
  trackerVisible: false,
  calleActual: "Preflop",
  jugadorAccion: "Hero",
  tipoAccion: "",
  tamanoAccion: "",
  accionesMano: [],
});

const emptyRegistro: RegistroMano = {
  pozoBb: "",
  jugadores: [
    { id: 1, nombre: "Rival 1", posicion: "", stackBb: "", cartas: "" },
  ],
  acciones: [
    {
      id: 1,
      calle: "Preflop",
      jugador: "Hero",
      accion: "",
      tamano: "",
      nota: "",
    },
  ],
  ganador: "",
  resumenResultado: "",
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savingHand, setSavingHand] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [registroVisible, setRegistroVisible] = useState(false);
  const [registroMano, setRegistroMano] = useState<RegistroMano>(emptyRegistro);
  const [importarVisible, setImportarVisible] = useState(false);
  const [captureTableId, setCaptureTableId] = useState<number | null>(null);

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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const shownTables = useMemo(
    () => tables.slice(0, visibleTables),
    [tables, visibleTables]
  );

  const gridClass = visibleTables === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2";

  const update = (id: number, data: TableState) => {
    setTables((prev: TableState[]) =>
      prev.map((table: TableState) => (table.id === id ? data : table))
    );
  };

  const applyCaptureToTable = (datos: DatosCapturaDetectados) => {
    const targetTableId = captureTableId ?? shownTables[0]?.id ?? 1;

    setTables((prev: TableState[]) =>
      prev.map((table: TableState) => {
        if (table.id !== targetTableId) return table;

        const now = Date.now();

        const accionesDetectadas: TableState["accionesMano"] =
          datos.accionesMano?.length
            ? datos.accionesMano.map((texto, index) => ({
                id: now + index,
                calle: "Preflop",
                jugador: "Hero",
                accion: "Check",
                tamano: "",
                nota: texto,
              }))
            : [
                {
                  id: now,
                  calle: "Preflop",
                  jugador: "Hero",
                  accion: "Check",
                  tamano: "",
                  nota: "Captura aplicada a la mesa.",
                },
              ];

        return {
          ...table,
          pot: datos.pot || table.pot,
          hero: datos.hero || table.hero,
          board: datos.board || table.board,
          position: datos.position ?? table.position,
          heroBb: datos.heroBb || table.heroBb,
          playersLeft: datos.playersLeft || table.playersLeft,
          paidPlaces: datos.paidPlaces || table.paidPlaces,
          blinds: datos.blinds || table.blinds,
          notes:
            datos.notes ||
            table.notes ||
            "Captura aplicada a esta mesa.",
          someoneRaised: datos.someoneRaised ?? table.someoneRaised,
          nobodyTalked: datos.nobodyTalked ?? table.nobodyTalked,
          threeBet: datos.threeBet ?? table.threeBet,
          allIn: datos.allIn ?? table.allIn,
          resultadoFinal: datos.resultadoFinal ?? table.resultadoFinal,
          resultadoBb: datos.resultadoBb || table.resultadoBb,
          accionFinalHero: datos.accionFinalHero ?? table.accionFinalHero,
          huboShowdown: datos.huboShowdown ?? table.huboShowdown,
          contraQuePerdimos: datos.contraQuePerdimos || table.contraQuePerdimos,
          rivales: datos.rivales?.length ? datos.rivales : table.rivales,
          accionesMano: [...table.accionesMano, ...accionesDetectadas],
        };
      })
    );

    setCaptureTableId(null);
    setImportarVisible(false);
  };

  const getVisibleHandData = () =>
    tables.slice(0, visibleTables).map((table: TableState) => ({
      tableId: table.id,
      hero: table.hero,
      board: table.board,
      position: table.position,
      tournamentPosition: table.tournamentPosition || "",
      heroBb: table.heroBb,
      playersLeft: table.playersLeft,
      paidPlaces: table.paidPlaces,
      blinds: table.blinds,
      notes: table.notes,
      result: table.resultadoFinal,
      netBb: table.resultadoBb,
      heroAction: table.accionFinalHero,
      villainCards: table.rivales,
      showdown: table.huboShowdown,
      finalNotes: table.contraQuePerdimos,
      handHistory: table.accionesMano,
      actions: {
        someoneRaised: table.someoneRaised,
        nobodyTalked: table.nobodyTalked,
        threeBet: table.threeBet,
        allIn: table.allIn,
      },
      advice: buildAdvice(table),
    }));

  const logHand = () => {
    console.log("Manos actuales:", getVisibleHandData());
  };

  const handleSaveHand = async () => {
    setSavingHand(true);
    setSaveMessage("");

    const hands = getVisibleHandData();

    const results = await Promise.all(
      hands.map((hand) =>
        saveHand({
          ...hand,
          registro: registroMano,
        })
      )
    );

    setSavingHand(false);

    const failed = results.some((result) => !result.ok);

    if (failed) {
      setSaveMessage("Error al guardar");
      console.error("Una o más manos no se pudieron guardar:", results);
      return;
    }

    setSaveMessage(hands.length === 1 ? "Mano guardada" : "Manos guardadas");
    console.log("Manos guardadas:", results);

    window.setTimeout(() => {
      setSaveMessage("");
    }, 2500);
  };

  useEffect(() => {
    window.logHand = logHand;
  }, [tables, visibleTables]);

  const applyCard = (card: string) => {
    if (!picker) return;

    setTables((prev: TableState[]) =>
      prev.map((table: TableState) => {
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

    setTables((prev: TableState[]) =>
      prev.map((table: TableState) => {
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
            className={
              visibleTables === count
                ? "border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
                : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
            }
            onClick={() => setVisibleTables(count)}
          >
            {count} mesa{count > 1 ? "s" : ""}
          </Button>
        ))}

        <Button
          variant="outline"
          className={
            registroVisible
              ? "border-blue-500 bg-blue-700 text-white hover:bg-blue-600"
              : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          }
          onClick={() => setRegistroVisible((visible: boolean) => !visible)}
        >
          Registro de mano
        </Button>

        <Button
          variant="outline"
          className="border-emerald-600 bg-emerald-800 text-white hover:bg-emerald-700"
          onClick={handleSaveHand}
          disabled={savingHand}
        >
          {savingHand ? "Guardando..." : "Guardar mano"}
        </Button>

        {saveMessage && (
          <div className="text-sm font-semibold text-emerald-300">
            {saveMessage}
          </div>
        )}

        <Button
          variant="outline"
          className="ml-auto border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          onClick={() => supabase.auth.signOut()}
        >
          Salir
        </Button>
      </div>

      <div className={`grid ${gridClass} gap-4`}>
        {shownTables.map((table: TableState) => (
          <PokerTable
            key={table.id}
            table={table}
            onUpdate={(data) => update(table.id, data)}
            onOpenPicker={(zone, index) =>
              setPicker({ tableId: table.id, zone, index })
            }
            onReset={() => update(table.id, emptyTable(table.id))}
            onImportCapture={() => {
              setCaptureTableId(table.id);
              setImportarVisible(true);
            }}
          />
        ))}
      </div>

      {registroVisible && (
        <RegistroManoPanel registro={registroMano} onChange={setRegistroMano} />
      )}

      {importarVisible && (
        <ImportarCapturaModal
          onClose={() => {
            setImportarVisible(false);
            setCaptureTableId(null);
          }}
          onApply={applyCaptureToTable}
        />
      )}

      {picker && (
        <PickerModal
          onPick={applyCard}
          onClear={clearCard}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
