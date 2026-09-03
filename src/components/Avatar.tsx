import type { Player } from "@/lib/domain/types";

/**
 * Initials on a colour picked from the player id, so everyone keeps the same
 * colour everywhere without anyone uploading a photo.
 */
const PALETTE = [
  "#38a8ff",
  "#14e27a",
  "#ff7a3d",
  "#a78bfa",
  "#f0b429",
  "#f472b6",
  "#2dd4bf",
  "#94a3b8",
];

export function avatarColor(playerId: number): string {
  return PALETTE[playerId % PALETTE.length];
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-[13px]",
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
  const color = avatarColor(player.id);
  return (
    <span
      className={`${SIZES[size]} display inline-flex shrink-0 items-center justify-center rounded-full border font-bold`}
      style={{
        color: dimmed ? "var(--color-ink-faint)" : color,
        borderColor: dimmed ? "var(--color-line)" : `${color}66`,
        background: dimmed ? "transparent" : `${color}1f`,
      }}
      aria-hidden
    >
      {player.initials}
    </span>
  );
}
