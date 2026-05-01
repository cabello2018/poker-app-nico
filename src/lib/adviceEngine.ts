import type { AdviceAction, AdviceResult, ProVerdict, TableState } from "../types/poker";

function normalizeRank(card: string) {
  const value = card.slice(0, -1);
  const map: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, T: 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };
  return map[value] || 0;
}

export function getAdviceColor(action: AdviceAction) {
  if (action === "FOLD") return "border-red-700 bg-red-950/40 text-red-300";
  if (action === "CALL") return "border-blue-700 bg-blue-950/40 text-blue-300";
  if (action === "RAISE") return "border-amber-700 bg-amber-950/40 text-amber-300";
  if (action === "ALL IN") return "border-fuchsia-700 bg-fuchsia-950/40 text-fuchsia-300";
  return "border-emerald-700 bg-emerald-950/40 text-emerald-300";
}

export function buildAdvice(table: TableState): AdviceResult {
  const heroBb = Number(table.heroBb || 0);
  const playersLeft = Number(table.playersLeft || 0);
  const paidPlaces = Number(table.paidPlaces || 0);
  const boardCount = table.board.filter(Boolean).length;
  const heroCards = table.hero.filter(Boolean);

  if (heroCards.length < 2) {
    return {
      adviceAction: "CHECK" as AdviceAction,
      adviceBb: "",
      adviceReason: "Faltan tus dos cartas. Sin eso no hay consejo serio.",
      adviceProbability: "0%",
      proVerdict: "Spot neutro" as ProVerdict,
      positionWarning: "Todavía no hay información suficiente.",
      beatenBy: "Todavía no se puede estimar qué manos te superan.",
    };
  }

  const [c1, c2] = heroCards;
  const r1 = normalizeRank(c1);
  const r2 = normalizeRank(c2);
  const pair = r1 === r2;
  const suited = c1.slice(-1) === c2.slice(-1);
  const high = Math.max(r1, r2);
  const low = Math.min(r1, r2);
  const broadway = high >= 10 && low >= 10;
  const shortStack = heroBb > 0 && heroBb <= 12;
  const mediumStack = heroBb > 12 && heroBb <= 25;
  const nearBubble = playersLeft > 0 && paidPlaces > 0 ? playersLeft <= paidPlaces + Math.max(2, Math.round(paidPlaces * 0.2)) : playersLeft > 0 && playersLeft <= 12;
  const stageText = boardCount < 3 ? "Preflop" : boardCount === 3 ? "Flop" : boardCount === 4 ? "Turn" : "River";
  const positionText = table.position ? `Tu posición es ${table.position}.` : "Cargá tu posición para afinar el spot.";
  const bubbleText = nearBubble ? "No regales fichas: estás en zona sensible de cobros o burbuja." : "Todavía podés maniobrar, pero sin inventar guerras.";

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
  strength = Math.max(5, Math.min(95, strength));

  if (boardCount < 3) {
    if (pair && high >= 11) {
      return {
        adviceAction: table.threeBet || shortStack ? "ALL IN" : "RAISE",
        adviceBb: table.threeBet || shortStack ? `${heroBb || 0} BB` : "2.2 BB",
        adviceReason: `Pareja premium preflop. ${positionText} Lo profesional es tomar iniciativa y castigar rangos peores.`,
        adviceProbability: `${Math.min(90, strength)}%`,
        proVerdict: table.threeBet || shortStack ? "Un pro empujaría" : "Un pro resubiría",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te siguen dominando sobre todo AA, KK y algunos spots premium de 4bet/all-in.",
      };
    }

    if (table.threeBet) {
      return {
        adviceAction: shortStack ? "ALL IN" : "FOLD",
        adviceBb: shortStack ? `${heroBb || 0} BB` : "0 BB",
        adviceReason: `${positionText} Hay 3bet. Si es fold, es fold. Sin premium o reshove claro, seguir sería regalar fichas.`,
        adviceProbability: `${Math.max(18, strength - 14)}%`,
        proVerdict: shortStack ? "Un pro empujaría" : "Un pro foldearía",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te superan overpairs, broadways dominantes y rangos fuertes de 3bet.",
      };
    }

    if (table.allIn) {
      if (shortStack || (pair && high >= 9) || (high === 14 && low >= 10)) {
        return {
          adviceAction: "CALL",
          adviceBb: shortStack ? `${heroBb || 0} BB` : "Call",
          adviceReason: `${positionText} Hay all-in previo. Con este stack y este rango todavía podés continuar sin quedar absurdamente dominado.`,
          adviceProbability: `${Math.max(30, Math.min(80, strength))}%`,
          proVerdict: "Un pro pagaría",
          positionWarning: `${stageText}. ${bubbleText}`,
          beatenBy: "Seguís por detrás de parejas altas, ases mejores y all-ins de rango premium.",
        };
      }
      return {
        adviceAction: "FOLD",
        adviceBb: "0 BB",
        adviceReason: `${positionText} Hay all-in y tu mano no llega al estándar. Si es fold, es fold.`,
        adviceProbability: `${Math.max(14, strength - 16)}%`,
        proVerdict: "Un pro foldearía",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te pisan pares, ases dominantes y rangos de empuje más fuertes.",
      };
    }

    if (table.someoneRaised) {
      if ((table.position === "BTN" || table.position === "CO") && (broadway || pair || high === 14)) {
        return {
          adviceAction: mediumStack || shortStack ? "CALL" : "RAISE",
          adviceBb: mediumStack || shortStack ? "Call" : "2.5x subida",
          adviceReason: `${positionText} Ya hubo subida. En late position un pro puede defender o aislar dependiendo de la fuerza relativa.`,
          adviceProbability: `${Math.min(82, strength)}%`,
          proVerdict: mediumStack || shortStack ? "Un pro pagaría" : "Un pro resubiría",
          positionWarning: `${stageText}. ${bubbleText}`,
          beatenBy: "Te siguen ganando los opens fuertes: pares altos, AK/AQ mejores y rangos que te dominan en kicker o equity pura.",
        };
      }
      return {
        adviceAction: "FOLD",
        adviceBb: "0 BB",
        adviceReason: `${positionText} Ya hubo agresión y tu mano no alcanza. No regales fichas por querer ver una más.`,
        adviceProbability: `${Math.max(16, strength - 12)}%`,
        proVerdict: "Un pro foldearía",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te dominan manos fuertes del open rival y encima jugás un pozo más duro sin edge claro.",
      };
    }

    if (table.nobodyTalked) {
      if (table.position === "UTG" && !pair && !(high === 14 && low >= 10)) {
        return {
          adviceAction: "FOLD",
          adviceBb: "0 BB",
          adviceReason: `${positionText} En primeras posiciones un pro foldea mucho más. No abrir basura también es jugar bien.`,
          adviceProbability: `${Math.max(18, strength - 10)}%`,
          proVerdict: "Un pro foldearía",
          positionWarning: `${stageText}. ${bubbleText}`,
          beatenBy: "Abrir desde temprano con rango flojo te deja dominado por calls y 3bets del rango fuerte rival.",
        };
      }

      if (["BTN", "CO"].includes(table.position) || pair || broadway || high === 14) {
        return {
          adviceAction: shortStack ? "ALL IN" : "RAISE",
          adviceBb: shortStack ? `${heroBb || 0} BB` : "2.2 BB",
          adviceReason: `${positionText} Nadie habló. Spot clásico para tomar iniciativa.`,
          adviceProbability: `${Math.min(84, strength)}%`,
          proVerdict: shortStack ? "Un pro empujaría" : "Un pro resubiría",
          positionWarning: `${stageText}. ${bubbleText}`,
          beatenBy: "Si te pagan o resuben, te complican pares medios-altos, ases mejores y broadways que dominan tu rango abierto.",
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
  const boardRanks = flopBoard.map((c) => normalizeRank(c));
  const heroPairsBoard = boardRanks.some((rank) => rank === r1 || rank === r2);
  const monotoneFlop = new Set(flopBoard.map((c) => c.slice(-1))).size === 1;
  const overcardBoard = boardRanks.filter((rank) => rank > high).length;

  let postStrength = strength;
  if (heroPairsBoard) postStrength += 16;
  if (monotoneFlop) postStrength -= 7;
  if (overcardBoard >= 2 && !pair) postStrength -= 8;
  postStrength = Math.max(8, Math.min(96, postStrength));

  if (!table.someoneRaised && !table.threeBet && !table.allIn) {
    if (postStrength >= 70) {
      return {
        adviceAction: "RAISE",
        adviceBb: "33%–45% pote",
        adviceReason: `${positionText} El flop te deja en zona de valor o presión rentable. Un pro apuesta chico/medio para cobrar y negar equity.`,
        adviceProbability: `${postStrength}%`,
        proVerdict: "Un pro resubiría",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Aun así te siguen ganando sets, dobles mejores, overpairs, color o escalera si el board lo permite.",
      };
    }
    return {
      adviceAction: "CHECK",
      adviceBb: "0 BB",
      adviceReason: `${positionText} El flop no amerita inflar el pozo.`,
      adviceProbability: `${postStrength}%`,
      proVerdict: "Spot neutro",
      positionWarning: `${stageText}. ${bubbleText}`,
      beatenBy: "Te ganan overpairs, dobles, sets, proyectos fuertes y top pair mejor acompañada según textura.",
    };
  }

  if (table.threeBet || table.allIn) {
    if (postStrength >= 76) {
      return {
        adviceAction: "CALL",
        adviceBb: "25%–33% pote",
        adviceReason: `${positionText} Ya venís en un spot cargado de fuerza. Un pro sigue controlado cuando tiene equity suficiente.`,
        adviceProbability: `${postStrength}%`,
        proVerdict: "Un pro pagaría",
        positionWarning: `${stageText}. ${bubbleText}`,
        beatenBy: "Te siguen superando manos hechas fuertes, proyectos monstruo y top pairs dominantes dentro de rangos agresivos.",
      };
    }
    return {
      adviceAction: "FOLD",
      adviceBb: "0 BB",
      adviceReason: `${positionText} Demasiada fuerza previa para una mano que no llega. Si es fold, es fold.`,
      adviceProbability: `${postStrength}%`,
      proVerdict: "Un pro foldearía",
      positionWarning: `${stageText}. ${bubbleText}`,
      beatenBy: "Te pisan overpairs, sets, dobles y líneas que ya vienen representando muchísimo valor real.",
    };
  }

  return {
    adviceAction: postStrength >= 62 ? "CALL" : "FOLD",
    adviceBb: postStrength >= 62 ? "25%–33% pote" : "0 BB",
    adviceReason: postStrength >= 62
      ? `${positionText} Ya hubo agresión y el call conserva stack sin sobrerreaccionar.`
      : `${positionText} No alcanza para seguir cómodo. Si es fold, es fold.`,
    adviceProbability: `${postStrength}%`,
    proVerdict: postStrength >= 62 ? "Un pro pagaría" : "Un pro foldearía",
    positionWarning: `${stageText}. ${bubbleText}`,
    beatenBy: "Te ganan dobles, sets, overpairs, color, escalera y top pair mejor kicker en gran parte de los rangos que apuestan fuerte postflop.",
  };
}
