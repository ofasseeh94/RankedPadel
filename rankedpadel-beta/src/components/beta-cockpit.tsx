"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { estimateInitialRating, tierForRating } from "@/lib/ranking";
import type { BetaUser, RecordedGame, RegistrationAnswers } from "@/types/beta";

const sessionKey = "nadd-beta-user-id";
const adminSessionKey = "nadd-beta-admin-code";

const blankRegistration: RegistrationAnswers = {
  name: "",
  email: "",
  phone: "",
  registrationChannel: "website",
  side: "unsure",
  frequency: "weekly",
  padelAge: "sixMonths",
  coaching: "few",
  racketSport: "none",
  racketLevel: "casual",
  tournament: "none",
  tournamentResult: "none",
};

const blankGame = {
  playedAt: new Date().toISOString().slice(0, 10),
  location: "",
  partnerName: "",
  opponentOne: "",
  opponentTwo: "",
  scoreFor: "6",
  scoreAgainst: "4",
  notes: "",
};

type Snapshot = {
  currentUser: BetaUser | null;
  myGames: RecordedGame[];
  metrics: {
    registeredUsers: number;
    recordedGames: number;
    placedUsers: number;
  };
  admin: null | {
    users: BetaUser[];
    games: RecordedGame[];
  };
};

export function BetaCockpit() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [registration, setRegistration] = useState(blankRegistration);
  const [loginContact, setLoginContact] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [game, setGame] = useState(blankGame);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const currentUser = snapshot?.currentUser ?? null;
  const estimatedRating = estimateInitialRating(registration);
  const sortedRegistrants = useMemo(
    () => [...(snapshot?.admin?.users ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [snapshot?.admin?.users],
  );

  async function fetchSnapshot(userId = "", code = "") {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (code) params.set("adminCode", code);
    const response = await fetch(`/api/beta${params.size ? `?${params.toString()}` : ""}`, {
      cache: "no-store",
    });
    return (await response.json()) as Snapshot;
  }

  async function loadSnapshot(
    userId = localStorage.getItem(sessionKey) ?? "",
    code = localStorage.getItem(adminSessionKey) ?? "",
  ) {
    const data = await fetchSnapshot(userId, code);
    setSnapshot(data);
  }

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        const savedAdminCode = localStorage.getItem(adminSessionKey) ?? "";
        setAdminCode(savedAdminCode);
        const data = await fetchSnapshot(localStorage.getItem(sessionKey) ?? "", savedAdminCode);
        if (isMounted) setSnapshot(data);
      } catch {
        if (isMounted) setMessage("Could not load beta data yet.");
      }
    }

    void boot();

    return () => {
      isMounted = false;
    };
  }, []);

  async function submitRegistration() {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/beta/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Registration failed.");
        return;
      }

      localStorage.setItem(sessionKey, data.user.id);
      setRegistration(blankRegistration);
      await loadSnapshot(data.user.id);
      setMessage("Registration complete. Welcome to your dashboard.");
    } finally {
      setIsBusy(false);
    }
  }

  async function submitLogin() {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/beta/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: loginContact }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Login failed.");
        return;
      }

      localStorage.setItem(sessionKey, data.user.id);
      await loadSnapshot(data.user.id, adminCode);
      setMessage("You are back in your beta dashboard.");
    } finally {
      setIsBusy(false);
    }
  }

  async function submitGame() {
    if (!currentUser) return;
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/beta/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...game,
          userId: currentUser.id,
          scoreFor: Number(game.scoreFor),
          scoreAgainst: Number(game.scoreAgainst),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Could not record this game.");
        return;
      }

      setGame({ ...blankGame, playedAt: new Date().toISOString().slice(0, 10) });
      await loadSnapshot(currentUser.id);
      setMessage("Game recorded. Your dashboard and admin backend are updated.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlockAdmin() {
    if (!currentUser) return;
    localStorage.setItem(adminSessionKey, adminCode);
    await loadSnapshot(currentUser.id, adminCode);
    setMessage("Admin access refreshed. You can now choose which registrants are admins if the code is valid.");
  }

  async function updateRegistrantRole(targetUserId: string, role: BetaUser["role"]) {
    if (!currentUser) return;
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/beta/admin/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: currentUser.id,
          adminCode,
          targetUserId,
          role,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Could not update admin role.");
        return;
      }

      await loadSnapshot(currentUser.id, adminCode);
      setMessage("Admin role updated.");
    } finally {
      setIsBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(adminSessionKey);
    setAdminCode("");
    setSnapshot((current) => current ? { ...current, currentUser: null, myGames: [], admin: null } : current);
    setMessage("Signed out on this device.");
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <section className="border-b border-[#d8ded4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#47735d]">
              NADD Beta
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#111814] sm:text-5xl">
              Register, open your dashboard, and start recording real beta games.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5a685f]">
              Registration can happen directly from the website or be captured from a phone signup. Admin access is assigned intentionally from the backend view.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Registrants" value={(snapshot?.metrics.registeredUsers ?? 0).toString()} />
            <Metric label="Games" value={(snapshot?.metrics.recordedGames ?? 0).toString()} />
            <Metric label="Placed" value={(snapshot?.metrics.placedUsers ?? 0).toString()} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-6">
        {message ? (
          <div className="mb-5 rounded-lg border border-[#cdd9ca] bg-white px-4 py-3 text-sm font-medium text-[#31523d]">
            {message}
          </div>
        ) : null}

        {currentUser ? (
          <Dashboard
            adminCode={adminCode}
            currentUser={currentUser}
            game={game}
            games={snapshot?.myGames ?? []}
            isBusy={isBusy}
            onAdminCodeChange={setAdminCode}
            onGameChange={setGame}
            onUnlockAdmin={unlockAdmin}
            onRecordGame={submitGame}
            onSignOut={signOut}
          />
        ) : (
          <Registration
            estimatedRating={estimatedRating}
            adminCode={adminCode}
            isBusy={isBusy}
            loginContact={loginContact}
            registration={registration}
            onLogin={submitLogin}
            onAdminCodeChange={setAdminCode}
            onLoginContactChange={setLoginContact}
            onRegistrationChange={setRegistration}
            onRegister={submitRegistration}
          />
        )}

        {snapshot?.admin ? (
          <AdminPanel
            games={snapshot.admin.games}
            isBusy={isBusy}
            onRoleChange={updateRegistrantRole}
            registrants={sortedRegistrants}
          />
        ) : null}
      </div>
    </main>
  );
}

function Registration({
  adminCode,
  estimatedRating,
  isBusy,
  loginContact,
  registration,
  onLogin,
  onAdminCodeChange,
  onLoginContactChange,
  onRegistrationChange,
  onRegister,
}: {
  adminCode: string;
  estimatedRating: number;
  isBusy: boolean;
  loginContact: string;
  registration: RegistrationAnswers;
  onLogin: () => void;
  onAdminCodeChange: (value: string) => void;
  onLoginContactChange: (value: string) => void;
  onRegistrationChange: (value: RegistrationAnswers) => void;
  onRegister: () => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Log in">
        <p className="text-sm leading-6 text-[#65756a]">
          Open an existing beta dashboard with either email or phone. Add the admin code only when you need to manage roles.
        </p>
        <div className="mt-4 grid gap-3">
          <Field label="Email or phone">
            <input value={loginContact} onChange={(event) => onLoginContactChange(event.target.value)} />
          </Field>
          <Field label="Admin code">
            <input type="password" value={adminCode} onChange={(event) => onAdminCodeChange(event.target.value)} />
          </Field>
        </div>
        <button disabled={isBusy} onClick={onLogin} className="mt-4 h-11 w-full rounded-md bg-[#17211b] px-5 text-sm font-semibold text-white hover:bg-[#29382f] disabled:opacity-60">
          Open my dashboard
        </button>
        <div className="mt-5 rounded-lg border border-[#d9e0d5] bg-[#fbfcfa] p-4">
          <p className="text-sm font-semibold text-[#405145]">New to the beta?</p>
          <p className="mt-1 text-sm leading-6 text-[#65756a]">
            Register on this same page below. Phone signups can also be captured by selecting phone-assisted registration.
          </p>
        </div>
      </Panel>

      <Panel title="Register">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Name">
            <input value={registration.name} onChange={(event) => onRegistrationChange({ ...registration, name: event.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" value={registration.email} onChange={(event) => onRegistrationChange({ ...registration, email: event.target.value })} />
          </Field>
          <Field label="Phone">
            <input value={registration.phone} onChange={(event) => onRegistrationChange({ ...registration, phone: event.target.value })} />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Select label="Registration source" value={registration.registrationChannel} onChange={(value) => onRegistrationChange({ ...registration, registrationChannel: value as RegistrationAnswers["registrationChannel"] })} options={[
            ["website", "Website signup"],
            ["phone", "Phone-assisted signup"],
          ]} />
          <Select label="Primary side" value={registration.side} onChange={(value) => onRegistrationChange({ ...registration, side: value as RegistrationAnswers["side"] })} options={[
            ["right", "Right"],
            ["left", "Left"],
            ["both", "Both"],
            ["unsure", "Not sure"],
          ]} />
          <Select label="Weekly play" value={registration.frequency} onChange={(value) => onRegistrationChange({ ...registration, frequency: value as RegistrationAnswers["frequency"] })} options={[
            ["rare", "< 1 / week"],
            ["weekly", "1 / week"],
            ["regular", "2-3 / week"],
            ["heavy", "4+ / week"],
          ]} />
          <Select label="Time playing" value={registration.padelAge} onChange={(value) => onRegistrationChange({ ...registration, padelAge: value as RegistrationAnswers["padelAge"] })} options={[
            ["new", "< 3 months"],
            ["threeMonths", "3-6 months"],
            ["sixMonths", "6-12 months"],
            ["oneYear", "1-2 years"],
            ["twoYears", "2+ years"],
          ]} />
          <Select label="Coaching" value={registration.coaching} onChange={(value) => onRegistrationChange({ ...registration, coaching: value as RegistrationAnswers["coaching"] })} options={[
            ["none", "No training"],
            ["few", "Few sessions"],
            ["short", "1-3 months"],
            ["long", "3-12 months"],
            ["yearPlus", "1+ year"],
          ]} />
          <Select label="Racket background" value={registration.racketSport} onChange={(value) => onRegistrationChange({ ...registration, racketSport: value as RegistrationAnswers["racketSport"] })} options={[
            ["none", "None"],
            ["tennis", "Tennis"],
            ["squash", "Squash"],
            ["tableTennis", "Table tennis"],
            ["other", "Other"],
          ]} />
          <Select label="Tournament level" value={registration.tournament} onChange={(value) => onRegistrationChange({ ...registration, tournament: value as RegistrationAnswers["tournament"] })} options={[
            ["none", "None"],
            ["social", "Social"],
            ["club", "Club"],
            ["regional", "City / regional"],
            ["national", "National"],
          ]} />
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#d9e0d5] bg-[#fbfcfa] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#607064]">Draft placement estimate</p>
            <p className="mt-1 text-2xl font-semibold">
              {tierForRating(estimatedRating)} / {estimatedRating} hidden points
            </p>
            <p className="mt-1 text-sm text-[#68786d]">Public rating stabilizes after 3 recorded beta games.</p>
          </div>
          <button disabled={isBusy} onClick={onRegister} className="h-11 rounded-md bg-[#1f6f52] px-5 text-sm font-semibold text-white hover:bg-[#18593f] disabled:opacity-60">
            Register and open dashboard
          </button>
        </div>
      </Panel>
    </section>
  );
}

function Dashboard({
  adminCode,
  currentUser,
  game,
  games,
  isBusy,
  onAdminCodeChange,
  onGameChange,
  onUnlockAdmin,
  onRecordGame,
  onSignOut,
}: {
  adminCode: string;
  currentUser: BetaUser;
  game: typeof blankGame;
  games: RecordedGame[];
  isBusy: boolean;
  onAdminCodeChange: (value: string) => void;
  onGameChange: (value: typeof blankGame) => void;
  onUnlockAdmin: () => void;
  onRecordGame: () => void;
  onSignOut: () => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="My beta dashboard">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold">{currentUser.name}</p>
            <p className="mt-1 text-sm text-[#65756a]">{currentUser.email} / {currentUser.phone}</p>
            <p className="mt-1 text-sm text-[#65756a]">Registered by {currentUser.registrationChannel === "phone" ? "phone" : "website"}</p>
            <span className="mt-3 inline-flex rounded-full bg-[#e6efe8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#276345]">
              {currentUser.role}
            </span>
          </div>
          <button onClick={onSignOut} className="h-10 rounded-md border border-[#abc0b0] px-4 text-sm font-semibold text-[#24543d] hover:bg-[#edf4ef]">
            Sign out
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Tier" value={currentUser.tier} />
          <Stat label="Rating" value={currentUser.isPlaced ? currentUser.rating.toString() : "Placement"} />
          <Stat label="Record" value={`${currentUser.wins}-${currentUser.losses}`} />
          <Stat label="Placement" value={`${currentUser.placementCount}/3`} />
        </div>

        <div className="mt-5 rounded-lg border border-[#d9e0d5] bg-[#fbfcfa] p-4">
          <p className="text-sm font-semibold text-[#405145]">Admin access</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="password" value={adminCode} onChange={(event) => onAdminCodeChange(event.target.value)} placeholder="Admin code" />
            <button disabled={isBusy} onClick={onUnlockAdmin} className="h-11 rounded-md bg-[#17211b] px-5 text-sm font-semibold text-white hover:bg-[#29382f] disabled:opacity-60">
              Unlock admin
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Record a game">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Date">
            <input type="date" value={game.playedAt} onChange={(event) => onGameChange({ ...game, playedAt: event.target.value })} />
          </Field>
          <Field label="Location">
            <input value={game.location} onChange={(event) => onGameChange({ ...game, location: event.target.value })} />
          </Field>
          <Field label="Partner">
            <input value={game.partnerName} onChange={(event) => onGameChange({ ...game, partnerName: event.target.value })} />
          </Field>
          <Field label="Opponent 1">
            <input value={game.opponentOne} onChange={(event) => onGameChange({ ...game, opponentOne: event.target.value })} />
          </Field>
          <Field label="Opponent 2">
            <input value={game.opponentTwo} onChange={(event) => onGameChange({ ...game, opponentTwo: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Your score">
              <input type="number" min="0" value={game.scoreFor} onChange={(event) => onGameChange({ ...game, scoreFor: event.target.value })} />
            </Field>
            <Field label="Their score">
              <input type="number" min="0" value={game.scoreAgainst} onChange={(event) => onGameChange({ ...game, scoreAgainst: event.target.value })} />
            </Field>
          </div>
        </div>

        <label className="mt-3 block text-sm font-medium text-[#405145]">
          Notes
          <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#cbd6ca] bg-white p-3 text-sm" value={game.notes} onChange={(event) => onGameChange({ ...game, notes: event.target.value })} />
        </label>

        <button disabled={isBusy} onClick={onRecordGame} className="mt-4 h-11 rounded-md bg-[#1f6f52] px-5 text-sm font-semibold text-white hover:bg-[#18593f] disabled:opacity-60">
          Save game to backend
        </button>
      </Panel>

      <Panel title="My recorded games">
        {games.length ? (
          <div className="space-y-3">
            {games.map((recordedGame) => (
              <GameRow key={recordedGame.id} game={recordedGame} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#65756a]">No games recorded yet. Your first saved result will appear here and in the admin backend.</p>
        )}
      </Panel>
    </section>
  );
}

function AdminPanel({
  games,
  isBusy,
  onRoleChange,
  registrants,
}: {
  games: RecordedGame[];
  isBusy: boolean;
  onRoleChange: (targetUserId: string, role: BetaUser["role"]) => void;
  registrants: BetaUser[];
}) {
  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Admin backend: registered people">
        {registrants.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9e0d5] text-xs uppercase tracking-[0.12em] text-[#65756a]">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">Level</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrants.map((user) => (
                  <tr key={user.id} className="border-b border-[#edf0eb]">
                    <td className="py-3 pr-4 font-semibold">{user.name}</td>
                    <td className="py-3 pr-4 text-[#65756a]">{user.email}<br />{user.phone}</td>
                    <td className="py-3 pr-4">{user.tier}<br /><span className="text-[#65756a]">{user.wins}-{user.losses}</span></td>
                    <td className="py-3 pr-4">
                      <select
                        disabled={isBusy}
                        value={user.role}
                        onChange={(event) => onRoleChange(user.id, event.target.value as BetaUser["role"])}
                      >
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4 text-[#65756a]">{user.registrationChannel === "phone" ? "Phone" : "Website"}</td>
                    <td className="py-3 pr-4 text-[#65756a]">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[#65756a]">No registrations yet.</p>
        )}
      </Panel>

      <Panel title="Admin backend: recorded games">
        {games.length ? (
          <div className="space-y-3">
            {games.map((recordedGame) => (
              <GameRow key={recordedGame.id} game={recordedGame} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#65756a]">Recorded games from beta users will appear here.</p>
        )}
      </Panel>
    </section>
  );
}

function GameRow({ game }: { game: RecordedGame }) {
  return (
    <div className="rounded-lg border border-[#d9e0d5] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{game.ownerName} {game.result === "win" ? "won" : "lost"} {game.scoreFor}-{game.scoreAgainst}</p>
          <p className="text-sm text-[#65756a]">{game.location} / {new Date(game.playedAt).toLocaleDateString()}</p>
        </div>
        <span className="rounded-full bg-[#e6efe8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#276345]">
          {game.result}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#65756a]">
        Partner: {game.partnerName || "Not listed"} / Opponents: {game.opponentOne}, {game.opponentTwo}
      </p>
      {game.notes ? <p className="mt-2 text-sm text-[#405145]">{game.notes}</p> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-lg border border-[#d9e0d5] bg-[#fbfcfa] px-4 py-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#65756a]">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d9e0d5] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="block text-sm font-medium text-[#405145]">
      {label}
      {children}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <label className="block text-sm font-medium text-[#405145]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d9e0d5] bg-[#fbfcfa] p-4">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#65756a]">{label}</p>
    </div>
  );
}
