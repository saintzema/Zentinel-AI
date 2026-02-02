# Global Deployment Protocol 🛰️

## Architecture Overview
Zentinel OS utilizes a **Hybrid Architecture** to maximize performance and accessibility:
-   **Sector A (The Brain)**: Python Backend + YOLO + WebSockets. Hosted on **Render** or **Railway**.
-   **Sector B (The Interface)**: React Frontend. Hosted on **Vercel**.

---

## 🏗️ Sector A: The Brain (Backend)

### Option 1: Deploy to Render (Recommended)
1.  **Push Code**: Commit all changes to your GitHub "Zentinel" repository.
2.  **Dashboard**: logic into [dashboard.render.com](https://dashboard.render.com).
3.  **New Blueprint**: Click "New +" -> "Blueprint".
4.  **Connect Repo**: Select your "Zentinel" repository.
5.  **Auto-Deploy**: Render will detect `render.yaml` and automatically build the Docker container.
6.  **Retrieve URL**: Once deployed, copy the service URL (e.g., `https://zentinel-brain.onrender.com`).

### Option 2: Deploy to Railway
1.  **Dashboard**: Log into [railway.app](https://railway.app).
2.  **New Project**: "Deploy from GitHub repo" -> Select "Zentinel".
3.  **Config**: Railway will auto-detect the `Dockerfile`.
4.  **Variables**: Add `GEMINI_API_KEY` in the "Variables" tab.
5.  **Retrieve URL**: Go to "Settings" -> "Generic Domains" to get your URL.

---

## 🖥️ Sector B: The Interface (Frontend)

1.  **Dashboard**: Log into [vercel.com](https://vercel.com).
2.  **New Project**: "Add New..." -> "Project".
3.  **Import**: Select your "Zentinel" repository.
4.  **Configuration**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: `frontend` (IMPORTANT: Click 'Edit' and select the `frontend` folder).
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
5.  **Environment Variables**:
    -   Add `VITE_API_URL` -> Value: Your Sector A URL (e.g., `https://zentinel-brain.onrender.com`).
    -   *Note: Do NOT include a trailing slash.*
6.  **Deploy**: Click "Deploy".

---

## 🔒 Post-Deployment Verification
1.  **Access**: Open your Vercel URL. You should see the **Identity Challenge**.
2.  **Login**: Enter code `DEFCON-1`.
3.  **Uplink**: Dashboard should load. Verify the "STATUS" indicator in the top right is **STANDBY** (not "Connecting...").
4.  **Intelligence**: Open Sidebar. Ensure "Zentinel Core" connection log appears in the browser console.

**Mission Complete.** 🚀
