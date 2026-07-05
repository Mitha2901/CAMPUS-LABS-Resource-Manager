# 🧪 Campus Labs Resource Hub

A web application for managing and booking campus lab resources — built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS** on the frontend, with a lightweight **Node.js/TypeScript server** and **SQLite** database on the backend.

---

## ✨ Features

- Browse available labs and lab resources/systems
- Book resources by date and time
- View booking history and status
- Admin management of labs, resources, and usage
- Fast local development powered by Vite (HMR-enabled)

> ℹ️ Update this section with the exact feature list for your app once finalized.

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|----------------------------------------|
| Frontend   | React, TypeScript, Vite, Tailwind CSS  |
| Backend    | Node.js, TypeScript (`server.ts`)      |
| Database   | SQLite (`database.db`)                  |
| Build Tool | Vite                                    |
| Styling    | Tailwind CSS                            |

---

## 📁 Project Structure

```
campus-labs-resource-hub/
├── assets/.aistudio/        # AI Studio project assets
├── java-src/                # (if applicable) Java source files
├── node_modules/            # Installed dependencies
├── src/
│   ├── App.tsx              # Root React component
│   ├── index.css            # Global styles
│   └── main.tsx              # React entry point
├── .env.example              # Environment variable template
├── .gitignore
├── database.db               # SQLite database file
├── database.json             # Database config/schema reference
├── index.html                 # Vite HTML entry point
├── metadata.json
├── package.json
├── package-lock.json
├── server.ts                  # Backend server (Node/TypeScript)
├── tsconfig.json
└── vite.config.ts             # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and **npm** installed

Verify:
```bash
node -v
npm -v
```

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/campus-labs-resource-hub.git
cd campus-labs-resource-hub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env
```

### 4. Run the development server
```bash
npm run dev
```
The app will start at:
```
http://localhost:3000
```

### 5. Build for production
```bash
npm run build
```

### 6. Preview the production build
```bash
npm run preview
```

---

## 🗄️ Database

This project uses a local **SQLite** database (`database.db`). Schema/config details are defined in `database.json`.

> ℹ️ Add setup or migration instructions here if the database needs to be initialized manually before first run.

---

## 📄 Environment Variables

See `.env.example` for all required environment variables. Common ones may include:

```env
DATABASE_URL=./database.db
PORT=3000
```

> ℹ️ Update this with the actual variables your `.env.example` defines.

---

## 📄 License

This project is open-source and available for educational use.  

---

Live demo Link:https://campus-labs-resource-hub-289921004854.asia-southeast1.run.app
