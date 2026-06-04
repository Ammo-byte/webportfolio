# F1 Game Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the hero mini-game into the approved rear-view F1 arcade panel with recognizable assets, smoother movement, theme support, and scenery phase changes.

**Architecture:** Keep the mini-game inside the existing `index.html`, `style.css`, and `script.js` structure. Use SVG/CSS for the panel, road, HUD, scanlines, and dynamic game objects, with helper builders inside `initF1Game()` so the large existing file does not need a broad module split. Preserve the current controls and game state while replacing the current primitive car and obstacle shapes with rear-view F1 and recognizable obstacle/scenery elements.

**Tech Stack:** Static HTML/CSS/JavaScript, inline SVG, CSS variables for theme support, Playwright e2e tests, existing `npm` scripts.

---

## File Structure

- Modify `tests/e2e/portfolio.spec.js`: add e2e contracts for rear-view F1 scene layers, recognizable asset markers, theme toggling, and scenery phase hooks.
- Modify `index.html`: replace the current inline road/player SVG structure with named scene layers and an initially empty player group populated by JavaScript.
- Modify `style.css`: add theme-aware F1 game asset styling, scanline/road texture, player/obstacle classes, phase classes, and reduced-motion overrides.
- Modify `script.js`: add SVG helper builders, rear-view F1 player builder, obstacle/scenery builders, projection helpers, smooth lane/jump state, scenery phases, and updated collision logic.
- No new dependencies.

---

### Task 1: Add Failing Rear-View F1 E2E Contracts

**Files:**
- Modify: `tests/e2e/portfolio.spec.js:232-293`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Write the failing test**

Add this test immediately after the existing `"F1 game panel loads, initializes, responds to controls, and handles mute"` test:

```js
test("F1 game renders approved rear-view scene assets and survives theme changes", async ({
  page,
}) => {
  await releaseLoader(page);

  await expect(page.locator("#game-svg")).toBeVisible();
  await expect(page.locator("#svg-road-surface")).toBeVisible();
  await expect(page.locator("#svg-scenery-back")).toBeAttached();
  await expect(page.locator("#svg-scenery-front")).toBeAttached();
  await expect(page.locator("#svg-obstacles")).toBeAttached();
  await expect(page.locator("#svg-player[data-vehicle='rear-f1']")).toBeAttached();
  await expect(page.locator("#svg-player .rear-f1-car")).toBeAttached();
  await expect(page.locator("#svg-player .rear-f1-rear-wing")).toBeAttached();
  await expect(page.locator("#svg-player .rear-f1-rear-tire")).toHaveCount(2);
  await expect(page.locator("#game-frame")).toHaveAttribute("data-track-phase", "forest");

  await page.locator("#game-start-btn").click();
  await expect(page.locator("#overlay-start")).not.toBeVisible();
  await page.waitForTimeout(1400);

  const obstacleKinds = await page
    .locator("#svg-obstacles [data-obstacle-kind]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-obstacle-kind")));
  expect(obstacleKinds.length).toBeGreaterThan(0);
  expect(obstacleKinds.every(Boolean)).toBe(true);

  await page.locator(".desktop-nav .theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#svg-player .rear-f1-car")).toBeAttached();
  await expect(page.locator("#svg-road-surface")).toBeVisible();

  await page.locator(".desktop-nav .theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#svg-player .rear-f1-car")).toBeAttached();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:e2e -- --grep "F1 game renders approved rear-view scene assets"
```

Expected: FAIL because `#svg-road-surface`, `#svg-scenery-back`, and `#svg-player[data-vehicle='rear-f1']` do not exist yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add tests/e2e/portfolio.spec.js
git commit -m "test: capture rear-view F1 game contract"
```

Expected: commit succeeds with only `tests/e2e/portfolio.spec.js` staged.

---

### Task 2: Replace The Game SVG Skeleton With Named Rear-View Layers

**Files:**
- Modify: `index.html:318-365`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Replace the current SVG body**

In `index.html`, replace the content inside `<svg id="game-svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">` with this structure:

```html
<defs>
  <linearGradient id="road-grad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="var(--game-road-start)" stop-opacity="0.98" />
    <stop offset="100%" stop-color="var(--game-road-end)" stop-opacity="0.98" />
  </linearGradient>
  <filter id="game-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="2.2" result="blur" />
    <feMerge>
      <feMergeNode in="blur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
  <pattern id="game-scanlines" width="1" height="8" patternUnits="userSpaceOnUse">
    <rect y="0" width="1" height="1" class="game-scanline" />
  </pattern>
</defs>

<rect class="game-sky" x="0" y="0" width="400" height="500" />
<rect class="game-scanline-fill" x="0" y="0" width="400" height="500" fill="url(#game-scanlines)" />

<g id="svg-stars"></g>
<g id="svg-scenery-back"></g>
<line id="svg-horizon" x1="0" y1="190" x2="400" y2="190" />

<polygon id="svg-road-surface" points="166,190 234,190 386,500 14,500" fill="url(#road-grad)" />
<g id="svg-grid-floor"></g>
<g id="svg-road-lines">
  <line class="road-edge road-edge-left" x1="166" y1="190" x2="14" y2="500" />
  <line class="road-edge road-edge-right" x1="234" y1="190" x2="386" y2="500" />
  <line id="lane-line-left" class="lane-line" x1="188" y1="198" x2="146" y2="500" />
  <line id="lane-line-right" class="lane-line" x1="212" y1="198" x2="254" y2="500" />
</g>

<g id="svg-scenery-front"></g>
<g id="svg-obstacles"></g>
<g id="svg-player" data-vehicle="rear-f1" transform="translate(200, 430)"></g>
```

- [ ] **Step 2: Run the rear-view contract test**

Run:

```bash
npm run test:e2e -- --grep "F1 game renders approved rear-view scene assets"
```

Expected: FAIL because the layer IDs exist but the rear F1 car contents and track phase are not implemented.

- [ ] **Step 3: Run HTML validation**

Run:

```bash
npm run check:html
```

Expected: PASS. If it fails due to SVG syntax, fix the exact reported HTML line and rerun.

- [ ] **Step 4: Commit the SVG skeleton**

Run:

```bash
git add index.html
git commit -m "feat: add rear-view F1 scene layers"
```

Expected: commit succeeds with only `index.html` staged.

---

### Task 3: Add Theme-Aware Game Styling For The New Layers

**Files:**
- Modify: `style.css:1429-1818`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Add game theme tokens and layer styling**

At the top of the F1 mini-game section in `style.css`, immediately after the `F1 Mini Game Styles` comment, add:

```css
.f1-game-panel {
  --game-ink: #070808;
  --game-surface: rgba(12, 16, 17, 0.96);
  --game-road-start: #121719;
  --game-road-end: #050606;
  --game-line: rgba(238, 234, 226, 0.2);
  --game-line-strong: rgba(238, 234, 226, 0.72);
  --game-object: rgba(238, 234, 226, 0.9);
  --game-object-muted: rgba(238, 234, 226, 0.58);
  --game-accent: var(--blue);
  --game-accent-soft: var(--blue-soft);
  --game-shadow: rgba(0, 0, 0, 0.42);
}

html[data-theme="light"] .f1-game-panel {
  --game-ink: #f3efe6;
  --game-surface: rgba(225, 219, 206, 0.96);
  --game-road-start: #ddd6c8;
  --game-road-end: #cfc7b6;
  --game-line: rgba(5, 9, 11, 0.18);
  --game-line-strong: rgba(5, 9, 11, 0.66);
  --game-object: rgba(5, 9, 11, 0.86);
  --game-object-muted: rgba(5, 9, 11, 0.54);
  --game-accent: #005f9e;
  --game-accent-soft: rgba(0, 95, 158, 0.18);
  --game-shadow: rgba(5, 9, 11, 0.13);
}
```

Then add these SVG layer rules after `#game-svg`:

```css
.game-sky {
  fill: var(--game-ink);
}

.game-scanline {
  fill: var(--game-object);
  opacity: 0.055;
}

.game-scanline-fill {
  pointer-events: none;
}

#svg-horizon {
  stroke: var(--game-line);
  stroke-width: 1;
}

#svg-road-surface {
  stroke: var(--game-line);
  stroke-width: 1.4;
}

.road-edge {
  stroke: var(--game-line-strong);
  stroke-width: 1.5;
  stroke-dasharray: 7 9;
}

.lane-line {
  stroke: var(--game-object-muted);
  stroke-width: 1.2;
  stroke-dasharray: 9 14;
}

.game-grid-line {
  stroke: var(--game-line);
  stroke-width: 1;
}

.rear-f1-car,
.game-obstacle,
.game-scenery {
  vector-effect: non-scaling-stroke;
}

.rear-f1-car {
  filter: url("#game-soft-glow");
}

.rear-f1-shadow {
  fill: var(--game-shadow);
  stroke: none;
}

.rear-f1-line,
.game-obstacle-line,
.game-scenery-line {
  fill: none;
  stroke: var(--game-object);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rear-f1-muted,
.game-obstacle-muted,
.game-scenery-muted {
  fill: none;
  stroke: var(--game-object-muted);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rear-f1-accent,
.game-obstacle-accent,
.game-scenery-accent {
  fill: none;
  stroke: var(--game-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rear-f1-fill-accent,
.game-obstacle-fill-accent {
  fill: var(--game-accent);
  stroke: none;
}

.game-obstacle-fill-soft {
  fill: var(--game-accent-soft);
}

.track-phase-paddock #svg-road-surface {
  filter: drop-shadow(0 0 8px var(--game-accent-soft));
}

.track-phase-night #svg-stars {
  opacity: 0.95;
}

.track-phase-speed .lane-line {
  stroke-dasharray: 15 10;
}
```

- [ ] **Step 2: Add reduced-motion overrides**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .rear-f1-car,
  .game-obstacle,
  .game-scenery,
  .lane-line {
    transition: none !important;
  }
```

- [ ] **Step 3: Run CSS validation**

Run:

```bash
npm run check:css
```

Expected: PASS. If `stylelint` reports selector order or formatting, adjust the exact reported lines and rerun.

- [ ] **Step 4: Run the rear-view contract test**

Run:

```bash
npm run test:e2e -- --grep "F1 game renders approved rear-view scene assets"
```

Expected: FAIL because JavaScript has not populated the car and scenery yet.

- [ ] **Step 5: Commit styling**

Run:

```bash
git add style.css
git commit -m "feat: style rear-view F1 game layers"
```

Expected: commit succeeds with only `style.css` staged.

---

### Task 4: Build The Rear-View F1 Car And Recognizable Obstacle SVGs

**Files:**
- Modify: `script.js:1501-1700`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Add SVG helper functions**

Inside `initF1Game()`, after `const gameCrashReason = document.getElementById("game-crash-reason");`, add:

```js
    const SVG_NS = "http://www.w3.org/2000/svg";

    function svgEl(tagName, attrs = {}, children = []) {
      const node = document.createElementNS(SVG_NS, tagName);
      Object.entries(attrs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          node.setAttribute(key, String(value));
        }
      });
      children.forEach((child) => node.appendChild(child));
      return node;
    }

    function clearSvg(node) {
      if (node) node.replaceChildren();
    }
```

- [ ] **Step 2: Add the rear-view F1 car builder**

After `const laneTargets = { ... };`, add:

```js
    function buildRearF1Car() {
      clearSvg(svgPlayer);
      svgPlayer.dataset.vehicle = "rear-f1";
      svgPlayer.append(
        svgEl("ellipse", {
          class: "rear-f1-shadow",
          cx: 0,
          cy: 58,
          rx: 58,
          ry: 12,
          opacity: 0.42,
        }),
        svgEl("g", { class: "rear-f1-car" }, [
          svgEl("rect", {
            class: "rear-f1-line rear-f1-rear-tire",
            x: -58,
            y: 0,
            width: 22,
            height: 58,
            rx: 6,
            "stroke-width": 2,
          }),
          svgEl("rect", {
            class: "rear-f1-line rear-f1-rear-tire",
            x: 36,
            y: 0,
            width: 22,
            height: 58,
            rx: 6,
            "stroke-width": 2,
          }),
          svgEl("rect", {
            class: "rear-f1-muted",
            x: -42,
            y: -34,
            width: 16,
            height: 33,
            rx: 4,
            "stroke-width": 1.6,
          }),
          svgEl("rect", {
            class: "rear-f1-muted",
            x: 26,
            y: -34,
            width: 16,
            height: 33,
            rx: 4,
            "stroke-width": 1.6,
          }),
          svgEl("path", {
            class: "rear-f1-line rear-f1-rear-wing",
            d: "M -70 14 H 70",
            "stroke-width": 7,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M -60 6 H 60",
            "stroke-width": 2.4,
          }),
          svgEl("path", {
            class: "rear-f1-line",
            d: "M -62 -36 H 62",
            "stroke-width": 5,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M -52 -45 H 52",
            "stroke-width": 2.2,
          }),
          svgEl("path", {
            class: "rear-f1-line",
            d: "M -18 68 L -12 16 L -6 -35 L 0 -66 L 6 -35 L 12 16 L 18 68 Z",
            "stroke-width": 2,
          }),
          svgEl("path", {
            class: "rear-f1-line",
            d: "M -32 34 C -16 12 16 12 32 34",
            "stroke-width": 1.8,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M -12 -8 Q 0 -28 12 -8",
            "stroke-width": 1.8,
          }),
          svgEl("path", {
            class: "rear-f1-accent",
            d: "M 0 -60 V 64",
            "stroke-width": 2.6,
          }),
          svgEl("path", {
            class: "rear-f1-muted",
            d: "M -12 48 H 12 M -9 60 H 9 M -70 14 L -82 25 M 70 14 L 82 25 M -62 -36 L -72 -27 M 62 -36 L 72 -27",
            "stroke-width": 1.4,
          }),
          svgEl("circle", {
            class: "rear-f1-fill-accent car-rain-light",
            cx: 0,
            cy: 43,
            r: 4.2,
          }),
        ]),
      );
    }
```

- [ ] **Step 3: Add obstacle builders**

Replace the current `const obstacleTemplates = { ... };` block with:

```js
    function buildTireStack() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "tire" }, [
        svgEl("ellipse", { class: "game-obstacle-line", cx: 0, cy: -12, rx: 28, ry: 12, "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-line", d: "M -28 -12 V 10 C -28 19 -15 26 0 26 C 15 26 28 19 28 10 V -12", "stroke-width": 2 }),
        svgEl("ellipse", { class: "game-obstacle-line", cx: 0, cy: 10, rx: 28, ry: 12, "stroke-width": 2 }),
        svgEl("ellipse", { class: "game-obstacle-accent", cx: 0, cy: -12, rx: 16, ry: 6, "stroke-width": 1.5 }),
        svgEl("ellipse", { class: "game-obstacle-muted", cx: 0, cy: 10, rx: 16, ry: 6, "stroke-width": 1.4 }),
        svgEl("path", { class: "game-obstacle-muted", d: "M -20 0 H 20 M -18 18 H 18", "stroke-width": 1.2 }),
      ]);
    }

    function buildCone() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "cone" }, [
        svgEl("path", { class: "game-obstacle-line", d: "M -16 24 H 16 L 9 -32 H -9 Z", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -10 -6 H 10 M -12 10 H 12", "stroke-width": 1.8 }),
        svgEl("ellipse", { class: "game-obstacle-line", cx: 0, cy: 28, rx: 24, ry: 5, "stroke-width": 1.7 }),
      ]);
    }

    function buildBarrier() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "barrier" }, [
        svgEl("path", { class: "game-obstacle-line", d: "M -42 -12 H 42 L 36 22 H -36 Z", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -33 -10 L -20 22 M -8 -10 L 5 22 M 17 -10 L 30 22", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-muted", d: "M -36 22 L -46 34 M 36 22 L 46 34", "stroke-width": 1.5 }),
      ]);
    }

    function buildRamp() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "ramp" }, [
        svgEl("path", { class: "game-obstacle-line game-obstacle-fill-soft", d: "M -34 24 H 34 L 20 -24 H -20 Z", "stroke-width": 2 }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -14 10 L 0 -8 L 14 10 M -14 -4 L 0 -22 L 14 -4", "stroke-width": 2.4 }),
        svgEl("path", { class: "game-obstacle-muted", d: "M -26 24 L -14 -24 M 26 24 L 14 -24", "stroke-width": 1.2 }),
      ]);
    }

    function buildOilSlick() {
      return svgEl("g", { class: "game-obstacle", "data-obstacle-kind": "oil" }, [
        svgEl("path", {
          class: "game-obstacle-line game-obstacle-fill-soft",
          d: "M -30 8 C -26 -14 -4 -19 10 -12 C 28 -4 34 12 18 20 C 4 28 -24 25 -30 8 Z",
          "stroke-width": 1.8,
        }),
        svgEl("path", { class: "game-obstacle-accent", d: "M -14 5 C -5 -2 8 -1 17 6", "stroke-width": 1.5 }),
      ]);
    }

    const obstacleBuilders = {
      tire: buildTireStack,
      cone: buildCone,
      barrier: buildBarrier,
      ramp: buildRamp,
      oil: buildOilSlick,
    };
```

- [ ] **Step 4: Update `spawnObstacle()` to use builders**

Replace the current `spawnObstacle()` with:

```js
    function spawnObstacle() {
      const lanes = [-1, 0, 1];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const phase = getTrackPhase(score);
      const type = phase.obstacleMix[Math.floor(Math.random() * phase.obstacleMix.length)];
      const g = obstacleBuilders[type]();

      g.setAttribute("transform", "translate(200, 190) scale(0.08)");
      svgObstacles.appendChild(g);

      obstacles.push({
        id: obstacleIdCounter++,
        lane,
        progress: 0,
        type,
        element: g,
        jumpable: type === "tire" || type === "cone" || type === "oil",
        boost: type === "ramp",
      });
    }
```

- [ ] **Step 5: Initialize the car**

After `initFloorGrid();`, add:

```js
    buildRearF1Car();
```

- [ ] **Step 6: Run the rear-view contract test**

Run:

```bash
npm run test:e2e -- --grep "F1 game renders approved rear-view scene assets"
```

Expected: FAIL because `getTrackPhase()` and `data-track-phase` are not implemented yet.

- [ ] **Step 7: Run JS syntax check**

Run:

```bash
npm run check:js
```

Expected: PASS. If syntax fails, fix the reported `script.js` line and rerun.

- [ ] **Step 8: Commit asset builders**

Run:

```bash
git add script.js
git commit -m "feat: build rear-view F1 game assets"
```

Expected: commit succeeds with only `script.js` staged.

---

### Task 5: Add Track Phases And Scenery Builders

**Files:**
- Modify: `script.js:1501-1836`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Add scene layer references**

Near the existing SVG element lookups in `initF1Game()`, add:

```js
    const svgSceneryBack = document.getElementById("svg-scenery-back");
    const svgSceneryFront = document.getElementById("svg-scenery-front");
```

- [ ] **Step 2: Add phase definitions**

After `const laneTargets = { ... };`, add:

```js
    const trackPhases = [
      {
        id: "forest",
        minScore: 0,
        obstacleMix: ["tire", "cone", "ramp"],
        scenery: ["tree-left-large", "tree-right-large", "sign-left"],
      },
      {
        id: "paddock",
        minScore: 900,
        obstacleMix: ["tire", "cone", "barrier", "ramp"],
        scenery: ["guardrail-left", "pit-sign-right", "flag-left"],
      },
      {
        id: "night",
        minScore: 1900,
        obstacleMix: ["tire", "cone", "barrier", "oil", "ramp"],
        scenery: ["skyline", "guardrail-left", "guardrail-right"],
      },
      {
        id: "speed",
        minScore: 3200,
        obstacleMix: ["barrier", "oil", "ramp", "ramp", "cone"],
        scenery: ["speed-lines", "flag-left", "flag-right"],
      },
    ];

    let currentPhaseId = "forest";

    function getTrackPhase(scoreValue) {
      return trackPhases.reduce((active, phase) => (
        scoreValue >= phase.minScore ? phase : active
      ), trackPhases[0]);
    }
```

- [ ] **Step 3: Add scenery builders**

After the obstacle builder code, add:

```js
    function buildTree(x, y, scale) {
      return svgEl("g", { class: "game-scenery", transform: `translate(${x}, ${y}) scale(${scale})` }, [
        svgEl("path", { class: "game-scenery-line", d: "M 0 58 V 32 M -28 32 L 0 -28 L 28 32 Z M -22 5 L 0 -46 L 22 5 Z", "stroke-width": 1.7 }),
        svgEl("path", { class: "game-scenery-muted", d: "M -18 16 H 18 M -12 -7 H 12", "stroke-width": 1.1 }),
      ]);
    }

    function buildRoadSign(x, y, scale, arrows = true) {
      return svgEl("g", { class: "game-scenery", transform: `translate(${x}, ${y}) scale(${scale})` }, [
        svgEl("rect", { class: "game-scenery-line", x: -28, y: -18, width: 56, height: 32, rx: 3, "stroke-width": 1.6 }),
        svgEl("path", { class: arrows ? "game-scenery-accent" : "game-scenery-muted", d: arrows ? "M -15 -5 H 10 M 0 -13 L 13 -5 L 0 3" : "M -16 -2 H 16", "stroke-width": 2 }),
        svgEl("path", { class: "game-scenery-muted", d: "M -16 14 V 44 M 16 14 V 44", "stroke-width": 1.4 }),
      ]);
    }

    function buildGuardRail(side) {
      const x1 = side === "left" ? 24 : 376;
      const x2 = side === "left" ? 152 : 248;
      return svgEl("g", { class: "game-scenery" }, [
        svgEl("path", { class: "game-scenery-accent", d: `M ${x1} 470 L ${x2} 232`, "stroke-width": 1.5 }),
        svgEl("path", { class: "game-scenery-muted", d: `M ${x1 + (side === "left" ? 7 : -7)} 500 L ${x2 + (side === "left" ? 5 : -5)} 248`, "stroke-width": 1 }),
      ]);
    }

    function buildFlag(x, y, scale) {
      return svgEl("g", { class: "game-scenery", transform: `translate(${x}, ${y}) scale(${scale})` }, [
        svgEl("path", { class: "game-scenery-muted", d: "M 0 40 V -30", "stroke-width": 1.6 }),
        svgEl("path", { class: "game-scenery-line", d: "M 0 -30 C 16 -38 25 -23 40 -31 V -2 C 24 7 15 -9 0 -2 Z", "stroke-width": 1.5 }),
      ]);
    }

    function renderSceneryPhase(phase) {
      clearSvg(svgSceneryBack);
      clearSvg(svgSceneryFront);
      phase.scenery.forEach((item) => {
        if (item === "tree-left-large") svgSceneryBack.appendChild(buildTree(64, 290, 1.05));
        if (item === "tree-right-large") svgSceneryBack.appendChild(buildTree(332, 268, 0.88));
        if (item === "sign-left") svgSceneryBack.appendChild(buildRoadSign(110, 248, 0.78, true));
        if (item === "guardrail-left") svgSceneryFront.appendChild(buildGuardRail("left"));
        if (item === "guardrail-right") svgSceneryFront.appendChild(buildGuardRail("right"));
        if (item === "pit-sign-right") svgSceneryBack.appendChild(buildRoadSign(318, 242, 0.72, false));
        if (item === "flag-left") svgSceneryBack.appendChild(buildFlag(76, 250, 0.76));
        if (item === "flag-right") svgSceneryBack.appendChild(buildFlag(326, 248, 0.76));
        if (item === "skyline") {
          svgSceneryBack.appendChild(svgEl("path", {
            class: "game-scenery-muted",
            d: "M 0 190 H 70 V 170 H 95 V 186 H 138 V 160 H 170 V 190 H 400",
            "stroke-width": 1.2,
          }));
        }
        if (item === "speed-lines") {
          svgSceneryBack.appendChild(svgEl("path", {
            class: "game-scenery-accent",
            d: "M 24 260 L 112 215 M 376 260 L 288 215 M 42 420 L 128 310 M 358 420 L 272 310",
            "stroke-width": 1.1,
            opacity: 0.55,
          }));
        }
      });
    }

    function updateTrackPhase() {
      const phase = getTrackPhase(score);
      if (phase.id === currentPhaseId && gameFrame.dataset.trackPhase) return phase;
      currentPhaseId = phase.id;
      gameFrame.dataset.trackPhase = phase.id;
      gameFrame.classList.remove("track-phase-forest", "track-phase-paddock", "track-phase-night", "track-phase-speed");
      gameFrame.classList.add(`track-phase-${phase.id}`);
      renderSceneryPhase(phase);
      return phase;
    }
```

- [ ] **Step 4: Initialize and update phases**

After `buildRearF1Car();`, add:

```js
    updateTrackPhase();
```

Inside `gameLoop(now)`, immediately after updating `distance`, add:

```js
      const activePhase = updateTrackPhase();
```

Then in `spawnObstacle()`, replace:

```js
      const phase = getTrackPhase(score);
```

with:

```js
      const phase = updateTrackPhase();
```

- [ ] **Step 5: Reset phase on start**

Inside `startRun()`, after `lastTime = performance.now();`, add:

```js
      currentPhaseId = "";
      updateTrackPhase();
```

- [ ] **Step 6: Run the rear-view contract test**

Run:

```bash
npm run test:e2e -- --grep "F1 game renders approved rear-view scene assets"
```

Expected: PASS.

- [ ] **Step 7: Run JS syntax check**

Run:

```bash
npm run check:js
```

Expected: PASS.

- [ ] **Step 8: Commit phases and scenery**

Run:

```bash
git add script.js
git commit -m "feat: add F1 track phases and scenery"
```

Expected: commit succeeds with only `script.js` staged.

---

### Task 6: Implement Smooth Lane Motion, Jump Arc, And Perspective Projection

**Files:**
- Modify: `script.js:1547-1836`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Add player motion state**

Replace:

```js
    let currentVisualX = 200;
    let gridOffset = 0;
```

with:

```js
    let currentVisualX = 200;
    let laneVelocity = 0;
    let lastLaneDirection = 0;
    let gridOffset = 0;
```

- [ ] **Step 2: Add projection and easing helpers**

After `getTrackPhase(scoreValue)`, add:

```js
    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    }

    function projectTrackPoint(lane, progress) {
      const p = easeOutCubic(progress);
      return {
        x: 200 + lane * 148 * p,
        y: 190 + 318 * p,
        scale: 0.08 + 1.08 * p,
        opacity: clamp(0.18 + p * 0.92, 0.18, 1),
      };
    }

    function getJumpState(now) {
      if (jumpStart === null) {
        return { active: false, clearance: 0, yOffset: 0, scale: 1 };
      }
      const elapsed = now - jumpStart;
      if (elapsed >= jumpDuration) {
        jumpStart = null;
        return { active: false, clearance: 0, yOffset: 0, scale: 1 };
      }
      const t = elapsed / jumpDuration;
      const arc = Math.sin(t * Math.PI);
      return {
        active: true,
        clearance: arc,
        yOffset: arc * 38,
        scale: 1 - arc * 0.075,
      };
    }

    function updatePlayerMotion(dt) {
      const targetX = laneTargets[playerLane];
      const diff = targetX - currentVisualX;
      const stiffness = 0.025;
      const damping = 0.78;
      laneVelocity = (laneVelocity + diff * stiffness * dt) * damping;
      currentVisualX += laneVelocity * 0.06;
      if (Math.abs(diff) < 0.35 && Math.abs(laneVelocity) < 0.35) {
        currentVisualX = targetX;
        laneVelocity = 0;
      }
      return clamp(laneVelocity * 0.12, -8, 8);
    }
```

- [ ] **Step 3: Update move direction tracking**

In `moveLeft()`, after `playerLane--;`, add:

```js
        lastLaneDirection = -1;
```

In `moveRight()`, after `playerLane++;`, add:

```js
        lastLaneDirection = 1;
```

- [ ] **Step 4: Replace player movement in `gameLoop()`**

Replace the current block from `const targetX = laneTargets[playerLane];` through `svgPlayer.setAttribute("transform", ...)` with:

```js
      const playerLean = updatePlayerMotion(dt);
      const jumpState = getJumpState(now);
      const isInvulnerable = now < invulnerableUntil;
      svgPlayer.style.opacity = isInvulnerable
        ? (Math.floor(now / 80) % 2 === 0 ? "0.24" : "0.82")
        : "1";
      svgPlayer.setAttribute(
        "transform",
        `translate(${currentVisualX}, ${430 - jumpState.yOffset}) rotate(${playerLean}) scale(${jumpState.scale})`,
      );
```

- [ ] **Step 5: Replace obstacle projection in `gameLoop()`**

Replace:

```js
        const obsY = 200 + 300 * obs.progress;
        const obsX = 200 + obs.lane * 150 * obs.progress;
        const obsScale = 0.05 + 0.95 * obs.progress;
        obs.element.setAttribute("transform", `translate(${obsX}, ${obsY}) scale(${obsScale})`);
```

with:

```js
        const projected = projectTrackPoint(obs.lane, obs.progress);
        obs.element.setAttribute(
          "transform",
          `translate(${projected.x}, ${projected.y}) scale(${projected.scale})`,
        );
        obs.element.style.opacity = String(projected.opacity);
        obs.element.style.zIndex = String(Math.floor(projected.y));
```

- [ ] **Step 6: Update collision clearances**

Replace the collision block condition:

```js
        if (obs.progress >= 0.76 && obs.progress <= 0.84) {
```

with:

```js
        if (obs.progress >= 0.76 && obs.progress <= 0.88) {
```

Then replace:

```js
              if (jumpStart !== null && jumpYOffset > 15) {
                // jumped over successfully!
              } else {
```

with:

```js
              if (obs.jumpable && jumpState.clearance > 0.48) {
                obs.element.classList.add("is-cleared");
              } else {
```

- [ ] **Step 7: Reset motion state in `startRun()`**

Inside `startRun()`, after `currentVisualX = 200;`, add:

```js
      laneVelocity = 0;
      lastLaneDirection = 0;
```

- [ ] **Step 8: Run focused e2e tests**

Run:

```bash
npm run test:e2e -- --grep "F1 game"
```

Expected: PASS.

- [ ] **Step 9: Run JS syntax check**

Run:

```bash
npm run check:js
```

Expected: PASS.

- [ ] **Step 10: Commit smoother motion**

Run:

```bash
git add script.js
git commit -m "feat: smooth F1 lane and jump motion"
```

Expected: commit succeeds with only `script.js` staged.

---

### Task 7: Tune Spawn Rhythm, Phase Labels, And Visual Feedback

**Files:**
- Modify: `script.js:1829-1834`
- Modify: `style.css:1804-1828`
- Test: `tests/e2e/portfolio.spec.js`

- [ ] **Step 1: Replace spawn interval logic**

In `gameLoop()`, replace:

```js
        const baseInterval = 1800 - Math.min(1250, (speed - 100) * 6.0);
        spawnTimer = baseInterval * (0.8 + Math.random() * 0.4);
```

with:

```js
        const phasePressure = activePhase.id === "speed" ? 0.78 : activePhase.id === "night" ? 0.88 : 1;
        const baseInterval = (1850 - Math.min(1120, (speed - 100) * 5.4)) * phasePressure;
        spawnTimer = baseInterval * (0.86 + Math.random() * 0.32);
```

- [ ] **Step 2: Update bottom HUD track label**

In `index.html`, change:

```html
<span class="bottom-label">TRACK 01</span>
```

to:

```html
<span class="bottom-label" id="game-track-label">TRACK 01 / FOREST</span>
```

In `script.js`, add this lookup next to `gameDistanceLabel`:

```js
    const gameTrackLabel = document.getElementById("game-track-label");
```

In `updateTrackPhase()`, before `return phase;`, add:

```js
      if (gameTrackLabel) {
        gameTrackLabel.textContent = `TRACK 01 / ${phase.id.toUpperCase()}`;
      }
```

- [ ] **Step 3: Add cleared obstacle and boost feedback CSS**

After the `.car-rain-light` rule in `style.css`, add:

```css
.game-obstacle.is-cleared {
  opacity: 0.34 !important;
  filter: drop-shadow(0 0 8px var(--game-accent-soft));
}

.score-display.is-boosting .hud-value {
  color: var(--game-accent);
  text-shadow: 0 0 14px var(--game-accent-soft);
}
```

- [ ] **Step 4: Replace temporary score color mutation**

In the ramp collision branch, replace:

```js
              gameScore.style.color = "var(--blue)";
              setTimeout(() => { gameScore.style.color = ""; }, 300);
```

with:

```js
              gameScore.closest(".score-display")?.classList.add("is-boosting");
              setTimeout(() => {
                gameScore.closest(".score-display")?.classList.remove("is-boosting");
              }, 300);
```

- [ ] **Step 5: Run focused e2e tests**

Run:

```bash
npm run test:e2e -- --grep "F1 game"
```

Expected: PASS.

- [ ] **Step 6: Run CSS and JS checks**

Run:

```bash
npm run check:css
npm run check:js
```

Expected: both PASS.

- [ ] **Step 7: Commit tuning**

Run:

```bash
git add index.html script.js style.css
git commit -m "feat: tune F1 phases and feedback"
```

Expected: commit succeeds with only `index.html`, `script.js`, and `style.css` staged.

---

### Task 8: Final Verification And Visual Review

**Files:**
- Modify: none unless verification reveals a defect.
- Test: full local checks.

- [ ] **Step 1: Run the full check suite**

Run:

```bash
npm run check
```

Expected: PASS for `check:js`, `check:html`, `check:css`, `format:check`, and `test:e2e`.

- [ ] **Step 2: Start the local server**

Run:

```bash
npm run serve
```

Expected: server listens at `http://localhost:4189/`.

- [ ] **Step 3: Verify the page visually in dark mode**

Open `http://localhost:4189/` and verify:

```text
The hero game panel renders a rear-view F1 car at the bottom.
The road recedes toward the horizon with lane markers and scanlines.
Obstacles are recognizable as tires, cones, barriers, ramps, or oil slicks.
Lane movement feels eased rather than jumpy.
Jumping clearly lifts the car and returns it smoothly.
The panel uses ink/ivory/blue colors.
```

- [ ] **Step 4: Verify the page visually in light mode**

Toggle light mode and verify:

```text
The game panel stays readable.
The car and obstacle outlines switch to dark ink tones.
Blue accents remain visible but not overpowering.
HUD text remains legible.
```

- [ ] **Step 5: Verify mobile controls**

Use a mobile viewport and verify:

```text
Touch controls are visible.
Left, jump, and right controls still work.
The car remains lane-safe and the game panel does not overflow.
```

- [ ] **Step 6: Stop the local server**

If the server was started in the foreground, press `Ctrl-C`. If it was started in a background session, stop that session before finishing.

- [ ] **Step 7: Commit any verification fixes**

If verification required fixes, run:

```bash
git add index.html script.js style.css tests/e2e/portfolio.spec.js
git commit -m "fix: polish rear-view F1 verification issues"
```

Expected: commit only if files changed. If no fixes were needed, skip this commit step and record that no verification changes were made.

---

## Self-Review

Spec coverage:

- Recognizable rear-view F1 assets: Task 4.
- Three-lane rear chase panel structure: Task 2.
- Theme support: Task 3 and Task 8.
- Smooth lane/jump movement: Task 6.
- Perspective obstacle movement: Task 6.
- Scenery phases: Task 5 and Task 7.
- Existing controls and scoring preserved: Tasks 1, 6, 7, and 8.
- Testing and manual verification: Tasks 1 and 8.

Red-flag scan:

- The plan contains no vague markers or unspecified implementation steps.
- Each code-changing step includes exact code or exact replacements.
- Each verification step includes exact commands and expected outcomes.

Type and name consistency:

- `svgEl`, `clearSvg`, `buildRearF1Car`, `getTrackPhase`, `renderSceneryPhase`, `updateTrackPhase`, `projectTrackPoint`, `getJumpState`, and `updatePlayerMotion` are defined before use.
- DOM IDs match the planned `index.html` skeleton: `svg-road-surface`, `svg-scenery-back`, `svg-scenery-front`, `svg-obstacles`, `svg-player`, and `game-track-label`.
- CSS class names match planned SVG builders: `rear-f1-car`, `rear-f1-rear-wing`, `rear-f1-rear-tire`, `game-obstacle`, `game-scenery`, and phase classes.
