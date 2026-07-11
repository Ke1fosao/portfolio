# Mobile Home and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a stable, polished homepage and navigation for phones from 320 px upward, including non-jumping animated UA/EN switching.

**Architecture:** Keep the existing React component structure and desktop presentation. Add a small transition state to the language context, give the switcher a layout-independent sliding indicator, consolidate mobile navigation overrides, and add one final authoritative mobile layer for `sales3-home`.

**Tech Stack:** React 19, React Router, CSS media queries, Node test runner, Vite.

## Global Constraints

- Preserve the desktop design above 820 px.
- Support 320, 360, 390, 430, 768, and 820 px without horizontal page overflow.
- Use minimum 44 px touch targets and safe-area padding.
- Do not animate width, height, margin, or font size during language changes.
- Respect `prefers-reduced-motion`.
- Do not change backend, admin pages, or public content.

---

### Task 1: Language transition contract

**Files:**
- Create: `frontend/tests/mobile-ui.test.mjs`
- Modify: `frontend/src/i18n/LanguageContext.jsx`
- Modify: `frontend/src/components/Layout.jsx`

**Interfaces:**
- Produces: `isLanguageTransitioning: boolean` from `useLanguage()` and `.is-language-transitioning` on `.site-shell`.

- [ ] Write a Node source-contract test asserting a transition state, timeout cleanup, fixed switch indicator, and reduced-motion rule.
- [ ] Run `node --test tests/mobile-ui.test.mjs` and confirm it fails because the transition contract is absent.
- [ ] Add a 180 ms transition state with timer cleanup, expose it through context, and apply the state class in `Layout`.
- [ ] Change `LanguageSwitcher` markup to two equal buttons plus an `aria-hidden` sliding indicator.
- [ ] Run the focused test and confirm it passes.

### Task 2: Mobile header and navigation

**Files:**
- Modify: `frontend/src/components/Layout.jsx`
- Modify: `frontend/src/components/layout.css`
- Test: `frontend/tests/mobile-ui.test.mjs`

**Interfaces:**
- Consumes: stable language-switcher markup and `isLanguageTransitioning`.
- Produces: one authoritative mobile header/menu layer at 820 px and narrow refinement at 460 px.

- [ ] Extend the source-contract test for fixed header action sizes, closed-sheet inert behavior, 44 px targets, and safe-area padding; verify failure.
- [ ] Add stable mobile header zones, consolidate final overrides, make the closed sheet non-interactive, and preserve Escape/body-lock behavior.
- [ ] Add narrow-phone sizing without hiding search or menu controls.
- [ ] Run the focused test and confirm it passes.

### Task 3: Homepage mobile layout

**Files:**
- Modify: `frontend/src/styles.css`
- Test: `frontend/tests/mobile-ui.test.mjs`

**Interfaces:**
- Produces: final `@media (max-width: 820px)` and `@media (max-width: 460px)` rules scoped to `.sales3-home`.

- [ ] Extend the test for mobile shell gutters, single-column hero, flat dashboard preview, non-sticky journey, one-column content grids, and overflow containment; verify failure.
- [ ] Implement the authoritative 820 px homepage layer with consistent spacing, typography, card layouts, touch behavior, and simplified effects.
- [ ] Implement 460 px refinements for hero typography, buttons, demo internals, and cards.
- [ ] Add reduced-motion and coarse-pointer rules; run the focused test and confirm it passes.

### Task 4: Verification and publication

**Files:**
- Modify only files from Tasks 1–3 if verification finds a scoped defect.

- [ ] Run `node --test tests/mobile-ui.test.mjs` and require all tests to pass.
- [ ] Run `corepack pnpm run build` with the production site URL and require Vite and route-shell generation to succeed.
- [ ] Run `git diff --check` and inspect the final diff for desktop leakage or unrelated changes.
- [ ] Publish the implementation files to GitHub `main` with a focused commit message.
- [ ] Monitor the new Vercel deployment and report the exact status.
