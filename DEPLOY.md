# ProofMark Deployment

Two services (Render blueprint in `render.yaml`): **proofmark-api** (Node) and
**proofmark-web** (static Vite build). MongoDB is external (Atlas).

## Prereqs
- A MongoDB Atlas cluster → connection string (`MONGO_URI`).
- Cloudinary creds (same account as FPWM is fine).
- FPWM is already live at https://watermarking-engine.onrender.com with its API key.

## Deploy (Render Blueprint)
1. Render → **New → Blueprint** → select the `Sadiq-Teslim/proofmark` repo (reads `render.yaml`).
2. It creates **proofmark-api** + **proofmark-web**. Fill the `sync:false` secrets:

   **proofmark-api**
   ```
   MONGO_URI=<your Atlas connection string>
   JWT_SECRET=ede8ffa66a30e3c3f7c52ff9f2436d9fa6bbf73f592577a978291edd8f7537bb
   CLOUDINARY_CLOUD_NAME=dw8tqfqaj
   CLOUDINARY_API_KEY=653635422627148
   CLOUDINARY_API_SECRET=YfkXV1r-bS4M95dS_-VgaoARtxA
   FPWM_API_KEY=SpcvQvvzw4E1JWjPngZlc3Orqk6M4CAZ6M8s6bfYT_KnqoPYKDbnXx_LQk_NRisK
   CLIENT_URL=<the proofmark-web URL, set after first deploy>
   ```
   (FPWM_BASE_URL and FPWM_IMAGE_ENGINE=qim-dct are already in the blueprint.)

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
- Atlas: allow Render egress IPs (or 0.0.0.0/0 for testing) in Network Access.
