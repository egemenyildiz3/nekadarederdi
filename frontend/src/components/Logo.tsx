export function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="Ne Kadar Ederdi?">
      <div className="grid h-12 w-12 rotate-[-2deg] place-items-center rounded-md border border-ink-900 bg-coin-300 text-ink-950 shadow-stamp transition hover:rotate-0">
        <span className="font-display text-xl font-black leading-none">₺?</span>
      </div>
      <div className="leading-none">
        <p className="font-display text-2xl font-black text-ink-950">Ne Kadar</p>
        <p className="font-display text-2xl font-black text-ink-950">Ederdi?</p>
      </div>
    </div>
  );
}
