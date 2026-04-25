# PerFinManage — Personal Finance Management System

A full-stack personal finance management application built with React, Node.js, MongoDB, and Firebase Authentication.

---

## 🚀 Features

- **Google OAuth** login via Firebase Authentication
- **Expense Management** — add/edit/delete with categories, recurring expenses, budget limits & alerts
- **Income Tracking** — salary, freelance, passive income with trend charts
- **Investment Portfolio** — stocks, mutual funds, crypto with P&L tracking
- **Fixed Deposits** — FD tracker with maturity alerts & interest estimates
- **Loan Management** — EMI tracking, outstanding balance, progress
- **Dashboard** — net worth, income vs expense charts, recent transactions
- **Admin Panel** — user management, suspension, growth analytics
- **CSV Export** for all modules
- **Mobile-responsive** UI

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | Firebase Authentication (Google OAuth) |
| Deployment | Render |

---

## 📁 Project Structure

```
PerFinManage/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── charts/      # Recharts chart components
│   │   │   └── modals/      # Add/Edit modals
│   │   ├── context/         # AuthContext (Firebase)
│   │   ├── pages/           # Route pages
│   │   ├── services/        # Axios API client
│   │   └── utils/           # Helpers & constants
│   └── package.json
└── server/                  # Node.js + Express backend
    ├── config/              # DB & Firebase admin
    ├── middleware/          # Auth, rate limiter, error handler
    ├── models/              # Mongoose schemas
    ├── routes/              # Express route handlers
    └── package.json
```

---

## ⚙️ Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Google Sign-In** under Authentication → Sign-in methods
4. Generate a **Service Account Key** (Project Settings → Service Accounts → Generate new private key)
5. Note your web app config (Project Settings → General → Your apps)

### 2. MongoDB Setup

Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com/) and get your connection string.

### 3. Backend Configuration

```bash
cd server
cp .env.example .env
# Fill in MONGO_URI, Firebase service account values, CLIENT_URL
npm install
npm run dev
```

### 4. Frontend Configuration

```bash
cd client
cp .env.example .env
# Fill in VITE_FIREBASE_* values from your Firebase web app config
npm install
npm run dev
```

### 5. First Admin User

After signing in, manually set `isAdmin: true` on your user document in MongoDB:

```js
db.users.updateOne({ email: "your@email.com" }, { $set: { isAdmin: true } })
```

---

## 🚢 Deployment on Render

### Backend (Web Service)
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Environment Variables:** All from `server/.env`

### Frontend (Static Site)
- **Root Directory:** `client`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** All `VITE_*` from `client/.env`
- Update `VITE_API_URL` to your Render backend URL

---

## 🔒 Security

- Firebase ID token verification on every API request
- Rate limiting (100 req/15min general, 20 req/15min auth)
- Helmet.js security headers
- Input validation with express-validator
- CORS restricted to frontend origin
- Body size limit (10kb)
- Admin-only routes protected server-side
