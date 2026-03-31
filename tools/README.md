# Tools

Utilities for the junior asset pipeline live here.

Current purpose:

- Blender export scaffolding
- path and naming helpers
- future validation scripts for GLB delivery

Main entry point:

- `blender_export_junior.py`

Suggested usage:

- `python3 tools/blender_export_junior.py --dry-run --write-manifest`
- `blender -b assets/lm402/characters/junior/work/junior_hero_master.blend -P tools/blender_export_junior.py -- --write-manifest`

Output contract:

- `junior_2005_runtime.glb`
- `junior_2005_hero_closeup.glb`
- `junior_2005_runtime_mobile.glb`
- `junior_2005_export_manifest.json`
