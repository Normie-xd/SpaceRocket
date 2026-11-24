# Icons

Place app icons here before running `tauri build`.

Required files for all platforms:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `icon.png` (512x512, source)

## Generating Icons

Once you have a source `icon.png` (512×512 or larger), run:

```bash
npm run tauri icon icon.png
```

This generates all required sizes automatically.
