# ProofMark Product Plan

ProofMark v1 is intentionally simple: a user uploads a picture, ProofMark returns a protected version, the user shares that protected version anywhere, and ProofMark helps verify authenticity, track appearances, and manage the image as property.

This product is the image-first foundation for FairPlay Africa. Once the image path is dependable, the same watermarking, detection, and tracking policies can be applied to extracted video frames.

## 1. Core Product Flow

The product must optimize for one repeated workflow:

1. Upload an original image.
2. Generate a protected image with a forensic watermark.
3. Store that protected image as user property.
4. Let the user download and share the protected version.
5. Verify suspicious copies by upload.
6. Track where protected images appear online.
7. Keep an evidence trail for verifications and sightings.

The UI should make this flow obvious without requiring the user to understand watermarking internals. The current app now exposes this as:

- Property: protect new images and manage protected images.
- Verify: upload a suspect image and see match evidence.
- Track: run copy scans from each protected image.

## 2. Simple Production Data Model

ProofMark v1 should stay lean. The first production model is:

| Model | Purpose | Current status |
| --- | --- | --- |
| `User` | Owns protected images and evidence | Existing |
| `Image` | The protected image/property record | Existing |
| `Verification` | A saved evidence record for suspect image checks | Added |
| `Sighting` | A found web/social appearance of a protected image | Existing |

`Image` should remain the primary property record. It stores title, original URL, protected URL, payload, watermark engine, dimensions, and owner.

`Verification` records the result of a suspect-image check:

- `matched`: watermark maps to one of the user's protected images.
- `unknown_owner`: valid ProofMark watermark exists, but not for this user.
- `not_found`: no valid ProofMark watermark was detected.
- `invalid`: the verification attempt failed.

`Sighting` records where copies appear online and whether the watermark was confirmed on the found copy.

## 3. Watermark Robustness Plan

The watermark engine must be treated as a release gate, not a hidden implementation detail.

Minimum edge cases to test before production:

- JPEG recompression at multiple qualities.
- Resize down and resize up.
- Screenshots.
- Social-media re-encoding.
- WhatsApp-style compression.
- Repost chains.
- Crop.
- Small rotation.
- Brightness, contrast, and color changes.
- False positives against unrelated images.
- Wrong-payload attribution against unrelated ProofMark images.

Recommended watermark policy:

- Standard mode: `qim-dct` for fast everyday protection.
- Strong mode: `trustmark` for high-risk public images when the watermark engine has neural support enabled.
- Verification should auto-try the engines already used by the user's protected images.
- Detection should use stored original dimensions as candidate-size hints.
- ProofMark must never claim ownership unless the detected payload validates and maps to a protected image owned by the user.

Current local benchmark result on 2026-06-12:

- `qim-dct-hinted` passed all configured image gates.
- Recovery was 100% for JPEG recompression, resize, screenshot, social, Instagram, Twitter/X, WhatsApp, reshare, brightness, and clean detection on the local 8-image corpus.
- False positives were 0/8.
- Imperceptibility passed with PSNR 43.57 and SSIM 0.9822.
- Crop and rotation recovery were 0% for `qim-dct-hinted`, which is expected. Those attacks require the strong/neural tier.
- `trustmark` could not be benchmarked locally because the `trustmark` Python package is not installed in the local engine virtual environment. Production strong mode must install `requirements-neural-image.txt` and pass `FPWM_BENCH_ENGINE=trustmark python -m bench.run_image_benchmark && python -m bench.image_gates` before strong mode is enabled for users.

Implementation notes:

- ProofMark now asks the watermark engine for `/v1/image/capabilities`.
- Strong mode is disabled in the UI and rejected by the API unless TrustMark is reported available.
- The watermark engine image endpoints default to `qim-dct`, not `trustmark`, so production does not accidentally depend on missing neural dependencies.
- Verification auto-tries the engines used by the user's protected images.

## 3.1 Evidence-Grade Verification

Verification now supports both uploaded suspect images and direct public image URLs.

Each verification stores:

- source: `upload` or `url`
- suspect filename or URL
- optional stored suspect image URL
- detected payload
- confidence
- engine
- matched protected image, if any
- structured evidence JSON
- downloadable Markdown evidence report

Evidence reports are available at:

```text
GET /api/verify/:id/report
```

The report is authenticated and intentionally strict: it only attributes ownership when a valid detected payload maps to a protected image owned by the account.

## 4. Tracking Rollout

Tracking should grow one source at a time:

1. Manual suspect upload.
2. Direct image URL verification.
3. Public webpage scanning.
4. Reverse image search provider.
5. X/Twitter.
6. Instagram/Facebook.
7. TikTok/YouTube thumbnails.
8. Video frame sampling for FairPlay Africa.

Each platform needs its own transformation profile, benchmark, fetcher, evidence schema, and legal/ToS review.

Current tracking status:

- Manual upload verification is implemented.
- Direct image URL verification is implemented.
- When a direct URL verification matches one of the user's protected images, ProofMark records it as a confirmed `direct-url` sighting.
- Reverse-image/public web scanning already exists through Google Vision Web Detection when `GOOGLE_VISION_API_KEY` is configured.

## 5. FairPlay Africa Bridge

ProofMark should become the image/frame protection layer for FairPlay Africa.

The bridge is:

1. Harden image watermarking.
2. Detect modified copies reliably.
3. Track sightings and store evidence.
4. Apply the same watermarking policy to selected video frames.
5. Detect suspect videos by sampling frames and using payload voting.
6. Combine frame watermark results with FairPlay Africa's audio/content fingerprinting.

This avoids starting over when the product moves from images to video.
