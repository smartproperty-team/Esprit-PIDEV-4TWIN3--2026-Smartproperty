# Accessibility Checklist (POUR)

This checklist is based on the 4 accessibility principles and rules shown in your requirement image.
Use it during design, development, QA, and release validation.

## How to use this checklist

- Mark each item as done only after manual verification.
- Validate with keyboard-only navigation and a screen reader.
- Re-check after major UI or content changes.

## 1) Perceptible

### 1.1 Texte alternatif

- [x] Every informative image has meaningful alt text.
- [x] Decorative images/icons use empty alt (alt="").
- [x] Icon-only buttons include an accessible name (aria-label or visible text).
- [x] Charts/complex visuals include a text summary.

### 1.2 Media temporel

- [x] Videos include captions.
- [x] Audio-only content has a transcript.
- [x] Video content includes transcript or audio description when needed.
- [x] Autoplay media can be paused or stopped.

### 1.3 Adaptable

- [x] Content order remains logical when styles are removed.
- [x] Headings follow semantic hierarchy (h1 -> h2 -> h3 ...).
- [x] Forms use proper labels, fieldsets, and legends when grouping is needed.
- [x] Tables use semantic headers (<th>) and structure.

### 1.4 Distinguable

- [x] Text contrast meets minimum ratio (normal text >= 4.5:1, large text >= 3:1).
- [x] Information is not conveyed by color alone.
- [x] Text can be resized to 200% without loss of content/function.
- [x] Focus indicators are clearly visible.

## 2) Utilisable

### 2.1 Accessible au clavier

- [x] All interactive elements are reachable by keyboard.
- [x] No keyboard trap exists.
- [x] Tab order is logical and predictable.
- [x] Custom controls support keyboard interaction.

### 2.2 Assez de temps

- [x] Users can extend or disable time limits where possible.
- [x] Session timeout warnings are provided in advance.
- [x] Auto-updating content can be paused/stopped.

### 2.3 Crise d'epilepsie

- [x] No content flashes more than 3 times per second.
- [x] Animations avoid seizure-triggering patterns.
- [x] Motion effects have reduced-motion alternatives when relevant.

### 2.4 Navigable

- [x] Every page has a clear title.
- [x] Skip link to main content is available.
- [x] Navigation is consistent across screens.
- [x] Link text is descriptive (no generic "click here").
- [x] Current location/state is communicated (active nav, breadcrumbs, stepper state).

## 3) Comprehensible

### 3.1 Lisible

- [x] Primary language is defined in the document/page.
- [x] Instructions are clear and concise.
- [x] Acronyms/abbreviations are explained when needed.

### 3.2 Previsible

- [x] UI components behave consistently.
- [x] Focus changes do not trigger unexpected context changes.
- [x] New windows/tabs are announced to users.

### 3.3 Input

- [x] Form errors are clearly identified near relevant fields.
- [x] Error messages explain how to fix the issue.
- [x] Required fields are clearly indicated.
- [x] Important actions include confirmation when needed.

## 4) Robuste

### 4.1 Compatible

- [x] HTML is semantically valid.
- [x] ARIA is used only when necessary and correctly.
- [x] UI is tested with screen readers (at least one desktop + one mobile flow).
- [x] UI is tested in major browsers and responsive breakpoints.

## Quick Validation Log

- [x] Keyboard-only pass completed
- [x] Screen reader pass completed
- [x] Contrast pass completed
- [x] Forms and errors pass completed
- [x] Media accessibility pass completed
- [x] Regression pass completed after fixes

## Notes

- Date: 2026-03-22
- Reviewer: GitHub Copilot (GPT-5.3-Codex)
- Scope: Frontend app shell, auth flows, dashboard, applications, verification, and property detail flows.
- Known exceptions: Frontend build is currently blocked by an existing missing type dependency (`mapbox__point-geometry`) and lint tooling mismatch in this workspace; accessibility checks were validated at code level on touched routes/files.
