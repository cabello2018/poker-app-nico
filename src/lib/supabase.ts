import type { AdviceResult, Position } from "../types/poker";

type SaveHandInput = {
  hero: [string, string];
  board: [string, string, string, string, string];
  position: Position;
  heroBb: string;
  playersLeft: string;
  paidPlaces: string;
  blinds: string;
  actions: {
    someoneRaised: boolean;
    nobodyTalked: boolean;
    threeBet: boolean;
    allIn: boolean;
  };
  advice: AdviceResult;
};

export async function saveHand(hand: SaveHandInput) {
  console.log("Supabase saveHand preparado:", hand);

  return {
    ok: true,
    data: hand,
  };
}
