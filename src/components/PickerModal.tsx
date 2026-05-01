import { Button } from "./ui/button.tsx";

const values = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const suits = [
  { key: "d", label: "♦", color: "text-red-400" },
  { key: "c", label: "♣", color: "text-white" },
  { key: "h", label: "♥", color: "text-red-400" },
  { key: "s", label: "♠", color: "text-white" },
] as const;

export function PickerModal({ onPick, onClear, onClose }: { onPick: (card: string) => void; onClear: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl rounded-xl bg-neutral-900 p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-white">
          <div className="font-semibold">Seleccionar carta</div>
          <Button variant="outline" size="icon" onClick={onClose}>✕</Button>
        </div>
        <div className="space-y-3">
          {suits.map((row) => (
            <div key={row.key} className="grid grid-cols-13 gap-1.5">
              {values.map((v) => {
                const c = v + row.key;
                return (
                  <Button key={c} variant="outline" className={`border-neutral-700 bg-neutral-950 ${row.color}`} onClick={() => onPick(c)}>
                    {v}{row.label}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={onClear}>Limpiar</Button>
          <Button className="flex-1" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
