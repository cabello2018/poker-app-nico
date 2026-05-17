import type {
  AdviceAction,
  AdviceResult,
  ProVerdict,
  TableState,
} from "../types/poker";

export function normalizeRank(card: string) {
  const value = card.slice(0, -1);
  const map: Record<string, number> = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    T: 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2,
  };

  return map[value] || 0;
}

export function cardLabel(card: string) {
  if (!card) return "+";

  const value = card.slice(0, -1);
  const suit = card.slice(-1);
  const suitLabel =
    suit === "s" ? "♠" : suit === "h" ? "♥" : suit === "d" ? "♦" : "♣";

  return `${value}${suitLabel}`;
}

export function getAdviceColor(action: AdviceAction) {
  if (action === "FOLD") return "border-red-700 bg-red-950/40 text-red-300";
  if (action === "CALL") return "border-blue-700 bg-blue-950/40 text-blue-300";
  if (action === "RAISE") return "border-amber-700 bg-amber-950/40 text-amber-300";
  if (action === "ALL IN") return "border-fuchsia-700 bg-fuchsia-950/40 text-fuchsia-300";
  return "border-emerald-700 bg-emerald-950/40 text-emerald-300";
}

function toNumber(value: string | undefined) {
  return Number(String(value || "").replace(/[^\d.]/g, "")) || 0;
}

function parseTournamentPosition(value: string | undefined) {
  const numbers = String(value || "")
    .match(/\d+/g)
    ?.map(Number) || [];

  return {
    currentPosition: numbers[0] || 0,
    totalPlayers: numbers[1] || 0,
  };
}

function buildBubbleContext(table: TableState) {
  const playersLeft = toNumber(table.playersLeft);
  const paidPlaces = toNumber(table.paidPlaces);
  const { currentPosition, totalPlayers } = parseTournamentPosition(
    table.tournamentPosition
  );

  const distanceToPaid =
    playersLeft > 0 && paidPlaces > 0 ? playersLeft - paidPlaces : 0;

  const criticalWindow =
    paidPlaces > 0 ? Math.max(3, Math.round(paidPlaces * 0.05)) : 0;

  const nearWindow =
    paidPlaces > 0 ? Math.max(8, Math.round(paidPlaces * 0.12)) : 0;

  const isNearByPlayers =
    playersLeft > paidPlaces &&
    paidPlaces > 0 &&
    distanceToPaid <= nearWindow;

  const isCriticalByPlayers =
    playersLeft > paidPlaces &&
    paidPlaces > 0 &&
    distanceToPaid <= criticalWindow;

  const isNearByPosition =
    currentPosition > paidPlaces &&
    paidPlaces > 0 &&
    currentPosition <= paidPlaces + Math.max(20, Math.round(paidPlaces * 0.15));

  const isPaidByPosition =
    currentPosition > 0 && paidPlaces > 0 && currentPosition <= paidPlaces;

  const pressure: "normal" | "near" | "critical" =
    isCriticalByPlayers || isNearByPosition
      ? "critical"
      : isNearByPlayers
        ? "near"
        : "normal";

  const parts: string[] = [];

  if (playersLeft && paidPlaces) {
    parts.push(`Quedan ${playersLeft} jugadores y cobran ${paidPlaces}`);
  }

  if (currentPosition) {
    parts.push(
      `tu posición actual es ${currentPosition}${totalPlayers ? `/${totalPlayers}` : ""}`
    );
  }

  return {
    playersLeft,
    paidPlaces,
    currentPosition,
    totalPlayers,
    distanceToPaid,
    isPaidByPosition,
    pressure,
    text: parts.length ? `${parts.join(", ")}.` : "",
  };
}

function isPremiumPreflop({
  pair,
  high,
  low,
  suited,
}: {
  pair: boolean;
  high: number;
  low: number;
  suited: boolean;
}) {
  if (pair && high >= 11) return true;
  if (high === 14 && low >= 13) return true;
  if (high === 14 && low >= 12 && suited) return true;
  return false;
}

function emptyAdvice(): AdviceResult {
  return {
    adviceAction: "CHECK",
    adviceBb: "",
    adviceReason: "Faltan tus dos cartas. Sin eso no hay consejo serio.",
    adviceProbability: "0%",
    proVerdict: "Spot neutro",
    positionWarning: "Todavía no hay información suficiente.",
    beatenBy: "Todavía no se puede estimar qué manos te superan.",
  };
}

export function buildAdvice(table: TableState): AdviceResult {
  const heroBb = toNumber(table.heroBb);
  const boardCount = table.board.filter(Boolean).length;
  const heroCards = table.hero.filter(Boolean);

  if (heroCards.length < 2) {
    return emptyAdvice();
  }

  const bubble = buildBubbleContext(table);

  const [c1, c2] = heroCards;
  const r1 = normalizeRank(c1);
  const r2 = normalizeRank(c2);

  const pair = r1 === r2;
  const suited = c1.slice(-1) === c2.slice(-1);
  const high = Math.max(r1, r2);
  const low = Math.min(r1, r2);
  const broadway = high >= 10 && low >= 10;
  const premium = isPremiumPreflop({ pair, high, low, suited });

  const shortStack = heroBb > 0 && heroBb <= 12;
  const mediumStack = heroBb > 12 && heroBb <= 25;

  const stageText =
    boardCount < 3
      ? "Preflop"
      : boardCount === 3
        ? "Flop"
        : boardCount === 4
          ? "Turn"
          : "River";

  const positionText = table.position
    ? `Tu posición en la mesa es ${table.position}.`
    : "Cargá tu posición en la mesa para afinar el spot.";

  const bubbleText =
    bubble.pressure === "critical"
      ? `${bubble.text} Estás en zona MUY sensible de burbuja/cobros: no conviene quemar el torneo con manos medias.`
      : bubble.pressure === "near"
        ? `${bubble.text} Estás cerca de zona de cobros: bajá la varianza salvo spot fuerte.`
        : bubble.text
          ? `${bubble.text} Todavía hay margen para jugar poker sin regalar fichas.`
          : "Todavía podés maniobrar, pero sin inventar guerras.";

  let strength = 38;

  if (pair) strength += 22 + high;
  if (high === 14) strength += 8;
  if (broadway) strength += 7;
  if (suited) strength += 5;
  if (["BTN", "CO"].includes(table.position)) strength += 5;
  if (table.position === "UTG") strength -= 4;
  if (table.someoneRaised) strength -= 6;
  if (table.threeBet) strength -= 12;
  if (table.allIn && heroBb > 0) strength -= 10;

  if (bubble.pressure === "near" && !premium) strength -= 8;
  if (bubble.pressure === "critical" && !premium) strength -= 16;

  strength = Math.max(5, Math.min(95, strength));

  if (boardCount < 3) {
    if (bubble.pressure === "critical" && !premium && heroBb > 10) {
      return {
        adviceAction: "FOLD",
        adviceBb: "0 BB",
        adviceReason: `${positionText} ${bubbleText} Aunque la mano pueda parecer jugable, en este punto un pro evita all-ins marginales y preserva fold equity.`,
        adviceProbability: `${Math.max(12, strength)}%`,
        proVerdict: "Un pro foldearía",
        positionWarning: `${stageText}. Preservar stack vale más que ganar un pozo chico.`,
        beatenBy: "Te dominan pares mejores, ases fuertes, broadways mejores y rangos de push/call más cerrados por burbuja.",
      };
    }

    if (pair && high >= 11) {
      return {
        adviceAction: table.threeBet || shortStack ? "ALL IN" : "RAISE",
        adviceBb: table.threeBet || shortStack ? `${heroBb || 0} BB` : "2.2 BB",
        adviceReason: `Pareja premium preflop. ${positionText} Incluso con presión de torneo, esta mano sí puede jugar por valor.`,
        adviceProbability: `${Math.min(90, strength)}%`,
        proVerdict: table.threeBet || shortStack ? "Un pro empujaría" : "Un pro resubiría",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te siguen dominando sobre todo AA, KK y algunos spots premium de 4bet/all-in.",
      };
    }

    if (table.threeBet) {
      return {
        adviceAction: shortStack && premium ? "ALL IN" : "FOLD",
        adviceBb: shortStack && premium ? `${heroBb || 0} BB` : "0 BB",
        adviceReason: `${positionText} Hay 3bet. ${bubbleText} Sin premium real, seguir sería regalar fichas en un punto caro del torneo.`,
        adviceProbability: `${Math.max(15, strength - 10)}%`,
        proVerdict: shortStack && premium ? "Un pro empujaría" : "Un pro foldearía",
        positionWarning: `${stageText}. La presión de cobros hace que el rango de continuar sea más cerrado.`,
        beatenBy: "Te superan overpairs, ases dominantes, broadways fuertes y rangos cerrados de 3bet.",
      };
    }

    if (table.allIn) {
      if (premium || (shortStack && ((pair && high >= 8) || (high === 14 && low >= 10)))) {
        return {
          adviceAction: "CALL",
          adviceBb: shortStack ? `${heroBb || 0} BB` : "Call",
          adviceReason: `${positionText} Hay all-in previo. ${bubbleText} La mano tiene fuerza suficiente para pagar, pero no es un call automático si el rival es muy cerrado.`,
          adviceProbability: `${Math.max(30, Math.min(82, strength))}%`,
          proVerdict: "Un pro pagaría",
          positionWarning: `${stageText}. Call aceptable por fuerza relativa de mano y stack.`,
          beatenBy: "Seguís por detrás de parejas altas, ases mejores y rangos de all-in premium.",
        };
      }

      return {
        adviceAction: "FOLD",
        adviceBb: "0 BB",
        adviceReason: `${positionText} Hay all-in y tu mano no llega al estándar. ${bubbleText} Si es fold, es fold.`,
        adviceProbability: `${Math.max(10, strength - 14)}%`,
        proVerdict: "Un pro foldearía",
        positionWarning: `${stageText}. No conviene pagar por curiosidad cerca de cobros.`,
        beatenBy: "Te pisan pares, ases dominantes y rangos de empuje más fuertes.",
      };
    }

    if (table.someoneRaised) {
      if (
        bubble.pressure !== "critical" &&
        ["BTN", "CO"].includes(table.position) &&
        (broadway || pair || high === 14)
      ) {
        return {
          adviceAction: mediumStack || shortStack ? "CALL" : "RAISE",
          adviceBb: mediumStack || shortStack ? "Call" : "2.5x subida",
          adviceReason: `${positionText} Ya hubo subida. En late position podés defender o aislar si la mano acompaña.`,
          adviceProbability: `${Math.min(82, strength)}%`,
          proVerdict: mediumStack || shortStack ? "Un pro pagaría" : "Un pro resubiría",
          positionWarning: `${stageText}. ${bubbleText}`,
          beatenBy: "Te siguen ganando los opens fuertes: pares altos, AK/AQ mejores y rangos que te dominan.",
        };
      }

      return {
        adviceAction: "FOLD",
        adviceBb: "0 BB",
        adviceReason: `${positionText} Ya hubo agresión y tu mano no alcanza. ${bubbleText}`,
        adviceProbability: `${Math.max(12, strength - 10)}%`,
        proVerdict: "Un pro foldearía",
        positionWarning: `${stageText}. Evitá entrar dominado en pozo subido.`,
        beatenBy: "Te dominan manos fuertes del open rival y jugás un pozo más duro sin edge claro.",
      };
    }

    if (table.nobodyTalked) {
      if (table.position === "UTG" && !pair && !(high === 14 && low >= 10)) {
        return {
          adviceAction: "FOLD",
          adviceBb: "0 BB",
          adviceReason: `${positionText} En primeras posiciones un pro foldea mucho más. ${bubbleText}`,
          adviceProbability: `${Math.max(14, strength - 8)}%`,
          proVerdict: "Un pro foldearía",
          positionWarning: `${stageText}. No abrir basura también es jugar bien.`,
          beatenBy: "Abrir desde temprano con rango flojo te deja dominado por calls y 3bets.",
        };
      }

      if (["BTN", "CO"].includes(table.position) || pair || broadway || high === 14) {
        if (bubble.pressure === "critical" && !premium && heroBb > 12) {
          return {
            adviceAction: "FOLD",
            adviceBb: "0 BB",
            adviceReason: `${positionText} Nadie habló, pero estás en zona crítica de torneo. Sin premium, un pro no se inmola por robar ciegas.`,
            adviceProbability: `${Math.max(18, strength)}%`,
            proVerdict: "Un pro foldearía",
            positionWarning: `${stageText}. ${bubbleText}`,
            beatenBy: "Te complican reshoves, pares mejores, ases dominantes y calls de jugadores que te cubren.",
          };
        }

        return {
          adviceAction: shortStack ? "ALL IN" : "RAISE",
          adviceBb: shortStack ? `${heroBb || 0} BB` : "2.2 BB",
          adviceReason: `${positionText} Nadie habló. Spot para tomar iniciativa, ajustando por presión de torneo.`,
          adviceProbability: `${Math.min(84, strength)}%`,
          proVerdict: shortStack ? "Un pro empujaría" : "Un pro resubiría",
          positionWarning: `${stageText}. ${bubbleText}`,
          beatenBy: "Si te pagan o resuben, te complican pares medios-altos, ases mejores y broadways dominantes.",
        };
      }
    }

    return {
      adviceAction: "CHECK",
      adviceBb: "0 BB",
      adviceReason: `${positionText} Spot neutro o insuficiente para inventar agresión rentable.`,
      adviceProbability: `${strength}%`,
      proVerdict: "Spot neutro",
      positionWarning: `${stageText}. ${bubbleText}`,
      beatenBy: "Sin edge preflop claro, te superan las manos premium normales del rango rival.",
    };
  }

  const flopBoard = table.board.slice(0, 3).filter(Boolean);
  const boardRanks = flopBoard.map((card) => normalizeRank(card));
  const heroPairsBoard = boardRanks.some((rank) => rank === r1 || rank === r2);
  const monotoneFlop = new Set(flopBoard.map((card) => card.slice(-1))).size === 1;
  const overcardBoard = boardRanks.filter((rank) => rank > high).length;

  let postStrength = strength;

  if (heroPairsBoard) postStrength += 16;
  if (monotoneFlop) postStrength -= 7;
  if (overcardBoard >= 2 && !pair) postStrength -= 8;
  if (bubble.pressure === "critical" && postStrength < 74) postStrength -= 8;

  postStrength = Math.max(8, Math.min(96, postStrength));

  if (!table.someoneRaised && !table.threeBet && !table.allIn) {
    if (postStrength >= 70) {
      return {
        adviceAction: "RAISE",
        adviceBb: "33%–45% pote",
        adviceReason: `${positionText} El board te deja en zona de valor o presión rentable. Aun así, ${bubbleText}`,
        adviceProbability: `${postStrength}%`,
        proVerdict: "Un pro resubiría",
        positionWarning: `${stageText}. Apostá por valor, no por impulso.`,
        beatenBy: "Aun así te siguen ganando sets, dobles mejores, overpairs, color o escalera si el board lo permite.",
      };
    }

    return {
      adviceAction: "CHECK",
      adviceBb: "0 BB",
      adviceReason: `${positionText} El board no amerita inflar el pozo. ${bubbleText}`,
      adviceProbability: `${postStrength}%`,
      proVerdict: "Spot neutro",
      positionWarning: `${stageText}. Controlar pozo también es una decisión profesional.`,
      beatenBy: "Te ganan overpairs, dobles, sets, proyectos fuertes y top pair mejor acompañada según textura.",
    };
  }

  if (table.threeBet || table.allIn) {
    if (postStrength >= 76) {
      return {
        adviceAction: "CALL",
        adviceBb: "25%–33% pote",
        adviceReason: `${positionText} Ya venís en un spot cargado de fuerza. Tenés equity suficiente para continuar controlado.`,
        adviceProbability: `${postStrength}%`,
        proVerdict: "Un pro pagaría",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te siguen superando manos hechas fuertes, proyectos monstruo y top pairs dominantes.",
      };
    }

    return {
      adviceAction: "FOLD",
      adviceBb: "0 BB",
      adviceReason: `${positionText} Demasiada fuerza previa para una mano que no llega. ${bubbleText}`,
      adviceProbability: `${postStrength}%`,
      proVerdict: "Un pro foldearía",
      positionWarning: `${stageText}. Si es fold, es fold.`,
      beatenBy: "Te pisan overpairs, sets, dobles y líneas que ya vienen representando mucho valor.",
    };
  }

  return {
    adviceAction: postStrength >= 62 ? "CALL" : "FOLD",
    adviceBb: postStrength >= 62 ? "25%–33% pote" : "0 BB",
    adviceReason:
      postStrength >= 62
        ? `${positionText} Ya hubo agresión y el call conserva stack sin sobrerreaccionar. ${bubbleText}`
        : `${positionText} No alcanza para seguir cómodo. ${bubbleText}`,
    adviceProbability: `${postStrength}%`,
    proVerdict: postStrength >= 62 ? "Un pro pagaría" : "Un pro foldearía",
    positionWarning: `${stageText}. Decisión ajustada por fuerza de mano y contexto de torneo.`,
    beatenBy:
      "Te ganan dobles, sets, overpairs, color, escalera y top pair mejor kicker en gran parte de los rangos que apuestan fuerte.",
  };
}
