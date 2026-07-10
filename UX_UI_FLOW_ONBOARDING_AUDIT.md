# UX/UI/Flow/Onboarding Audit

Date: 10 July 2026

## Summary

BB Gym is getting closer functionally, but the product still feels like a small SaaS dashboard wearing gym-app clothes. The main problem is not just colour. It is the interaction model:

- Too many bordered cards.
- Too much explanatory copy.
- Too many secondary destinations visible before the user has a reason to care.
- Plan setup feels like a form, not like building a workout.
- The active workout is better than before, but still has admin controls too close to the lifting flow.
- Onboarding does almost nothing beyond account creation and units, so a new user lands in a generic shell instead of a personal gym setup.

The target should be a personal gym log app: fast, tactile, session-first, and quiet. It should feel more like opening a training notebook with smart defaults, not a business dashboard.

## Research Notes

Sources reviewed:

- [Lifewire: Workout Log Apps That Make Gym Training Easier in 2026](https://www.lifewire.com/best-workout-log-apps-4140222)
- [Lifewire: 8 Weight Lifting Apps Worth Using to Track Gains in 2026](https://www.lifewire.com/best-weight-lifting-apps-5079430)
- [TechRadar: 5 fitness apps that can help you build muscle in the gym](https://www.techradar.com/health-fitness/fitness-apps/5-fitness-apps-that-can-help-you-build-muscle-in-the-gym)
- [TechRadar: Fitbod founder interview on personalized fitness apps](https://www.techradar.com/health-fitness/fitness-apps/its-no-longer-enough-for-an-app-to-tell-you-what-to-do-people-want-to-know-why-fitness-app-fitbods-founder-on-the-reason-behind-the-ai-fitness-boom)
- [Woman & Home: best strength training apps tested in 2025](https://www.womanandhome.com/health-wellbeing/best-strength-training-apps/)
- [SELF: Strong app summary](https://www.self.com/story/best-new-workout-apps)

Common patterns from good gym apps:

- Strong/FitNotes/Simple Workout Log: logging is the core, not dashboards. Previous values, set rows, history, charts, and quick exercise add are the product.
- StrongLifts: one clear planned workout, fixed sets/reps, tap set done, repeat. Extremely low cognitive load.
- Fitbod/PUSH: onboarding gathers goal, equipment, schedule, level, and then explains why today looks the way it does.
- Hevy/StrengthLog: exercise library and plans exist, but session logging and progress records remain obvious.
- Stacked/Workit: logging screens include practical gym tools: previous data, rest timer, PRs, 1RM/plate calculators, and ready-made routines.

The lesson for BB Gym: do less on screen, but make each screen more directly useful in the gym.

## Current App Audit

### 1. Visual System Feels Like SaaS

Observed in:

- `app/globals.css`
- `app/(app)/layout.tsx`
- `components/bottom-nav.tsx`
- Most page files using `app-card`, `app-card-flat`, and `app-chip`

Current feel:

- Many surfaces are bordered cards with shadows.
- Cards are nested or stacked everywhere.
- Pills/chips appear as labels rather than useful state.
- The app logo/header feels like an account/workspace header.
- The amber accent is used for too many things: brand, active state, buttons, badges, icons.
- The dark mode is heavy but not athletic. It is graphite SaaS, not gym-console.
- Light mode is warm/beige and may feel lifestyle/editorial rather than training-focused.

Why it feels weird:

- Gym apps usually privilege the workout object: exercise name, set number, weight, reps, timer.
- Our UI privileges containers: cards, panels, borders, headers, metadata.
- The result feels like browsing modules instead of doing a workout.

Recommendation:

- Reduce the global card language by 40-60%.
- Keep cards only for repeated workout/exercise items.
- Replace many page sections with unframed lists, dividers, and full-width panels.
- Make active workout the most distinct screen visually.
- Use amber only for primary action/current set, not every icon and chip.
- Use green only for completed sets.
- Make the app header smaller and less brand-heavy once logged in.

### 2. Shapes And Spacing Are Too Friendly/Soft For Lifting

Observed in:

- Rounded `12px`, `rounded-xl`, `rounded-2xl` across nearly everything.
- Bottom nav active item uses a large amber rounded rectangle.
- Active workout controls use large soft cards.

Current feel:

- The UI has many rounded boxes competing with each other.
- Important workout data is inside soft containers instead of feeling direct.
- The active nav item looks like a chunky app launcher tile.

Why it feels wrong:

- In the gym, the user is sweaty, distracted, and moving fast.
- Soft nested rounded shapes can feel playful or SaaS-like, not focused.
- Too many similar shapes make it harder to tell what is tappable, selected, or just decorative.

Recommendation:

- Use fewer radii:
  - `6px` for compact rows.
  - `10px` for cards.
  - `999px` only for true status pills.
- Bottom nav active state should be an underline/bar/dot or small filled icon background, not a whole orange tile.
- Workout set controls can be larger, but should feel like physical controls: high contrast, direct, not decorative.

### 3. Today Page Still Has Dashboard Energy

Observed in:

- `app/(app)/dashboard/page.tsx`

Current flow:

- Header date.
- Big Today card.
- Optional done/missed/fixed-day cards.
- Shortcuts grid.

Problems:

- Shortcuts make Today feel like a portal.
- The hero card duplicates app shell information.
- The page still asks the user to choose what part of the app they want, instead of telling them what to do next.
- “Fixed weekdays”, “Next in order”, “No scheduled lift” are system labels, not personal gym language.

Better Today model:

- If active workout: Resume is everything.
- If planned workout due: show workout name, exercises preview, estimated sets, and one primary Start button.
- If done today: show “Done today” plus a tiny summary, not a big history CTA.
- If no plan: show “Pick a starter plan” and “Start blank workout.”
- Hide shortcut grid or move it below a compact “More” row.

Better copy:

- “Push is up today”
- “3 lifts, 11 sets”
- “Last done: Monday”
- “Start Push”
- “Done today”
- “Skip this missed day”

### 4. Active Workout Is Still Carrying Admin Weight

Observed in:

- `components/active-workout-console.tsx`

What improved:

- Focus Mode exists.
- Reps stepper exists.
- Planned weight is prominent.
- Full workout is secondary.

Remaining problems:

- The page still begins with a large workout header card.
- “Add lift” appears near the top, before the current set.
- Full workout still contains many controls: move up, move down, later, edit, undo, add set, copy, delete.
- Complete/cancel/history sticky bar is large and visually heavy.
- Advanced override is okay, but still looks like another panel.

Why it still feels confusing:

- The user is doing one set now, but the screen still exposes too many plan-management concepts.
- “History” in the sticky workout bar is not urgent during a set.
- Cancel workout is icon-only and close to completion; it could be mistaken or feel scary.

Recommendation:

- Active workout default screen should have this order:
  1. Current exercise name.
  2. Current set target.
  3. Reps `- current +`.
  4. Complete set.
  5. Rest timer.
  6. Next set/exercise preview.
- Move Add lift, Full workout, History, Cancel into a top-right menu or bottom sheet.
- Completed exercises should become slim rows, not full cards.
- Sticky bar should only show `Complete workout` once all planned sets are done or near the end. Before then, use a smaller menu action.

### 5. Plan Creation Is Still A Form, Not A Builder

Observed in:

- `app/(app)/programs/new/page.tsx`
- `app/(app)/programs/[id]/edit/page.tsx`
- `components/program-exercise-picker.tsx`
- `components/program-exercise-card.tsx`

Current flow:

- User creates plan name, optional notes, mode, and up to 7 day rows.
- Then edits plan to add exercises.

Problems:

- New plan asks for too much structure before the user has built anything.
- Seven blank day rows feel like admin data entry.
- “Mode” is abstract before the user understands how they will train.
- Exercise add is better with body part filtering, but still feels like filling a record.
- Plan cards are still visually dense and bordered.

Better flow:

- Start with intent:
  - “Use starter plan”
  - “Build my own”
  - “Import CSV”
- For “Build my own”:
  1. Name plan.
  2. Choose days: `3`, `4`, `5`, `6`, or custom.
  3. App suggests names: Full Body A/B/C, Push/Pull/Legs, Upper/Lower.
  4. Tap a day.
  5. Add exercise by body part.
  6. Pick sets, rep range, starting kg.
- Do not show all seven rows by default.
- Do not ask notes on first setup.

### 6. Onboarding Is Barely Onboarding

Observed in:

- `app/(auth)/signup/page.tsx`
- No dedicated post-signup onboarding route.

Current signup asks:

- Display name.
- Email.
- Password.
- Units.

Missing setup:

- Goal: strength, muscle, general fitness.
- Experience: beginner/intermediate/advanced.
- Training days per week.
- Plan preference: fixed weekdays or rotate next workout.
- Equipment access.
- Starting point: choose starter plan or create/import one.
- Whether to track main lifts.

Why this matters:

- Good gym apps feel personal because setup produces an immediate next action.
- Right now, after signup the user is dropped into a generic app shell.
- That makes the app feel cold and business-like.

Recommendation:

- Add a short post-signup onboarding wizard with 4 screens maximum:
  1. Units + name.
  2. Goal + experience.
  3. Days/week + schedule mode.
  4. Choose starter plan or import/create.
- For this private app, onboarding can be skippable and simple.
- Store onboarding completion in `user_settings`.

### 7. Copy Is Too System-Literal

Examples:

- “Next workout in order”
- “Fixed weekdays”
- “No scheduled lift”
- “Quick start”
- “Workout”
- “Plans”
- “Stats”
- “Finished”
- “Leave unused rows blank”

Why it feels off:

- It describes database behavior instead of user intent.
- It sounds like a builder/admin app.
- A personal gym app should use short, plain, action-led copy.

Better copy direction:

- “Today”
- “Push is up”
- “Start Push”
- “Skip today”
- “Train missed day”
- “Build my split”
- “Choose days”
- “Add exercises”
- “Ready for next time”
- “Your lifts”
- “Best sets”
- “This month”

### 8. Navigation Is Better, But Still Not Quite Right

Current bottom nav:

- Today
- Workout
- Progress
- Plans
- More

This is close.

Problems:

- Workout nav item points to active workout/history territory and can be unclear when no workout exists.
- Plans is a broad setup area, not daily-use for most users.
- More still contains utility pages, but some flows like Import may be too prominent depending on use.

Recommendation:

- Keep five tabs but tune behavior:
  - Today
  - Workout
  - Progress
  - Exercises
  - More
- Put Plans in Today when needed and More for management.
- Or keep Plans if plan editing is genuinely frequent, but make it feel like “My Split” rather than a plan database.

### 9. Progress Screen Is Conceptually Better But Needs Personal Meaning

Observed in:

- `app/(app)/progress/page.tsx`
- `lib/progress/queries.ts`

Current progress direction:

- Active block.
- Main lifts.
- Week/month/year workout counts.
- Bodyweight.
- Recent bests.

Problems:

- “12-week block” is too programmatic if the user did not intentionally start a 12-week block.
- Main lifts depend on plan setup and can feel empty/wrong if not configured.
- Mini trend bars are generic and do not clearly explain what improved.

Recommendation:

- Rename top-level page to “Progress”.
- If no main lifts are marked, auto-suggest based on most logged weighted exercises.
- Put human summaries above charts:
  - “Bench: 60kg x 10 last time”
  - “Up 5kg since first session”
  - “3 workouts this week”
- Make charts secondary, not the emotional center.

### 10. Personal App Feel Is Missing

This app is for 3-5 people, not a public SaaS product.

Current product language and layout imply:

- Generic scalable product.
- Admin controls.
- Clean but detached “workspace” feel.

Needed feel:

- “This is my gym log.”
- “Here is exactly what I’m doing today.”
- “I tap done and it remembers.”
- “Progress is obvious without me thinking.”

Ways to create that:

- More use of names: plan day name, last exercise result, next target.
- Less “global app” framing.
- More session memory:
  - last time completed,
  - previous reps,
  - next weight,
  - streak/consistency,
  - current split day.
- Make empty states practical:
  - “No plan yet. Pick PPL, Upper/Lower, or Full Body.”

## Priority Fixes

### Priority 1: Make Today And Workout Feel Native To Training

- Remove shortcuts grid from the first viewport.
- Make Today show the due workout preview.
- Make active workout screen current-set-first.
- Move Add lift / Full workout / History / Cancel into menu or lower secondary section.
- Reduce active workout card nesting.

### Priority 2: Replace SaaS Surfaces With Gym Surfaces

- Reduce global card usage.
- Remove most large shadows.
- Use flatter rows and tighter dividers.
- Simplify bottom nav active style.
- Lower accent usage to primary actions only.
- Make completed state green and current state amber.

### Priority 3: Fix Onboarding

- Add post-signup setup.
- Ask only useful questions.
- End onboarding by choosing a starter plan or creating/importing one.
- Do not land a new user in an empty dashboard.

### Priority 4: Simplify Plan Builder

- New plan should not show seven blank day cards.
- Use day count presets.
- Suggest day names.
- Add exercises by body part.
- Keep advanced progression hidden.

### Priority 5: Rewrite Copy

- Replace system labels with gym language.
- Remove unnecessary helper text.
- Use short verbs.
- Make empty states decisive.

## Suggested Design Direction

Name: Training Notebook

Visual style:

- Dark or light, but flatter.
- Fewer panels.
- Strong typography for exercise names and numbers.
- Less amber decoration.
- Clear current/completed/rest states.
- Smaller header.
- More list-like workout structure.

Core screen principles:

- Today: “What am I doing now?”
- Workout: “What set am I on?”
- Progress: “Am I getting stronger?”
- Plans: “What am I following?”
- More: “Everything else.”

## Implementation Pass Proposal

1. Workout screen cleanup:
   - Current set becomes first viewport.
   - Admin controls move behind menu/details.
   - Sticky bar simplified.

2. Today rewrite:
   - Remove shortcut grid from top.
   - Show due workout preview.
   - Better done/missed/rest states.

3. Visual system pass:
   - New card/row primitives.
   - Reduce shadows and border noise.
   - Bottom nav active style cleanup.

4. Onboarding:
   - Add setup route.
   - Pick starter plan/create/import.
   - Set `onboarding_completed`.

5. Copy pass:
   - Replace system language across Today, Workout, Plans, Progress, More.

## Non-Goals

- Do not redesign the database first.
- Do not add AI inside the app.
- Do not make it a social fitness product.
- Do not build a public marketing-style app.
- Do not add more analytics before the core workout flow feels good.

## North Star

Open app. See today’s lift. Tap start. Tap sets done. Rest timer helps. Finish. Progress updates. No dashboard nonsense.
