import { Shell } from "@/components/Shell";

/**
 * Shown the moment a page is asked for, while it comes from the server: the
 * header and tab bar as they will be, and the outline of a list. Prefetched,
 * so a tap changes the screen straight away instead of waiting on the data.
 */
export default function Loading() {
  return (
    <Shell loading>
      <div aria-busy className="animate-pulse">
        <p className="sr-only">Hleð…</p>
        <div className="mt-2 h-[1.375rem] w-2/5 rounded-lg bg-surface-raised" />
        <div className="card mt-3 divide-y divide-line">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-3 px-3 py-2.5">
              <span className="size-9 shrink-0 rounded-full bg-surface-raised" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-4 w-1/2 rounded bg-surface-raised" />
                <span className="block h-3 w-1/3 rounded bg-surface-raised" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
