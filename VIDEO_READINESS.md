# ProofMark Video Readiness

Video support is now merged into `main` as part of the existing ProofMark dashboard.

## What Is Implemented

- Shared `Asset` model for image and video media.
- Image protection still works through the existing `/api/images` routes and response shape.
- Video protection works through `/api/videos`.
- FPWM video watermark jobs are wired through the ProofMark backend.
- Video verification works through `/api/verify/video` and `/api/verify/video/url`.
- Video verification jobs are asynchronous.
- Video evidence is available at `/app/videos/:id`.
- Direct video URL tracking is available from `/app/tracking`.
- Confirmed video sightings are stored against the shared asset/payload model.
- Dashboard navigation stays unified:
  - `Protect` supports Image and Video modes.
  - `Verify` supports Image and Video modes.

## What Is Not Claimed Yet

Video support is ready for controlled testing, but it is not yet a production-grade public video claim.

Still required before public video release:

- live end-to-end deployment test with ProofMark + FPWM + Cloudinary + Redis
- repeatable benchmark pass on the FPWM video engine
- real platform survival tests
- public-beta worker separation if memory/queue pressure appears
- Strong/neural video mode only after funding and benchmark gates

## Current Product Position

The image/picture alpha remains the current primary product.

Video is now in the codebase so we can test the same ProofMark ownership model on short clips and prepare for FairPlay Africa, but product copy should stay conservative:

> Standard video protection is available for controlled testing and direct-URL verification.

Do not claim broad social platform survival until each platform has been tested and documented.

## Test Path

1. Protect a short MP4 from `/app/protect`.
2. Switch to the Video tab.
3. Wait for the FPWM job to complete.
4. Open the video evidence page.
5. Download the protected MP4.
6. Verify that protected MP4 from `/app/verify`.
7. Switch to the Video tab.
8. Paste a direct protected-video URL in `/app/tracking`.
9. Confirm a verification record, confirmed sighting, and markdown report are created.

## Latest Engine Smoke Test

Date: 2026-06-23

Live FPWM engine:

- Health: OK
- Readiness: OK
- Redis: OK
- FFmpeg: OK
- Storage: OK

Small-video test:

- Source: generated 3-second MP4 uploaded to Cloudinary
- Payload: `424244`
- Watermark job: ready
- Frames marked: `45`
- PSNR: `38.12`
- SSIM: `0.9571`
- Detection job: ready
- Detected payload: `424244`
- Confidence: `1.0`
- Frames voted: `3`

Result: Standard video watermark and detection passed on a controlled small MP4 through the live FPWM engine.

Note: two third-party public sample URLs failed inside FFmpeg before output. Use clean uploaded source media for the current smoke path and treat arbitrary external URL handling as part of later hardening.
