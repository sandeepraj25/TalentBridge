# Deploying Rojgaar on Hostinger

Rojgaar has two deployable parts:

| Part | What it is | Where it runs on Hostinger |
|------|-----------|----------------------------|
| **`client/`** | React SPA (static files after build) | **Shared Web Hosting** `public_html` — works on any plan |
| **`server/`** | Node.js + Express API | **VPS** (Node is required; shared hosting cannot run Node) |
| **MySQL** | Database | hPanel → **Databases** (shared or VPS) |

> ⚠️ **Important:** Hostinger's shared/web hosting runs PHP + MySQL only — **not Node.js**.
> The React frontend and the MySQL database sit happily on shared hosting, but the Express
> API needs a Node runtime, which on Hostinger means a **VPS** (or KVM/Cloud plan with SSH).
> The two talk over HTTPS, and the API reaches the shared-hosting MySQL through **Remote MySQL**.

---

## 1. Database (Hostinger MySQL)

1. hPanel → **Databases → MySQL Databases**. Create a database + user, note the name, user, password.
2. If the API runs on a different server (VPS), enable **Remote MySQL** and add that server's IP to the whitelist (or `%` while testing).
3. From a machine that can reach the DB, apply the schema and seed:

```bash
cd server
cp .env.example .env      # fill DB_* with your Hostinger MySQL details
npm install
npm run migrate           # creates all tables
npm run seed              # optional demo data + reference data (packages, coin rules…)
```

Demo logins after seeding (password `Password123!`): `admin@rojgaar.example`, `recruiter@rojgaar.example`, `priya@example.com`.

---

## 2. API (Hostinger VPS)

On an Ubuntu VPS:

```bash
# Node 18+ (use nvm or NodeSource)
git clone <your-repo> rojgaar && cd rojgaar/server
npm install --omit=dev
cp .env.example .env       # set DB_*, JWT_SECRET (openssl rand -hex 48), CLIENT_ORIGIN=https://yourdomain.com
npm i -g pm2
pm2 start src/index.js --name rojgaar-api
pm2 save && pm2 startup
```

Put Nginx in front for TLS and to expose it as `https://api.yourdomain.com` (or reverse-proxy `https://yourdomain.com/api` → `http://127.0.0.1:4000`). Set `CLIENT_ORIGIN` to the exact SPA origin so CORS allows it.

---

## 3. Frontend (Hostinger shared hosting)

```bash
cd client
# Point the SPA at your API. If the API is reverse-proxied under the same domain
# at /api, you can leave VITE_API_URL unset (defaults to "/api").
echo 'VITE_API_URL=https://api.yourdomain.com/api' > .env.production
npm install
npm run build     # outputs client/dist
```

Upload the **contents of `client/dist`** to `public_html` (hPanel File Manager or FTP).

Because it's a single-page app, add a rewrite so deep links work. Create `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 4. Everything on one VPS (simplest, all-Hostinger)

If you have a VPS you can host both parts there and skip Remote MySQL:

- Run MySQL, the API (PM2), and serve `client/dist` with Nginx.
- Reverse-proxy `/api` to the Node process; serve the SPA for everything else with an SPA fallback to `index.html`.

```nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /var/www/rojgaar/client/dist;

  location /api/ { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; }
  location / { try_files $uri /index.html; }
}
```

Then leave `VITE_API_URL` unset (defaults to `/api`) and rebuild the client.

---

## Payments

The checkout flow uses a **mock gateway** that marks orders paid immediately. To go live,
replace the mock block in `server/src/routes/recruiter.js` (`/checkout`) with a real
Razorpay/Stripe order + signature verification step before crediting coins / activating a package.
