export type PreferredSide = "right" | "left" | "both" | "unsure";

export type Player = {
  id: string;
  name: string;
  email: string;
  phone: string;
  side: PreferredSide;
  rating: number;
  tier: TierName;
  placementCount: number;
  isPlaced: boolean;
  wins: number;
  losses: number;
  confidence: "calibrating" | "stable";
};

export type TierName =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Elite";

export type MatchRequest = {
  id: string;
  location: string;
  scheduledFor: string;
  status: "open" | "full" | "completed";
  players: string[];
  minRating?: number;
  maxRating?: number;
};

export type CompletedMatch = {
  id: string;
  team1: [string, string];
  team2: [string, string];
  team1Score: number;
  team2Score: number;
  winnerTeam: 1 | 2;
  status: "confirmed";
};

export type RegistrationAnswers = {
  name: string;
  email: string;
  phone: string;
  side: PreferredSide;
  frequency: "rare" | "weekly" | "regular" | "heavy";
  padelAge: "new" | "threeMonths" | "sixMonths" | "oneYear" | "twoYears";
  coaching: "none" | "few" | "short" | "long" | "yearPlus";
  racketSport: "none" | "tennis" | "squash" | "tableTennis" | "other";
  racketLevel: "casual" | "club" | "competitive" | "semiPro";
  tournament: "none" | "social" | "club" | "regional" | "national";
  tournamentResult: "none" | "lateRounds" | "finalist" | "winner";
};
