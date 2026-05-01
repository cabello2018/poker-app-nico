export function PlayerSeat({ className }: { className: string }) {
  return (
    <div className={`pointer-events-none absolute ${className} flex flex-col items-center gap-1`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-600 bg-black/45 text-base">👤</div>
    </div>
  );
}
