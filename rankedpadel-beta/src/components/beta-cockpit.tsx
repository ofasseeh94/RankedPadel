"use client";

import { useMemo, useState } from "react";
import { applyConfirmedMatch, estimateInitialRating, tierForRating } from "@/lib/ranking";
import { seedMatches, seedPlayers } from "@/lib/seed";
import type { MatchRequest, Player, RegistrationAnswers } from "@/types/beta";

const blankRegistration: RegistrationAnswers = {
  name: "",
  email: "",
  phone: "",
  side: "unsure",
  frequency: "weekly",
  padelAge: "sixMonths",
  coaching: "few",
  racketSport: "none",
  racketLevel: "casual",
  tournament: "none",
  tournamentResult: "none",
};

export function BetaCockpit() {
  const [players, setPlayers] = useState<Player[]>(seedPlayers);
  const [matches, setMatches] = useState<MatchRequest[]>(seedMatches);
  const [registration, setRegistration] = useState(blankRegistration);
  const [selectedPlayer, setSelectedPlayer] = useState("p4");
  const [scoreMatchId, setScoreMatchId] = useState("m1");
  const [winnerTeam, setWinnerTeam] = useState<1 | 2>(1);

  const estimatedRating = estimateInitialRating(registration);
  const selectedMatch = matches.find((match) => match.id === scoreMatchId);
  const rankedPlayers = useMemo(
    () => [...players].sort((a, b) => b.rating - a.rating),
    [players],
  );

  function registerPlayer() {
    const normalizedEmail = registration.email.trim().toLowerCase();
    const normalizedPhone = registration.phone.trim();
    const hasDuplicate = players.some(
      (player) => player.email === normalizedEmail || player.phone === normalizedPhone,
    );

    if (!registration.name || !normalizedEmail || !normalizedPhone || hasDuplicate) {
      return;
    }

    const player: Player = {
      id: `p${Date.now()}`,
      name: registration.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      side: registration.side,
      rating: estimatedRating,
      tier: tierForRating(estimatedRating),
      placementCount: 0,
      isPlaced: false,
      wins: 0,
      losses: 0,
      confidence: "calibrating",
    };

    setPlayers((current) => [...current, player]);
    setSelectedPlayer(player.id);
    setRegistration(blankRegistration);
  }

  function joinMatch(matchId: string) {
    setMatches((current) =>
      current.map((match) => {
        if (match.id !== matchId || match.players.includes(selectedPlayer) || match.players.length >= 4) {
          return match;
        }

        const nextPlayers = [...match.players, selectedPlayer];
        return {
          ...match,
          players: nextPlayers,
          status: nextPlayers.length >= 4 ? "full" : "open",
        };
      }),
    );
  }

  function confirmScore() {
    if (!selectedMatch || selectedMatch.players.length < 4) return;

    const [a, b, c, d] = selectedMatch.players;
    setPlayers((current) => applyConfirmedMatch(current, [a, b], [c, d], winnerTeam));
    setMatches((current) =>
      current.map((match) =>
        match.id === selectedMatch.id ? { ...match, status: "completed" } : match,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <section className="border-b border-[#d8ded4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#47735d]">
              RankedPadel Beta
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#111814] sm:text-5xl">
              Small-scale test cockpit for ranked padel matches.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5a685f]">
              This draft lets you test the first beta layers with friends: draft placement,
              open lobbies, vacant slots, score confirmation, and a live ranking table.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Players" value={players.length.toString()} />
            <Metric label="Open games" value={matches.filter((m) => m.status !== "completed").length.toString()} />
            <Metric label="Placed" value={players.filter((p) => p.isPlaced).length.toString()} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="1. Registration & Draft Placement">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Name">
              <input value={registration.name} onChange={(event) => setRegistration({ ...registration, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <input value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} />
            </Field>
            <Field label="Phone">
              <input value={registration.phone} onChange={(event) => setRegistration({ ...registration, phone: event.target.value })} />
            </Field>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Select label="Primary side" value={registration.side} onChange={(value) => setRegistration({ ...registration, side: value as RegistrationAnswers["side"] })} options={[
              ["right", "Right"],
              ["left", "Left"],
              ["both", "Both"],
              ["unsure", "Not sure"],
            ]} />
            <Select label="Weekly play" value={registration.frequency} onChange={(value) => setRegistration({ ...registration, frequency: value as RegistrationAnswers["frequency"] })} options={[
              ["rare", "< 1 / week"],
              ["weekly", "1 / week"],
              ["regular", "2-3 / week"],
              ["heavy", "4+ / week"],
            ]} />
            <Select label="Time playing" value={registration.padelAge} onChange={(value) => setRegistration({ ...registration, padelAge: value as RegistrationAnswers["padelAge"] })} options={[
              ["new", "< 3 months"],
              ["threeMonths", "3-6 months"],
              ["sixMonths", "6-12 months"],
              ["oneYear", "1-2 years"],
              ["twoYears", "2+ years"],
            ]} />
            <Select label="Coaching" value={registration.coaching} onChange={(value) => setRegistration({ ...registration, coaching: value as RegistrationAnswers["coaching"] })} options={[
              ["none", "No training"],
              ["few", "Few sessions"],
              ["short", "1-3 months"],
              ["long", "3-12 months"],
              ["yearPlus", "1+ year"],
            ]} />
            <Select label="Racket background" value={registration.racketSport} onChange={(value) => setRegistration({ ...registration, racketSport: value as RegistrationAnswers["racketSport"] })} options={[
              ["none", "None"],
              ["tennis", "Tennis"],
              ["squash", "Squash"],
              ["tableTennis", "Table tennis"],
              ["other", "Other"],
            ]} />
            <Select label="Tournament level" value={registration.tournament} onChange={(value) => setRegistration({ ...registration, tournament: value as RegistrationAnswers["tournament"] })} options={[
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
                {tierForRating(estimatedRating)} · {estimatedRating} hidden points
              </p>
              <p className="mt-1 text-sm text-[#68786d]">Public rating unlocks after 3 confirmed placement matches.</p>
            </div>
            <button onClick={registerPlayer} className="h-11 rounded-md bg-[#1f6f52] px-5 text-sm font-semibold text-white hover:bg-[#18593f]">
              Add test player
            </button>
          </div>
        </Panel>

        <Panel title="2. Leaderboard">
          <div className="space-y-3">
            {rankedPlayers.map((player, index) => (
              <div key={player.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-lg border border-[#d9e0d5] bg-white p-3">
                <span className="text-center text-sm font-semibold text-[#728073]">{index + 1}</span>
                <div>
                  <p className="font-semibold">{player.name}</p>
                  <p className="text-sm text-[#65756a]">
                    {player.tier} · {player.side} side · {player.wins}-{player.losses}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{player.isPlaced ? player.rating : "Placement"}</p>
                  <p className="text-xs text-[#65756a]">{player.placementCount}/3 matches</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="3. Open Match Lobbies">
          <div className="mb-4">
            <Select label="Acting as player" value={selectedPlayer} onChange={setSelectedPlayer} options={players.map((player) => [player.id, player.name])} />
          </div>
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="rounded-lg border border-[#d9e0d5] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{match.location}</p>
                    <p className="text-sm text-[#65756a]">{match.scheduledFor}</p>
                  </div>
                  <span className="rounded-full bg-[#e6efe8] px-3 py-1 text-xs font-semibold text-[#276345]">
                    {match.status} · {4 - match.players.length} vacant
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((slot) => {
                    const player = players.find((candidate) => candidate.id === match.players[slot]);
                    return (
                      <div key={slot} className="min-h-16 rounded-md border border-dashed border-[#c9d3c7] bg-[#fbfcfa] p-2 text-sm">
                        {player ? (
                          <>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-[#65756a]">{player.tier}</p>
                          </>
                        ) : (
                          <p className="text-[#8a968d]">Vacant</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => joinMatch(match.id)} className="mt-4 h-10 rounded-md border border-[#abc0b0] px-4 text-sm font-semibold text-[#24543d] hover:bg-[#edf4ef]">
                  Join match
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="4. Score Confirmation & Ranking Update">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Match" value={scoreMatchId} onChange={setScoreMatchId} options={matches.map((match) => [match.id, `${match.location} (${match.players.length}/4)`])} />
            <Select label="Winner" value={winnerTeam.toString()} onChange={(value) => setWinnerTeam(Number(value) as 1 | 2)} options={[
              ["1", "Team 1"],
              ["2", "Team 2"],
            ]} />
          </div>
          <div className="mt-4 rounded-lg border border-[#d9e0d5] bg-white p-4">
            <p className="text-sm font-medium text-[#607064]">Team layout</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Team title="Team 1" ids={selectedMatch?.players.slice(0, 2) ?? []} players={players} />
              <Team title="Team 2" ids={selectedMatch?.players.slice(2, 4) ?? []} players={players} />
            </div>
            <button onClick={confirmScore} className="mt-4 h-11 rounded-md bg-[#17211b] px-5 text-sm font-semibold text-white hover:bg-[#29382f]">
              Confirm score and update rankings
            </button>
            <p className="mt-3 text-sm text-[#65756a]">
              Beta rule: only confirmed matches update placement count and points. Disputes stay frozen for admin review.
            </p>
          </div>
        </Panel>
      </section>
    </main>
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

function Team({ title, ids, players }: { title: string; ids: string[]; players: Player[] }) {
  return (
    <div className="rounded-md bg-[#f5f7f4] p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 space-y-1 text-sm text-[#536158]">
        {ids.length ? ids.map((id) => <p key={id}>{players.find((player) => player.id === id)?.name}</p>) : <p>Needs two players</p>}
      </div>
    </div>
  );
}
