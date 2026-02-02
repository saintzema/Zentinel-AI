# ZentinelOS Setup Guide

## Frontend Dependencies

Run this in `/frontend` directory:

```bash
cd /Users/zema/Projects/AI\ Projects/Zentinel/frontend
npm install @react-google-maps/api
```

## Backend Dependencies

Run this in the root directory:

```bash
cd /Users/zema/Projects/AI\ Projects/Zentinel
source venv/bin/activate
pip install google-generativeai
```

## Restart Services

After installing, restart both:

**Terminal 1 (Frontend):**
```bash
cd /Users/zema/Projects/AI\ Projects/Zentinel/frontend
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd /Users/zema/Projects/AI\ Projects/Zentinel
./run_backend.sh
```

---

## Installed Dependencies

### Frontend (package.json)
- `@react-google-maps/api` - Google Maps integration

### Backend (requirements added)
- `google-generativeai` - Gemini AI integration
