"""
Placeholder Blender export script for the LM402 junior hero asset.

Usage inside Blender:
  blender -b junior_hero_master.blend -P tools/export_junior_glb_placeholder.py
"""

import os

try:
    import bpy
except Exception as exc:  # pragma: no cover
    raise SystemExit(f"Run this from Blender's Python environment: {exc}")


EXPORT_NAME = "junior_hero_master.glb"


def main():
    blend_path = bpy.data.filepath
    if not blend_path:
        raise SystemExit("Save the .blend file before exporting.")

    root_dir = os.path.dirname(os.path.dirname(blend_path))
    export_dir = os.path.join(root_dir, "exports")
    os.makedirs(export_dir, exist_ok=True)
    export_path = os.path.join(export_dir, EXPORT_NAME)

    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format="GLB",
        use_visible=True,
        export_apply=True,
        export_animations=True,
        export_skins=True,
        export_yup=True,
    )

    print(f"Exported: {export_path}")


if __name__ == "__main__":
    main()
