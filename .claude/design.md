# Design System Document: Editorial Minimalism

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**
This design system moves away from the "template" aesthetic of standard blogs. It treats digital content as a high-end physical publication. Instead of rigid grids and heavy borders, we utilize **Intentional Asymmetry** and **Tonal Depth** to guide the reader’s eye. The goal is to create an experience that feels like a quiet, well-lit gallery—where the technology is sophisticated, but the lifestyle is personal and breathable.

To achieve this, we avoid "flat" design. We use overlapping elements (e.g., an image bleeding slightly into a text block) and a high-contrast typography scale to create a sense of curated authority.

---

## 2. Colors
Our palette is rooted in a monochromatic foundation, utilizing subtle shifts in temperature to define space.

*   **Primary (#000000):** Used for high-impact typography and core brand moments.
*   **Surface Hierarchy:** Our "color" is actually the space between elements.
*   **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the separation a reader needs without the visual noise of a line.
*   **The "Glass & Gradient" Rule:** To elevate main CTAs or Hero sections, use a subtle linear gradient from `primary` to `primary_container`. For floating navigation or mobile menus, utilize **Glassmorphism**: `surface` at 70% opacity with a `20px` backdrop-blur.
*   **Signature Textures:** For high-end "Editorial" cards, use a `surface_container_lowest` background on top of a `surface_container_low` page to create a soft, paper-like lift.

---

## 3. Typography
We use **Inter** as our typographic backbone. It provides the mechanical precision of tech with the humanist legibility of a lifestyle journal.

*   **Display (Display-LG 3.5rem):** Reserved for home-page headlines. Use tight letter-spacing (-0.02em) to create a "block" of text that feels like a masthead.
*   **Headlines (Headline-MD 1.75rem):** Used for article titles. These should have generous leading (line-height) to ensure breathability.
*   **Body (Body-LG 1rem):** Our workhorse. Optimized for long-form reading. Never use pure #000000 for long body text; use `on_surface_variant` (#4C4546) to reduce eye strain.
*   **Labels (Label-MD 0.75rem):** Always uppercase with increased letter-spacing (+0.05em) for a technical, "meta-data" feel.

---

## 4. Elevation & Depth
In this system, depth is biological, not mechanical. We move away from the "drop shadow" defaults of 2010.

*   **The Layering Principle:** Stacking determines importance. 
    *   *Level 0:* `surface` (The desk).
    *   *Level 1:* `surface_container_low` (The paper).
    *   *Level 2:* `surface_container_lowest` (The highlight).
*   **Ambient Shadows:** For floating modals or "elevated" cards, use "Air Shadows." Shadow color must be a 4% opacity tint of `on_surface`. Blur values should be large (30px–60px) to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., an input field), use the `outline_variant` token at **20% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use `surface_container_lowest` at 80% opacity with `backdrop-filter: blur(12px)`. This integrates the component into the environment rather than "pasting" it on top.

---

## 5. Components

### Cards & Lists
*   **The Rule of Zero Lines:** Forbid the use of divider lines. Separate list items using `spacing-8` (2rem) of vertical white space or a subtle background shift to `surface_container_high` on hover.
*   **Images:** All images should use `rounded-md` (0.375rem) to soften the "tech" edge.

### Buttons
*   **Primary:** Background `primary` (#000000), text `on_primary` (#FFFFFF). Use `rounded-full` for a sophisticated, "pebble" feel.
*   **Secondary:** Background `surface_container_high`. No border.
*   **Tertiary:** Text only, using `label-md` styling (Uppercase + Tracking).

### Input Fields
*   **Styling:** Use `surface_container_low` as the background. On focus, transition the background to `surface_container_lowest` and apply a "Ghost Border."
*   **Feedback:** Error states use `error` (#BA1A1A) but only for the text and a subtle 1px bottom indicator—never a full red box.

### Article Signature (Custom Component)
*   **The "Curator" Byline:** A combination of a `body-sm` author name and a `label-sm` timestamp, separated by a wide `spacing-4` gap. This emphasizes the "Lifestyle" aspect of the blog.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., 60% width for text, 40% for white space) to create an editorial look.
*   **Do** leverage the `surface` tokens to create "zones" of content instead of using lines.
*   **Do** use high-contrast type scales (Display-LG vs Body-MD) to create visual hierarchy.

### Don't
*   **Don't** use 100% black (#000000) for large blocks of background; use it only for accents and text.
*   **Don't** use standard "Drop Shadows" with high opacity.
*   **Don't** use default 1px dividers; they break the immersion of a "minimal" interface.
*   **Don't** crowd the content. If in doubt, add `spacing-12` (3rem) of padding.

---

## 7. Tokens Reference (Abbreviated)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `background` | #F9F9FA | Global page background |
| `primary` | #000000 | Headlines, Primary Buttons |
| `surface_container_low` | #F3F3F4 | Secondary sections, Card backgrounds |
| `outline_variant` | #CFC4C5 | 20% Opacity "Ghost Borders" |
| `radius-md` | 0.375rem | Standard component rounding |
| `spacing-8` | 2rem | Standard gutter/section spacing |