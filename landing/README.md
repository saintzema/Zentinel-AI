# Zentinel Landing Page

Professional marketing website for Zentinel AI Surveillance Platform

## Quick Start

1. **Local Development**:
   ```bash
   cd landing
   python3 -m http.server 8000
   ```
   Open http://localhost:8000

2. **Login Credentials**:
   - Email: `admin@gmail.com`
   - Password: `S`

## Structure

```
landing/
├── index.html          # Homepage
├── login.html          # Dashboard authentication
├── assets/
│   ├── css/
│   │   └── main.css    # Global styles
│   ├── js/
│   │   └── main.js     # Interactions
│   └── images/         # Logos, demos, screenshots
└── README.md
```

## Features

- ✅ SEO-optimized with meta tags
- ✅ Multi-industry showcase (Retail, Drones, Pipelines, Traffic, Security)
- ✅ Interactive industry tabs
- ✅ Contact form with validation
- ✅ Secure login with dashboard redirect
- ✅ Fully responsive design
- ✅ Smooth animations and transitions
- ✅ Premium tactical design theme

## Dashboard Integration

The login page redirects to: `../frontend/index.html`

Update the redirect path in `login.html` line 156 to match your dashboard URL:
```javascript
window.location.href = 'YOUR_DASHBOARD_URL';
```

## Adding Demo Images

Place your demo screenshots in `assets/images/`:
- `hero-demo.jpg` - Main hero section
- `retail-demo.jpg` - Retail theft detection
- `drone-demo.jpg` - Drone surveillance
- `pipeline-demo.jpg` - Pipeline monitoring
- `traffic-demo.jpg` - Traffic analysis
- `security-demo.jpg` - Security sentry

## SEO Optimization

To maximize Google rankings:

1. **Update meta tags** in index.html with your domain
2. **Add sitemap.xml**:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url><loc>https://yourdomain.com/</loc><priority>1.0</priority></url>
     <url><loc>https://yourdomain.com/login.html</loc><priority>0.8</priority></url>
   </urlset>
   ```

3. **Create robots.txt**:
   ```
   User-agent: *
   Disallow: /login.html
   Sitemap: https://yourdomain.com/sitemap.xml
   ```

4. **Google Analytics**: Add tracking code before closing `</head>` tag

## Deployment

### Option 1: Static Hosting (Vercel/Netlify)
```bash
cd landing
vercel --prod
```

### Option 2: Custom Domain
1. Upload `landing/` folder to web server
2. Point domain DNS to server IP
3. Enable HTTPS with Let's Encrypt

## Customization

### Colors
Edit CSS variables in `assets/css/main.css`:
```css
:root {
  --primary: #00d4ff;      /* Brand color */
  --secondary: #10b981;     /* Accent color */
  --gray-900: #0a0e1a;      /* Background */
}
```

### Content
- Edit text directly in HTML files
- Update stats in hero section
- Modify industry-specific features

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile iOS/Android

## License

© 2026 Zentinel. All rights reserved.
