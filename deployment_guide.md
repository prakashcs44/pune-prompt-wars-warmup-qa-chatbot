# 🚀 Lumina AI — Deployment Guide (GCP)

To deploy Lumina AI to Google Cloud Platform and get a working URL, we will use a **Split-Hosting Strategy** (best practice for Performance & Cost):
1.  **Backend (FastAPI):** Hosted on **Google Cloud Run** (Scalable container).
2.  **Frontend (React):** Hosted in a **Google Cloud Storage Bucket** (Static website hosting).

---

## 🛠️ Prerequisites
1.  Install the **[Google Cloud CLI](https://cloud.google.com/sdk/docs/install)** (Note: The `npm` package you installed is a library, not the deployment tool).
2.  Run `gcloud init` and `gcloud auth login`.
3.  Enable required services:
    ```bash
    gcloud services enable run.googleapis.com artifactregistry.googleapis.com
    ```

---

## 1️⃣ Deploy the Backend (Cloud Run)
The backend requires a server to run Python code. Cloud Storage buckets cannot run logic, so we use Cloud Run.

1.  **Navigate to backend:** `cd backend`
2.  **Deploy using the Dockerfile:**
    ```bash
    gcloud run deploy lumina-backend \
      --source . \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="GOOGLE_API_KEY=YOUR_KEY_HERE,CORS_ORIGINS=*"
    ```
3.  **Save the Service URL:** After deployment, you will get a URL like `https://lumina-backend-xyz.a.run.app`. **Copy this.**

---

## 2️⃣ Deploy the Frontend (GCP Bucket)
Now we build your React app and upload it to a bucket as requested.

1.  **Update API URL:** Open `frontend/src/api.ts` and change `API_BASE` to your new Cloud Run URL.
2.  **Build the React app:**
    ```bash
    cd frontend
    npm run build
    ```
    *This creates a `dist/` folder.*
3.  **Create a Bucket:**
    ```bash
    gcloud storage buckets create gs://YOUR_UNIQUE_BUCKET_NAME --location=us-central1
    ```
4.  **Upload the `dist/` contents:**
    ```bash
    gcloud storage cp -r dist/* gs://YOUR_UNIQUE_BUCKET_NAME
    ```
5.  **Make public & Set Main Page:**
    ```bash
    # Allow public read access
    gcloud storage buckets add-iam-policy-binding gs://YOUR_UNIQUE_BUCKET_NAME \
      --member=allUsers --role=roles/storage.objectViewer

    # Set index.html as the entrypoint
    gcloud storage buckets update gs://YOUR_UNIQUE_BUCKET_NAME \
      --web-main-page-suffix=index.html --web-error-page-suffix=index.html
    ```

---

## 🔗 Getting your working URL
Your frontend will be accessible at:
`https://storage.googleapis.com/YOUR_UNIQUE_BUCKET_NAME/index.html`

> [!TIP]
> For a custom domain (e.g., `www.yourhackathon.com`), you would normally put a **Cloud Load Balancer** in front of the bucket.

---

## 📝 Troubleshooting
- **CORS Error:** Ensure the `CORS_ORIGINS` environment variable in Cloud Run includes your bucket URL.
- **API Key:** Don't forget to pass your `GOOGLE_API_KEY` during the `gcloud run deploy` command.
