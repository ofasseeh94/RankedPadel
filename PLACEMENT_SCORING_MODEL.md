# RankedPadel Placement Scoring Model

## Purpose

The registration score is not a self-rating. It is a draft placement estimate used to place a new player into fairer first matches. The estimate must be validated through 3 confirmed placement matches before exact points become public.

## Principles

- No single answer should move a player into a high tier.
- Coaching and training consistency should outweigh casual time played.
- Time played without coaching does not automatically imply advanced level.
- Tournament claims can increase confidence, but high claims should be admin-reviewable.
- Racket-sport background helps, but it cannot replace padel-specific checkpoints.
- Higher levels require passing all lower checkpoint gates.

## Domains

The draft estimate is based on five domains:

| Domain | What it measures | Why it matters |
| --- | --- | --- |
| Training | Coaching history and weekly repetition | Separates structured improvement from casual play |
| Experience | Time playing and racket background | Gives context, but should not dominate |
| Competition | Tournament level and results | Strong signal, but easier to exaggerate |
| Technical | serve, return, tactics, pressure consistency | Closest proxy for court ability |
| Transfer | tennis, squash, or other racket background | Helps with starting level, not final proof |

## Tier Gates

Suggested draft gates:

| Gate | Meaning | Required pattern |
| --- | --- | --- |
| Basic | Can join beginner-friendly games | Some technical stability and either training or experience |
| Intermediate | Can play regular social competitive games | Technical consistency, some training, enough padel experience |
| Advanced | Can handle strong club games | Higher technical score plus training and competition or racket transfer |
| Pro | Strong competitive player | High technical, structured training, meaningful competition |
| Elite | Rare beta case | Very high technical, training, and competition signals |

## Manipulation Review Flags

Flag for admin review when:

- Player claims tournament wins but no tournament level.
- Player claims high technical consistency with no coaching and no tournament history.
- Player has played for years but has no coaching and tries to land above Basic.
- Player claims semi-pro racket background but no racket sport.
- Draft placement reaches Pro or Elite.

## User Experience

The player should see:

- Easy dropdowns and chips.
- No draft placement tier or points on signup.
- A neutral message that placement is calculated privately and validated through confirmed matches.
- Placement progress.
- Clear message that exact points unlock after 3 confirmed matches.
- Other players' exact points should not be visible in player-facing screens.
- The signed-in player may see their own exact points once placed.

The admin should see:

- Hidden points.
- Domain scores.
- Gate passed.
- Risk/review flags.
- Email and phone uniqueness.
- Placement progress.
- Court records and location links used by the open-games filter.
