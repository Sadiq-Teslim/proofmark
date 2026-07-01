# ProofMark Deployment

Three components (Render blueprint in `render.yaml`): **proofmark-db** (managed Postgres),
**proofmark-api** (Node), and **proofmark-web** (static Vite build). No external database
needed — Render provisions Postgres and wires `DATABASE_URL` automatically. Tables are
created on first boot (Sequelize sync).

## Prereqs
- Cloudinary creds (same account as FPWM is fine).
- FPWM is already live at https://watermarking-engine.onrender.com with its API key.

## Deploy (Render Blueprint)
1. Render → **New → Blueprint** → select the `Sadiq-Teslim/proofmark` repo (reads `render.yaml`).
2. It creates **proofmark-db** + **proofmark-api** + **proofmark-web**. `DATABASE_URL` is
   auto-wired from the database. Fill the remaining `sync:false` secrets:

   **proofmark-api**
   ```
   JWT_SECRET=<generate-a-long-random-secret>
   CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<cloudinary-api-key>
   CLOUDINARY_API_SECRET=<cloudinary-api-secret>
   FPWM_API_KEY=<watermark-engine-api-key>
   CLIENT_URL=<the proofmark-web URL, set after first deploy>
   ```
   (DATABASE_URL, FPWM_BASE_URL and FPWM_IMAGE_ENGINE=qim-dct are already wired by the blueprint.)

   **proofmark-web**
   ```
   VITE_API_URL=<the proofmark-api URL>/api
   ```
3. **Apply.** Both build. Note the two URLs.
4. **Wire the two together:** set `CLIENT_URL` (api) = the web URL, and
   `VITE_API_URL` (web) = `<api-url>/api`, then redeploy each once.

## Verify
```bash
curl https://<proofmark-api>.onrender.com/health    # {"status":"ok","service":"proofmark"}
```
Then open the web URL → register → upload an asset → add a recipient → issue → trace.

## Switching to the neural engine (screenshots/social-robust)
Default is `qim-dct` (live now). For `trustmark`:
1. Redeploy **FPWM** with `INSTALL_NEURAL=true` on a Standard (non-free) instance and
   validate its image gates (`FPWM_BENCH_ENGINE=trustmark`).
2. Set `FPWM_IMAGE_ENGINE=trustmark` on **proofmark-api** and redeploy.

## Notes
- Free Render instances sleep when idle (first request slow). Use paid for production.
- The `proofmark-db` blueprint plan is `free` (expires after ~30 days) — upgrade for production.
- Tables auto-create on boot via Sequelize `sync()`. For schema changes later, switch to
  migrations rather than relying on sync.
