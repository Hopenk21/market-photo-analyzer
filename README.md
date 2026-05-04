# Market Photo Analyzer (prototype)

Simple Next.js prototype that accepts photo uploads and returns basic image features (average color, dimensions, size).

Quick start (dev):

```bash
npm install
npm run dev
```

Notes:
- This prototype stores uploads in a local `uploads/` folder. That won't persist on Vercel serverless functions — use S3/Cloudinary/Supabase storage for production.
- For production-grade market analysis, integrate a vision/ML API (OpenAI, Google Vision, Clarifai, etc.) in `pages/api/upload.js`.

Qwen 3 VL integration
- This project supports sending uploaded images to a Qwen-like vision-language endpoint. To enable it, set the following environment variables (see `.env.example`):
	- `QWEN_API_URL` — the inference endpoint URL
	- `QWEN_API_KEY` — your API key

Example (local): create a `.env.local` with the values and restart the dev server.

Deploy to Vercel: connect your repo and deploy normally. Add `QWEN_API_URL` and `QWEN_API_KEY` as project Environment Variables in the Vercel dashboard. For production storage, replace local `uploads/` handling with S3/Cloudinary/Supabase as Vercel serverless functions have ephemeral storage.

S3 storage integration
- This project supports uploading images to an S3 bucket. To enable it, set the following environment variables (see `.env.example`):
	- `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

When enabled the API will upload each accepted image to `uploads/<uuid>-<filename>` and return a `storage.url` field in the API response. If you use a different S3-compatible provider (DigitalOcean Spaces, MinIO), adjust the URL pattern or use a custom endpoint in the AWS SDK client initialization.

Deploying to Vercel
1. Create a Git repo (GitHub/GitLab) and push the project.
2. In Vercel, import the repo and set the Environment Variables: `QWEN_API_URL`, `QWEN_API_KEY`, and S3 variables if using storage.
3. Deploy — Vercel will build the Next.js app automatically.

Local test
1. Create a `.env.local` (copy `.env.example`) with the variables you want to test.
2. Install dependencies and run dev:

```bash
npm install
npm run dev
```

The upload endpoint will be available at `http://localhost:3000/api/upload`.
