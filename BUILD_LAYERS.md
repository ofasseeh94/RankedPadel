# RankedPadel Beta Build Layers

## Layer 1: Local Friend-Test Prototype

Path: `rankedpadel-beta-static/index.html`

Purpose:
- Test the public landing page, signup, login, dashboard, and player game flow.
- Test the registration checklist and draft placement logic.
- Add friends as test players.
- Treat each signup as a distinct player ID with future records linked to that ID.
- Show a signed-in player dashboard with rank, points visibility, win/loss, placement progress, and leaderboard position.
- Create and find games through separate player views.
- Join players into open right/left team slots.
- Confirm a match result and see ranking/placement movement.
- Validate whether the 3-match placement phase feels fair.

Current behavior:
- Email and phone are checked for duplicate entries inside the local session.
- Initial draft rating is estimated from tiered checkpoint gates, not equal-weight answers.
- Placement players show `Placement` instead of public points.
- After 3 confirmed matches, the player becomes placed.
- Ranking movement uses a simple ELO-style update for early testing.
- Landing, player beta, and admin views are separated so user-facing screens stay simple while admin data remains auditable.
- Match creation uses Team 1 and Team 2, each with right-side and left-side slots.
- Creators can add a premade partner, leave positions open, or require a pass for locked positions.
- Player-facing leaderboard shows rank/tier but hides other players' exact points.
- Admin view shows exact points and can manage court records with location links.

## Layer 2: Real Data Model

Move the local prototype into Supabase tables:
- `players`
- `match_requests`
- `match_slots`
- `matches`
- `rating_history`
- `notification_preferences`
- `feature_flags`
- `courts`

Important constraints:
- `players.email` must be unique.
- `players.phone` must be unique after normalization.
- All match, slot, score, and rating records must reference the player ID, not just a display name.
- Match slots should store team number, side position, player ID, reserved player ID, locked status, and optional access policy.
- Courts should store name, area, and map/location URL for player-facing open games.
- Exact points should be visible to the signed-in player for their own dashboard after placement, and to admins only for all players.
- Matches should update rankings only once.
- Disputed matches should not update rankings until admin resolution.

## Layer 3: Authenticated Web Beta

Build the real Next.js app around:
- Magic-link login.
- Registration and initial placement.
- Signed-in player dashboard as the post-login landing page.
- Find open games with day, rank, and court filters.
- Team/side slot-based match creation.
- Score submission and confirmation.
- Public leaderboard.
- Admin court management.
- Admin dispute review.

## Layer 4: Ranking Engine Upgrade

Start with simple ELO-style movement for testing, then replace with Glicko-2 after enough sample matches.

Testing questions:
- Are players being initially placed near their real level?
- Do 3 placement matches feel enough?
- Are ratings moving too fast or too slowly?
- Should tiers have divisions immediately, or only after the pool grows?
- Which checkpoint gates are too easy to exaggerate?
- Which answers best predict real performance after the first 3 confirmed matches?

## Layer 5: Notifications

For the beta, use WhatsApp manually.

Still store preferences for future automation:
- New match alerts.
- Match update alerts.
- Lobby filled alerts.
- Score confirmation alerts.
- Dispute alerts.
- Rating update alerts.

Later, add email/WhatsApp/push automation behind feature flags.
