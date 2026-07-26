# Design QA

## System

- Pixelify Sans drives display text and Silkscreen drives body, labels, metadata, controls, dialogs, the game shell, and the 404 page.
- All interface icons are locally generated 24×24 pixel PNG masks from one MIT-licensed source.
- Shared CSS palette tokens feed the DOM, loader Canvas, Experience Canvas, and fluid particle Canvas.
- Dark mode uses raised charcoal project and dossier surfaces, while light mode uses warm cream surfaces with dark ink.
- Legacy font and icon dependencies, glass blur, inline Experience SVG, and Project SVG systems are removed.

## Visual review

- The loader was compared directly with the supplied telemetry reference in both themes.
- Home, About, Experience, Projects, Contact, email, arcade, mobile menu, and 404 states were visually inspected.
- The protected portrait and original logo geometry remain unchanged.
- Six Experience scenes render as crisp low-resolution Canvas artwork at eight visual frames per second.
- Seven projects use paired 360×240 dark and light PNG artwork with nearest-neighbor display.
- Particles remain fluid and use the shared theme palette.

## Responsive review

- No horizontal overflow remains at the smallest browser-supported mobile viewport or at 390, 430, 768, 1024, and 1440 CSS-pixel targets.
- The mobile menu replaces desktop navigation below 900px.
- Home changes from one desktop nameplate to a controlled two-line mobile nameplate.
- Experience changes from tabs and a dossier to one-open mobile drawers.
- Carousel cards, expanded details, and pixel artwork remain legible on mobile.

## Interaction review

- Theme controls update the logo, favicon, project artwork, particles, Experience Canvas, and game bridge.
- Experience supports pointer selection and directional keyboard navigation with exactly one active entry.
- Carousel arrows, dots, keyboard navigation, direct dragging, stepped settling, expansion, and Escape close work.
- The email dialog opens, traps focus, closes on Escape, and restores focus.
- The hidden game unlocks with three `A` keypresses on desktop and three first-`A` taps on mobile.
- The game iframe stays unloaded until unlock and keeps its existing pause, theme, popup content, and close behavior.
- A fresh page load produces no console warnings or errors.

## Build and preservation

- `npm run assets`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
- Vite produces both `dist/index.html` and `dist/404.html`.
- Portrait: `316e67ed0cf9f7ec534a0cfcb4751a523597db8689d5f84ac4eecb6b0a40e91f`.
- Logo source 1: `87ca328eadcb587f488f774452e72199d2b2a8515e1c1b98f34d49497c7886c1`.
- Logo source 2: `321542337aee5bd2adca09bba87dbff575ac2828e27243e827c8ecc3377e33b7`.
- Protected game bundle: `e089e19984526037b223986a972a95bf0394c0249122da4a6e29ccf8e71f1896`.
