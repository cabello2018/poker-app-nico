function cardLabel(card: string) {
  if (!card) return "+";
  const v = card.slice(0, -1);
  const s = card.slice(-1);
  const sl = s === "s" ? "♠" : s === "h" ? "♥" : s === "d" ? "♦" : "♣";
  return `${v}${sl}`;
}

export function CardSlot({ card, onClick }: { card: string; onClick: () => void }) {
  const suit = card ? card.slice(-1) : "";
  const suitStyle = suit === "h" || suit === "d" ? "text-red-400" : "text-white";
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-10 items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 text-sm font-semibold shadow-inner transition hover:border-neutral-400"
    >
      <span className={card ? suitStyle : "text-neutral-500"}>{cardLabel(card)}</span>
    </button>
  );
}
