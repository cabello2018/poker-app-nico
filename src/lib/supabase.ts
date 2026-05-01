import { createClient } from "@supabase/supabase-js";
import type { AdviceResult, Position } from "../types/poker";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("hands")
    .insert({
      user_id: user?.id,
      hero: hand.hero,
      board: hand.board,
      position: hand.position,
      hero_bb: hand.heroBb,
      players_left: hand.playersLeft,
      paid_places: hand.paidPlaces,
      blinds: hand.blinds,
      actions: hand.actions,
      advice: hand.advice,
    })
    .select()
    .single();

  if (error) {
    console.error("Error guardando mano:", error);
    return {
      ok: false,
      error,
    };
  }

  return {
    ok: true,
    data,
  };
}
