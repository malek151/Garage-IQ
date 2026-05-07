# GarageIQ — Deployment Guide

## Folder structure
```
garageiq/
  api/
    vehicle.js   ← DVLA proxy
    mot.js       ← DVSA MOT proxy
  vercel.json
  package.json
```

## Step 1 — Install Vercel CLI
```
npm install -g vercel
```

## Step 2 — Deploy
Inside the garageiq folder, run:
```
vercel
```
Follow the prompts. Choose "No" for existing project, name it "garageiq".

## Step 3 — Add your API keys as environment variables
In Vercel dashboard → Your project → Settings → Environment Variables:

| Name | Value |
|------|-------|
| DVLA_API_KEY | your DVLA key here |
| DVSA_API_KEY | your DVSA MOT key here |

## Step 4 — Redeploy after adding keys
```
vercel --prod
```

## Step 5 — Your API endpoints will be live at:
- POST https://garageiq.vercel.app/api/vehicle
- GET  https://garageiq.vercel.app/api/mot?reg=AB12CDE

## Updating the frontend
Replace the fetch URLs in the app with your Vercel URLs above.
