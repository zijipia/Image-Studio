# Animated GIF / WebP generation

Image Studio supports animated output through the existing `/api/generate` endpoint.

## Animation Timeline

The UI is available at:

`/?studio=animation`

The Timeline provides:

- visual preview with play/pause and a draggable playhead;
- duration and FPS controls;
- GIF or animated WebP output;
- per-element tracks and keyframes;
- smooth interpolation with easing for position, size and opacity;
- generated frame count and frame delay preview;
- copyable `/api/generate` JSON payload.

The current sample is a 930×280 welcome card and demonstrates staggered title/subtitle/avatar motion.

## SVG-first rendering

Animated frames are rendered by Satori directly to SVG buffers. Sharp/libvips accepts SVG buffers as array inputs and can join an array as an animated image, so the animation path no longer performs an explicit `SVG → PNG → decode → GIF/WebP` round-trip. Static image generation remains unchanged.

This still rasterizes the SVG inside libvips because GIF and animated WebP are raster image formats, but it removes the extra PNG encode/decode stage.

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

The server limits animated requests to 60 frames and 10 seconds of total frame duration. Frames are rendered with a concurrency limit of three.

## Output

The endpoint returns the binary image directly:

- GIF: `Content-Type: image/gif`
- WebP: `Content-Type: image/webp`
- `Content-Disposition` contains the generated filename.

Animated WebP is included because it can preserve more colour information than GIF for gradients and artwork while sharing the same frame pipeline.
