import { describe, expect, it } from "vitest";
import { type Match, isLegalScore, isSevenNil, scoreProblem } from "./types";

const match = (scoreA: number, scoreB: number): Match => ({
  id: 1,
  sessionId: 1,
  seq: 1,
  teamA: [1, 2],
  teamB: [3, 4],
  scoreA,
  scoreB,
});

describe("legal final scores", () => {
  it("accepts to eleven, win by two, no cap", () => {
    expect(isLegalScore(11, 9)).toBe(true);
    expect(isLegalScore(15, 13)).toBe(true);
    expect(isLegalScore(11, 10)).toBe(false);
    expect(isLegalScore(9, 2)).toBe(false);
  });

  it("accepts exactly 7-0, from either side", () => {
    expect(isLegalScore(7, 0)).toBe(true);
    expect(isLegalScore(0, 7)).toBe(true);
  });

  it("rejects anything near 7-0 that is not it", () => {
    expect(isLegalScore(8, 0)).toBe(false);
    expect(isLegalScore(7, 1)).toBe(false);
    expect(isLegalScore(11, 0)).toBe(false);
  });
});

describe("isSevenNil", () => {
  it("is true only for exactly 7-0", () => {
    expect(isSevenNil(match(7, 0))).toBe(true);
    expect(isSevenNil(match(0, 7))).toBe(true);
    expect(isSevenNil(match(11, 0))).toBe(false);
    expect(isSevenNil(match(11, 7))).toBe(false);
  });
});

describe("scoreProblem", () => {
  it("is null for every legal score", () => {
    expect(scoreProblem(11, 9)).toBeNull();
    expect(scoreProblem(7, 0)).toBeNull();
    expect(scoreProblem(0, 7)).toBeNull();
  });

  it("explains a nil score that is not 7-0", () => {
    expect(scoreProblem(11, 0)).toMatch(/7–0/);
    expect(scoreProblem(8, 0)).toMatch(/7–0/);
  });

  it("keeps the old messages for the old mistakes", () => {
    expect(scoreProblem(9, 9)).toMatch(/jafn/);
    expect(scoreProblem(9, 2)).toMatch(/11/);
    expect(scoreProblem(11, 10)).toMatch(/tveggja/);
  });
});
