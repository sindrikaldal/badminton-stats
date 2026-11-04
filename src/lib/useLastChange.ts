import { useRef } from "react";

export type Change = { dir: "up" | "down"; from: number };

/**
 * How `value` last changed since the component mounted: which way, and from
 * what. Null while it has not changed. Lets a number animate when it changes
 * but not when the page arrives, so a load or a background refresh stays still.
 */
export function useLastChange(value: number): Change | null {
  const last = useRef<{ value: number; change: Change | null }>({
    value,
    change: null,
  });
  // Written during render on purpose: the direction must be known in the same
  // render that shows the new value. Idempotent, so a double render is safe.
  if (last.current.value !== value) {
    last.current = {
      value,
      change: { dir: value > last.current.value ? "up" : "down", from: last.current.value },
    };
  }
  return last.current.change;
}
