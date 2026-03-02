# TaskFlow - Todoist-like Task Management App

A modern, full-featured task management application inspired by Todoist. Built with Next.js 16, TypeScript, Prisma, and deployed on Vercel.

![TaskFlow Preview](https://via.placeholder.com/800x400?text=TaskFlow+Preview)

## ✨ Features

- 🔐 **User Authentication** - Secure login/register with credentials
- 📋 **Task Management** - Create, edit, delete, and complete tasks
- 📁 **Projects** - Organize tasks into custom projects
- 🏷️ **Labels** - Tag tasks with custom labels
- 🎯 **Priority Levels** - 5 priority levels (None, Low, Medium, High, Urgent)
- 📅 **Due Dates** - Set and track due dates with quick date selection
- 🔔 **Push Notifications** - Get reminders before task deadlines (desktop & mobile)
- 📎 **Image Attachments** - Attach images to tasks for better context
- ✅ **Subtasks** - Break down tasks into smaller subtasks
- 🔍 **Filtering** - View tasks by Today, Upcoming, Completed, or by project
- 🌙 **Dark Theme** - Modern dark UI design
- ⌨️ **Keyboard Shortcuts** - Press 'Q' to quickly add tasks
- 📊 **Statistics** - View task completion stats
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔔 **Service Worker** - Background notifications and offline support

### Notification Features
- Set reminders 1, 2, 3, or 7 days before task due date
- Native browser notifications on desktop and mobile
- Automatic reminder checking every 5 minutes
- Click notifications to open the app directly

### Attachment Features
- Upload up to 5MB per image (JPEG, PNG, GIF, WebP)
- Multiple images per task
- Image preview grid in task details
- Click to view full-size images in new tab
- Automatic file organization by user ID in `/public/uploads/`

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL (Neon/Vercel Postgres)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v4
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (Neon, Supabase, or Vercel Postgres)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/taskflow.git
   cd taskflow
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
   POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/db?sslmode=require"
   NEXTAUTH_SECRET="your-super-secret-key"
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

## 📦 Deployment to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - TaskFlow app"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git

# Push to GitHub
git push -u origin main
```

### Step 2: Set Up PostgreSQL Database

**Option A: Neon (Recommended - Free)**
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string (both pooled and direct)

**Option B: Vercel Postgres**
1. In Vercel dashboard, go to your project
2. Click "Storage" → "Create Database" → "Postgres"
3. Copy the environment variables

**Option C: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection string from Settings → Database

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your PostgreSQL pooled connection string |
   | `POSTGRES_URL_NON_POOLING` | Your PostgreSQL direct connection string |
   | `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Your Vercel URL (e.g., `https://taskflow.vercel.app`) |

6. Click "Deploy"

### Step 4: Run Database Migrations

After deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
bun run db:deploy
```

Or manually in Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `DATABASE_URL` and `POSTGRES_URL_NON_POOLING`
3. Redeploy the project

## 🗄️ Database Schema

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  tasks     Task[]
  projects  Project[]
  labels    Label[]
}

model Task {
  id           String          @id @default(cuid())
  title        String
  description  String?
  completed    Boolean         @default(false)
  priority     Int             @default(0)
  dueDate      DateTime?
  reminderDays Int?            // Days before due date to send reminder
  project      Project?        @relation(...)
  labels       TaskLabel[]
  subtasks     Subtask[]
  attachments  TaskAttachment[]
  reminders    TaskReminder[]
}

model TaskAttachment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  fileName  String
  fileUrl   String
  fileType  String   // image/jpeg, image/png, etc.
  fileSize  Int      // Size in bytes
  createdAt DateTime @default(now())
}

model TaskReminder {
  id           String   @id @default(cuid())
  taskId       String
  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  reminderDate DateTime // When to send the reminder
  isSent       Boolean  @default(false)
  sentAt       DateTime?
  createdAt    DateTime @default(now())
}

model Project {
  id    String  @id @default(cuid())
  name  String
  color String  @default("#f59e0b")
  tasks Task[]
}

model Label {
  id    String  @id @default(cuid())
  name  String
  color String  @default("#f59e0b")
}
```

## 📎 File Upload Configuration

Uploaded images are stored in `/public/uploads/{userId}/` directory. Make sure your deployment environment has:

1. **Write permissions** for the `public/uploads` directory
2. **Sufficient disk space** for user uploads
3. **Backup strategy** for uploaded files (consider using cloud storage like AWS S3 for production)

### Optional: Cloud Storage Setup

For production deployments, consider using cloud storage instead of local disk:

1. **AWS S3**: Configure `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
2. **Cloudflare R2**: Configure `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`
3. **Vercel Blob**: Use `@vercel/blob` for serverless-compatible storage

## 🔔 Notification Setup

Push notifications work out of the box using the browser's Notification API. No additional configuration is required for basic functionality.

### For Advanced Push Notifications (Optional)

To enable server-sent push notifications (useful for mobile PWA):

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add environment variables:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key
   VAPID_SUBJECT=mailto:admin@yourdomain.com
   ```

3. Update the service worker with push event handlers (already included in `public/service-worker.js`)

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Q` or `N` | Quick add task |
| `Esc` | Close dialog |

## 📝 Scripts

```bash
bun run dev        # Start development server
bun run build      # Build for production
bun run start      # Start production server
bun run lint       # Run ESLint
bun run db:push    # Push schema to database
bun run db:migrate # Create and apply migrations
bun run db:deploy  # Deploy migrations to production
bun run db:studio  # Open Prisma Studio
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ using Next.js and Prisma
