# Lumina Deployment Guide (GCP)

This guide provides step-by-step instructions for deploying Lumina to Google Cloud Platform as a lightweight, scalable solution.

## 1. Prerequisites
- Google Cloud SDK installed and configured (`gcloud auth login`).
- A GCP project with Billing enabled.
- API Enabling: `gcloud services enable run.googleapis.com containerregistry.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com`.

## 2. Backend Deployment (Cloud Run)
Cloud Run is ideal for Lumina's FastAPI backend as it scales to zero and is cost-effective.

```bash
# Navigate to backend directory
cd backend

# Build and Push to Google Container Registry
gcloud builds submit --tag gcr.io/[PROJECT_ID]/lumina-backend

# Deploy to Cloud Run
gcloud run deploy lumina-backend \
  --image gcr.io/[PROJECT_ID]/lumina-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=[YOUR_GEMINI_API_KEY]
```

## 3. Frontend Deployment (Firebase Hosting)
Firebase Hosting provides a global CDN for the React application.

```bash
# Navigate to frontend directory
cd frontend

# Build the production bundle
npm run build

# Initialize Firebase (if not already)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

## 4. Firestore Configuration (LTM)
1. Go to the Firebase Console.
2. Create a Firestore database in "Native Mode".
3. The backend uses the `google-cloud-firestore` library which will automatically authenticate using the Cloud Run service account.

## 5. Security Best Practices
- **Secret Manager:** Instead of environment variables, store `GOOGLE_API_KEY` in GCP Secret Manager.
- **CORS:** Update `allow_origins` in `main.py` to only include your frontend URL.
- **IAM:** Ensure the Cloud Run service account has `roles/datastore.user` permission for Firestore access.
