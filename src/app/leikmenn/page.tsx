import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { AddPlayerInline } from "@/components/AddPlayerInline";
import { MeProvider } from "@/components/Me";
import { MeSwitcher } from "@/components/MeSwitcher";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import { seasonStats } from "@/lib/domain/stats";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, season] = await Promise.all([
    repo.getPlayers(),
    repo.getActiveSeason(),
  ]);

  const sessions = season ? await repo.getSessions(season.id) : [];
  const stats = seasonStats(
    sessions,
    players.map((p) => p.id),
  );
  const statsById = new Map(stats.players.map((s) => [s.playerId, s]));

  // By name (as getPlayers orders them), not by record: the running season's
  // ranking stays sealed until it ends.
  const regulars = players.filter((p) => p.isActive && !p.isGuest);
  const guests = players.filter((p) => p.isActive && p.isGuest);
  const archived = players.filter((p) => !p.isActive);

  return (
    <Shell status={season?.name}>
      <MeProvider>
        <SectionTitle>Leikmenn</SectionTitle>

        {players.length === 0 ? (
          <EmptyState title="Enginn leikmaður skráður">
            Bættu við hópnum hér að neðan.
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {regulars.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                stats={statsById.get(player.id)}
              />
            ))}
          </ul>
        )}

        {guests.length > 0 ? (
          <>
            <SectionTitle>Gestir</SectionTitle>
            <ul className="card divide-y divide-line overflow-hidden">
              {guests.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  stats={statsById.get(player.id)}
                />
              ))}
            </ul>
          </>
        ) : null}

        {archived.length > 0 ? (
          <>
            <SectionTitle>Í geymslu</SectionTitle>
            <p className="mb-2 text-xs text-ink-faint">
              Birtast ekki þegar þú velur leikmenn. Úrslitin þeirra standa.
            </p>
            <ul className="card divide-y divide-line overflow-hidden opacity-60">
              {archived.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  stats={statsById.get(player.id)}
                />
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-4">
          <AddPlayerInline />
        </div>

        <SectionTitle>Þetta tæki</SectionTitle>
        <MeSwitcher players={players} />
      </MeProvider>
    </Shell>
  );
}

function PlayerRow({
  player,
  stats,
}: {
  player: { id: number; name: string; shortName: string; initials: string };
  stats?: { played: number; honors: number };
}) {
  return (
    <li>
      <Link href={`/leikmenn/${player.id}`} className="flex items-center gap-3 px-3 py-2.5">
        <Avatar player={player} />
        <div className="min-w-0 flex-1">
          <p className="display truncate text-lg text-ink">{player.name}</p>
          <p className="text-xs text-ink-faint">
            {stats && stats.played > 0
              ? `${stats.played} leikir á tímabilinu${stats.honors > 0 ? ` · ${stats.honors}× 3 í röð` : ""}`
              : "Engir leikir á tímabilinu"}
          </p>
        </div>
      </Link>
    </li>
  );
}
