#!/usr/bin/env python3
"""Placeholder Blender export helper for the junior character pipeline.

This script is intentionally lightweight. It documents the expected export
contract so a future Blender add-on or command-line runner can be dropped in
without changing the LM402 game code.

Usage ideas:

- Run inside Blender's Python environment.
- Point it at a `.blend` source file and an export directory.
- Export a versioned GLB bundle plus any companion metadata.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence


@dataclass(frozen=True)
class ExportPlan:
    source_blend: Path
    export_dir: Path
    character_id: str
    version: str
    export_glb: bool = True
    export_gltf: bool = False

    @property
    def bundle_name(self) -> str:
        return f"{self.character_id}_bundle_{self.version}"

    @property
    def glb_path(self) -> Path:
        return self.export_dir / f"{self.bundle_name}.glb"

    @property
    def gltf_path(self) -> Path:
        return self.export_dir / f"{self.bundle_name}.gltf"


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Junior character export skeleton for Blender/GLB delivery."
    )
    parser.add_argument("--source-blend", type=Path, required=True)
    parser.add_argument("--export-dir", type=Path, required=True)
    parser.add_argument("--character-id", default="jr")
    parser.add_argument("--version", default="v001")
    parser.add_argument("--no-glb", action="store_true")
    parser.add_argument("--gltf", action="store_true")
    return parser


def validate_plan(plan: ExportPlan) -> None:
    if not plan.source_blend.exists():
        raise FileNotFoundError(f"Missing source blend file: {plan.source_blend}")
    plan.export_dir.mkdir(parents=True, exist_ok=True)


def export_stub(plan: ExportPlan) -> Sequence[Path]:
    """Return the paths that a real exporter would create.

    Replace this stub with Blender API calls such as:
    - scene preparation
    - armature and mesh selection
    - material slot validation
    - `bpy.ops.export_scene.gltf(...)`
    """

    outputs: list[Path] = []
    if plan.export_glb:
        outputs.append(plan.glb_path)
    if plan.export_gltf:
        outputs.append(plan.gltf_path)
    return outputs


def main() -> int:
    args = build_arg_parser().parse_args()
    plan = ExportPlan(
        source_blend=args.source_blend,
        export_dir=args.export_dir,
        character_id=args.character_id,
        version=args.version,
        export_glb=not args.no_glb,
        export_gltf=args.gltf,
    )
    validate_plan(plan)

    print("Junior export plan")
    print(f"  source: {plan.source_blend}")
    print(f"  export:  {plan.export_dir}")
    print(f"  bundle:  {plan.bundle_name}")
    print("  slots:")
    print("    model / lod0 / lod1 / rig / anim")
    print("  texture slots:")
    print("    skin_basecolor, skin_normal, skin_roughness, skin_sss_mask")
    print("    hair_basecolor, hair_alpha, hair_normal")
    print("    shirt_basecolor, shirt_normal, shirt_roughness")
    print("    shorts_basecolor, shorts_normal, shorts_roughness")

    outputs = export_stub(plan)
    for path in outputs:
        print(f"  planned output: {path}")
    if not outputs:
        print("  planned output: none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
