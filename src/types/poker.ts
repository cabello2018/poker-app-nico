export type PickerTarget = { tableId: number; zone: "hero" | "board"; index: number } | null;

export type AdviceAction = "FOLD" | "CALL" | "RAISE" | "ALL IN" | "CHECK";

export type ProVerdict =
  | "Un pro foldearía"
  | "Un pro pagaría"
  | "Un pro resubiría"
  | "Un pro empujaría"
  | "Spot neutro";

export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB" | "";

export type TableState = {
  id: number;
  pot: string;
  hero: [string, string];
  board: [string, string, string, string, string];
  notes: string;
  playersLeft: string;
  paidPlaces: string;
  heroBb: string;
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
