# GRE Quant Mastery

An interactive GRE Quantitative Reasoning coach built around one sequence:

**RECOGNIZE → DECODE → CHOOSE → SOLVE → SHORTCUT → REMEMBER**

It is a standalone, modular React app, structured so it can later be merged into a GRE Verbal app. Progress is stored under its own namespaced `localStorage` key (`gre.quant.progress.v1`).

## Setup

```bash
npm install
npm run dev        # local dev server
npm test           # answer-key verification, content integrity, grading, UI interactions
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

No API keys and no backend. All questions come from a fixed, hand-written bank. Nothing is AI-generated at runtime.

## Phase 1 — implemented

| Module | What works |
| --- | --- |
| **Dashboard** | Real stats only (recognition, first-step, strategy, solving, decode accuracy; average time; hint use; accuracy by topic and difficulty; weakest topics with practice links). Reset button. Planned modules are shown as non-clickable "Planned · Phase N" cards. |
| **Recognize the Problem** | "What kind of problem is this?" with 4 choices or all 14 categories. Partial credit for secondary concepts; highlighted clues, why it is recognizable, best strategy, REMEMBER rule, then optionally solve. A separate **"What would you do FIRST?"** mode. Mixed-topic order, plus area/topic/difficulty filters. |
| **Decode the Equation** | 10 lessons: quadratics (including rearranging), linear, slope-intercept, exponents, fractions, geometry, ratios, inequalities, probability, statistics. Each has a parts table, a worked example, and checked exercises with per-field explanations. Unlimited generated quadratic a/b/c drills (standard and rearranged). |
| **Decode This Question** | Available on every practice question. Level 1 identifies the components, Level 2 connects them to a concept and strategy, Level 3 sends you back to solve. |
| **What's the Fastest Way?** | Pick a strategy; it is rated *fastest / valid / slow / won't work*, the preferred method is named, and every option is compared. |
| **Shortcut vs. Traditional** | Shortcut first (recognition clue, strategy, steps, why it works, when NOT to use it, rule); the long way stays collapsed. Questions where the standard method is already the fastest say so. |
| **Question formats** | Select one, select one or more (clearly marked, all-or-nothing grading), numeric entry (exact fractions and decimals, equivalent fractions accepted), and quantitative comparison (standard A–D statements). Hints, a second try before the reveal, the TYPE/CLUE/DECODE/STRATEGY/FAST/LONG/REMEMBER explanation, and "Try a Similar Question". |

**Question bank:** 38 original questions: arithmetic 10, algebra 12, geometry 7, data analysis 9. They cover all 14 recognition categories, all 4 formats, and 3 difficulty levels. Geometry figures are labeled and marked "not necessarily drawn to scale".

## How the math is verified

`src/test/answerKeys.test.ts` recomputes **every** answer independently in code, using brute-force enumeration where practical: dice outcomes, marble draws, factor counts, root searches, and solution-set sampling for "must be true" questions. Quantitative comparison answers are derived by sampling the allowed domain (respecting restrictions such as 0 < x < 1 and the triangle inequality). The test fails if:

- a question has no verifier,
- a select-one question has zero or more than one choice equal to the computed answer,
- a select-all key differs from the computed set,
- an "approximately" question has near-tied choices.

`contentIntegrity.test.ts` checks the structure of every question: format/answer agreement, distinct choices, exactly one "best" strategy, a complete explanation, balanced math delimiters, and no zero denominators. `decodeContent.test.ts` verifies every decode exercise answer and checks 2,000 generated quadratics algebraically. Planting a wrong answer key makes the suite fail. This was tested on purpose.

## Project layout

```
src/
  data/            question bank (by area), taxonomy, decode lessons, types
  lib/             grading (exact rationals), progress store, deck/filtering, generators
  components/      MathText (KaTeX), QuestionSolver, DecodePanel, Explanation, Diagrams
  modules/         Dashboard, Recognize, Decode, ChooseMethod, ShortcutVsTraditional
  test/            verification and interaction tests
```

## Remaining phases

- **Phase 2:** GRE Topic Library, Shortcut & Formula Vault, Spot the Clue, topic-based sessions.
- **Phase 3:** Guided step-by-step tutor, full practice sets, QC trainer with "Test Different Values", data interpretation sets.
- **Phase 4:** Mistake Tracker with error classification (asking the learner when the cause is unclear), Speed Training, 30-Second Recognition.
- **Phase 5:** Spaced review, adaptive recommendations, expanded problem generation, bookmarks, learning paths.
