"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GATE_COOKIE } from "@/lib/gate";
import { scoreProblem } from "@/lib/domain/types";
import * as repo from "@/lib/repo";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/* -------------------------------------------------------------- gate ---- */

export async function enterGroupCode(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const code = String(formData.get("code") ?? "").trim();
  const expected = process.env.GROUP_CODE;

  if (!expected) return { ok: false, error: "Hópkóði er ekki uppsettur." };
  if (code.toLowerCase() !== expected.toLowerCase()) {
    return { ok: false, error: "Rangur kóði. Prófaðu aftur." };
  }

  const store = await cookies();
  store.set(GATE_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // A whole winter, so nobody re-types the code every week.
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect(String(formData.get("naest") || "/"));
}

/* ------------------------------------------------------------ players ---- */

const playerSchema = z.object({
  name: z.string().trim().min(1, "Nafn vantar.").max(60),
  isGuest: z.boolean().default(false),
});

/**
 * Called directly rather than as a form action: the roster picker that uses it
 * already sits inside a form, and forms cannot nest.
 */
export async function addPlayer(input: {
  name: string;
  isGuest: boolean;
}): Promise<ActionResult & { playerId?: number }> {
  const parsed = playerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const player = await repo.createPlayer(parsed.data);
  revalidateAll();
  return { ok: true, playerId: player.id };
}

/**
 * Removes a player outright. Refused once they appear in any match: the match
 * would have to go too, and losing an evening's results to tidy up a roster is
 * never the trade anyone wants. Archive them instead.
 */
export async function deletePlayer(
  playerId: number,
): Promise<ActionResult> {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return { ok: false, error: "Leikmaður fannst ekki." };
  }

  const usage = await repo.getPlayerUsage(playerId);
  if (usage.matches > 0) {
    return {
      ok: false,
      error: `Þessi leikmaður hefur spilað ${usage.matches} leiki. Ekki er hægt að eyða honum án þess að eyða leikjunum — geymdu hann í staðinn.`,
    };
  }

  await repo.deletePlayer(playerId);
  revalidateAll();
  return { ok: true };
}

/** Hides a player from every picker without touching their history. */
export async function setPlayerActive(
  playerId: number,
  isActive: boolean,
): Promise<ActionResult> {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return { ok: false, error: "Leikmaður fannst ekki." };
  }
  await repo.setPlayerActive(playerId, isActive);
  revalidateAll();
  return { ok: true };
}

/* ------------------------------------------------------------ seasons ---- */

export async function startSeason(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const startedOn = String(formData.get("startedOn") ?? "").trim();
  if (!name) return { ok: false, error: "Nafn tímabils vantar." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) {
    return { ok: false, error: "Ógild dagsetning." };
  }

  await repo.createSeason({ name, startedOn });
  revalidateAll();
  return { ok: true };
}

/* ----------------------------------------------------------- sessions ---- */

export async function startSession(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const playedOn = String(formData.get("playedOn") ?? "").trim();
  const attendees = formData
    .getAll("attendee")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedOn)) {
    return { ok: false, error: "Ógild dagsetning." };
  }
  if (attendees.length < 4) {
    return { ok: false, error: "Það þarf a.m.k. fjóra til að spila." };
  }

  const season = await repo.getActiveSeason();
  if (!season) return { ok: false, error: "Ekkert virkt tímabil." };

  const open = await repo.getOpenSession();
  if (open) {
    return {
      ok: false,
      error: "Það er kvöld í gangi. Ljúktu því fyrst.",
    };
  }

  const session = await repo.createSession({
    seasonId: season.id,
    playedOn,
    attendees,
  });
  revalidateAll();
  redirect(`/?kvold=${session.id}`);
}

/**
 * Ends the evening and lands on it, where the summary is waiting. Going back
 * to an empty Kvöldið tab instead would throw away the one moment everyone is
 * still standing together looking at the phone.
 */
export async function endSession(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const sessionId = Number(formData.get("sessionId"));
  if (!sessionId) return { ok: false, error: "Kvöld fannst ekki." };
  await repo.endSession(sessionId);
  revalidateAll();
  redirect(`/?kvold=${sessionId}`);
}

export async function reopenSession(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const sessionId = Number(formData.get("sessionId"));
  if (!sessionId) return { ok: false, error: "Kvöld fannst ekki." };

  const open = await repo.getOpenSession();
  if (open && open.id !== sessionId) {
    return {
      ok: false,
      error: "Annað kvöld er í gangi. Ljúktu því fyrst.",
    };
  }

  await repo.reopenSession(sessionId);
  revalidateAll();
  redirect(`/?kvold=${sessionId}`);
}

export async function updateAttendees(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const sessionId = Number(formData.get("sessionId"));
  const attendees = formData
    .getAll("attendee")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (!sessionId) return { ok: false, error: "Kvöld fannst ekki." };

  await repo.setAttendees(sessionId, attendees);
  revalidateAll();
  return { ok: true };
}

export async function removeSession(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const sessionId = Number(formData.get("sessionId"));
  if (!sessionId) return { ok: false, error: "Kvöld fannst ekki." };
  await repo.deleteSession(sessionId);
  revalidateAll();
  redirect("/leikir");
}

/* ------------------------------------------------------------ matches ---- */

const teamSchema = z.tuple([z.number().int().positive(), z.number().int().positive()]);

const matchSchema = z
  .object({
    teamA: teamSchema,
    teamB: teamSchema,
    scoreA: z.number().int().min(0).max(99),
    scoreB: z.number().int().min(0).max(99),
  })
  .refine((m) => new Set([...m.teamA, ...m.teamB]).size === 4, {
    message: "Sami leikmaður má ekki vera tvisvar í leiknum.",
  })
  .superRefine((m, ctx) => {
    const problem = scoreProblem(m.scoreA, m.scoreB);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });

function readMatch(formData: FormData) {
  return matchSchema.safeParse({
    teamA: [Number(formData.get("a1")), Number(formData.get("a2"))],
    teamB: [Number(formData.get("b1")), Number(formData.get("b2"))],
    scoreA: Number(formData.get("scoreA")),
    scoreB: Number(formData.get("scoreB")),
  });
}

export async function logMatch(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const sessionId = Number(formData.get("sessionId"));
  if (!sessionId) return { ok: false, error: "Kvöld fannst ekki." };

  const parsed = readMatch(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // Guards against a stale form left open on a phone after the night ended.
  const session = await repo.getSession(sessionId);
  if (!session) return { ok: false, error: "Kvöld fannst ekki." };
  if (session.endedAt) {
    return {
      ok: false,
      error: "Þessu kvöldi er lokið. Opnaðu það aftur til að skrá leik.",
    };
  }

  const match = await repo.addMatch({ sessionId, ...parsed.data });
  revalidateAll();
  // The session page decides whether this completed a three-in-a-row.
  redirect(`/?kvold=${sessionId}&nyr=${match.id}`);
}

export async function editMatch(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const matchId = Number(formData.get("matchId"));
  if (!matchId) return { ok: false, error: "Leikur fannst ekki." };

  const parsed = readMatch(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  await repo.updateMatch(matchId, parsed.data);
  revalidateAll();
  return { ok: true };
}

export async function removeMatch(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const matchId = Number(formData.get("matchId"));
  if (!matchId) return { ok: false, error: "Leikur fannst ekki." };
  await repo.deleteMatch(matchId);
  revalidateAll();
  return { ok: true };
}
