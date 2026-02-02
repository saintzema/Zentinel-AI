# Zentinel Deployment Guide

## 🚀 Quick Start - Local Development

### Run Both Landing Page + Dashboard

```bash
./run_full_stack.sh
```

This starts:
- Landing Page on `http://localhost:8001`
- Dashboard on `http://localhost:5173`

**Entry Point**: Visit `http://localhost:8001`

---

## 📦 Vercel Deployment Strategy

You have 2 options for deploying to Vercel:

### Option 1: Integrated Deployment (Recommended)

Deploy both landing page and dashboard as a single Vercel app:

1. **Update `login.html` redirect**:
   Edit `/landing/login.html` line 201:
   ```javascript
   window.location.href = '/dashboard';
   ```

2. **Move landing files into frontend**:
   ```bash
   cp -r landing frontend/public/landing
   ```

3. **Update routing in React app** (`frontend/src/App.tsx`):
   ```tsx
   // Add this route BEFORE other routes
   {window.location.pathname === '/login' && (
     window.location.href = '/landing/login.html'
   )}
   ```

4. **Deploy to Vercel**:
   ```bash
   cd frontend
   vercel --prod
   ```

5. **Configure rewrites in `vercel.json`** (already created):
   - Root `/` → Landing page
   - `/dashboard/*` → React app
   - `/api/*` → Backend API (deploy separately)

### Option 2: Separate Deployments

Deploy landing and dashboard as separate Vercel apps:

**Landing Page**:
```bash
cd landing
vercel --prod
# Result: landing.vercel.app
```

**Dashboard**:
```bash
cd frontend
vercel --prod
# Result: dashboard.vercel.app
```

Then update `landing/login.html` to redirect to `https://dashboard.vercel.app`

---

## 🔧 Backend Deployment

Your backend needs to be deployed separately. Options:

1. **Render.com** (already configured in `render.yaml`):
   ```bash
   # Push to GitHub, connect to Render
   git push origin main
   ```

2. **Railway**:
   ```bash
   railway up
   ```

3. **DigitalOcean App Platform**
4. **AWS EC2/ECS**

Update `frontend/.env` with your backend URL:
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🎯 Simulation Mode Setup

The simulation mode video upload works when:

1. **Backend is running**: `./run_backend.sh`
2. **Simulation mode is ON**: Toggle in dashboard
3. **Use case is selected**: The inference engine adapts based on selected use case

### Use Case → Engine Mapping

| Use Case | Engine | Detection Focus |
|----------|--------|----------------|
| `mall_cctv` | Mall Security | Theft gestures, loitering |
| `traffic` | Traffic Intelligence | Vehicles, speed, plates |
| `industrial` | Pipeline Monitoring | Leaks, intrusions |
| `security` | Perimeter Security | Breaches, weapons |

---

## 🐛 Troubleshooting

### "Upload not working in simulation mode"

**Check:**
1. Backend is running on port 8000
2. Simulation mode is toggled ON in dashboard
3. Browser console for CORS errors  
4. `/api/v1/analyze/upload` endpoint is accessible

**Test upload endpoint**:
```bash
curl -X POST http://localhost:8000/api/v1/analyze/upload \
  -F "file=@test_video.mp4"
```

### "Login redirects to 404"

**Local Dev**: Dashboard must be running on port 5173
**Production**: Update redirect URL in `login.html` to your Vercel dashboard URL

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│   Landing Page (localhost:8001)         │
│   ├── index.html (Homepage)             │
│   ├── login.html (Authentication)       │
│   └── assets/ (CSS, JS, Images)         │
└────────────┬────────────────────────────┘
             │ (Login redirect)
             ▼
┌─────────────────────────────────────────┐
│   Dashboard (localhost:5173)            │
│   ├── React + Vite                      │
│   ├── Routes: /dashboard, /events, etc │
│   └── API calls to backend              │
└────────────┬────────────────────────────┘
             │ (Fetch data)
             ▼
┌─────────────────────────────────────────┐
│   Backend (localhost:8000)              │
│   ├── FastAPI                           │
│   ├── Perception Engines                │
│   ├── Video Processing                  │
│   └── Database                          │
└─────────────────────────────────────────┘
```

---

## ✅ Production Checklist

- [ ] Update API URLs in `frontend/.env`
- [ ] Update login redirect in `landing/login.html`
- [ ] Deploy backend (Render/Railway/etc)
- [ ] Deploy frontend to Vercel
- [ ] Test login flow end-to-end  
- [ ] Verify simulation mode video upload
- [ ] Enable CORS on backend for your Vercel domain
- [ ] Set up custom domain (optional)
- [ ] Configure environment variables in Vercel dashboard

---

## 🎬 Demo Flow

1. User visits `your-site.vercel.app` → **Landing Page**
2. User clicks "Dashboard" → **Login Page**
3. User enters `admin@gmail.com` / `SAng12!?`
4. Redirects to **Dashboard** (React app)
5. User selects "Simulation Mode"
6. User chooses use case (Mall, Traffic, Industrial, Security)
7. User uploads video → **Backend processes** with correct engine
8. Dashboard shows real-time AI detections

---

## 💡 Pro Tips

- Use `run_full_stack.sh` for local development
- Keep secrets in `.env` files (never commit)
- Test on mobile - landing page is fully responsive
- Monitor backend logs for debugging
- Use Vercel Analytics for traffic insights

Need help? Check logs:
- Frontend: Browser DevTools Console
- Backend: `./run_backend.sh` terminal output
