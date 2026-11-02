import Link from "next/link";

/**
 * 2 á 2 or 1 á 1. One control, the same on the score pad and on Tölfræði, so
 * the two competitions are told apart the same way everywhere. The ink thumb
 * slides rather than jumps, which says "the same place, the other mode".
 *
 * Buttons when given `onChange`, links when given `hrefFor`.
 */
export function KindSwitch({
  singles,
  onChange,
  hrefFor,
}: {
  singles: boolean;
  onChange?: (singles: boolean) => void;
  hrefFor?: (singles: boolean) => string;
}) {
  return (
    <div
      role="group"
      aria-label="Tegund leiks"
      className="relative grid shrink-0 grid-cols-2 rounded-lg bg-surface-raised p-0.5"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[3px] bg-ink transition-transform duration-300 ease-arrive ${
          singles ? "translate-x-full" : ""
        }`}
      />
      {[false, true].map((value) => {
        const on = singles === value;
        const className = `display tnum relative flex h-10 items-center justify-center px-3.5 text-base tracking-[0.04em] transition-colors duration-200 ${
          on ? "text-tape" : "text-ink-muted"
        }`;
        const label = value ? "1 á 1" : "2 á 2";
        return hrefFor ? (
          <Link
            key={label}
            href={hrefFor(value)}
            aria-current={on ? "true" : undefined}
            className={className}
          >
            {label}
          </Link>
        ) : (
          <button
            key={label}
            type="button"
            onClick={() => onChange?.(value)}
            aria-pressed={on}
            className={className}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
