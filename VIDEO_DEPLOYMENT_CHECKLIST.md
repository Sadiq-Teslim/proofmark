# ProofMark Video Deployment Checklist

Use this checklist only when we decide to deploy the `codex/proofmark-video-v1` branch for alpha video testing.

Current decision: **do not deploy or restructure video infrastructure yet.** The existing ProofMark image/picture flow remains the active alpha product. The video branch is prepared for later, but worker separation and video infrastructure changes are deferred.

## ProofMark API Environment

Required:

- `FPWM_BASE_URL`
- `FPWM_API_KEY`
- `FPWM_VIDEO_ENGINE=qim-dct`
- `FPWM_MAX_PAYLOAD=268435455`
- `MAX_VIDEO_UPLOAD_MB=250`
- `MAX_VERIFY_VIDEO_UPLOAD_MB=250`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`

Recommended timeouts:

- `FPWM_VIDEO_JOB_TIMEOUT_MS=120000`
- `FPWM_VIDEO_STATUS_TIMEOUT_MS=60000`

## FPWM Engine Environment

For Standard video V1:

- `FPWM_API_KEY` must match ProofMark's `FPWM_API_KEY`
- `FPWM_HMAC_SECRET` should be set and stable
- `REDIS_URL` must be configured
- `STORAGE_BACKEND=cloudinary`
- Cloudinary credentials must be configured
- `MAX_DURATION_S` should be conservative during alpha
- `WEB_CONCURRENCY=1` is acceptable for controlled smoke tests

Deferred:

- Do not split FPWM web/worker/Redis specifically for the current image alpha.
- Do not add a separate FPWM worker service until video is moving toward public beta or the current engine starts hitting memory/queue limits.
- Do not enable Strong/neural video during this phase.

Do not enable Strong video yet unless the neural worker has enough memory and the VideoSeal gates pass.

## Benchmark Gates

Run these in `C:\Users\Admin\fairplayafrica\watermark-engine` before claiming production-grade Standard video.

```bash
python -m bench.run_benchmark
python -m bench.gates
```

Minimum accepted attack coverage:

- H.264 recompression
- resize to 720p
- resize to 480p
- bitrate reduction
- first/last trim
- frame-rate change
- audio removed
- platform-style re-upload sample

For Strong video later:

```bash
AUDIO_WATERMARK_ENABLED=true FPWM_BENCH_ENGINE=videoseal python -m bench.run_benchmark
python -m bench.gates
```

## ProofMark Smoke Test

After deploying this branch:

1. Register/login.
2. Protect a short MP4 at `/app/protect-video`.
3. Wait for the job to become ready.
4. Open the video evidence page from the result.
5. Download the protected MP4.
6. Verify the protected MP4 at `/app/verify-video`.
7. Paste a direct protected MP4 URL in `/app/tracking`.
8. Confirm the result creates:
   - a video verification record
   - a confirmed video sighting
   - an exportable markdown report

## Release Claim

Until benchmark gates pass on a real corpus, product copy should say:

> Standard video protection is available for alpha testing and direct-URL verification.

Do not claim broad social-platform survival until each platform has its own passing test evidence.
