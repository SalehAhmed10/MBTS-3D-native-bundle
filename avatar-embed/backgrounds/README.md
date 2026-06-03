Add background images (JPEG/PNG/WebP) to this folder.

How the demo loads backgrounds
- The app expects a JSON manifest at `./backgrounds/list.json` containing an array of filenames, for example:
  [
    "bg1.jpg",
    "bg2.jpg"
  ]

- After you add new image files to this folder, update `list.json` to include the filenames in the order you want them to appear in the dropdown.

Tips
- Keep filenames simple (no spaces). If you upload to a case-sensitive server, match case exactly.
- Use images around 1920x1080 for best results; they will be scaled with `background-size: cover`.
- If you prefer automatic discovery, you can modify the app to fetch an index from a server-side endpoint. This demo uses a simple static manifest for portability.
