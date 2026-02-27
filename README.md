# TaskFlow - Smart Task Management

A modern, intuitive task management application inspired by Todoist. Built with Next.js 16, TypeScript, Prisma, and Tailwind CSS.

![TaskFlow](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)

## ✨ Features

- 🔐 **User Authentication** - Secure login/register with NextAuth.js
- ✅ **Task Management** - Create, edit, delete, and complete tasks
- 📁 **Projects** - Organize tasks into custom projects
- 🏷️ **Labels** - Tag tasks with colorful labels
- 🎯 **Priority Levels** - 5 priority levels (None, Low, Medium, High, Urgent)
- 📅 **Due Dates** - Set and track due dates with calendar picker
- 📋 **Subtasks** - Break down tasks into smaller steps
- 🔍 **Filtering** - View tasks by Today, Upcoming, Completed
- 🌙 **Dark Theme** - Beautiful dark mode UI
- ⌨️ **Keyboard Shortcuts** - Press 'Q' to quickly add tasks
- 📊 **Statistics** - Track your productivity with stats

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL (for production) or SQLite (for development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/taskflow.git
   cd taskflow
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-super-secret-key-at-least-32-characters-long"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the database**
   ```bash
   bun run db:push
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Deployment Guide

### Step 1: Push to GitHub

1. **Create a new repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name it `taskflow` (or your preferred name)
   - Don't initialize with README (we already have one)

2. **Push your code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TaskFlow task management app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
   git push -u origin main
   ```

### Step 2: Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Go to **Storage** → **Create Database** → **Postgres**
3. Choose a name (e.g., `taskflow-db`)
4. Select a region close to you
5. Click **Create**

**Option B: Neon (Free Tier)**

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string

**Option C: Supabase (Free Tier)**

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Settings** → **Database** → **Connection string**
4. Copy the URI

### Step 3: Deploy to Vercel

1. **Import your GitHub repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your `taskflow` repository
   - Click **Import**

2. **Configure the project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `bun run build` (or `npm run build`)
   - Output Directory: `.next`

3. **Add Environment Variables**
   
   Click **Environment Variables** and add:
   
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string |
   | `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Your Vercel URL (e.g., `https://taskflow.vercel.app`) |
   
   If using Vercel Postgres, these are auto-added:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

4. **Update Prisma for PostgreSQL**
   
   Before deploying, update `prisma/schema.prisma`:
   
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("POSTGRES_URL_NON_POOLING")
   }
   ```

5. **Deploy**
   - Click **Deploy**
   - Wait for the build to complete
   - Your app is now live! 🎉

### Step 4: Initialize Production Database

After deployment, run the database migration:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Run migration via Vercel CLI:
   ```bash
   npx vercel env pull .env.production
   npx prisma migrate deploy
   ```
   
   Or use Vercel's built-in terminal in the dashboard.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for JWT encryption (32+ chars) | ✅ |
| `NEXTAUTH_URL` | Your production URL | ✅ |
| `POSTGRES_URL_NON_POOLING` | Direct Postgres URL (Vercel) | For Vercel Postgres |

### Generate NEXTAUTH_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Prisma](https://www.prisma.io/) + PostgreSQL/SQLite
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Lucide Icons](https://lucide.dev/)

## 📝 License

MIT License - feel free to use this for your own projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ using Next.js & Prisma
