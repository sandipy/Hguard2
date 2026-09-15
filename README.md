# HGuard Home Monitor

Live Site: [https://sandipy.github.io/hguard2](https://sandipy.github.io/hguard2)

Senior-friendly home surveillance and monitoring app designed to repurpose old smartphones into smart home security cameras.

## Features

- **Multi-Camera Grid**: View up to 6 camera transmitter slots simultaneously from any viewer tablet, phone, or laptop.
- **Remote Screen Wake**: Wake the camera phone screen remotely for 30 seconds to inspect camera aim or check in.
- **Eco-Cool Screen (15s Auto-Dim)**: Dims camera phone displays to black during continuous surveillance, preventing heating and battery degradation.
- **80% Battery Protection**: Enforces battery protection alarms to prevent pouch swelling when plugged into 24/7 chargers.
- **Two-Way Audio & Loud Broadcast**: Instant walkie-talkie audio and household announcement broadcasts.
- **AES-256 GCM Encrypted Logging**: Local tamper-proof event logs and encrypted motion snapshots.
- **1-Tap Pairing & QR Code**: Effortless setup via direct web link, QR code scanner, or 4-digit Household PIN.

## Deployment to GitHub Pages (`sandipy.github.io/hguard2`)

### Option A: Automatic via GitHub Actions (Recommended)

1. Push the repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. In your GitHub repository settings:
   - Go to **Settings** > **Pages**
   - Under **Build and deployment** > **Source**, select **GitHub Actions**
3. GitHub Actions will automatically run `.github/workflows/deploy.yml` and publish the site to `https://sandipy.github.io/hguard2`.

### Option B: Deploy via `gh-pages` command

```bash
npm run deploy
```

This compiles the app into `dist/` and pushes it directly to the `gh-pages` branch.

---

## Deployment to Cloudflare Pages

You can host HGuard on Cloudflare Pages (at `https://hguard2.pages.dev` or your custom domain) using either method below:

### Method 1: Connect GitHub in Cloudflare Dashboard (Easiest, 1-Click)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository: `sandipy/hguard2`.
3. In the Build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**. Cloudflare will build the site and provide a free live URL (e.g. `https://hguard2.pages.dev`). Every future `git push` will deploy automatically!

### Method 2: Deploy via Wrangler CLI

```bash
npm run deploy:cf
```
*(If prompted on your first run, Wrangler will open a browser to authenticate with your Cloudflare account).*

