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
  data/            question bank, taxonomy, decode lessons, library/, shortcuts, formulas,
                   clues, flashcards, links (cross-references)
  lib/             grading (exact rationals), progress store, deck/filtering, generators,
                   analytics, mistakes (classifier), timedSession, timer
  components/      MathText (KaTeX), QuestionSolver, DecodePanel, Explanation, Diagrams
  modules/         Dashboard, Recognize, Decode, ChooseMethod, ShortcutVsTraditional,
                   Library, Vault, Formulas, Clues, Flashcards, Practice,
                   Progress, NextPractice, Speed, TimedResults, Review, QuickPractice
  test/            verification and interaction tests
```

## Phase 2 — implemented

| Module | What works |
| --- | --- |
| **GRE Topic Library** (`#/library`) | 55 lessons across Arithmetic (19), Algebra (13), Geometry (11), Data Analysis (12). Every lesson has WHAT IS IT · HOW DO I RECOGNIZE IT (3 clues) · DECODE IT · WHAT DO I NEED TO REMEMBER · WHAT'S THE FASTEST WAY (+ when valid) · SHOW ME (+ collapsible traditional solution) · COMMON GRE TRAP · LET ME TRY (graded quick checks) · ONE-LINE TAKEAWAY. Searchable, with per-lesson progress from real attempts and links to practice, shortcuts, and formulas. |
| **Shortcut & Formula Vault** (`#/vault`) | 27 shortcuts, searchable by name, formula, concept, or clue. Each has a recognition clue, rule, symbols explained, worked example, when to use / when NOT to use, a bookmark, and **Practice This Shortcut** (a graded drill plus tagged bank questions). |
| **Understand the Formula** (`#/formulas`) | 25 formulas. Tap a component to highlight it everywhere it appears (e.g. every *a* in the quadratic formula) and see its meaning. Labeled diagrams for geometry. Every formula has a graded **Test My Understanding**; the quadratic formulas also offer generated a/b/c practice. |
| **Spot the Clue** (`#/clues`) | Phrase → meaning (26), words → expression (13), expression → words (9), and wording-trap pairs (8). Options are shuffled. |
| **Shortcut Flashcards** (`#/flashcards`) | ~135 cards derived from shortcuts, formulas, clue words, and lesson takeaways. Flip, I Knew This, Need More Practice, Bookmark, Practice an Example. Saved per card; repeatedly missed cards come first next time and return later in the same session. |
| **Topic Practice** (`#/practice`) | Recognition, Decode, Strategy, Solve, and Shortcut practice per lesson or mixed (topic hidden), at Foundational/Intermediate/Challenging. Empty combinations say so. |
| **Phase 1 integration** | Missed recognition → **Review This Concept**. Missed decode step or coefficient → **Learn What This Means**. Valid-but-slower strategy → **See a Faster Method**. Missed question with a tagged shortcut → **Practice This Shortcut**. All targets are verified to exist by tests, and every lesson, shortcut, and formula URL is rendered in a routing test. |

**Question bank (at end of Phase 2):** 66 verified questions (38 Phase 1 + 28 Phase 2). *(An earlier version of this README said 67; the Phase 2 file contains 28.)*

**Verification added:** `phase2Content.test.ts` recomputes every numeric answer in all lesson checks, shortcut drills, and formula tests (it fails on a missing or stale check). It also proves exactly one option of each Spot-the-Clue translation is equivalent to the statement, by evaluating every option, and renders every formula highlight through KaTeX. Link integrity is checked across questions, lessons, shortcuts, and formulas. `phase2Interactions.test.tsx` covers the new modules and the four integration buttons.

### Known gaps (honest status)

- ~~Practice banks are thin~~ (fixed by the bank expansion below).
- Recognition still uses the 14 Phase 1 categories. Sets, counting, and functions questions map to the nearest category (statistics, probability, linear).
- Flashcard ordering is priority-based (misses first), not full spaced repetition. That is Phase 5.
- There is no Verbal section in this repository, so there was nothing to preserve or test.

## Bank expansion

76 new questions (**142 total**: arithmetic 49, algebra 33, geometry 29, data analysis 31; 46 foundational / 54 intermediate / 42 challenging). Every lesson now has at least 3 bank questions, and 43 of 55 lessons cover all three difficulty levels. 68 questions carry **distractor metadata**: specific wrong answers mapped to a mistake type with an explanation, used as evidence in Phase 4. Every answer key is independently recomputed in `src/test/verifyBank3.ts`, and a test checks that every distractor is a genuinely wrong answer.

## Phase 4 — implemented

| Feature | What works |
| --- | --- |
| **My Quant Progress** (`#/progress`) | Overall accuracy; accuracy by topic and subtopic; recognition, component identification (decode + formula checks), and strategy selection accuracy, each with average decision time; calculation accuracy; average solving time; questions completed (unique and unanswered); questions needing hints; correct without hints; difficulty and GRE format breakdowns; mistake-cause breakdown. Filters: last 7 / 30 days / all time, topic, practice mode. Charts of daily accuracy (solving, recognition, and strategy as separate series) and daily speed, each with crosshair tooltip and a table view. "Approach vs. execution" compares earlier vs. later attempts per skill, shown only with ≥ 12 attempts over ≥ 2 days. |
| **Why did I miss this?** | After any missed question: if the answer matches an authored distractor, or a wrong recognition/strategy choice was recorded for that question in the past hour, the cause is recorded as **evidence** and shown with that evidence; the learner can correct it. Weaker signals (a wrong decode target, more than twice the pace) are only *suggested*. Otherwise the app **asks**, and stores nothing until the learner answers (including "Not sure"). Each cause links to its activity: recognition → Recognition Practice, concept → lesson, strategy → Fastest Method, reading → Spot the Clue, timing → Speed Training, careless → Review Queue, calculation → Topic Practice solving with hints *(Guided Problem Solving is a Phase 3 feature that does not exist yet)*. |
| **What Should I Practice Next?** (`#/next`) | Ranks topics by accuracy, recent accuracy (last 6), recognition accuracy, and mistake rate. Ranking starts only at ≥ 5 attempts and is labeled "early signal" below 12; topics with fewer attempts are listed under "Not enough data yet". Each weak topic shows accuracy by skill, its most common recorded mistake (or says it is unknown), advice, and a practice button. |
| **Speed Training** (`#/speed`) | **30-Second Recognition**: topic, clue, and first step under a 30 s countdown, with recognition time measured separately. **60-Second Strategy Drill**: method choice with verdict and decision time. **Timed GRE Quant Practice**: official-style presets (12 questions / 21 min and 15 / 26 min, from [ETS's current test structure](https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html); not adaptive and no on-screen calculator, both stated in the app), plus sets of 5, 10, 15, or 20 at the derived official pace (≈ 104 s/question, labeled as derived) or custom timing. Visible countdown, question navigator, mark for review, review screen, and confirm-on-submit; auto-submits at 0. Sessions persist across reloads (the clock keeps running) and can be abandoned, in which case nothing counts. Results appear only afterwards. |
| **Time management feedback** | Total time, average per answered question, correct / incorrect / unanswered, the slowest questions, quick-and-correct, and quick-but-wrong. Patterns are described without equating slow with poor understanding. **Where Could I Have Saved Time?** lists above-pace questions that have a shortcut, comparing step counts (no invented time savings). Per-question review includes the mistake panel. |
| **Mistake Review Queue** (`#/review`) | Every question ever missed (including unanswered), organized by date, topic, mistake type, difficulty, or failed-attempt count. **Retry Original** (previous answer not shown), **Try Similar** (different question, same concept), **Recognize Only** (type + strategy, no solving). Attempt history is append-only (✗ ✗ ✓) and marks "Improved". Unclassified misses can be classified from the queue. |
| **Practice What I Need** (`#/quick`) | 5 items (recognition, decode, strategy, solve, solve) aimed at the 1–3 weakest ranked topics, falling back to secondary-concept questions when a topic's bank runs out. With insufficient data it gives a balanced diagnostic across all four content areas. The summary compares session accuracy to the earlier baseline per topic (flagged as a small sample) and recommends the next activity. |

**Storage:** the same namespaced `localStorage` record, extended additively. Older attempts gain a stable id on load, with every recorded field preserved. New attempts store question id, topic and subtopic, mode, difficulty, format, selected answer, correct answer, correctness, time, hints, unanswered flag, and session id. Recognition and strategy responses are their own attempts. Classifications are stored separately with their source (`evidence` / `confirmed` / `self-reported`). Each attempt is a single record read by every dashboard, so nothing is double counted.

**Tests added:** `analytics.test.ts` covers metric arithmetic, the no-double-count invariant, filters, time series, weak-area thresholds, queue history, the quick-practice planner, evidence-only inference, and legacy migration. `phase4.test.tsx` covers recorded fields, auto-classification and correction, ask-when-unknown, retry appending, recognize-only, timed navigation, mark-for-review, persistence, manual submit vs. time expiry (with fake timers), both speed drills, dashboards on real data, insufficient-data states, and recommendations.

## Remaining phases

- **Phase 3 (not built; it was skipped):** Guided step-by-step tutor, QC trainer with "Test Different Values", data interpretation sets. Timed practice now covers test-style sets in all four formats.
- **Phase 5:** Spaced review, adaptive recommendations, expanded problem generation, bookmarks, learning paths.
