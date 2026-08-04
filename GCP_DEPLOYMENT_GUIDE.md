# Google Cloud Platform (GCP) Deployment Guide

This guide provides step-by-step instructions to deploy the **Global Exams and Learning Portal** on **Google Cloud Platform (GCP)** using **GCP Cloud Run** or **GCP Compute Engine (Docker Compose)**.

---

## Prerequisites

1. **Google Cloud Account & Project**: Create a project in [GCP Console](https://console.cloud.google.com/).
2. **Install Google Cloud SDK (`gcloud` CLI)**:
   ```bash
   gcloud init
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
3. **MongoDB Atlas Network Access**:
   Ensure `0.0.0.0/0` is added to **Network Access** in MongoDB Atlas Dashboard to allow connections from dynamic GCP Cloud Run IPs.

---

## Option 1: Deploy to GCP Cloud Run (Recommended)

GCP Cloud Run is serverless, cost-efficient, and automatically scales containers down to 0 when idle.

### Step 1: Enable GCP Services
```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

### Step 2: Create Artifact Registry Repository
```bash
gcloud artifacts repositories create global-exams-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Global Exams Platform Containers"
```

### Step 3: Build & Push Images to GCP

#### 1. Backend Service
```bash
# Build container image
docker build -t us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/backend:latest ./backend

# Push to Google Artifact Registry
docker push us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/backend:latest
```

#### 2. Python Evaluator Service
```bash
docker build -t us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/python-evaluator:latest ./python-evaluator
docker push us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/python-evaluator:latest
```

#### 3. Frontend Service
```bash
docker build -t us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/frontend:latest ./frontend
docker push us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/frontend:latest
```

---

### Step 4: Deploy Containers to Cloud Run

#### Deploy Python Evaluator
```bash
gcloud run deploy python-evaluator \
  --image=us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/python-evaluator:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8000 \
  --memory=2Gi \
  --cpu=2
```
*Note the returned service URL, e.g., `https://python-evaluator-xxxx-uc.a.run.app`.*

#### Deploy Backend Service
```bash
gcloud run deploy backend \
  --image=us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/backend:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=5000 \
  --set-env-vars="MONGODB_URI=mongodb+srv://opreman589_db_user:gZdPdsZVxgdHZJ27@examproctoringsystem.gsoscsp.mongodb.net/global-exams?retryWrites=true&w=majority,JWT_SECRET=production-secret-key,PYTHON_SERVICE_URL=https://python-evaluator-xxxx-uc.a.run.app"
```

#### Deploy Frontend Service
```bash
gcloud run deploy frontend \
  --image=us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/global-exams-repo/frontend:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080
```

---

## Option 2: Deploy using Docker Compose on a GCP VM (Compute Engine)

If you prefer running all 3 services on a single virtual machine:

1. **Create a Compute Engine Instance**:
   ```bash
   gcloud compute instances create global-exams-vm \
     --zone=us-central1-a \
     --machine-type=e2-standard-2 \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --tags=http-server,https-server
   ```

2. **SSH into VM and clone repo**:
   ```bash
   gcloud compute ssh global-exams-vm --zone=us-central1-a
   ```

3. **Install Docker & Docker Compose on VM**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose
   sudo systemctl enable --now docker
   ```

4. **Launch Multi-Container Stack**:
   ```bash
   cd Global-Exams-and-Learning-Portal
   docker-compose up -d --build
   ```

---

## Database Seeding in Cloud Environment

To seed your MongoDB Atlas Cloud database with admin credentials, courses, and syllabus questions from any terminal:

```bash
cd backend
npm run seed
npm run seed:admin
```

---

## Summary of Cloud Endpoints

- **Frontend**: `http://YOUR_GCP_IP:8080` or Cloud Run URL
- **Backend API**: `http://YOUR_GCP_IP:5000` or Cloud Run URL
- **Python AI Engine**: `http://YOUR_GCP_IP:8000` or Cloud Run URL
- **Database**: MongoDB Atlas (`examproctoringsystem.gsoscsp.mongodb.net`)
