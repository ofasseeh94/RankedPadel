import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { estimateInitialRating, tierForRating } from "@/lib/ranking";
import type { BetaDatabase, BetaUser, RecordedGame, RegistrationAnswers } from "@/types/beta";

const dbPath = path.join(process.cwd(), "data", "beta-db.json");
const fallbackAdminCode = "NADD-BETA-ADMIN";

const emptyDb: BetaDatabase = {
  users: [],
  games: [],
};

export type RegisterInput = RegistrationAnswers;

export type GameInput = {
  userId: string;
  playedAt: string;
  location: string;
  partnerName: string;
  opponentOne: string;
  opponentTwo: string;
  scoreFor: number;
  scoreAgainst: number;
  notes: string;
};

async function ensureDbFile() {
  await mkdir(path.dirname(dbPath), { recursive: true });

  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeDatabase(emptyDb);
  }
}

export async function readDatabase(): Promise<BetaDatabase> {
  await ensureDbFile();
  const raw = await readFile(dbPath, "utf8");
  return JSON.parse(raw) as BetaDatabase;
}

export async function writeDatabase(database: BetaDatabase) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

export function sanitizeRegistration(input: RegisterInput): RegisterInput {
  return {
    ...input,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    registrationChannel: input.registrationChannel ?? "website",
  };
}

export function validateRegistration(input: RegisterInput) {
  if (!input.name || !input.email || !input.phone) {
    return "Name, email, and phone are required.";
  }

  if (!input.email.includes("@")) {
    return "Enter a valid email address.";
  }

  return "";
}

export function publicUser(user: BetaUser) {
  return user;
}

export async function registerUser(input: RegisterInput) {
  const database = await readDatabase();
  const registration = sanitizeRegistration(input);
  const validationError = validateRegistration(registration);

  if (validationError) {
    return { error: validationError, user: null };
  }

  const duplicate = database.users.find(
    (user) => user.email === registration.email || user.phone === registration.phone,
  );

  if (duplicate) {
    return { error: "A beta registrant with that email or phone already exists.", user: null };
  }

  const now = new Date().toISOString();
  const rating = estimateInitialRating(registration);
  const user: BetaUser = {
    ...registration,
    id: `u_${Date.now()}`,
    role: "player",
    rating,
    tier: tierForRating(rating),
    placementCount: 0,
    isPlaced: false,
    wins: 0,
    losses: 0,
    confidence: "calibrating",
    createdAt: now,
    updatedAt: now,
  };

  database.users.push(user);
  await writeDatabase(database);
  return { error: "", user: publicUser(user) };
}

export async function findUserById(userId: string) {
  const database = await readDatabase();
  return database.users.find((user) => user.id === userId) ?? null;
}

export async function findUserByEmail(email: string) {
  const database = await readDatabase();
  return database.users.find((user) => user.email === email.trim().toLowerCase()) ?? null;
}

export async function findUserByContact(contact: string) {
  const normalized = contact.trim().toLowerCase();
  const database = await readDatabase();
  return database.users.find(
    (user) => user.email === normalized || user.phone.trim().toLowerCase() === normalized,
  ) ?? null;
}

export function isValidAdminCode(adminCode?: string) {
  const configuredCode = process.env.NADD_BETA_ADMIN_CODE || fallbackAdminCode;
  return Boolean(adminCode && adminCode === configuredCode);
}

export function canManageAdmins(actor: BetaUser | null, adminCode?: string) {
  return actor?.role === "admin" || isValidAdminCode(adminCode);
}

export async function updateUserRole(input: {
  actorId: string;
  adminCode?: string;
  targetUserId: string;
  role: BetaUser["role"];
}) {
  const database = await readDatabase();
  const actor = database.users.find((user) => user.id === input.actorId) ?? null;

  if (!canManageAdmins(actor, input.adminCode)) {
    return { error: "Admin access is required to change roles.", user: null };
  }

  const targetIndex = database.users.findIndex((user) => user.id === input.targetUserId);

  if (targetIndex < 0) {
    return { error: "Registrant not found.", user: null };
  }

  const updatedUser: BetaUser = {
    ...database.users[targetIndex],
    role: input.role,
    updatedAt: new Date().toISOString(),
  };

  database.users[targetIndex] = updatedUser;
  await writeDatabase(database);

  return { error: "", user: publicUser(updatedUser) };
}

export async function recordGame(input: GameInput) {
  const database = await readDatabase();
  const userIndex = database.users.findIndex((user) => user.id === input.userId);

  if (userIndex < 0) {
    return { error: "Sign in again before recording a game.", game: null, user: null };
  }

  if (!input.playedAt || !input.location || !input.opponentOne || !input.opponentTwo) {
    return { error: "Date, location, and both opponents are required.", game: null, user: null };
  }

  if (!Number.isFinite(input.scoreFor) || !Number.isFinite(input.scoreAgainst)) {
    return { error: "Enter a valid score.", game: null, user: null };
  }

  if (input.scoreFor === input.scoreAgainst) {
    return { error: "Padel matches need a winner for ranking updates.", game: null, user: null };
  }

  const user = database.users[userIndex];
  const result = input.scoreFor > input.scoreAgainst ? "win" : "loss";
  const ratingDelta = result === "win" ? 18 : -12;
  const nextRating = Math.max(900, user.rating + ratingDelta);
  const nextPlacementCount = Math.min(3, user.placementCount + 1);
  const now = new Date().toISOString();

  const game: RecordedGame = {
    id: `g_${Date.now()}`,
    ownerId: user.id,
    ownerName: user.name,
    playedAt: input.playedAt,
    location: input.location.trim(),
    partnerName: input.partnerName.trim(),
    opponentOne: input.opponentOne.trim(),
    opponentTwo: input.opponentTwo.trim(),
    scoreFor: input.scoreFor,
    scoreAgainst: input.scoreAgainst,
    result,
    notes: input.notes.trim(),
    createdAt: now,
  };

  const updatedUser: BetaUser = {
    ...user,
    rating: nextRating,
    tier: tierForRating(nextRating),
    placementCount: nextPlacementCount,
    isPlaced: nextPlacementCount >= 3,
    wins: user.wins + (result === "win" ? 1 : 0),
    losses: user.losses + (result === "loss" ? 1 : 0),
    confidence: nextPlacementCount >= 3 ? "stable" : "calibrating",
    updatedAt: now,
  };

  database.users[userIndex] = updatedUser;
  database.games.unshift(game);
  await writeDatabase(database);

  return { error: "", game, user: publicUser(updatedUser) };
}

export async function betaSnapshot(userId?: string, adminCode?: string) {
  const database = await readDatabase();
  const currentUser = userId
    ? database.users.find((user) => user.id === userId) ?? null
    : null;
  const myGames = currentUser
    ? database.games.filter((game) => game.ownerId === currentUser.id)
    : [];

  return {
    currentUser,
    myGames,
    metrics: {
      registeredUsers: database.users.length,
      recordedGames: database.games.length,
      placedUsers: database.users.filter((user) => user.isPlaced).length,
    },
    admin: canManageAdmins(currentUser, adminCode)
      ? {
          users: database.users,
          games: database.games,
        }
      : null,
  };
}
