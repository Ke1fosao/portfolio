# Mobile home and navigation redesign

## Goal

Make the public homepage comfortable and visually stable on phones from 320 px upward, while preserving the existing desktop design. Fix mobile navigation and language switching so no controls or content jump when Ukrainian and English labels differ in length.

## Scope

- Public `Layout` header and mobile menu.
- `LanguageProvider` and `LanguageSwitcher` transition behavior.
- All `sales3-home` homepage sections.
- Responsive behavior at tablet, regular phone, and narrow phone widths.
- Motion accessibility and safe-area handling.

The desktop layout, page content, backend API, admin panel, and other public pages remain outside this change except for shared header improvements.

## Responsive model

- Desktop remains unchanged above 820 px.
- Mobile navigation is authoritative at 820 px and below.
- A narrow-phone refinement applies at 460 px and below.
- Containers use stable inline gutters and never exceed the viewport.
- Grids collapse intentionally to one column; horizontal card rows may scroll only when that improves usability and include visible scroll affordance.

## Header and navigation

- Keep a compact sticky glass header with four stable zones: logo, language switcher, search, menu.
- Give action controls fixed dimensions so label changes cannot move adjacent controls.
- Remove conflicting duplicate mobile rules and retain one source of truth.
- Open the navigation as a full-height side sheet with backdrop, safe-area padding, body scroll lock, Escape support, and predictable close behavior.
- Use large touch targets, clear active states, and a fixed contact action near the bottom.
- Prevent focusable menu content from receiving pointer interaction while the sheet is closed.

## Language transition

- Keep the switcher width fixed for UA and EN.
- Use a sliding active indicator instead of replacing differently sized button backgrounds.
- Apply a short state class during language changes, producing a subtle opacity/translate transition on page content without hiding controls.
- Do not animate layout-related properties such as width, height, margin, or font size.
- Respect `prefers-reduced-motion` by removing decorative transitions.

## Homepage mobile layout

- Hero: reduce excessive vertical spacing, keep the headline readable without clipping, stack actions, and scale the dashboard preview into a flat mobile card without 3D transforms or overflowing notes.
- Section headings: consistent index, heading, description order and spacing.
- Journey/process: remove sticky desktop behavior and use a clean vertical flow.
- Services/cases/pricing: one-column cards with controlled padding, readable typography, and no accidental horizontal overflow.
- Dashboard and decorative visuals: simplify dense subgrids on narrow screens while retaining the core sales narrative.
- FAQ and final CTA: full-width touch targets, balanced spacing, safe-area-aware footer clearance.
- Disable hover-only transforms on touch layouts and reduce expensive background effects where appropriate.

## Accessibility and stability

- Minimum 44 px interactive targets.
- Visible keyboard focus and correct `aria-expanded`, dialog labeling, and pressed states.
- No horizontal document overflow at 320, 360, 390, 430, 768, or 820 px.
- Language changes preserve scroll position and do not reopen or close navigation unexpectedly.
- Reduced-motion users receive instant state changes.

## Verification

- Add focused automated checks for language transition state and switcher semantics where the current toolchain permits.
- Run a clean dependency install and production build.
- Inspect the homepage at representative mobile widths and in both languages.
- Verify the menu open/close flow, direct navigation, search access, language switching, reduced motion, and absence of horizontal overflow.
- Push only after the checks pass, then monitor the Vercel deployment.
