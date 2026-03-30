```markdown
# Design System Specification: Luminous Authority

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Commander."** 

Moving beyond the fatigue of standard SaaS dashboards, this system rejects the "white-box-on-grey-background" utility model. Instead, it draws inspiration from high-end automotive cockpits and institutional intelligence hubs. It creates an immersive, "dark-mode-first" environment where data doesn't just sit on a screen—it glows with intent. 

We break the "template" look through **Intentional Asymmetry** and **Tonal Depth**. By utilizing wide horizontal spans contrasted against dense, technical data clusters, we create a rhythmic visual pace. Overlapping glass surfaces and glowing "inner-light" borders replace traditional dividers, ensuring the UI feels like a single, high-performance instrument rather than a collection of disparate widgets.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the "Deepest Navy" foundation, providing a high-contrast stage for "Electric" accents.

### The Foundation (Neutrals)
- **Background:** `#051522` (The void. All light originates from here.)
- **Surface Tiers:** 
    - `surface_container_lowest`: `#010f1c` (Deepest recesses, used for background grouping)
    - `surface_container`: `#11212f` (Standard widget base)
    - `surface_container_highest`: `#273645` (Elevated interactive states)

### The Luminescence (Accents)
- **Primary (Cyan):** `#00f2ff` — Used for active data streams and primary commands.
- **Secondary (Violet):** `#571bc1` — Used for "Innovation" metrics and secondary analytical paths.
- **Tertiary (Ice):** `#76ebff` — Used for high-level technical labels and subtle highlights.

### The "No-Line" Rule
**Strict Mandate:** Prohibit 1px solid, opaque borders for sectioning. 
Structure must be defined through:
1.  **Background Shifts:** Placing a `surface_container_high` card against a `surface_dim` background.
2.  **Tonal Transitions:** Using the `outline_variant` (`#3a494b`) at 15% opacity to create a "perceived" edge.

### Glass & Gradient Rule
To achieve "Luminous Authority," main action components and "Floating Hero" stats must use **Glassmorphism**:
- **Fill:** `surface_bright` at 40% opacity.
- **Backdrop Blur:** 12px to 20px.
- **Inner Glow:** A 1px inside stroke using `primary_container` at 20% opacity.
- **Signature Textures:** Apply a linear gradient from `primary` to `primary_container` on mission-critical CTAs to provide a "forged" metallic-light feel.

---

## 3. Typography
We utilize a dual-typeface system to balance institutional authority with technical precision.

- **Display & Headlines (Plus Jakarta Sans):** These are the "Command" fonts. Use **Bold (700)** or **ExtraBold (800)** weights. The wide aperture of Plus Jakarta Sans provides a modern, expansive feel.
    - *Scale:* `display-lg` (3.5rem) for singular, high-impact KPIs.
- **Technical Data & Body (Inter):** The "Intelligence" font. Inter’s tall x-height ensures readability in high-density data environments.
    - *Scale:* `body-sm` (0.75rem) for metadata; `title-md` (1.125rem) for widget headers.
- **The Contrast Play:** Pair a `display-sm` headline in heavy weight with a `label-sm` technical timestamp in Mono/Inter Light. This high-low contrast mimics high-end editorial layouts.

---

## 4. Elevation & Depth
Depth in this system is not about "shadows"—it is about **Tonal Layering** and light emission.

- **The Layering Principle:** Stack surfaces to create focus. An executive summary might sit on `surface_container_low`, while the detailed drill-down cards emerge on `surface_container_highest`.
- **Ambient Glows:** Traditional shadows are replaced by "Ambient Glows." Use a large blur (32px+) with `primary` or `secondary` colors at 5-8% opacity to make components appear as if they are backlit by the data they contain.
- **Ghost Borders:** For essential containment, use the `outline_variant` token at 20% opacity. This "Ghost Border" provides a hint of structure without interrupting the "Luminous" aesthetic.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), sharp corners (`ROUND_TWO`: 0.25rem), and a subtle external glow state.
- **Secondary:** Ghost style. `outline` color at 30% with `on_surface` text.
- **Tertiary:** Text-only with `primary` color, strictly for low-priority utility.

### Executive Cards
- **Construction:** No borders. Use `surface_container` with a `surface_container_highest` header area. 
- **Spacing:** Use `spacing.6` (2rem) for internal padding to ensure the "Premium" feel—data needs room to breathe to look expensive.

### Data Visualization
- **Neon Gradients:** Charts must never use flat fills. Use a gradient from `primary` (100% opacity) to `primary` (0% opacity) for area charts.
- **Zero-Line:** The X/Y axis should use `outline_variant` at 10% opacity. Never use solid white or grey grid lines.

### Inputs & Selection
- **Inputs:** `surface_container_lowest` fill with a `primary` 1px bottom-border that glows only on `:focus`.
- **Chips:** Sharp corners, `secondary_container` background, with `on_secondary_container` text. Use for filtering "Intelligence Categories."

---

## 6. Do’s and Don’ts

### Do:
- **Use "Breathing Room":** Lean heavily on the `spacing.10` and `spacing.12` scales. Premium design is defined by the space you *don't* fill.
- **Embrace Asymmetry:** Align a large KPI to the far left and balance it with a dense technical list on the right.
- **Layer Glass:** Overlap a floating glass navigation rail over the main dashboard content to create 3D depth.

### Don’t:
- **No Rounded Corners:** Avoid the "bubbly" look of consumer apps. Stick to `0.25rem` (ROUND_TWO) for almost everything.
- **No Default Shadows:** Never use a black `rgba(0,0,0,0.5)` shadow. If it doesn't glow with the accent color, it doesn't belong.
- **No Dividers:** If you feel the need to add a horizontal line, use `spacing.8` of empty space instead. If that fails, use a subtle background color shift.

---

## 7. Signature Technical Interaction
To reinforce the "Executive Dashboard" feel, all hover states on interactive data points should trigger a "Scanner" effect—a thin, high-speed horizontal line (`primary` at 40% opacity) that briefly tracks across the component, mimicking a data-refresh or hardware interface.