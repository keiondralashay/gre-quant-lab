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
  lib/             grading (exact rationals), progress store, deck/filtering, generators
  components/      MathText (KaTeX), QuestionSolver, DecodePanel, Explanation, Diagrams
  modules/         Dashboard, Recognize, Decode, ChooseMethod, ShortcutVsTraditional,
                   Library, Vault, Formulas, Clues, Flashcards, Practice
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

**Question bank:** 67 verified questions (38 Phase 1 + 29 Phase 2). Every lesson has at least one.

**Verification added:** `phase2Content.test.ts` recomputes every numeric answer in all lesson checks, shortcut drills, and formula tests (it fails on a missing or stale check). It also proves exactly one option of each Spot-the-Clue translation is equivalent to the statement, by evaluating every option, and renders every formula highlight through KaTeX. Link integrity is checked across questions, lessons, shortcuts, and formulas. `phase2Interactions.test.tsx` covers the new modules and the four integration buttons.

### Known gaps (honest status)

- **Practice banks are thin.** 26 lessons have 1 bank question, 23 have 2, and only 6 have 3 or more. Only 2 lessons have questions at all three difficulty levels. Every lesson still has its own graded quick checks.
- Recognition still uses the 14 Phase 1 categories. Sets, counting, and functions questions map to the nearest category (statistics, probability, linear).
- Flashcard ordering is priority-based (misses first), not full spaced repetition. That is Phase 5.
- There is no Verbal section in this repository, so there was nothing to preserve or test.

## Remaining phases

- **Phase 3:** Guided step-by-step tutor, full practice sets, QC trainer with "Test Different Values", data interpretation sets.
- **Phase 4:** Mistake Tracker with error classification (asking the learner when the cause is unclear), Speed Training, 30-Second Recognition.
- **Phase 5:** Spaced review, adaptive recommendations, expanded problem generation, bookmarks, learning paths.
