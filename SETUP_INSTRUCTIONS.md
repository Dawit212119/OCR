# Quick Setup Instructions

## Current Status
✅ Frontend is running on http://localhost:3000
❌ Backend needs configuration

## Backend Setup Required

### Step 1: Create Backend .env File

Create `backend/.env` with the following content:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/receipt_ocr?schema=public"
PORT=4000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

**Note:** Update the DATABASE_URL with your PostgreSQL credentials if different.

### Step 2: Ensure PostgreSQL is Running

Make sure PostgreSQL is installed and running on your system.

**Windows:**
- Check if PostgreSQL service is running: Services → PostgreSQL
- Or install PostgreSQL from https://www.postgresql.org/download/windows/

**Create Database:**
```sql
CREATE DATABASE receipt_ocr;
```

Or using command line:
```bash
createdb receipt_ocr
```

### Step 3: Run Prisma Migrations

```bash
cd backend
npm run prisma:migrate
```

This will create the database tables.

### Step 4: Restart the Dev Server

The dev server should automatically detect the .env file and start the backend.

Or manually start backend:
```bash
cd backend
npm run dev
```

## Alternative: Use Docker (Easier)

If you have Docker installed, this is simpler:

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL automatically
- Create the database
- Run migrations
- Start both frontend and backend

Then access:
- Frontend: http://localhost:3000
- GraphQL API: http://localhost:4000/graphql


