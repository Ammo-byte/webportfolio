# F1 Game Polish Design

## Summary

Upgrade the portfolio hero mini-game from a simple SVG obstacle runner into a smoother rear-view F1 arcade panel. The approved visual target is the generated rear-view F1 mockup: the player sees the back of a recognizable F1 car at the bottom of the game panel, with a three-lane perspective road, identifiable obstacles ahead, technical scanline/grid styling, and the existing portfolio color system.

The game should still feel lightweight and native to the page. It should preserve the current basic interaction model while improving motion, visual assets, theme support, and scenery variety.

## Goals

- Replace primitive shape-based car and obstacle drawings with recognizable game elements.
- Use a rear chase view from behind the F1 car, matching the approved mockup.
- Keep the car visually lane-safe at the bottom of the panel while allowing smooth lane transitions.
- Improve jump feel so the car clearly rises, clears low obstacles, and lands smoothly.
- Add scenery phases that change after sustained play so the world does not feel static.
- Support both dark and light themes using the existing portfolio palette.
- Preserve existing keyboard and touch controls, score, speed, lives, mute, best score, and pause behavior.

## Non-Goals

- Do not rewrite the mini-game into a full game engine.
- Do not add external game libraries.
- Do not make the player vehicle a normal road car; the approved direction is rear-view F1.
- Do not use visible debug boxes or lane-fit guides in production.
- Do not introduce branded, licensed, or team-specific F1 imagery.

## Visual Direction

The panel should look like a technical arcade racing display embedded in the hero:

- Dark mode: ink background, warm ivory line/detail, muted gray texture, electric blue accents.
- Light mode: warm ivory surface, dark ink line/detail, muted gray texture, blue accents.
- Road: three-lane perspective road with dashed lane markers, horizon depth, subtle grid and scanline texture.
- Car: rear-view F1 car with large rear tires, rear wing, suspension hints, engine cover, cockpit shape, center accent, rear light, and soft shadow.
- Obstacles: identifiable tire stacks, cones, barriers, boost ramps, oil slicks, and track markers.
- Scenery: line-art trees, pit-wall signs, flags, guardrails, skyline/paddock silhouettes, and phase-specific roadside details.

Assets may be SVG, raster images, or a hybrid. The priority is recognizability and polish, not forcing everything to be hand-coded SVG. If raster assets are used, they should be local, optimized, and theme-compatible.

## Game Feel

Lane movement should be smoother than the current lane snap:

- Keep lane selection discrete for predictable gameplay.
- Interpolate the visual car position with easing or spring-like velocity.
- Add slight car lean during lane changes.
- Keep collision checks lane-based so visual easing does not make hits feel unfair.

Jump movement should feel clearer:

- Use a shaped jump arc rather than a simple vertical offset.
- Add a short takeoff/landing feel through scale, shadow, or squash-like feedback.
- Make the airborne clear-window explicit for low obstacles.
- Keep tall obstacles like barriers requiring lane avoidance rather than jumping.

Obstacle movement should better sell perspective:

- Spawn near the horizon and scale toward the player.
- Sort or layer obstacles by depth so closer elements appear in front.
- Use eased progress so movement looks natural at higher speeds.
- Keep obstacle widths lane-safe at collision time.

## Scenery Phases

Scenery should evolve as the score or distance increases:

- Phase 1: classic forest track with trees, cones, tire stacks, and a dark technical road.
- Phase 2: paddock straight with guardrails, pit signs, flags, and more blue accent lighting.
- Phase 3: night race skyline with distant structures, denser scanline/grid texture, and faster visual rhythm.
- Phase 4: high-speed final stretch with more frequent boost ramps and stronger motion streaks.

Phase changes should be visual and atmospheric first. They should not radically alter core controls.

## Architecture

Keep the game inside `initF1Game()` in `script.js`, but split the internal logic into clearer helpers where useful:

- Asset builders: create car, obstacle, and scenery elements.
- Motion helpers: lane interpolation, jump arc, perspective projection, and depth scaling.
- State helpers: phase selection, spawn timing, collision windows, and HUD updates.
- Theme helpers: apply CSS-variable-driven colors or theme-specific asset classes.

The existing `index.html` structure can remain mostly intact. The inline player group may be replaced with a richer group or image-backed element. `style.css` should own visual theme tokens, panel polish, reduced-motion handling, and light-mode overrides.

## Data Flow

Each animation frame should:

1. Compute `dt` and clamp large frame gaps.
2. Update score, speed, distance, and phase.
3. Update lane target and visual car motion.
4. Update jump state and airborne clearance.
5. Project obstacles/scenery from progress to screen position, scale, and layer.
6. Resolve collisions or boosts.
7. Update HUD and schedule the next frame.

## Accessibility And Preferences

- Preserve current keyboard and touch controls.
- Keep visible HUD values readable in both themes.
- Respect `prefers-reduced-motion` by minimizing decorative animation and avoiding intense motion effects.
- Keep mute behavior and local storage preferences.

## Testing

Update the existing Playwright coverage for the F1 panel:

- Confirm the panel renders and the start overlay works.
- Confirm the new rear-view player asset exists after initialization.
- Confirm obstacles/scenery can be created without console/runtime errors.
- Confirm keyboard or touch controls still update gameplay state.
- Confirm theme toggling does not break the game panel or assets.
- Confirm reduced-motion mode does not leave the game blank.

Manual visual verification should include dark mode, light mode, desktop, and mobile breakpoints.

## Implementation Defaults

- Use a hybrid asset strategy: image-backed/generated local sprites for the rear F1 car and highly recognizable obstacles, with SVG/CSS for road lines, HUD, scanlines, grid texture, and lightweight scenery.
- If raster sprites are used in production, process them into transparent PNG or WebP assets and store them under the existing project asset tree.
- Keep scenery phase transitions moderate: noticeable new roadside objects, palette/texture shifts, and spawn mix changes, without disrupting the core control loop.
