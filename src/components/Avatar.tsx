import type { Player } from "@/lib/domain/types";

/**
 * Initials in the court's own three kits, picked from the player id so everyone
 * keeps the same one everywhere. A name always sits beside the avatar, so the
 * kit only has to tell neighbours apart, not identify anyone on its own.
 */
const KITS = [
  { bg: "var(--color-ink)", fg: "#fff", edge: "var(--color-ink)" },
  { bg: "var(--color-court)", fg: "#fff", edge: "var(--color-court)" },
  { bg: "#fff", fg: "var(--color-ink)", edge: "var(--color-ink)" },
] as const;

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  player,
  size = "md",
  dimmed = false,
}: {
  player: Pick<Player, "id" | "initials" | "name">;
  size?: keyof typeof SIZES;
  dimmed?: boolean;
}) {
  const kit = KITS[player.id % KITS.length];
  return (
    <span
      className={`${SIZES[size]} display inline-flex shrink-0 items-center justify-center rounded-full border-2 tracking-[0.04em]`}
      style={{
        color: dimmed ? "var(--color-ink-faint)" : kit.fg,
        borderColor: dimmed ? "var(--color-line-bright)" : kit.edge,
        background: dimmed ? "transparent" : kit.bg,
      }}
      aria-hidden
    >
      {player.initials}
    </span>
  );
}
