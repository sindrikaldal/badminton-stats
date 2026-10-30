import { CourtMark } from "@/components/CourtMark";
import { GateForm } from "./GateForm";

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ naest?: string }>;
}) {
  const { naest } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <CourtMark size={72} />
          <h1 className="display mt-4 text-5xl text-ink">Badd Boys</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Badmintonkvöldin, leikirnir og tölfræðin.
          </p>
        </div>
        <GateForm next={naest ?? "/"} />
      </div>
    </div>
  );
}
