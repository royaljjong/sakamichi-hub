export default function Loading() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-[color:var(--ink-soft,#6b615a)]">
        <span
          className="inline-block h-4 w-4 rounded-full border-2 border-[color:var(--g-brand,#B27B4E)] border-t-transparent animate-spin"
          aria-hidden="true"
        />
        <span>Loading…</span>
      </div>
    </div>
  );
}
