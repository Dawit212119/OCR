# Quick Start Guide

Get the Receipt OCR API up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- OR Node.js 18+ and PostgreSQL 15+

## Option 1: Docker (Fastest)

```bash
# Clone and navigate to the project
cd OCR

# Start all services
docker-compose up -d

# Wait for services to start (30-60 seconds)
# Check logs if needed:
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# GraphQL API: http://localhost:4000/graphql
```

## Option 2: Local Setup

### Step 1: Database

```bash
# Install PostgreSQL, then:
createdb receipt_ocr
```

### Step 2: Backend

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/receipt_ocr?schema=public"
PORT=4000
NODE_ENV=development
UPLOAD_DIR=./uploads
EOF

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start server
npm run dev
```

### Step 3: Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

## First Steps

1. Open http://localhost:3000 in your browser
2. Upload a receipt image (JPEG, PNG, or WebP)
3. Wait for OCR processing (10-30 seconds)
4. View extracted data!

## Testing Without Real Receipts

Enable mock OCR mode for testing:

1. In `backend/src/services/ocrService.ts`, add:
```typescript
import { getRandomMockReceipt } from './mockOCRData';

export async function processReceiptImage(imagePath: string): Promise<string> {
  if (process.env.USE_MOCK_OCR === 'true') {
    return getRandomMockReceipt();
  }
  // ... rest of code
}
```

2. Set `USE_MOCK_OCR=true` in `backend/.env`
3. Upload any image - it will use mock data

## Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml or .env files
```

**Database connection failed:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**OCR not working:**
- Check image quality (high resolution works best)
- Ensure Tesseract is installed (Docker has it pre-installed)
- Check server logs for errors

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [SAMPLE_RECEIPTS.md](SAMPLE_RECEIPTS.md) for test data
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute


