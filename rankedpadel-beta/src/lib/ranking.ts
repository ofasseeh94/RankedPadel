import type { Player, RegistrationAnswers, TierName } from "@/types/beta";

const tiers: Array<{ name: TierName; min: number; max: number }> = [
  { name: "Bronze", min: 0, max: 1199 },
  { name: "Silver", min: 1200, max: 1399 },
  { name: "Gold", min: 1400, max: 1599 },
  { name: "Platinum", min: 1600, max: 1799 },
  { name: "Diamond", min: 1800, max: 1999 },
  { name: "Elite", min: 2000, max: 3000 },
];

export function tierForRating(rating: number): TierName {
  return tiers.find((tier) => rating >= tier.min && rating <= tier.max)?.name ?? "Elite";
}

export function estimateInitialRating(answers: RegistrationAnswers): number {
  let rating = 1050;

  rating += {
    rare: 0,
    weekly: 90,
    regular: 190,
    heavy: 290,
  }[answers.frequency];

  rating += {
    new: 0,
    threeMonths: 70,
    sixMonths: 130,
    oneYear: 230,
    twoYears: 330,
  }[answers.padelAge];

  rating += {
    none: 0,
    few: 40,
    short: 90,
    long: 150,
    yearPlus: 230,
  }[answers.coaching];

  rating += answers.racketSport === "none" ? 0 : 80;
  rating += {
    casual: 0,
    club: 80,
    competitive: 180,
    semiPro: 300,
  }[answers.racketLevel];

  rating += {
    none: 0,
    social: 70,
    club: 140,
    regional: 250,
    national: 360,
  }[answers.tournament];

  rating += {
    none: 0,
    lateRounds: 60,
    finalist: 120,
    winner: 210,
  }[answers.tournamentResult];

  return Math.min(Math.max(Math.round(rating), 850), 2150);
}

export function applyConfirmedMatch(
  players: Player[],
  team1: [string, string],
  team2: [string, string],
  winnerTeam: 1 | 2,
) {
  const teamIds = [...team1, ...team2];
  const average = (ids: string[]) =>
    ids.reduce((sum, id) => sum + (players.find((player) => player.id === id)?.rating ?? 1500), 0) / ids.length;

  const team1Rating = average(team1);
  const team2Rating = average(team2);
  const expectedTeam1 = 1 / (1 + 10 ** ((team2Rating - team1Rating) / 400));
  const k = 32;

  return players.map((player) => {
    if (!teamIds.includes(player.id)) return player;

    const isTeam1 = team1.includes(player.id);
    const actual = winnerTeam === (isTeam1 ? 1 : 2) ? 1 : 0;
    const expected = isTeam1 ? expectedTeam1 : 1 - expectedTeam1;
    const placementBoost = player.isPlaced ? 1 : 1.8;
    const delta = Math.round(k * placementBoost * (actual - expected));
    const nextRating = Math.max(700, player.rating + delta);
    const nextPlacementCount = Math.min(3, player.placementCount + 1);

    return {
      ...player,
      rating: nextRating,
      tier: tierForRating(nextRating),
      placementCount: nextPlacementCount,
      isPlaced: nextPlacementCount >= 3,
      confidence: nextPlacementCount >= 3 ? "stable" : "calibrating",
      wins: player.wins + (actual === 1 ? 1 : 0),
      losses: player.losses + (actual === 0 ? 1 : 0),
    };
  });
}
