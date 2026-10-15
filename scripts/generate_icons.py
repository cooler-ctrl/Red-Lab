import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

def create_redlab_icon():
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer rounded rectangle (Cybersecurity dark container)
    margin = 48
    corner_radius = 220
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=corner_radius,
        fill=(17, 21, 29, 255),  # #11151D
        outline=(41, 49, 64, 255),  # #293140
        width=16,
    )

    # Inner gradient rounded shield
    inner_margin = 128
    inner_radius = 160
    
    # Draw gradient-filled inner squircle
    for y in range(inner_margin, size - inner_margin):
        # Progress 0 to 1
        ratio = (y - inner_margin) / (size - 2 * inner_margin)
        # Gradient #FF3B4E (255, 59, 78) to #9E1020 (158, 16, 32)
        r = int(255 - ratio * (255 - 158))
        g = int(59 - ratio * (59 - 16))
        b = int(78 - ratio * (78 - 32))
        
        # We can draw line by line or clipped
        draw.line(
            [(inner_margin, y), (size - inner_margin, y)],
            fill=(r, g, b, 255),
            width=1,
        )

    # Create mask for rounded inner rect
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        radius=inner_radius,
        fill=255,
    )

    # Composite gradient with mask onto a background
    gradient_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Re-draw gradient on fresh layer
    for y in range(inner_margin, size - inner_margin):
        ratio = (y - inner_margin) / (size - 2 * inner_margin)
        r = int(255 - ratio * (255 - 158))
        g = int(59 - ratio * (59 - 16))
        b = int(78 - ratio * (78 - 32))
        ImageDraw.Draw(gradient_img).line(
            [(inner_margin, y), (size - inner_margin, y)],
            fill=(r, g, b, 255),
            width=1,
        )

    # Apply mask
    inner_shape = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner_shape.paste(gradient_img, (0, 0), mask=mask)

    # Paste onto main image
    img = Image.alpha_composite(img, inner_shape)
    draw = ImageDraw.Draw(img)

    # Draw stylized white Flame/Shield icon in center
    # Flame coordinates centered around (512, 512)
    center_x, center_y = 512, 530
    scale = 3.8

    # Stylized Flame path
    flame_pts = [
        (0, -90),
        (35, -45),
        (70, 0),
        (85, 45),
        (75, 80),
        (45, 110),
        (0, 120),
        (-45, 110),
        (-75, 80),
        (-85, 45),
        (-70, 0),
        (-35, -45),
    ]
    scaled_flame = [(center_x + x * scale, center_y + y * scale) for x, y in flame_pts]
    draw.polygon(scaled_flame, fill=(255, 255, 255, 255))

    # Inner cutout for flame shape (gives it distinctive dual flame flick)
    inner_pts = [
        (0, -30),
        (20, 0),
        (35, 35),
        (25, 75),
        (0, 95),
        (-25, 75),
        (-35, 35),
        (-20, 0),
    ]
    scaled_inner = [(center_x + x * scale, center_y + y * scale) for x, y in inner_pts]
    draw.polygon(scaled_inner, fill=(220, 30, 50, 255))

    # Center white flame spark
    spark_pts = [
        (0, 20),
        (12, 45),
        (0, 75),
        (-12, 45),
    ]
    scaled_spark = [(center_x + x * scale, center_y + y * scale) for x, y in spark_pts]
    draw.polygon(scaled_spark, fill=(255, 255, 255, 255))

    # Ensure output directories exist
    assets_dir = Path("desktop/assets")
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Save master 512x512 PNG
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(assets_dir / "icon.png", format="PNG")
    print(f"Generated {assets_dir / 'icon.png'}")

    # Generate Windows .ico with multi-resolutions
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img_512.save(
        assets_dir / "icon.ico",
        format="ICO",
        sizes=ico_sizes,
    )
    print(f"Generated {assets_dir / 'icon.ico'}")

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

    for filename, px in sizes_map.items():
        resized = img.resize((px, px), Image.Resampling.LANCZOS)
        resized.save(iconset_dir / filename, format="PNG")

    try:
        subprocess.run(
            ["iconutil", "-c", "icns", str(iconset_dir), "-o", str(assets_dir / "icon.icns")],
            check=True,
        )
        print(f"Generated {assets_dir / 'icon.icns'}")
        # Clean up iconset directory
        import shutil
        shutil.rmtree(iconset_dir)
    except Exception as e:
        print(f"iconutil warning: {e}")

if __name__ == "__main__":
    create_redlab_icon()
