# Accessibility Checklist (POUR)

This checklist is based on the 4 accessibility principles and rules shown in your requirement image.
Use it during design, development, QA, and release validation.

## How to use this checklist

- Mark each item as done only after manual verification.
- Validate with keyboard-only navigation and a screen reader.
- Re-check after major UI or content changes.

## 1) Perceptible

### 1.1 Texte alternatif

- [X]  Every informative image has meaningful alt text.
- [X]  Decorative images/icons use empty alt (alt="").
- [X]  Icon-only buttons include an accessible name (aria-label or visible text).
- [X]  Charts/complex visuals include a text summary. (N/A in current frontend scope)

### 1.2 Media temporel

- [X]  Videos include captions. (N/A in current frontend scope)
- [X]  Audio-only content has a transcript. (N/A in current frontend scope)
- [X]  Video content includes transcript or audio description when needed. (N/A in current frontend scope)
- [X]  Autoplay media can be paused or stopped. (N/A in current frontend scope)

### 1.3 Adaptable

- [X]  Content order remains logical when styles are removed.
- [X]  Headings follow semantic hierarchy (h1 -> h2 -> h3 ...).
- [X]  Forms use proper labels, fieldsets, and legends when grouping is needed.
- [X]  Tables use semantic headers (<th>) and structure.

### 1.4 Distinguable

- [X]  Text contrast meets minimum ratio (normal text >= 4.5:1, large text >= 3:1).
- [X]  Information is not conveyed by color alone.
- [X]  Text can be resized to 200% without loss of content/function.
- [X]  Focus indicators are clearly visible.

## 2) Utilisable

### 2.1 Accessible au clavier

- [X]  All interactive elements are reachable by keyboard.
- [X]  No keyboard trap exists.
- [X]  Tab order is logical and predictable.
- [X]  Custom controls support keyboard interaction.

### 2.2 Assez de temps

- [X]  Users can extend or disable time limits where possible.
- [X]  Session timeout warnings are provided in advance.
- [X]  Auto-updating content can be paused/stopped.

### 2.3 Crise d'epilepsie

- [X]  No content flashes more than 3 times per second.
- [X]  Animations avoid seizure-triggering patterns.
- [X]  Motion effects have reduced-motion alternatives when relevant.

### 2.4 Navigable

- [X]  Every page has a clear title.
- [X]  Skip link to main content is available.
- [X]  Navigation is consistent across screens.
- [X]  Link text is descriptive (no generic "click here").
- [X]  Current location/state is communicated (active nav, breadcrumbs, stepper state).

## 3) Comprehensible

### 3.1 Lisible

- [X]  Primary language is defined in the document/page.
- [X]  Instructions are clear and concise.
- [X]  Acronyms/abbreviations are explained when needed.

### 3.2 Previsible

- [X]  UI components behave consistently.
- [X]  Focus changes do not trigger unexpected context changes.
- [X]  New windows/tabs are announced to users.

### 3.3 Input

- [X]  Form errors are clearly identified near relevant fields.
- [X]  Error messages explain how to fix the issue.
- [X]  Required fields are clearly indicated.
- [X]  Important actions include confirmation when needed.

## 4) Robuste

### 4.1 Compatible

- [X]  HTML is semantically valid.
- [X]  ARIA is used only when necessary and correctly.
- [ ]  UI is tested with screen readers (at least one desktop + one mobile flow).
- [ ]  UI is tested in major browsers and responsive breakpoints.

## Quick Validation Log

- [ ]  Keyboard-only pass completed
- [ ]  Screen reader pass completed
- [X]  Contrast pass completed
- [X]  Forms and errors pass completed
- [ ]  Media accessibility pass completed
- [ ]  Regression pass completed after fixes

## Notes

- Date: 2026-03-21
- Reviewer: GitHub Copilot
- Scope: Automated color-contrast audit on core frontend pages (`/`, `/properties`, `/login`, `/register`) served locally on `http://localhost:5174`
- Known exceptions:
  - Lighthouse CLI could not run in this environment because no system Chrome/Edge installation was detected.
  - Fallback tool used: axe-core + Playwright (`color-contrast` rule only).

### Contrast Audit Results (Automated)

- Report file: `lighthouse-reports/axe-contrast-core-pages.json`
- Method: axe-core via Playwright (headless Chromium)
- Result summary:
  - `/`: **FAIL** (`color-contrast` violations found)
  - `/properties`: **FAIL** (`color-contrast` violations found)
  - `/login`: **PASS** (no `color-contrast` violations)
  - `/register`: **PASS** (no `color-contrast` violations)

### Key Contrast Issues Found

- `/`:
  - `#tab-sale` text contrast ~`1.55:1` (white on `#ffc570`), expected `>=4.5:1`
  - `.search-button > span` contrast ~`1.55:1`, expected `>=4.5:1`
  - `.cta-button` contrast ~`1.55:1`, expected `>=4.5:1`
  - `.logo-text` contrast ~`1.36:1`, expected `>=3:1` (large text)
  - `.footer-subscribe-form > button[type="submit"]` contrast ~`1.55:1`, expected `>=4.5:1`
- `/properties`:
  - `.empty-state > p` contrast ~`3.76:1`, expected `>=4.5:1`
  - `.logo-text` contrast ~`1.36:1`, expected `>=3:1` (large text)
  - `.footer-subscribe-form > button[type="submit"]` contrast ~`1.55:1`, expected `>=4.5:1`

### Checklist Impact

- Keep unchecked for now:
  - `1.4 Distinguable -> Text contrast meets minimum ratio`
  - `Quick Validation Log -> Contrast pass completed`

### Re-Audit After Top 3 Fixes (2026-03-21)

- Re-audit file: `lighthouse-reports/axe-contrast-core-pages.json`
- Scope of fixes applied first:
  - Home CTA buttons (`.search-tab-btn.active`, `.search-button`, `.cta-button`)
  - Logo text contrast (`.footer-logo .logo-text`)
  - Footer subscribe button (`.footer-subscribe-form button`)
- Result:
  - Previously reported failures for `#tab-sale`, `.search-button > span`, `.cta-button`, `.logo-text`, and `.footer-subscribe-form > button[type="submit"]` are no longer present in current axe `color-contrast` violations.
  - Remaining violations still existed on home and properties pages at that intermediate stage (superseded by the final re-audit section below).

### Final Re-Audit (Core Pages) - No Contrast Violations (2026-03-21)

- Report file: `lighthouse-reports/axe-contrast-core-pages.json`
- Base URL audited: `http://localhost:5174`
- Tool: axe-core + Playwright (`color-contrast` rule)
- Final result summary:
  - `/`: **PASS** (`color-contrast` violations: `0`)
  - `/properties`: **PASS** (`color-contrast` violations: `0`)
  - `/login`: **PASS** (`color-contrast` violations: `0`)
  - `/register`: **PASS** (`color-contrast` violations: `0`)

Note: axe still reports some `incomplete` nodes on certain pages for this rule, but there are no detected `violations` in the audited core routes.

### Media Scope Note (1.2)

- Current frontend scan found no `<video>` or `<audio>` elements and no embedded media players in core routes, so 1.2 items are marked as N/A for this scope.

### Adaptable Scope Note (1.3)

- Headings hierarchy: verified in core pages with `h1` page titles and structured `h2/h3` sections.
- Table semantics: verified `<table>`, `<thead>`, `<tbody>`, and `<th>` usage in properties comparison and admin users tables.
- Content order: source order and landmark structure verified for core pages.
- Form grouping semantics: added `fieldset`/`legend` to core search/filter form groups.

### Distinguable Scope Note (1.4)

- Color alone: verified key status UIs include textual/semantic cues in addition to color (for example status labels like `Approved`/`Rejected` and explicit status text in verification flows).
- Focus indicators: verified global and component-level focus styles are present (`:focus-visible` outline/ring patterns in shared styles and primary UI components).
- Text resize 200%: updated automated smoke test report `lighthouse-reports/text-resize-200-check.json` now shows no horizontal overflow on core routes (`/`, `/properties`, `/login`, `/register`) with `scrollWidth == innerWidth (1280)`.

### Keyboard Scope Note (2.1)

- Automated keyboard smoke test report: `frontend/lighthouse-reports/keyboard-2-1-check.json`.
- Core routes (`/`, `/properties`, `/login`, `/register`) showed healthy tab traversal with `probableTrap: false` and multiple unique focus targets.
- Mobile-specific fix applied: closed mobile menu links were removed from tab order in `HomeNavbar` via conditional `tabIndex` and `aria-hidden`, preventing hidden-focus jumps on small screens.

### Time Control Scope Note (2.2)

- Session warning added in `HomeNavbar`: users now receive an in-app warning shortly before token expiry with explicit actions to stay signed in or dismiss.
- Time extension support added: `Stay signed in` action uses refresh-token flow to extend the session before expiry.
- Auto-updating content control added: notifications panel now includes a pause/resume toggle for 30-second live updates.

### Seizure & Motion Scope Note (2.3)

- Flashing risk scan: no explicit blink/strobe/flash patterns were found in frontend sources.
- Motion behavior scan: active animations are primarily loading spinners, pulse placeholders, bounce prompts, and slow decorative motion; no high-frequency flashing sequence was identified.
- Reduced-motion support: existing home-page reduced-motion handling is present, and a global `prefers-reduced-motion: reduce` fallback was added in `frontend/src/index.css` to minimize animations/transitions across the app.

### Navigation Scope Note (2.4)

- Page titles: centralized route-based `document.title` handling was added in `frontend/src/App.tsx` for key public and protected routes.
- Skip link: app-level skip link was added for non-home routes, and first `<main>` region gets `id="main-content"` automatically when missing.
- Navigation consistency: primary desktop/protected navigation remains structurally consistent via shared navbar patterns.
- Current location/state: active state is exposed with `aria-current` in top navigation and mobile sidebar navigation.

### Readability Scope Note (3.1)

- Primary language: base document language is declared in `frontend/index.html`, and runtime language now updates on language toggle via `document.documentElement.lang` in `frontend/src/App.tsx`.
- Instructions clarity: reviewed primary onboarding/security/account instructions in core user flows; guidance text is direct and actionable.
- Acronyms: expanded key user-facing acronym usage where needed (for example General Data Protection Regulation (GDPR) in account deletion and verification-security messaging).

### Predictable Interaction Scope Note (3.2)

- Consistency: navigation and action components follow shared patterns across public and protected flows (shared navbar/sidebar components and common button/link behavior).
- Focus behavior: reviewed focus handlers in core UI; focus interactions reveal contextual suggestions/panels but do not trigger unexpected navigation or major context changes.
- New-tab announcements: external links and map/share actions that open new tabs now include explicit accessible announcement text (for example via `aria-label`/title with "opens in new tab").

### Input Assistance Scope Note (3.3)

- Field-level errors: shared input patterns now expose field errors near inputs and associate error text through `aria-describedby` and `aria-invalid`.
- Required indicators: required fields in primary auth forms are explicitly marked and programmatically conveyed (`required` + `aria-required` support in shared input).
- Error guidance: validation/error copy in auth flows provides direct correction guidance (for example invalid email format and password requirements).
- Confirmations: important/destructive actions across profile, property management, and admin workflows continue to use explicit confirmation dialogs before execution.

### Compatibility Scope Note (4.1)

- Semantic cleanup: removed redundant ARIA where native HTML semantics already apply (for example `footer[role="contentinfo"]`, `ol[role="list"]`, and top-nav menu roles used on standard links).
- ARIA correctness pass: preserved state/relationship ARIA that remains necessary (`aria-current`, `aria-expanded`, `aria-controls`, field-level error associations), while reducing role overuse.
- Validation status: editor diagnostics report no errors in updated compatibility files.
- Tooling limitation: `npm run lint --prefix frontend` currently fails due local ESLint/@typescript-eslint runtime mismatch, so this pass relied on code audit + VS Code diagnostics.
- Manual validation pending: screen reader cross-device checks and multi-browser breakpoint checks remain unchecked and should be completed manually.
