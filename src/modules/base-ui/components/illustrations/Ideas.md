
## 💰 1. No Transactions Yet

**Concept:**
A sleek, semi-transparent wallet floats gently in the center of the canvas, seen slightly from above. Its material feels like frosted acrylic — translucent with subtle refraction edges.

Inside, a few faintly glowing coins are visible, suspended midair as if waiting to fall in. Each coin has soft pastel reflections: warm gold blending into blush pink and light coral.

**Background elements:**
Soft radial glow in mint-to-lilac gradient. A few bokeh lights (tiny circles with 5–10px blur) float behind the wallet, giving a sense of depth through the glass.

**Lighting:**

* Top-left warm light (simulates sunrise)
* Bottom-right cool reflection (to mimic frosted glass catchlight)

**Mood:**
Hopeful, welcoming — “you’re ready to begin.”

**Micro details:**

* Coins cast blurred refractions inside the wallet edges
* Gentle vertical float animation looks like underwater motion

**Motion Concept:** Coins drifting slowly into the wallet.

* **Coins:** Each coin rotates slightly as it falls, with a slow easing curve (`easeInOutCubic`) and slight delay between them (0.3s stagger).
* **Glow:** A soft shimmer sweeps diagonally across the wallet every ~5s.
* **Background bokeh:** Subtle parallax drift (very slow, ~0.1px/s).
* **Timing:** 3–5s total loop, seamless.

**Effect:** Feels like calm anticipation — money waiting to arrive.

---

## 🧾 2. Empty List / No Records

**Concept:**
An A4-like paper sheet, semi-transparent, floats slightly tilted backward. It has rounded corners and faint shadow under it (blurred, soft).

On the paper: three or four placeholder lines — soft gray with 10% opacity, symbolizing empty text. The top has a faint folded-corner effect with subtle reflection gradient.

**Color Palette:**

* Sheet: `rgba(255,255,255,0.25)` on dark mode, `rgba(0,0,0,0.05)` on light mode
* Background: pastel cyan → lavender fog
* Accent: one hovering pen icon or circular plus sign glowing softly in the bottom right corner (gradient: sky blue → violet)

**Mood:**
Clean, calm, ready-to-fill.

**Micro details:**

* Light grain texture applied only to the paper’s body
* A subtle ripple blur underneath to make it look “hovering behind glass”


**Motion Concept:** “Paper” breathing gently as if floating in light air.

* **Paper float:** Small Y-axis oscillation (2–3px) using sine easing over 4s.
* **Glow:** Faint pulse on the plus icon (~8s cycle, opacity 0.7→1→0.7).
* **Lines:** If animated, faint shimmer moves top to bottom once every 10s.

**Effect:** Suggests potential — calm, inviting, not static.

---

## 📊 3. No Reports Yet

**Concept:**
Three minimal bar-chart columns made of translucent glass rods rise from a soft glowing base. Only one has partial color fill (teal gradient fading upward), while others are barely visible outlines.

In the background, a faint dotted line or arc (like a trend curve) floats behind, defocused slightly to feel “behind” the glass plane.

**Lighting:**
Cool ambient light from top, warm edge rim light on left edges to simulate reflections.

**Color Palette:**

* Bars: transparent white with hints of teal and purple refraction
* Background glow: gradient mint → blue → violet
* Shadows: blurred, very low opacity

**Mood:**
Data in waiting — balanced and techy.

**Micro details:**

* Subtle animated sparkle moving along one bar
* Faint refracted highlight sweeps diagonally across bars every few seconds

**Motion Concept:** Bars filling faintly, then fading out.

* **Bars:** Each rises slightly (10–15%) in height with elastic easing and settles back.
* **Trend curve:** Subtle horizontal shimmer, as if data scanning.
* **Ambient sparkle:** Tiny glowing dot moves slowly along one bar’s edge.

**Loop:** 6s–8s, very slow, no sharp transitions.
**Effect:** Gentle data motion, alive but controlled.

---

## 💳 4. No Linked Accounts

**Concept:**
Two connector plugs (one circular bank icon plug, one app plug) float slightly apart, glowing faintly as if waiting to connect. Between them, a ghosted dotted line curves gently — incomplete circuit.

Both plugs are made of frosted glass shells with metallic edges. The background has a radial gradient from navy → deep indigo, suggesting digital depth.

**Color Palette:**

* Left plug: mint-tinted glass
* Right plug: lavender-tinted glass
* Connection line: animated glow from one side to the other (pulse effect)

**Mood:**
Energetic but inviting — “connect me.”

**Micro details:**

* Slight chromatic aberration along plug edges
* Micro sparkle on the tip of each connector
* Optional micro-animation: line “tries to connect,” fades, repeats
**Motion Concept:** Connection attempt — plugs reaching toward each other.

* **Plugs:** Move 5–8px closer, pause, then retreat slightly (loop 5s).
* **Glow line:** When plugs approach, the dotted connection line glows brighter then dims.
* **Spark:** Tiny electric particle jumps between ends (quick 0.3s flash).

**Easing:** `easeInOutQuad`.
**Effect:** Feels like “waiting for connection” without tension.

---

## 🌍 5. Page Not Found (404)

**Concept:**
The numbers “404” rendered as glass numerals, refracting soft light. The middle “0” doubles as a compass or magnifying glass — tilted slightly, with a floating compass needle.

**Background:**
Gradient fog of dusk purple → midnight blue, scattered grain texture for richness. A faint grid floor (very subtle) gives a sense of space and direction.

**Lighting:**
A soft rim glow along the digits’ edges — one warm (orange) and one cool (blue) light to emphasize the glass refraction.

**Mood:**
Playfully lost, not error-heavy.

**Micro details:**

* The “needle” moves slightly (hover motion)
* Particles drift behind the digits for parallax feel
* Soft focus edges to blend with backdrop blur

**Motion Concept:** Gentle “exploration” motion.

* **Compass needle:** Slow oscillation (±10°) with easing curve over 3s.
* **Digits:** Soft breathing scale animation (1.00→1.02→1.00) over 6s.
* **Particles:** Drift upward and fade slowly at random intervals.

**Effect:** Calm wandering — like softly searching, not erroring.

---

## 🌱 6. No Savings Goals

**Concept:**
A piggy bank made of frosted glass sits at the center, with a small green sprout growing from its coin slot. The pig’s body subtly refracts the background gradient.

**Background:**
Soft radial glow (mint → peach) creating a dawn-light vibe.

**Color Palette:**

* Pig: translucent pink glass
* Sprout: desaturated green gradient (mint → emerald)
* Reflections: faint highlights in white with low opacity

**Mood:**
Growth, optimism.

**Micro details:**

* Gentle “pulse” in the sprout leaf to simulate life
* Soft reflection of pig’s body on invisible ground plane (blurred)

**Motion Concept:** Plant life growing.

* **Sprout:** Leaf gently sways left and right (sinusoidal 3s loop).
* **Piggy bank glow:** Very faint pulse (opacity 0.9→1→0.9) every 6s.
* **Light shimmer:** Sweeps across pig’s body diagonally once every 10s.

**Effect:** Peaceful growth — subtle rhythm, organic.

---

## 🌙 7. All Clear / No Pending Tasks

**Concept:**
A relaxed glass cat curled up on top of a floating piggy bank (the same one used before for continuity), eyes closed, tail forming a soft “checkmark” shape.

**Background:**
Gradient: indigo → teal with star-like white dots in blur (not literal stars, more like grain glints).

**Color Palette:**

* Cat: slightly tinted lilac glass
* Piggy bank: translucent silver-white glass
* Ambient glow under both: soft blue aura

**Mood:**
Peaceful, complete, reassuring.

**Micro details:**

* Gentle shimmer across the pig’s surface
* Faint breathing motion loop on cat’s body
* Optional animated particle sparkle drifting upward slowly

**Motion Concept:** Restful breathing.

* **Cat:** Expands and contracts by 1–2% scale in sync with a “breathing” rhythm (4s loop).
* **Tail checkmark:** Soft bounce or tail-tip twitch every 8s.
* **Stars/grains:** Slow twinkle (random opacity flickers).

**Effect:** Satisfying calm — “mission complete, rest.”

---

## 💡 8. No Insights Yet

**Concept:**
A glowing filament light bulb floating midair, but the filament is a stylized “graph curve.” The bulb itself is transparent glass with inner glow diffused by blur.

**Background:**
Cool white → violet gradient fog, with soft radial illumination behind the bulb.

**Color Palette:**

* Bulb: translucent glass with 15–20% opacity
* Filament: animated orange → pink gradient glow
* Light halo: 10px blurred glow that pulses slowly

**Mood:**
Curious, thoughtful — “insights loading.”

**Micro details:**

* Subtle refracted shadow on the bottom plane
* Filament pulse intensity synced to ease-in-out timing
* Halo diffusion increases when idle
**Motion Concept:** Light awakening.

* **Bulb filament:** Glows up → fades down slowly (3s cycle).
* **Inner glow:** Expands outward subtly (blur radius animate 10→14→10px).
* **Reflections:** Tiny specular glint moving across bulb (0.5s sweep every 8s).

**Effect:** Curious, almost breathing — like a thought forming.

---

## 💵 9. No Bills Due

**Concept:**
Floating receipts and bills turning into translucent birds midair — a metaphor for financial freedom. Each receipt has minimal lines and icons before it transforms.

**Background:**
Gradient white → sky blue in light theme, charcoal → teal in dark mode.

**Color Palette:**

* Receipts: translucent off-white with gray linework
* Birds: same shapes morphing, now tinted pastel cyan and lilac
* Trail particles: tiny blur circles fading upward

**Mood:**
Light, liberating, stress-free.

**Micro details:**

* Morph animation (paper edges ripple → wings flap)
* Motion blur for flight trail
* Faint reflection underneath to suggest elevation
**Motion Concept:** Paper transforming into freedom.

* **Receipts:** Gently float upward, tilt, and morph into birds (~2.5s per morph).
* **Birds:** Wings flap slowly twice, then drift upward and fade.
* **Particles:** Trail fades out as they rise (opacity 0.5→0).

**Loop:** 7–10s, random stagger.
**Effect:** Serenity and release.


✨ Animation System Guidelines (for Consistency)

| Parameter               | Recommendation                                       |
| ----------------------- | ---------------------------------------------------- |
| **Duration range**      | 2–10s (avoid fast loops)                             |
| **Easing**              | `easeInOutSine`, `easeInOutCubic`, or `easeOutQuart` |
| **Amplitude**           | No more than 3–5px or 2–3% scaling                   |
| **Opacity transitions** | Keep between 0.7–1 for subtleness                    |
| **FPS (Lottie)**        | 30 max; slower playback preferred                    |
| **Loop type**           | Seamless, continuous — no start/stop resets          |