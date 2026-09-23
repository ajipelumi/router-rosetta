---
version: "alpha"
name: "Router Rosetta — Design System"
description: "The Router Rosetta design system. Governs the translator interface: transcript surfaces, code blocks, citation chips and the composer. Key features include a grid, full-bleed frame, an elevated surface material, and a technical atmospheric background field."
colors:
  primary: "#EA580C"
  secondary: "#D9570D"
  tertiary: "#F97316"
  neutral: "#737373"
  background: "#FFFFFF"
  surface: "#EA580C"
  text-primary: "#737373"
  text-secondary: "#0A0A0A"
  border: "#F5F5F5"
  accent: "#EA580C"
typography:
  headline-lg:
    fontFamily: "Newsreader"
    fontSize: "30px"
    fontWeight: 300
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "20.4px"
    letterSpacing: "0.12em"
    textTransform: "uppercase"
  label-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "16px"
    letterSpacing: "1.44px"
    textTransform: "uppercase"
rounded:
  md: "0px"
  full: "9999px"
spacing:
  base: "4px"
  sm: "4px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  gap: "8px"
  card-padding: "20px"
  section-padding: "56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "10px"
  button-link:
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "0px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Open
  - Grid: Strong

## Colors

The color system uses light mode with #EA580C as the main accent and #737373 as the neutral foundation.

- **Primary (#EA580C):** Main accent and emphasis color.
- **Secondary (#D9570D):** Supporting accent for secondary emphasis.
- **Tertiary (#F97316):** Reserved accent for supporting contrast moments.
- **Neutral (#737373):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FFFFFF; Surface: #EA580C; Text Primary: #737373; Text Secondary: #0A0A0A; Border: #F5F5F5; Accent: #EA580C

## Typography

Typography pairs Newsreader for display hierarchy with Inter for supporting content and interface copy.

- **Headlines (`headline-lg`):** Newsreader, 30px, weight 300, line-height 36px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 12px, weight 300, line-height 20.4px, letter-spacing 0.12em, uppercase.
- **Labels (`label-md`):** Inter, 12px, weight 300, line-height 16px, letter-spacing 1.44px, uppercase.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 4px, 8px, 10px, 12px, 20px, 24px, 28px, 32px
- **Section padding:** 56px
- **Card padding:** 20px
- **Gaps:** 8px, 24px, 32px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 1px #F5F5F5; 1px #D4D4D4
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(180, 60, 10, 0.35) 0px 40px 120px -40px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 44px padding and a 0px radius. Drive the shell with none so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 9999px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** background #EA580C, text #FFFFFF, radius 9999px, padding 10px, border 0px solid rgb(229, 231, 235).
- **Links:** text #737373, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected expressive motion intensity without a deliberate reason.

## Motion

Motion feels expressive but remains focused on interface, text, and layout transitions. Timing clusters around 1000ms and 150ms. Easing favors ease and 0.2. Hover behavior focuses on text and color changes.

**Motion Level:** expressive

**Durations:** 1000ms, 150ms, 900ms, 1100ms, 220000ms, 300000ms

**Easings:** ease, 0.2, 1), cubic-bezier(0.2, 0.75, cubic-bezier(0.4

**Hover Patterns:** text, color

## WebGL

Reconstruct the graphics as a full-bleed background field using alpha, dpr clamp, custom shaders. The effect should read as technical and atmospheric: noise haze with white and sparse spacing. Build it from shader field so the effect reads clearly. Animate it as slow orbital drift. Interaction can react to the pointer, but only as a subtle drift. Preserve reduced motion + dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Noise haze
  - **Primitives:**
    - **Value:** Shader field
  - **Motion:**
    - **Value:** Slow orbital drift
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** alpha, DPR clamp, custom shaders

**Techniques:** Pointer parallax, Shader gradients, Noise fields, DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <div class="relative order-2 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <div class="relative w-full aspect-square lg:aspect-[1.12/1] overflow-hidden" style="background:linear-gradient(to bottom,#1c0600 0%,#b53c00 45%,#fcdfcb 78%,#ffffff 100%)">
          <canvas id="field" class="absolute inset-0 h-full w-full block"></canvas>
          <div class="absolute left-5 top-5 sm:left-7 sm:top-7 lg:left-8 lg:top-8 t…
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      (function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var nodes = document.querySelectorAll('[data-anim]');
        nodes.forEach(function (n) {
          if (reduce) { n.style.transition = 'none'; }
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              n.style.opacity = '1';
      …
      ```
  - **Animation loop:**
    - **Language:** js
    - **Snippet:**
      ```
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var nodes = document.querySelectorAll('[data-anim]');
      nodes.forEach(function (n) {
        if (reduce) { n.style.transition = 'none'; }
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            n.style.opacity = '1';
            n.style.transform = 'none';
      …
      ```
