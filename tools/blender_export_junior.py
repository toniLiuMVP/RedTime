#!/usr/bin/env python3
"""Junior character export helper for Blender / GLB delivery.

This script is intentionally conservative:

- it documents the export contract for the junior hero asset
- it can run as a dry-run outside Blender to validate filenames / manifest data
- when executed inside Blender, it can export the runtime and hero close-up GLBs

The script does not assume a finished character already exists. It is a handoff
tooling skeleton for the future `junior_hero_master.blend` source file.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

try:  # Blender only
    import bpy  # type: ignore
except Exception:  # pragma: no cover - Blender is optional for dry-runs
    bpy = None


DEFAULT_TARGETS = ("runtime", "hero_closeup")


@dataclass(frozen=True)
class ExportTarget:
    name: str
    filename: str
    description: str
    collection_hint: str


@dataclass(frozen=True)
class ExportPlan:
    source_blend: Path
    export_dir: Path
    character_id: str
    version: str
    targets: tuple[str, ...]
    write_manifest: bool
    dry_run: bool

    @property
    def bundle_prefix(self) -> str:
        return f"{self.character_id}_{self.version}"

    def resolve_target(self, target: str) -> ExportTarget:
        if target == "runtime":
            return ExportTarget(
                name="runtime",
                filename="junior_2005_runtime.glb",
                description="full-body runtime bundle",
                collection_hint="JR_RUNTIME",
            )
        if target == "hero_closeup":
            return ExportTarget(
                name="hero_closeup",
                filename="junior_2005_hero_closeup.glb",
                description="face-dominant close-up bundle",
                collection_hint="JR_HERO_CLOSEUP",
            )
        if target == "mobile":
            return ExportTarget(
                name="mobile",
                filename="junior_2005_runtime_mobile.glb",
                description="decimated mobile runtime bundle",
                collection_hint="JR_RUNTIME_MOBILE",
            )
        raise ValueError(f"Unknown export target: {target}")

    def output_path(self, target: str) -> Path:
        return self.export_dir / self.resolve_target(target).filename

    def manifest_path(self) -> Path:
        return self.export_dir / "junior_2005_export_manifest.json"


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Export the LM402 junior asset into runtime and hero-closeup GLBs."
    )
    parser.add_argument("--source-blend", type=Path, default=None)
    parser.add_argument("--export-dir", type=Path, required=False)
    parser.add_argument("--character-id", default="junior2005")
    parser.add_argument("--version", default="v001")
    parser.add_argument(
        "--variant",
        action="append",
        choices=("runtime", "hero_closeup", "mobile", "all"),
        help="Repeatable. Defaults to runtime + hero_closeup.",
    )
    parser.add_argument("--write-manifest", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def resolve_source_blend(explicit: Path | None) -> Path:
    if explicit is not None:
        return explicit
    if bpy is not None and getattr(bpy.data, "filepath", ""):
        return Path(bpy.data.filepath)
    return Path("assets/lm402/characters/junior/work/junior_hero_master.blend")


def resolve_export_dir(source_blend: Path, explicit: Path | None) -> Path:
    if explicit is not None:
        return explicit
    return source_blend.parent.parent / "exports"


def normalize_variants(raw_variants: Iterable[str] | None) -> tuple[str, ...]:
    if not raw_variants:
        return DEFAULT_TARGETS
    variants = []
    for variant in raw_variants:
        if variant == "all":
            return ("runtime", "hero_closeup", "mobile")
        if variant not in variants:
            variants.append(variant)
    return tuple(variants)


def validate_plan(plan: ExportPlan) -> None:
    if not plan.dry_run and bpy is None:
        raise RuntimeError(
            "Blender's bpy module is unavailable. Re-run with --dry-run or inside Blender."
        )
    if not plan.dry_run and not plan.source_blend.exists():
        raise FileNotFoundError(f"Missing source blend file: {plan.source_blend}")
    plan.export_dir.mkdir(parents=True, exist_ok=True)


def build_manifest(plan: ExportPlan) -> dict:
    targets = [plan.resolve_target(name) for name in plan.targets]
    return {
        "characterId": plan.character_id,
        "version": plan.version,
        "sourceBlend": str(plan.source_blend),
        "exportDir": str(plan.export_dir),
        "targets": [
            {
                "name": target.name,
                "filename": target.filename,
                "description": target.description,
                "collectionHint": target.collection_hint,
                "output": str(plan.output_path(target.name)),
            }
            for target in targets
        ],
        "materialProfiles": [
            "skin_face",
            "skin_body",
            "hair_cards",
            "shirt_white",
            "shorts_denim",
            "shoes",
            "scrunchie",
        ],
        "animationClips": [
            "idle_breathe",
            "rear_wait",
            "micro_glance",
            "eyes_hold",
            "pony_sway",
        ],
        "fallbackPolicy": {
            "missingRuntime": "procedural_shell",
            "missingHeroCloseup": "runtime_glb_camera_crop",
            "preserveGameplay": True,
        },
    }


def export_variant(plan: ExportPlan, target_name: str) -> Path:
    target = plan.resolve_target(target_name)
    output_path = plan.output_path(target_name)

    if bpy is None:
        return output_path

    # Keep the scene export path explicit; a later artist can swap in per-variant
    # collection toggles without changing the CLI contract.
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_visible=True,
        export_apply=True,
        export_animations=True,
        export_skins=True,
        export_yup=True,
    )
    print(f"Exported {target.description}: {output_path}")
    return output_path


def write_manifest_file(plan: ExportPlan) -> Path:
    manifest = build_manifest(plan)
    manifest_path = plan.manifest_path()
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest_path


def main() -> int:
    args = build_arg_parser().parse_args()
    source_blend = resolve_source_blend(args.source_blend)
    export_dir = resolve_export_dir(source_blend, args.export_dir)
    plan = ExportPlan(
        source_blend=source_blend,
        export_dir=export_dir,
        character_id=args.character_id,
        version=args.version,
        targets=normalize_variants(args.variant),
        write_manifest=args.write_manifest,
        dry_run=args.dry_run or bpy is None,
    )
    validate_plan(plan)

    print("Junior export plan")
    print(f"  source: {plan.source_blend}")
    print(f"  export: {plan.export_dir}")
    print(f"  bundle: {plan.bundle_prefix}")
    print("  targets:")
    for name in plan.targets:
        target = plan.resolve_target(name)
        print(f"    - {target.name}: {target.filename} ({target.description})")
    print("  material slots:")
    print("    skin_face, skin_body, hair_cards, shirt_white, shorts_denim, shoes, scrunchie")
    print("  animation clips:")
    print("    idle_breathe, rear_wait, micro_glance, eyes_hold, pony_sway")

    outputs = []
    for target_name in plan.targets:
        outputs.append(export_variant(plan, target_name))

    if plan.write_manifest:
        manifest_path = write_manifest_file(plan)
        print(f"  manifest: {manifest_path}")

    if plan.dry_run:
        print("  mode: dry-run")
    for path in outputs:
        print(f"  planned output: {path}")
    if not outputs:
        print("  planned output: none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
