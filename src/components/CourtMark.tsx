/**
 * The club mark: a doubles court seen from above, the net in shuttle yellow.
 * Same drawing as src/app/icon.svg, so the home-screen icon and the header agree.
 */
export function CourtMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" fill="#1f7a4d" />
      <g fill="none" stroke="#fff" strokeWidth="22" strokeLinecap="square">
        <rect x="146" y="72" width="220" height="368" />
        <path d="M146 186h220M146 326h220M256 72v114M256 326v114" />
      </g>
      <path d="M104 256h304" stroke="#f4d23c" strokeWidth="30" strokeLinecap="round" />
    </svg>
  );
}
