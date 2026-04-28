# Exports

Final runtime-ready bundles go here.

Typical outputs:

- `junior_2005_runtime.glb`
- `junior_2005_hero_closeup.glb`
- `junior_2005_runtime_mobile.glb`
- `junior_2005_export_manifest.json`
- texture packs used by runtime

These files should be generated from one source `.blend` and treated as immutable once validated.

Suggested export contract:

- `runtime` = full-body/runtime shot bundle
- `hero_closeup` = face-dominant close-up bundle from the same source model
- `mobile` = decimated derivative when the device cannot carry the full runtime bundle
