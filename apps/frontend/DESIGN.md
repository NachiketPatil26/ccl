# Design System Strategy: The Kinetic Intelligence Framework

## 1. Overview & Creative North Star
**Creative North Star: The Biological Command Center**

This design system moves beyond the "fitness tracker" trope. We are building a sophisticated, high-fidelity intelligence platform that treats human biometrics with the same precision as a Formula 1 telemetry dashboard. The aesthetic is "Smart & Progressive"—an intentional blend of high-end editorial clarity and the immersive depth of premium game UI.

To break the "template" look, we reject the rigid, flat grid. Instead, we use **intentional asymmetry**, where data-heavy modules are balanced by expansive negative space. Elements should feel "docked" into a digital cockpit. We utilize overlapping "glass" layers and glowing focal points to guide the eye, ensuring the UI feels alive, reactive, and deeply technical.

---

## 2. Colors & Surface Philosophy
The palette is rooted in `surface` (#111316), creating a deep, "infinite" canvas that allows our vitality accents to resonate.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Structural definition is achieved exclusively through **Tonal Shifting**.
* **Example:** A module should be defined by placing a `surface-container-low` (#1a1c1f) element against the `surface` background. If further nesting is required, use `surface-container-high` (#282a2d). This creates a sophisticated, "molded" look rather than a boxed-in feel.

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of semi-transparent materials.
* **Base:** `surface` (#111316)
* **Primary Containers:** `surface-container` (#1e2023)
* **Floating Intelligence:** Use `surface-bright` (#37393d) with a 60% opacity and a 20px backdrop-blur to create a "Glassmorphism" effect for modals and hover states.

### Vitality Accents (The Glow)
Accents should never be flat. Use subtle gradients to provide "soul":
* **Activity (Cyan):** Transition from `primary-fixed` (#7df4ff) to `primary_container` (#00f0ff).
* **Heart Rate (Pulse):** Use `secondary` (#ffb3b5) with an outer glow of 12px blur at 20% opacity.
* **Metabolic (Orange):** Use `tertiary_fixed_dim` (#ffb874) for data points, conveying energy and fuel.

---

## 3. Typography: Technical Precision
We pair the human-centric **Inter** with the architectural **Space Grotesk** to create a "Technical Editorial" vibe.

* **Display & Headlines (Space Grotesk):** These should be tracked slightly tight (-2%) to feel like a high-end magazine header. Use `display-lg` for hero metrics (e.g., Daily Readiness Score) to command immediate authority.
* **Data Points (Space Grotesk / Monospace feel):** All numerical values must use Space Grotesk. Its geometric construction mimics monospaced type, providing the "precise, technical feel" required for health intelligence.
* **Body & Labels (Inter):** Use `body-md` for insights. Inter’s high x-height ensures readability even against dark, glassmorphic backgrounds.

---

## 4. Elevation & Depth: The Layering Principle
Hierarchy is conveyed through **Tonal Layering**, not shadows.

* **The Layering Principle:** To lift an element, move it up one step in the `surface-container` tier. A `surface-container-highest` (#333538) card sitting on a `surface-container-low` (#1a1c1f) background provides enough contrast to imply elevation without a single drop shadow.
* **Ambient Shadows:** For floating action buttons or critical alerts, use a "Tinted Glow." Instead of black, use `primary_fixed_dim` (#00dbe9) at 5% opacity with a 40px blur. This makes the component look like it is emitting light onto the surface below.
* **The Ghost Border Fallback:** If a boundary is required for accessibility, use `outline-variant` (#3b494b) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Data Visualization

### Buttons
* **Primary:** A gradient fill from `primary_fixed` to `primary_fixed_dim`. Use `sm` (0.125rem) or `none` corner radius for a sharper, more professional "instrument" feel.
* **Secondary:** Ghost style. No background, `outline` token at 20% opacity, text in `on_surface`.

### Input Fields
* **Style:** No bottom line. Use `surface_container_lowest` (#0c0e11) as the fill. On focus, the container background shifts to `surface_container_highest` and a subtle `primary` glow appears on the left edge (2px wide).

### Data Visualization (The "Heart" of the System)
* **Biometric Rings:** Use a thick stroke (8px+) for the base track in `surface_variant` (#333538) and a glowing, gradient stroke for the progress.
* **Sparklines:** Use `primary` for activity and `secondary` for stress/heart rate. Area fills below the line should be a 10% opacity gradient of the line color.
* **Cards & Lists:** **Forbidden:** Divider lines. **Requirement:** Use `spacing-6` (1.5rem) of vertical white space to separate list items, or alternating `surface-container` tiers for high-density data.

### Relevant Custom Components
* **The "Pulse Tracker":** A micro-sparkline embedded directly into a `label-sm` to show real-time fluctuations within a data point.
* **Glass Insight Panels:** Fixed-position panels using backdrop-blur that "float" over the main scroll area, providing real-time AI commentary on the user's data.

---

## 6. Do’s and Don’ts

### Do
* **Do** use asymmetrical layouts. Place a large `display-lg` metric on the left and offset the supporting text to the right.
* **Do** use `spaceGrotesk` for all numbers. It is the signature of the system's "Intelligence" look.
* **Do** lean into the "dark mode" depth. Use the full range of `surface-container` tokens to create a rich, 3D environment.

### Don’t
* **Don’t** use pure white (#FFFFFF). Always use `on_surface` (#e2e2e6) or `primary` (#dbfcff) for text to prevent harsh eye strain.
* **Don’t** use standard 400ms easing. Use a "snappy" custom cubic-bezier (e.g., `0.2, 1, 0.3, 1`) to make the UI feel responsive and high-tech.
* **Don’t** ever use a solid 1px border. If you feel the need for a line, use a background color shift instead.