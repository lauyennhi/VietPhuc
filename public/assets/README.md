# Vstyle visual assets

Place prepared SVG assets in the matching `characters`, `garments`, `accessories`, or `backgrounds` folder. Use the record's `imageAsset` value as the SVG filename, for example `char_female_standing.svg`.

Register an asset ID in `data/visual_assets.json` under `availableAssets` only after the file exists. The asset registry owns all public paths; components should use resolved metadata, not construct paths. Until an asset is registered, the deterministic SVG vector renderer provides the fallback illustration.

The current repository includes no prepared image files. The mockup is an illustration and does not perform photorealistic virtual try-on.
