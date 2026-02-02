# 🎓 Zentinel Cloud Studio: AI Training Guide

> [!IMPORTANT]
> **Free GPU Training**: This guide uses Google Colab's free T4 GPU tier. No local hardware required.

## 1. Quick Start (Google Colab)

We have prepared a "One-Click" notebook for training Zentinel models (YOLOv8).

1.  **[Click Here to Open Zentinel Cloud Studio in Colab](https://colab.research.google.com/drive/16jcaJ0aps6_rWe6kFeEP3W5-0-C?usp=sharing)** *(Mock Link for MVP)*
2.  Sign in with your Google Account.
3.  Click **Runtime > Change runtime type** and ensure **T4 GPU** is selected.

## 2. Prepare Your Data
1.  Collect 50-100 images of your target object (e.g., " FedEx Uniform", "Specific Product").
2.  Label them using [Roboflow](https://roboflow.com) (Free) or [CVAT](https://cvat.ai).
3.  Export the dataset in **YOLOv8 Format** (you will get a zip file or a code snippet).

## 3. Train the Model
In the Colab Notebook:
1.  Paste your dataset code snippet (from Roboflow) into the "Import Data" cell.
2.  Run the **"Start Training"** cell.
3.  Wait ~20-30 minutes.
4.  The notebook will generate a `best.pt` file. **Download this file**.

## 4. Deploy to Zentinel
1.  Go to your **Zentinel Dashboard**.
2.  Navigate to **Pipeline Training > Cloud Studio**.
3.  Drag & drop your `best.pt` file into the "Upload Custom Model" zone.
4.  The system will auto-reload and start using your new brain!

---

## ☁️ Option B: Hosting on Hugging Face (For Teams)
If you want to share models with your team:

1.  Create a model repository on [Hugging Face](https://huggingface.co).
2.  Upload your `best.pt`.
3.  In Zentinel, you can soon paste the Hugging Face URL to auto-sync (Feature coming in V2.3).
