# ProofMark Video Implementation Handoff

This document tracks the video rollout after the first foundation pass. The goal is to make ProofMark's image-first protection model reusable for FairPlay Africa video workflows without creating a second, incompatible product architecture.

## Completed Foundation

### 1. Shared asset model

ProofMark now has a shared `Asset` model for protected media.

- `type`: `image` or `video`
- `payload`: the forensic payload shared by ProofMark and FairPlay
- `engine`: active FPWM engine
- `status`: `processing`, `ready`, or `error`
- `originalUrl` / `protectedUrl`
- dimensions, duration, filename, MIME type, and metadata

New image protections still return the existing `Image` response for compatibility, but they also create a matching `Asset` row. New video protections use `Asset` directly.

### 2. Video API foundation

The backend now exposes video protection routes:

- `POST /api/videos`
- `GET /api/videos`
- `GET /api/videos/:id`
- `GET /api/videos/jobs`
- `GET /api/videos/jobs/:id`
- `GET /api/videos/:id/download`

Video protection is asynchronous from day one. The API uploads the original video to Cloudinary, allocates a ProofMark payload, creates a video asset, creates an FPWM video watermark job, then lets the client poll until the protected video is ready.

### 3. FPWM video client

The ProofMark FPWM client now supports:

- `createWatermarkVideoJob`
- `videoWatermarkJobStatus`
- `createDetectVideoJob`
- `videoDetectJobStatus`
- `defaultVideoEngine`

The client sends `FPWM_MAX_PAYLOAD` explicitly so ProofMark and FairPlay share the same payload range instead of inheriting FPWM's conservative request default.

### 4. Protect Video UI

ProofMark now has a first-class mobile-friendly video protection screen.

Route:

- `/app/protect-video`

Implemented states:

- Empty upload state
- File selected state with filename, size, and video preview
- Processing state with job polling
- Ready state with preview player, download, and verify action
- Error state with retry guidance

The UI uses the same dashboard system as image protection, but video processing is presented as an async job.

### 5. Video Verification API

ProofMark now exposes video verification endpoints around FPWM detect jobs.

Routes:

- `POST /api/verify/video`
- `POST /api/verify/video/url`
- `GET /api/verify/video`
- `GET /api/verify/video/jobs`
- `GET /api/verify/video/jobs/:id`

Verification creates a `Verification` row when the detect job finishes.

Evidence should include:

- detected payload
- confidence
- frames voted
- matched asset, if owned by the current account
- strict result: `matched`, `unknown_owner`, `not_found`, or `invalid`
- source filename or URL

### 6. Verify Video UI

ProofMark now has a first-class mobile-friendly video verification screen.

Route:

- `/app/verify-video`

The user can:

- upload a suspicious video
- paste a direct video URL
- see whether the video belongs to them
- see frame-vote evidence, not just a vague success/failure result
- download a verification report

## Completed V1 Additions

### 7. Video Evidence Page

ProofMark now has a video-specific evidence page.

Route:

- `/app/videos/:id`

Include:

- protected video preview/player
- original/protected metadata
- payload
- engine
- protection date
- FPWM metrics
- verification history
- sightings
- downloadable report

This page is important for FairPlay because video claims need defensible proof, not only a UI badge.

### 8. Tracking Pipeline

Direct video URL tracking is now implemented.

Implemented:

1. User submits a direct video URL from `/app/tracking`.
2. ProofMark creates an FPWM video detect job.
3. When the payload maps to a protected video owned by the user, ProofMark records:
   - a video verification record
   - a confirmed video sighting
   - evidence fields including payload, confidence, frames voted, and engine

Remaining platform order:

1. Direct downloadable URLs
2. User-submitted URLs
3. Public web pages with embedded videos
4. YouTube
5. X/Twitter
6. TikTok
7. Instagram/Facebook
8. WhatsApp/Telegram manual upload workflows

Every source should store sightings against the shared `Asset` payload. Do not build image-only and video-only tracking tables.

### 9. Benchmark Gates

Deployment benchmark gates are documented in `VIDEO_DEPLOYMENT_CHECKLIST.md`.

Before video is presented as production-grade, run a repeatable benchmark corpus.

Standard video gates:

```bash
python -m bench.run_benchmark
python -m bench.gates
```

Minimum attack matrix:

- H.264 recompression
- resize to 720p
- resize to 480p
- bitrate reduction
- trim first/last 10%
- frame-rate change
- audio removed
- platform-style re-upload sample

## Remaining Work

### 10. Worker Separation

Status: **deferred until after ProofMark image alpha and early video smoke tests.**

Do not make this part of the current ProofMark deployment. The current image product should continue to run as-is, and the video work lives on the `codex/proofmark-video-v1` branch until we decide to deploy it. Worker separation is a later production hardening step for public video beta, not a requirement for the current picture/image alpha.

Before public video beta, split the deployment.

Recommended services:

- ProofMark web API
- FPWM web API
- FPWM standard worker
- FPWM neural worker, disabled until funded and benchmarked
- Redis

Video processing should not share memory with the public web API.

Current decision:

- Keep current image protection and verification unchanged.
- Do not restructure the FPWM deployment right now.
- Use the existing FPWM deployment only for controlled short-video smoke tests if needed.
- Revisit worker separation when video moves from internal alpha to public beta or when memory/queue pressure appears.

### 11. Strong Video Mode

Do not enable Strong video by default during alpha.

Enable only after:

- VideoSeal is installed on a large enough worker
- benchmark gates pass
- memory usage is stable
- queue timeouts are tuned
- product copy clearly separates Standard from Strong

Strong video gate:

```bash
AUDIO_WATERMARK_ENABLED=true FPWM_BENCH_ENGINE=videoseal python -m bench.run_benchmark
python -m bench.gates
```

### 12. FairPlay Africa Integration Standard

FairPlay should integrate through the shared asset/payload contract.

FairPlay should store:

- `assetId`
- `payload`
- `engine`
- `mediaType`
- `originalUrl`
- `protectedUrl`
- `ownerId`
- `status`
- `evidence`

FairPlay should not depend on ProofMark-only concepts like `Image`. The long-term contract is `Asset`.

## Launch Recommendation

Build Standard Video V1 first:

- upload video
- protect video asynchronously
- download protected video
- verify uploaded suspect video
- produce evidence report

Then add tracking by source, one platform at a time.
