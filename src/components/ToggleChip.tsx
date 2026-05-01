import { Button } from "./ui/button.tsx";


export function ToggleChip({ active, label, activeClass, onClick }: { active: boolean; label: string; activeClass: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? activeClass : "border-neutral-600 bg-black/35 text-neutral-200 hover:bg-black/50"}`}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
