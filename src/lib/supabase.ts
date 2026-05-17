import { createClient } from "@supabase/supabase-js";
import type {
  AccionFinalHero,
  AccionMesa,
  AdviceResult,
  Position,
  ResultadoFinal,
  RivalMesa,
} from "../types/poker";
import type { RegistroMano } from "../components/RegistroManoModal";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SaveHandInput = {
  tableId?: number;
  hero: [string, string];
  board: [string, string, string, string, string];
  position: Position;
  heroBb: string;
  playersLeft: string;
  paidPlaces: string;
  blinds: string;
  notes?: string;
  actions: {
    someoneRaised: boolean;
    nobodyTalked: boolean;
    threeBet: boolean;
    allIn: boolean;
  };
  advice: AdviceResult;
  resultadoFinal?: ResultadoFinal;
  resultadoBb?: string;
  accionFinalHero?: AccionFinalHero;
  huboShowdown?: boolean;
  contraQuePerdimos?: string;
  rivales?: RivalMesa[];
  accionesMano?: AccionMesa[];
  registro?: RegistroMano;
};

export async function saveHand(hand: SaveHandInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("No hay usuario autenticado:", userError);
    return {
      ok: false,
      error: userError ?? new Error("No authenticated user"),
    };
  }

  const accionesFinales =
    hand.accionesMano && hand.accionesMano.length > 0
      ? hand.accionesMano
      : hand.registro?.acciones || [];

  const { data, error } = await supabase
    .from("hands")
    .insert({
      user_id: user.id,
      table_id: hand.tableId,
      hero: hand.hero,
      board: hand.board,
      position: hand.position,
      hero_bb: hand.heroBb,
      players_left: hand.playersLeft,
      paid_places: hand.paidPlaces,
      blinds: hand.blinds,
      notes: hand.notes,
      actions: hand.actions,
      advice: hand.advice,

      result: hand.resultadoFinal || null,
      net_bb: hand.resultadoBb || null,
      hero_action: hand.accionFinalHero || null,
      villain_cards: hand.rivales || [],
      showdown: hand.huboShowdown ?? null,
      final_notes: hand.contraQuePerdimos || null,
      hand_history: accionesFinales,

      pot_bb: hand.registro?.pozoBb || null,
      players: hand.registro?.jugadores || hand.rivales || [],
      street_actions: accionesFinales,
      winner: hand.registro?.ganador || hand.resultadoFinal || null,
      result_summary: hand.registro?.resumenResultado || hand.contraQuePerdimos || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error guardando mano:", error);
    return { ok: false, error };
  }

  return { ok: true, data };
}
