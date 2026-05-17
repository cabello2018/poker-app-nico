export type PickerTarget =
  | { tableId: number; zone: "hero" | "board"; index: number }
  | null;

export type AdviceAction = "FOLD" | "CALL" | "RAISE" | "ALL IN" | "CHECK";

export type ProVerdict =
  | "Un pro foldearía"
  | "Un pro pagaría"
  | "Un pro resubiría"
  | "Un pro empujaría"
  | "Spot neutro";

export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB" | "";

export type ResultadoFinal = "" | "Gané" | "Perdí" | "Foldeé";

export type AccionFinalHero = "" | "CHECK" | "CALL" | "RAISE" | "ALL IN" | "FOLD";

export type CalleAccion = "Preflop" | "Flop" | "Turn" | "River";

export type TipoAccionMesa =
  | ""
  | "Check"
  | "Call"
  | "Raise"
  | "Bet"
  | "Fold"
  | "All in";

export type RivalMano = {
  id: number;
  nombre: string;
  bb: string;
  cartas: string;
};

export type AccionMesa = {
  id: number;
  calle: CalleAccion;
  jugador: string;
  accion: TipoAccionMesa;
  tamano: string;
  nota: string;
};

export type TableState = {
  id: number;
  pot: string;
  hero: [string, string];
  board: [string, string, string, string, string];
  notes: string;
  playersLeft: string;
  paidPlaces: string;

  // Posición actual en el torneo, ejemplo: "1261 / 1456"
  tournamentPosition?: string;

  heroBb: string;

  // Posición en la mesa: UTG, MP, CO, BTN, SB, BB
  position: Position;

  blinds: string;
  someoneRaised: boolean;
  nobodyTalked: boolean;
  threeBet: boolean;
  allIn: boolean;

  adviceAction: AdviceAction;
  adviceBb: string;
  adviceReason: string;
  adviceProbability: string;
  proVerdict: ProVerdict;
  positionWarning: string;
  beatenBy: string;

  resultadoFinal: ResultadoFinal;
  resultadoBb: string;
  accionFinalHero: AccionFinalHero;
  huboShowdown: boolean;
  contraQuePerdimos: string;
  rivales: RivalMano[];

  trackerVisible: boolean;
  calleActual: CalleAccion;
  jugadorAccion: string;
  tipoAccion: TipoAccionMesa;
  tamanoAccion: string;
  accionesMano: AccionMesa[];
};

export type AdviceResult = Pick<
  TableState,
  | "adviceAction"
  | "adviceBb"
  | "adviceReason"
  | "adviceProbability"
  | "proVerdict"
  | "positionWarning"
  | "beatenBy"
>;

declare global {
  interface Window {
    logHand: () => void;
  }
}
