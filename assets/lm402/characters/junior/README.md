# LM402 Junior Character Pipeline

This folder is the handoff point for the formal 3D junior asset.

## Goal

Ship one primary junior runtime model for LM402 close-ups and in-world shots:

- `junior_hero_master.glb`
- one skeleton / one rig
- one material set
- optional decimated derivatives from the same source model for weaker devices

## Reference Source

Primary reference set lives in:

- `/Users/toni/Downloads/時間裡的兩個妳/2005年學妹定稿/`

Required views:

- `2005年學妹正面長袖襯衫定稿特寫.png`
- `2005年學妹左前長袖襯衫定稿特寫.png`
- `2005年學妹左側長袖襯衫定稿特寫.png`
- `2005年學妹背面長袖襯衫定稿特寫.png`

## Naming

- source scene: `junior_hero_master.blend`
- runtime export: `junior_hero_master.glb`
- lower poly export: `junior_hero_mobile.glb`
- animation clips:
  - `idle_breathe`
  - `rear_wait`
  - `micro_glance`
  - `eyes_hold`
  - `pony_sway`

## Material Slots

- `skin_face`
- `skin_body`
- `hair_cards`
- `shirt_white`
- `shorts_denim`
- `shoes`
- `scrunchie`

## Texture Slots

- `basecolor`
- `normal`
- `orm`
- `emissive` only if explicitly needed
- alpha only for hair cards

## Runtime Notes

- Keep face silhouette narrow and soft, not round or oversized.
- Hairline and bangs must read cleanly in close-up.
- Ponytail volume must survive left-front and rear views.
- Close-up fallback should not use flat 2D planes as the only face solution.

## Current Status

- `assets/lm402/renderer.js` contains a temporary close-up hero scaffold.
- Formal GLB integration is still pending a real source model.
