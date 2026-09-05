# Design

The visual source of truth for VitalPair. When a screen is built or changed, the
mockup here decides what it looks like, not improvisation.

## What is here

| Folder | Contents |
|---|---|
| `mockups/` | 21 interactive mockups, one `.dc.html` per screen. Open them in a browser; light and dark themes are both included. |
| `screenshots/` | 50 rendered captures of those screens, for quick reference without opening a browser. |
| `handoff/` | The implementation brief and the reference components it describes. Start with `IMPLEMENTATION-GUIDE.md`. |
| `reference/` | The original architecture PDF and the notes it came from. |

## Rules that are not negotiable

**The colour law.** Each colour has exactly one meaning. A colour used outside
its role is a bug.

| Colour | Means |
|---|---|
| Orange (`brand`) | You. Your avatar, your side of the scoreboard, streaks, primary actions, the logo. |
| Purple (`rival`) | Your partner, and nothing else. In solo mode the opponent is grey (`ghost`), never purple. |
| Green (`success`) | Health, goal met, whoever is winning, points, the calorie ring. |
| Gold (`carb`) | The carbohydrate macro, and legendary items in the shop. |
| Red | Destructive actions, and sabotaging your partner in the shop. |
| Warm neutrals | Structure. |

Never hardcode a hex value. Use the tokens in `frontend/src/index.css`.

**Themes.** Both are first-class. Light is warm cream (`#fbf6ee`), dark is
charcoal-amber (`#1b1610`). Never navy, never a clinical white.

**Typography.** Fredoka for display, numbers and headings. Nunito for body and
UI. Icons are filled SVG, never emoji. The mockups use emoji as placeholders for
the mascot and badges; replace them with real artwork.

**Layout.** This is a desktop web app: sidebar plus content. It must never look
like a mobile app in a browser.

**Voice.** Informal Brazilian Portuguese, the way people actually talk, with
affectionate teasing between partners. See `voice-and-tone.md`. Avoid the tells
of machine-written copy: forced symmetry, lists of three, invented statistics,
decorative em-dashes, medical jargon.

## The mascot

The Broto is a plant that grows with the user, from a seedling at level 1 to a
flowering plant at level 8, with expressions that react to the routine. It is
the emotional core of the product, not decoration. `Broto.dc.html` holds the
artwork; `handoff/src/components/Broto.tsx` is the reference implementation and
`frontend/src/components/brand/Broto.tsx` is the one the app actually renders.

## History

These files used to live in three near-identical copies across
`docs/Redesign VitalPair Frontend/`, its own `handoff/reference/`, and a
`Redesign Brand/` folder at the repository root, which also carried Blade
templates from an unrelated Laravel project. That was consolidated here: 71
files removed, no unique content lost.
