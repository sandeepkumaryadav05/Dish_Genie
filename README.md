# 🍳 DishGenie

> **An AI-powered recipe discovery and meal planning platform built with the MERN stack.**

DishGenie helps users discover recipes based on the ingredients they have, nutritional goals, dietary preferences, and cooking preferences.

It combines **React, Node.js, Express, MongoDB, Firebase Authentication, and Google Gemini AI** to provide a personalized recipe discovery experience.

**GitHub Repository:** [sandeepkumaryadav05/Dish_Genie](https://github.com/sandeepkumaryadav05/Dish_Genie)

**Live Link:** https://dish-genie-seven.vercel.app
---

## 📸 Application Preview

### 🔎 Discover Recipes

Users can search for recipes using ingredients and quickly filter recipes based on nutritional and dietary preferences such as **High Protein, Low Calorie, Vegetarian, Quick Meals, and Healthy**.

<p align="center">
  <img width="1889" height="865" alt="image" src="https://github.com/user-attachments/assets/65eaba09-56d7-4851-89b8-2f8078287032" />
  
</p>

---

### ❤️ Favorite Recipes

Users can save recipes to their personal favorites and easily access them later.

<p align="center">
  <img width="1838" height="778" alt="image" src="https://github.com/user-attachments/assets/181bc36f-625f-461a-8452-1c3b98bcce80" />

</p>

---

### 🛠️ Admin Dashboard

Administrators can manage the recipe database through a dedicated dashboard with recipe statistics and management controls.

<p align="center">
 <img width="1786" height="750" alt="image" src="https://github.com/user-attachments/assets/23fbaf1f-caeb-455d-a466-d9608b51839f" />

</p>

---

### 🤖 AI Recipe Assistant

The AI Recipe Assistant provides personalized recipe suggestions, cooking ideas, ingredient recommendations, and meal suggestions based on the user's preferences and available recipes.

<p align="center">
  <img width="1274" height="701" alt="image" src="https://github.com/user-attachments/assets/b116df61-398c-4069-9924-d2ae6956d4e9" />

</p>

---

# ✨ Features

## 🔎 Ingredient-Based Recipe Search

Find recipes based on ingredients available at home.

* Ingredient-based search
* Recipe filtering
* Random recipe discovery
* Detailed recipe information
* Cooking time and difficulty information

## 🤖 AI Recipe Assistant

DishGenie includes an AI-powered cooking assistant using **Google Gemini**.

Users can ask questions such as:

> "I have paneer, tomato and onion. What can I cook?"

or:

> "Suggest a high-protein dinner."

The assistant can provide recipe suggestions based on the application's recipe data and user preferences.

## 🥗 Nutrition Tracking

Recipes can be filtered according to nutritional goals:

* High Protein
* Low Calorie
* Low Carb
* High Fiber
* Healthy recipes
* Vegetarian options

Recipe cards display nutritional information such as calories and protein.

## 📅 Meal Planner

Plan meals throughout the week.

* Weekly meal planning
* Organize meals by day
* Different meal types
* Add recipes to meal-plan slots
* Remove planned recipes

## ❤️ Favorites

Users can:

* Save recipes
* View saved recipes
* Remove recipes from favorites
* Quickly access frequently used recipes

## 👤 User Preferences

Users can personalize their experience with:

* Diet type
* Cuisine preferences
* Cooking time
* Difficulty level
* Nutritional goals

These preferences can be used to provide more relevant recipe recommendations.

## 🛠️ Admin Dashboard

The application includes role-based admin functionality.

Administrators can:

* View recipe statistics
* Create recipes
* Edit recipes
* Delete recipes
* Search recipes
* Filter recipes
* Manage the recipe database

## 🎨 Modern User Interface

* Dark theme
* Light theme
* System-aware theme
* Responsive design
* Desktop support
* Tablet support
* Mobile support

---

# 🏗️ Application Architecture

```text
                         ┌──────────────────┐
                         │      User        │
                         │    Browser       │
                         └────────┬─────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │    React Frontend      │
                     │      + Vite             │
                     │                         │
                     │ • Pages                 │
                     │ • Components            │
                     │ • Context               │
                     │ • API Services          │
                     │ • Firebase Auth         │
                     └───────────┬────────────┘
                                 │
                         REST API + ID Token
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │    Express Backend     │
                     │       Node.js          │
                     │                        │
                     │ • Routes               │
                     │ • Controllers          │
                     │ • Middleware           │
                     │ • Services             │
                     │ • Validation            │
                     └───────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐       ┌─────────────────┐
          │     MongoDB      │       │   Google Gemini │
          │                  │       │       AI        │
          │ • Users          │       │                 │
          │ • Recipes        │       │ • Suggestions   │
          │ • Favorites      │       │ • Meal Ideas    │
          │ • Meal Plans     │       │ • Food Chat     │
          │ • Preferences    │       └─────────────────┘
          └──────────────────┘
```

---

# 🔐 Authentication Architecture

DishGenie uses **Firebase Authentication** for user authentication.

```text
User
 │
 ▼
Firebase Authentication
 │
 ▼
Firebase ID Token
 │
 ▼
React Frontend
 │
 │ Authorization: Bearer <ID_TOKEN>
 ▼
Express Authentication Middleware
 │
 ▼
Firebase Token Verification
 │
 ▼
MongoDB User
 │
 ▼
Authorized API Request
```

### Authentication Features

* Firebase Email/Password authentication
* Protected API routes
* Firebase ID token verification
* Automatic token refresh
* MongoDB user synchronization
* Role-based admin authorization
* Backend-side authorization

The backend verifies the Firebase ID token before processing protected requests.

---

# 🛠️ Technology Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Frontend        | React 18                |
| Build Tool      | Vite                    |
| Routing         | React Router v6         |
| Backend         | Node.js                 |
| API Framework   | Express 5               |
| Database        | MongoDB                 |
| ODM             | Mongoose                |
| Authentication  | Firebase Authentication |
| AI              | Google Gemini API       |
| API             | REST API                |
| Version Control | Git & GitHub            |

---

# 📁 Project Structure

```text
Dish_Genie/
│
├── screenshots/
│   ├── discover.png
│   ├── favorites.png
│   ├── admin-dashboard.png
│   └── ai-recipe-assistant.png
│
├── dishgenie/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── firebase/
│   │   ├── pages/
│   │   │   └── admin/
│   │   ├── routes/
│   │   ├── constants.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.example
│   └── package.json
│
├── dishgenie-server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── constants/
│   │   ├── data/
│   │   ├── utils/
│   │   ├── db/
│   │   └── app.js
│   │
│   ├── scripts/
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js 18+
* npm or Yarn
* MongoDB Atlas or local MongoDB
* Firebase project
* Firebase Authentication enabled
* Google Gemini API key for AI functionality

## 1. Clone Repository

```bash
git clone https://github.com/sandeepkumaryadav05/Dish_Genie.git
cd Dish_Genie
```

## 2. Backend Setup

```bash
cd dishgenie-server
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure the required variables and start the server:

```bash
npm run dev
```

## 3. Frontend Setup

Open another terminal:

```bash
cd dishgenie
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Start the frontend:

```bash
npm run dev
```

---

# 🔑 Environment Variables

## Backend

Create:

```text
dishgenie-server/.env
```

Example:

```env
NODE_ENV=development
PORT=4000

MONGO_URL=your_mongodb_connection_string

ALLOW_ORIGINS=http://localhost:5173

FIREBASE_PROJECT_ID=your_firebase_project_id

AI_API_KEY=your_gemini_api_key
AI_MODEL=your_gemini_model
AI_BASE_URL=your_gemini_api_base_url

SEED_KEY=your_seed_key
```

## Frontend

Create:

```text
dishgenie/.env
```

Example:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

VITE_API_URL=http://localhost:4000
```

> ⚠️ Never commit `.env` files or private credentials to GitHub.

---

# 🔥 Firebase Setup

1. Create a Firebase project.
2. Enable **Authentication**.
3. Enable **Email/Password** authentication.
4. Create a web application inside Firebase.
5. Copy the Firebase web configuration.
6. Add the configuration to the frontend `.env`.
7. Add the Firebase project ID to the backend `.env`.

The backend verifies Firebase ID tokens before allowing access to protected API endpoints.

---

# 🗄️ Database

DishGenie uses **MongoDB with Mongoose**.

The database manages:

* Users
* Recipes
* Favorites
* User preferences
* Meal plans
* User activity
* Roles and permissions

---

# 🤖 AI Recipe Assistant

The AI assistant is powered by **Google Gemini**.

Example questions:

```text
I have paneer, tomato and onion. What can I cook?
```

```text
Suggest a high-protein dinner under 500 calories.
```

```text
What can I substitute for an ingredient?
```

```text
Give me a quick vegetarian dinner.
```

The assistant is designed to work with DishGenie's recipe data and user preferences when generating recipe-related recommendations.

---

# 📡 API Overview

## Public Routes

| Method | Endpoint              | Description    |
| ------ | --------------------- | -------------- |
| GET    | `/health`             | Health check   |
| GET    | `/api/recipes`        | List recipes   |
| GET    | `/api/recipes/random` | Random recipes |
| GET    | `/api/recipes/:id`    | Get recipe     |

## Protected Routes

| Method | Endpoint                               | Description                  |
| ------ | -------------------------------------- | ---------------------------- |
| GET    | `/api/preferences`                     | Get preferences              |
| PUT    | `/api/preferences`                     | Update preferences           |
| POST   | `/api/users/activity`                  | Track activity               |
| GET    | `/api/users/favorites`                 | Get favorites                |
| POST   | `/api/users/favorites/:recipeId`       | Add favorite                 |
| DELETE | `/api/users/favorites/:recipeId`       | Remove favorite              |
| GET    | `/api/meal-plans`                      | Get weekly meal plan         |
| PUT    | `/api/meal-plans/:week`                | Update meal plan             |
| DELETE | `/api/meal-plans/:week/:day/:mealType` | Clear meal slot              |
| GET    | `/api/recommendations`                 | Personalized recommendations |
| POST   | `/api/ai/chat`                         | AI assistant                 |

## Admin Routes

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/admin/me`          | Verify admin         |
| GET    | `/api/admin/stats`       | Dashboard statistics |
| GET    | `/api/admin/recipes`     | Manage recipes       |
| GET    | `/api/admin/recipes/:id` | Get recipe           |
| POST   | `/api/admin/recipes`     | Create recipe        |
| PUT    | `/api/admin/recipes/:id` | Update recipe        |
| DELETE | `/api/admin/recipes/:id` | Delete recipe        |

---

# 👨‍💼 Admin & Role-Based Access

DishGenie uses backend-side role verification.

```text
Firebase ID Token
       │
       ▼
Verify Authentication
       │
       ▼
Find User in MongoDB
       │
       ▼
Check Role
    ┌──┴──┐
    │     │
   USER  ADMIN
    │     │
    ▼     ▼
 User    Admin
Features Dashboard
           │
           ▼
      Recipe CRUD
```

The frontend does not control admin authorization. The backend verifies the user's role before allowing administrative operations.

---

# 🌱 Database Seeding

If seed functionality is available, configure `SEED_KEY` and run:

```bash
cd dishgenie-server
npm run seed
```

Use database seeding carefully when working with existing production-like data.

---

# 🔒 Security

DishGenie uses:

* Firebase ID token verification
* Protected API routes
* Backend authorization
* Role-based access control
* Environment variables
* CORS restrictions
* Request validation
* Centralized error handling
* MongoDB user identification

Never commit:

```text
.env
.env.local
API keys
MongoDB credentials
Firebase private credentials
Gemini API keys
```

---

# 🧪 Development Commands

### Backend

```bash
cd dishgenie-server
npm install
npm run dev
```

### Frontend

```bash
cd dishgenie
npm install
npm run dev
```

### Production Build

```bash
npm run build
```

---

# 🐛 Troubleshooting

### MongoDB connection error

Check:

* `MONGO_URL`
* MongoDB credentials
* MongoDB Atlas network configuration
* Database availability

### Authentication error

Check:

* Firebase project ID
* Firebase Authentication configuration
* Frontend Firebase environment variables
* Backend Firebase configuration

### CORS error

Verify that the frontend origin is included in:

```env
ALLOW_ORIGINS=http://localhost:5173
```

### AI assistant not responding

Verify:

```env
AI_API_KEY=your_gemini_api_key
```

Also verify that the configured Gemini model and API endpoint are valid.

### Frontend cannot communicate with backend

Verify:

```env
VITE_API_URL=http://localhost:4000
```

and confirm that the backend server is running.

---

# 🔮 Future Improvements

* Grocery list generation
* Advanced nutrition analytics
* Recipe ratings and reviews
* More personalized recommendations
* AI-powered cooking instructions
* Recipe image generation
* Improved recipe search
* Social recipe sharing
* Progressive Web App support
* Automated testing
* CI/CD integration

---

# 📂 GitHub Repository

**Repository:**
[github.com/sandeepkumaryadav05/Dish_Genie](https://github.com/sandeepkumaryadav05/Dish_Genie)

---

# 👨‍💻 Author

## Sandeep Kumar Yadav

**B.Tech — Computer Science & Engineering**

Full Stack Developer interested in:

* MERN Stack
* Java
* JavaScript
* REST APIs
* MongoDB
* React
* Node.js
* Software Engineering

---

# 📄 License

This project is licensed under the **ISC License**.
