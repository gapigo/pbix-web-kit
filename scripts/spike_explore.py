#!/usr/bin/env python3
"""Spike exploration script: dump everything about a .pbix file."""

import json
import os
import sys
import zipfile
from pbixray import PBIXRay


def main():
    if len(sys.argv) < 2:
        print("Usage: python spike_explore.py <path/to/sample.pbix>")
        sys.exit(1)

    path = sys.argv[1]
    print(f"=== SPIKE EXPLORE: {path} ===\n")
    
    # 1. PBIXRay exploration
    print("--- PBIXRay ---")
    m = PBIXRay(path)
    
    print(f"\nTables ({len(m.tables)}): {m.tables}")
    
    print(f"\n--- Schema ---")
    print(m.schema.to_string())
    
    for t in m.tables:
        df = m.get_table(t)
        print(f"\n--- Table: {t} ({len(df)} rows, {len(df.columns)} cols) ---")
        print(df.head(5).to_string())
        print(f"... dtypes: {dict(df.dtypes)}")
    
    print(f"\n--- Relationships ---")
    if m.relationships is not None and len(m.relationships) > 0:
        print(m.relationships.to_string())
    else:
        print("(none found)")
    
    print(f"\n--- DAX Measures ({len(m.dax_measures)}) ---")
    for md in m.dax_measures:
        if isinstance(md, dict):
            print(f"  [{md.get('table','?')}] {md.get('name','?')} = {md.get('expression','?')}")
        else:
            print(f"  {md}")
    print(f"\n--- DAX Columns ({len(m.dax_columns)}) ---")
    for col in m.dax_columns:
        if isinstance(col, dict):
            print(f"  [{col.get('table','?')}] {col.get('name','?')} = {col.get('expression','?')}")
        else:
            print(f"  {col}")
    
    print(f"\n--- M Queries ---")
    if hasattr(m, 'power_query') and m.power_query:
        for k, v in m.power_query.items():
            print(f"  {k}: {v[:200]}...")
    
    print(f"\n--- Metadata ---")
    print(json.dumps(m.metadata, indent=2, default=str)[:1000])
    
    print(f"\n--- Size: {m.size}")
    
    # 2. Layout exploration (direct zip)
    print("\n\n--- Report/Layout ---")
    sample_dir = os.path.dirname(path)
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        print(f"Zip contents ({len(names)} files):")
        for n in names[:30]:
            info = z.getinfo(n)
            print(f"  {n} ({info.file_size} bytes)")
        if len(names) > 30:
            print(f"  ... and {len(names)-30} more")
        
        if 'Report/Layout' in names:
            with z.open('Report/Layout') as f:
                layout = json.loads(f.read().decode('utf-16-le'))
            
            # Dump full layout
            layout_path = os.path.join(sample_dir, 'raw_layout.json')
            with open(layout_path, 'w', encoding='utf-8') as f:
                json.dump(layout, f, indent=2, ensure_ascii=False)
            print(f"\nFull layout dumped to {layout_path}")
            
            sections = layout.get('sections', [])
            print(f"\nPages ({len(sections)}):")
            all_types = set()
            for i, section in enumerate(sections):
                name = section.get('name', f'Page_{i}')
                display = section.get('displayName', name)
                vcs = section.get('visualContainers', [])
                print(f"  [{i}] {name} ({display}) — {len(vcs)} visuals")
                
                for vc in vcs:
                    config_str = vc.get('config', '{}')
                    # config is a double-encoded JSON string
                    try:
                        config = json.loads(config_str) if isinstance(config_str, str) else config_str
                        sv = config.get('singleVisual', {}) if isinstance(config, dict) else {}
                        vt = sv.get('visualType', 'unknown')
                        all_types.add(vt)
                        projections = sv.get('projections', {}) if isinstance(sv, dict) else {}
                        print(f"    - type={vt}, projections={list(projections.keys()) if projections else []}")
                        
                        # Position info
                        vp = config.get('visual', {}).get('visualContainer', {}).get('position', {}) if isinstance(config, dict) else {}
                        if vp:
                            print(f"      position: x={vp.get('x')} y={vp.get('y')} w={vp.get('width')} h={vp.get('height')}")
                    except (json.JSONDecodeError, AttributeError) as e:
                        print(f"    - error parsing config: {e}")
            
            print(f"\n--- Unique visual types ({len(all_types)}): {sorted(all_types)}")
        else:
            print("'Report/Layout' not found in zip!")
            print(f"Available: {[n for n in names if 'Report' in n or 'Layout' in n]}")
        
        # Check for theme
        theme_files = [n for n in names if 'Theme' in n or 'theme' in n]
        print(f"\n--- Theme files: {theme_files}")


if __name__ == '__main__':
    main()
