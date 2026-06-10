# ProofMark API

Per-recipient forensic **image** watermarking. Upload an image, issue a uniquely-marked copy
to each recipient, and later trace any leaked copy back to the exact recipient. The actual
watermarking is done by **FPWM** (the watermark engine) — ProofMark owns users, the
issuance registry, and the trace logic.

## How it works
```
upload asset ─▶ issue(asset, recipient)
                   allocate unique payload ──▶ FPWM /v1/image/watermark ─▶ marked copy
                   store payload ↔ {recipient, asset, owner}
trace(suspect)  ──▶ FPWM /v1/image/detect ─▶ payload ─▶ issuance lookup ─▶ "issued to X"
```

## Run
```bash
cp .env.example .env     # fill MONGO_URI, JWT_SECRET, CLOUDINARY_*, FPWM_API_KEY
npm install
npm run dev              # http://localhost:4000
```

## API
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /api/auth/register | name, email, password | → token |
| POST | /api/auth/login | email, password | → token |
| POST | /api/assets | multipart: image, title | upload original (auth) |
| GET | /api/assets | — | list |
| POST | /api/recipients | name, email?, label? | create recipient |
| GET | /api/recipients | — | list |
| POST | /api/issuances | assetId, recipientId, engine? | → marked copy + downloadUrl |
| GET | /api/issuances | — | list (with asset + recipient) |
| POST | /api/trace | multipart: image | → match {recipient, asset, issuedAt} |

All except `/api/auth/*` and `/health` require `Authorization: Bearer <token>`.

## Engine selection
`FPWM_IMAGE_ENGINE=qim-dct` (live, CPU, survives JPEG/resize) or `trustmark`
(neural, survives screenshots/social — requires FPWM built with `INSTALL_NEURAL=true`).

## Status
- [x] B2 — product API (auth, assets, recipients, issuance, trace)
- [x] B3 — web UI (React/Vite in `client/` — builds clean)
- [x] B4 — image robustness benchmark + gates (in the watermark-engine repo, wired into CI)
- [ ] B5 — deploy (API + DB; client; FPWM neural for the `trustmark` engine)
