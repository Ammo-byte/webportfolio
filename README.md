# Personal Portfolio

My personal portfolio, kept as a simple static site with HTML, CSS, and JS.

Run it locally with:

```bash
npm run serve
```

Also if you're reading this, give the site a 404.

![Image of my portfolio website](assets/Images/screenshot.png?raw=true)

## Typography

The portfolio uses Inter for readable interface and body text, and Instrument Serif for the name and section headings. The main site uses the original off-white and blue palette by default, with a black and blue dark theme. Staged typography reveals, gentle scroll depth, a moving experience selection, and blue density contours add motion without taking over the page. The contours extend across the viewport while scrolling; cached vector shapes drift and respond gently to the pointer without changing their geometry. Reduced motion keeps the composition still; an inline SVG also provides a visible background before the animation loads or when JavaScript is unavailable. Experience diagrams animate once per selection and respect reduced-motion preferences. The hidden arcade opens with three A keypresses or three clicks/taps on the initial A in the name.

Projects retain their original vector illustrations from `assets/Images/signals/`. The artwork is inlined with theme colors so its foreground details remain readable on both backgrounds.

Use the local server to preview animations and the arcade; opening the source `index.html` directly does not compile its TypeScript entry point.

Favicons and home-screen icons use outlines of the header’s Instrument Serif “aa.” wordmark. Run `npm run favicons` to regenerate the PNG and ICO variants from the light and dark SVG sources in `assets/Images/favicons/`.


The hidden arcade and playful 404 page retain Determination by Lucca Cedro (`anonymous-1438277` in the bundled FontStruct license), used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); its original license and readme are preserved in `assets/fonts/determination/`.
