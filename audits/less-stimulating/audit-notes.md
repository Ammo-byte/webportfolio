# Portfolio stimulation audit

Date: 2026-07-25
Viewport reviewed: 1440 × 900, dark theme

## Overall verdict

The visual identity is distinctive, but the opening screen asks the game, oversized
headline, animated type, navigation, background graphics, and small status labels to
compete for attention at the same time. The strongest simplification is to make the
portfolio content primary and turn the game into an optional interaction.

## 1. Hero

Health: Needs simplification.

Evidence: `01-hero.png`

- The game and name both behave like primary hero content.
- Background letterforms, constellation lines, status copy, typed role, and large
  display type create several simultaneous motion and contrast layers.
- Replace the live game with a static preview and explicit Play action, or move it
  below the first screen.
- Keep the first screen to the name, one role statement, one CTA, and at most one
  ambient effect.

## 2. About

Health: Mostly clear, slightly dense.

Evidence: `02-about.png`

- The two-column split and portrait are easy to understand.
- The headline takes nearly half the left column and the three long paragraphs make
  the section feel heavier than necessary.
- Reduce the headline by roughly 15–20%, shorten the bio to two paragraphs, and turn
  the current internship into a compact status line.
- Fade or remove the decorative coordinates and letter field behind the copy.

## 3. Experience

Health: Strongest section.

Evidence: `03-experience.png`

- The list/detail layout provides a clear reading path.
- Repeated job titles and multiple animated diagram treatments add visual noise.
- Keep only the selected row strongly accented; reduce the other rows' contrast.
- Use one quiet static diagram treatment instead of several moving lines, scans,
  gears, and pulses.

## 4. Projects

Health: Visually sparse but interaction-heavy.

Evidence: `04-projects.png`

- The active card is easy to spot, but the carousel uses a large area for one item.
- Side arrows, pagination dots, layered cards, and 3D movement ask users to decode
  the interaction before seeing the work.
- A stable two- or three-column project grid would expose more work at once and
  remove most carousel motion.

## Highest-impact changes

1. Make the game opt-in and secondary.
2. Choose one signature motion system; stop the typing loop and reduce ambient
   particles, letter glows, frame traces, and animated diagrams.
3. Remove one decorative layer across the whole site: keep either the constellation
   network or the scattered letter field, not both.
4. Reserve blue for active navigation, links, and primary actions.
5. Preserve the existing reduced-motion support and add a visible "Calm mode" if
   the expressive version remains the default.

## Evidence limits

This review covers the visible desktop states in dark mode. Screenshots can show
hierarchy and density, but they cannot confirm complete keyboard behavior, screen
reader output, contrast ratios, or every motion state. The source includes reduced
motion handling, which is a good accessibility foundation.
