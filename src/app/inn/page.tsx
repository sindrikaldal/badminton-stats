import { GateForm } from "./GateForm";

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ naest?: string }>;
}) {
  const { naest } = await searchParams;

  return (
    <div className="stringbed flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <ShuttleMark />
          <h1 className="display mt-4 text-4xl text-ink">Badd Boys</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Badmintonkvöldin, leikirnir og tölfræðin.
          </p>
        </div>
        <GateForm next={naest ?? "/"} />
      </div>
    </div>
  );
}

function ShuttleMark() {
  return (
    <svg width="72" height="72" viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" fill="#0e1526" />
      <g transform="translate(256 268)">
        <g fill="none" stroke="#38a8ff" strokeWidth="17" strokeLinecap="round">
          <path d="M0 -18 L-96 -186" />
          <path d="M0 -18 L-50 -204" />
          <path d="M0 -18 L0 -212" />
          <path d="M0 -18 L50 -204" />
          <path d="M0 -18 L96 -186" />
        </g>
        <path
          d="M-70 -140 Q0 -112 70 -140"
          fill="none"
          stroke="#14e27a"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <circle cy="14" r="62" fill="#14e27a" />
      </g>
    </svg>
  );
}
