# DishGenie

An AI-powered recipe discovery platform that helps users find recipes based on ingredients they have, nutritional goals, and personal preferences.

## Features

- **Ingredient-Based Search** — Find recipes by the ingredients you have at home
- **AI Recipe Assistant** — Chat with an AI chef powered by Google Gemini for personalized suggestions
- **Nutrition Tracking** — Filter by high-protein, low-calorie, low-carb, and high-fiber goals
- **Meal Planner** — Weekly meal planning with drag-and-drop recipe slots
- **Favorites** — Save and manage your favorite recipes
- **User Preferences** — Diet type, cuisine preferences, cooking time, difficulty level
- **Admin Dashboard** — Full CRUD for recipe management with role-based access
- **Dark/Light Theme** — System-aware theming with manual toggle
- **Responsive Design** — Works on desktop, tablet, and mobile

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose ODM) |
| Authentication | Firebase Authentication |
| AI | Google Gemini API |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Folder Structure

```
DishGenieDB/
├── dishgenie/                  # Frontend (React/Vite)
│   ├── src/
│   │   ├── api/                # API client & service functions
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── firebase/           # Firebase auth configuration
│   │   ├── pages/              # Page components
│   │   │   └── admin/          # Admin pages
│   │   ├── routes/             # Route definitions
│   │   ├── constants.js        # Shared constants
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Entry point
│   ├── .env.example            # Frontend env template
│   ├── vercel.json             # Vercel SPA routing config
│   └── package.json
├── dishgenie-server/           # Backend (Express API)
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/          # Auth, error handling, validation
│   │   ├── model/              # Mongoose schemas
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   ├── constants/          # Enum definitions
│   │   ├── data/               # Nutrition lookup data
│   │   ├── utils/              # Helpers
│   │   ├── db/                 # Database connection
│   │   └── app.js              # Entry point
│   ├── scripts/                # Maintenance & seeding scripts
│   ├── .env.example            # Backend env template
│   └── package.json
└── README.md
```

## Local Development Setup

### Prerequisites

- Node.js >= 18
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Firebase project with Authentication enabled

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/DishGenieDB.git
cd DishGenieDB
```

### 2. Backend setup

```bash
cd dishgenie-server
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below).

```bash
npm install
npm run dev
```

The API runs at `http://localhost:4000`.

### 3. Frontend setup

```bash
cd ../dishgenie
cp .env.example .env
```

Edit `.env` with your Firebase config and `VITE_API_URL=http://localhost:4000`.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### 4. Seed the database (optional)

```bash
cd dishgenie-server
npm run seed
```

Requires `SEED_KEY` to be set in your `.env`.

## Environment Variables

### Backend (`dishgenie-server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `PORT` | No | Server port (default: `4000`, Render sets this automatically) |
| `MONGO_URL` | Yes | MongoDB Atlas connection string |
| `ALLOW_ORIGINS` | Yes | Comma-separated allowed CORS origins |
| `SEED_KEY` | For seeding | Guard key to prevent accidental database re-seeding |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID for ID token verification |
| `AI_API_KEY` | No | Google Gemini API key (assistant works offline without it) |
| `AI_MODEL` | No | Gemini model name (default: `gemini-3.6-flash`) |
| `AI_BASE_URL` | No | Gemini API base URL |

### Frontend (`dishgenie/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_ID` | Yes | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_API_URL` | Yes | Backend API base URL |

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** with Email/Password sign-in method
3. Copy the web app config from **Project Settings > General > Your apps** into the frontend `.env`
4. Copy the **Project ID** into the backend `.env` as `FIREBASE_PROJECT_ID`

**Backend token verification:** The Express server verifies Firebase ID tokens using only the project ID. No service account file is needed. Public signing keys are fetched automatically from Google.

## API Documentation

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (returns `{ status: "ok" }`) |
| `GET` | `/api/recipes` | List recipes with filters |
| `GET` | `/api/recipes/random` | Get random recipes |
| `GET` | `/api/recipes/:id` | Get a single recipe |

### Protected Routes (require `Authorization: Bearer <ID_TOKEN>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/preferences` | Get user preferences |
| `PUT` | `/api/preferences` | Update user preferences |
| `POST` | `/api/users/activity` | Track user activity |
| `GET` | `/api/users/favorites` | Get user favorites |
| `POST` | `/api/users/favorites/:recipeId` | Add recipe to favorites |
| `DELETE` | `/api/users/favorites/:recipeId` | Remove recipe from favorites |
| `GET` | `/api/meal-plans` | Get weekly meal plan |
| `PUT` | `/api/meal-plans/:week` | Set a meal plan slot |
| `DELETE` | `/api/meal-plans/:week/:day/:mealType` | Clear a meal plan slot |
| `GET` | `/api/recommendations` | Get personalized recommendations |
| `POST` | `/api/ai/chat` | Send message to AI assistant |

### Admin Routes (require auth + admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/me` | Verify admin status |
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/recipes` | List recipes (with search/filter) |
| `GET` | `/api/admin/recipes/:id` | Get recipe for editing |
| `POST` | `/api/admin/recipes` | Create a recipe |
| `PUT` | `/api/admin/recipes/:id` | Update a recipe |
| `DELETE` | `/api/admin/recipes/:id` | Delete a recipe |

## Authentication Architecture

```
Browser → Firebase Auth → ID Token → Frontend (localStorage)
                                          |
                                    Authorization: Bearer <ID_TOKEN>
                                          |
                                    Express Middleware (requireAuth)
                                          |
                                    Firebase Admin SDK (verifyIdToken)
                                          |
                                    MongoDB (getOrCreateUser)
```

- **Frontend:** Firebase SDK manages the session via browser `localStorage` (persists across tabs/restarts)
- **Backend:** Verifies the Firebase ID token on every protected request using the project's public signing keys
- **Admin:** After token verification, the server checks the user's role in MongoDB (never trusts client headers)
- **Token refresh:** The frontend automatically refreshes tokens; on 401, it retries once with a fresh token

**Important:** Restarting the backend server does NOT log users out. Firebase sessions are managed by the Firebase client SDK in the browser, independent of the server.

## Production Deployment

### Vercel (Frontend)

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the GitHub repo
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `dishgenie`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables in the Vercel dashboard:
   - All `VITE_*` variables from your frontend `.env`
   - Set `VITE_API_URL` to your Render backend URL (e.g., `https://your-app.onrender.com`)
5. Deploy

### Render (Backend)

1. Go to [render.com](https://render.com) and create a new **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `dishgenie-server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 18 or later
4. Add environment variables in the Render dashboard:
   - `NODE_ENV` = `production`
   - `MONGO_URL` = your MongoDB Atlas connection string
   - `ALLOW_ORIGINS` = your Vercel domain (e.g., `https://your-app.vercel.app`)
   - `FIREBASE_PROJECT_ID` = your Firebase project ID
   - `AI_API_KEY` = your Gemini API key (optional)
5. Deploy

**Note:** Render provides the `PORT` environment variable automatically. The server uses `process.env.PORT`.

### Post-Deployment

1. Update `ALLOW_ORIGINS` on Render with your actual Vercel domain
2. Update `VITE_API_URL` on Vercel with your actual Render backend URL
3. Set the admin role in MongoDB for your user:
   ```bash
   cd dishgenie-server
   npm run admin:role
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error in browser | Ensure `ALLOW_ORIGINS` on Render matches your Vercel domain exactly (including `https://`) |
| 401 Unauthorized | The Firebase ID token may have expired; the frontend should auto-refresh. Check `FIREBASE_PROJECT_ID` matches your Firebase project |
| 503 Authentication not configured | `FIREBASE_PROJECT_ID` is missing from the backend `.env` |
| MongoDB connection failed | Verify `MONGO_URL` is correct and the MongoDB Atlas IP allowlist includes Render's IPs (or set it to `0.0.0.0/0`) |
| AI assistant not responding | Check `AI_API_KEY` is set. Without it, the assistant falls back to database-only mode |
| Build fails on Vercel | Ensure `VITE_*` environment variables are set in the Vercel dashboard |
| Page refresh returns 404 | The `vercel.json` rewrites handle SPA routing; ensure it's deployed with the frontend |

## License

ISC
