type AdSlotProps = {
  label: string;
};

export function AdSlot({ label }: AdSlotProps) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white/70 px-4 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}
