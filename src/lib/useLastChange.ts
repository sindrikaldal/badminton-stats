import { useRef } from "react";

/**
 * Which way `value` last moved since the component mounted: "up", "down", or
 * null while it has not changed. Lets a number animate when it changes but not
 * when the page arrives, so a load or a background refresh stays still.
 */
export function useLastChange(value: number): "up" | "down" | null {
  const last = useRef<{ value: number; dir: "up" | "down" | null }>({
    value,
    dir: null,
  });
  // Written during render on purpose: the direction must be known in the same
  // render that shows the new value. Idempotent, so a double render is safe.
  if (last.current.value !== value) {
    last.current = { value, dir: value > last.current.value ? "up" : "down" };
  }
  return last.current.dir;
}
