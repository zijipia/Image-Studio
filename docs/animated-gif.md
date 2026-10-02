# Animated GIF / WebP generation

Image Studio now supports animated output through the existing `/api/generate` endpoint.

The animation pipeline renders each `CustomCanvasData` frame with the existing Satori + Sharp renderer, then combines the resulting PNG frames with Sharp's animated-image support. Static image generation remains unchanged.

## Request

```json
{
  "type": "animated",
  "data": {
    "title": "welcome-card",
    "format": "gif",
    "delay": 120,
    "loop": 0,
    "frames": [
      {
        "title": "welcome-card-frame-0",
        "width": 930,
        "height": 280,
        "background": "#090614",
        "elements": []
      },
      {
        "title": "welcome-card-frame-1",
        "width": 930,
        "height": 280,
        "background": "#090614",
        "elements": []
      }
    ]
  }
}
```

### Options

- `format`: `gif` (default) or `webp`.
- `delay`: one delay in milliseconds for every frame, or an array with one value per frame.
- `loop`: number of animation iterations. `0` means infinite looping.
- `frames`: 1–60 frames. All frames must have the same dimensions.

For a 10-frame card with 120 ms per frame, use `"delay": 120`; the animation cycle is 1.2 seconds.

## Limits

The server currently limits animated requests to 60 frames and 10 seconds of total frame duration. Frames are rendered with a concurrency limit of three to avoid creating all Satori/Sharp workloads at once.

## Output

The endpoint returns the binary image directly:

- GIF: `Content-Type: image/gif`
- WebP: `Content-Type: image/webp`
- `Content-Disposition` contains the generated filename.

Animated WebP is included because it can preserve more colour information than GIF for gradients and artwork while sharing the same frame pipeline.
