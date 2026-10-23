import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image

def generate_icons():
    root_dir = Path(__file__).resolve().parent.parent
    assets_dir = root_dir / "desktop" / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    master_icon_path = assets_dir / "icon.png"

    if not master_icon_path.exists():
        raise FileNotFoundError(f"Master icon not found at {master_icon_path}")

    print(f"--> Using master icon: {master_icon_path}")
    img = Image.open(master_icon_path).convert("RGBA")

    # Ensure 512x512 master is saved cleanly
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(master_icon_path, format="PNG")
    print(f"✓ Verified master PNG: {master_icon_path}")

    # Generate Windows .ico with multi-resolutions
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_path = assets_dir / "icon.ico"
    img_512.save(
        ico_path,
        format="ICO",
        sizes=ico_sizes,
    )
    print(f"✓ Generated Windows icon: {ico_path}")

    # Generate macOS .icns using iconutil
    iconset_dir = assets_dir / "icon.iconset"
    iconset_dir.mkdir(parents=True, exist_ok=True)

    sizes_map = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }

    # If master is smaller than 1024, scale smoothly
    img_1024 = img.resize((1024, 1024), Image.Resampling.LANCZOS)

    for filename, px in sizes_map.items():
        resized = img_1024.resize((px, px), Image.Resampling.LANCZOS)
        resized.save(iconset_dir / filename, format="PNG")

    icns_path = assets_dir / "icon.icns"
    try:
        subprocess.run(
            ["iconutil", "-c", "icns", str(iconset_dir), "-o", str(icns_path)],
            check=True,
        )
        print(f"✓ Generated macOS ICNS bundle: {icns_path}")
    except Exception as e:
        print(f"Warning: iconutil failed ({e}), keeping existing icns if present.")
    finally:
        if iconset_dir.exists():
            shutil.rmtree(iconset_dir)

    # Copy icons to frontend/public for web and Electron webview branding
    frontend_public = root_dir / "frontend" / "public"
    if frontend_public.exists():
        shutil.copy2(master_icon_path, frontend_public / "icon.png")
        shutil.copy2(ico_path, frontend_public / "favicon.ico")
        print(f"✓ Copied icons to {frontend_public}")

if __name__ == "__main__":
    generate_icons()
