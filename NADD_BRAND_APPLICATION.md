# NADD Brand Application Notes

## Current Website Direction

The prototype is now aligned to the NADD brand direction from `NADD_Brand_Guidelines_v1.0.pdf`.

## Brand Basics

- Master brand: `NADD`
- Brand idea: `Find your equal.`
- Product line: `Ranked padel games, on demand.`
- Launch campaign: `No More Random Matches`
- Short CTA: `Play your level.`

## Visual System

- Court Navy: `#0D1628`
- Signal Lime: `#C6FF00`
- Sand Gold: `#C9A45A`
- Off White: `#F7F4EA`
- Glass Grey: `#D8DEE8`
- Ink: `#162033`

Use Court Navy and Off White as the base, Signal Lime for action, and Sand Gold only for achievement and premium accents.

## Typography System

- Primary English typeface: `Space Grotesk`
- Arabic companion typeface: `IBM Plex Sans Arabic`
- Numerals and scores: `Space Grotesk Medium/Bold` with tabular numeral behavior where possible
- Fallback: `Arial`, then system sans-serif

Usage:

- Hero headline: `Space Grotesk 700`
- Section titles: `Space Grotesk 700`
- Subheads and product copy: `Space Grotesk 500`
- Body/UI copy: `Space Grotesk 400`
- Buttons: `Space Grotesk 700`
- Labels/tags: `Space Grotesk 600`
- NADD Levels, NADD Scores, match times, and NADD Board positions: `Space Grotesk 700`
- Arabic UI/campaign lines: `IBM Plex Sans Arabic 500-700`

## Product Language

Use:

- `NADD Level`
- `NADD Score`
- `Ranked Match`
- `Friendly Match`
- `Open Slot`
- `NADD Board`
- `Placement`
- `Verified`

Avoid:

- generic `rank`
- generic `points`
- `ELO` unless the final formula is officially Elo-based
- `official ranking` unless legally partnered

## Level Labels

- `N1 Starter`
- `N2 Developing`
- `N3 Club`
- `N4 Competitive`
- `N5 Advanced`
- `N6 Elite Amateur`
- `N7 Pro / Invitational`

## Current Prototype Notes

- Public player-facing screens show NADD Level, not other players' exact NADD Score.
- The signed-in player can see their own NADD Score only when placed.
- Admin screens can see exact NADD Scores.
- Signup does not reveal draft placement; it only says the provisional level is calculated privately and validated through confirmed Ranked Matches.

## Landing Page Direction

- Public navigation should show only brand/product links: `How it works`, `Ranking`, `Matches`, `City Board`, `For clubs`, `Log in`, and `Get your NADD Level`.
- Do not expose prototype/admin destinations in the public navigation.
- Hero structure should lead with `NO MORE RANDOM MATCHES` and `Find your equal.`
- Above the fold should explain the product system immediately: `Verified Levels`, `Ranked Matches`, `Open Slots`, and `City Boards`.
- Use a product-led glass card to show an Open Slot example, such as `N4.0-N4.7`, `Needs 1 right-side player`, and `Join Match`.
- The first section after the hero should explain the flow: get your level, join the right match, play/improve/move up.

## Launch Growth Loop

The public beta should make players feel that if they do not record, they lose proof, progress, and position.

- Primary early action: `Record a Match`
- Main loop: play, record, confirm, move, compare, return
- Core public sections: ranking proof, match types, City Board, Match Receipt, and clubs
- Gamification should stay premium and respectful: nearby rivals, top movers, rematches, and challenge prompts without insulting copy
- Match receipts should become a shareable proof asset after confirmed results

## Publishing

- Static beta source: `rankedpadel-beta-static`
- GitHub Pages workflow: `.github/workflows/pages.yml`
- Deployment source should be GitHub Actions so the static beta can publish from the repo on pushes to `main`.
