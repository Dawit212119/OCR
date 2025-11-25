# Receipt OCR & Data Extraction API

A full-stack application that processes uploaded supermarket or restaurant receipt images, extracts structured data using OCR, and exposes it via a GraphQL API.

## 🚀 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Apollo GraphQL Server** - GraphQL API framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **Tesseract.js** - OCR library for text extraction
- **Express** - Web server framework
- **TypeScript** - Type-safe development

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **GraphQL** - Data fetching

## 📋 Features

- ✅ Upload receipt images (JPEG, PNG, WebP)
- ✅ OCR text extraction using Tesseract.js
- ✅ Automatic data extraction:
  - Store name
  - Purchase date
  - Total amount
  - Individual items with quantities and prices
- ✅ GraphQL API with queries and mutations
- ✅ Receipt filtering by store name and date range
- ✅ Image validation (type and size)
- ✅ Error handling and user feedback
- ✅ Docker support for easy setup

## 🏗️ Project Structure

```
receipt-ocr-api/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Apollo Server setup
│   │   ├── typeDefs.ts           # GraphQL schema
│   │   ├── resolvers.ts          # GraphQL resolvers
│   │   └── services/
│   │       ├── ocrService.ts     # OCR processing
│   │       └── dataExtractor.ts  # Data extraction logic
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── uploads/                  # Uploaded receipt images
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main upload page
│   │   ├── layout.tsx
│   │   └── lib/
│   │       └── graphql.ts        # GraphQL client
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (or use Docker)
- Docker and Docker Compose (optional, for containerized setup)

### Option 1: Docker Setup (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd OCR
```

2. Start all services with Docker Compose:
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Start backend server on port 4000
- Start frontend server on port 3000
- Run database migrations automatically

3. Access the application:
- Frontend: http://localhost:3000
- GraphQL Playground: http://localhost:4000/graphql

### Option 2: Local Development Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/receipt_ocr?schema=public"
PORT=4000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

4. Set up PostgreSQL database:
```bash
# Create database
createdb receipt_ocr

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

5. Start the backend server:
```bash
npm run dev
```

The server will run on http://localhost:4000

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## 📖 Usage

### Upload a Receipt

1. Open the application in your browser (http://localhost:3000)
2. Click "Select Receipt Image" and choose an image file
3. Click "Process Receipt"
4. Wait for OCR processing (may take 10-30 seconds depending on image size)
5. View the extracted data:
   - Store name
   - Purchase date
   - Total amount
   - List of items with quantities and prices

### Search Receipts

1. Click "Show Filters" in the Search Receipts section
2. Enter optional filters:
   - Store name (partial match)
   - Start date
   - End date
3. Click "Search Receipts" to view matching results

### GraphQL API

#### Upload Receipt Mutation

```graphql
mutation UploadReceipt($file: Upload!) {
  uploadReceipt(file: $file) {
    id
    storeName
    purchaseDate
    totalAmount
    imageUrl
    items {
      id
      name
      quantity
      price
    }
  }
}
```

#### Query Receipts

```graphql
query GetReceipts($filter: ReceiptFilterInput) {
  receipts(filter: $filter) {
    id
    storeName
    purchaseDate
    totalAmount
    items {
      id
      name
      quantity
      price
    }
  }
}
```

#### Query Single Receipt

```graphql
query GetReceipt($id: ID!) {
  receipt(id: $id) {
    id
    storeName
    purchaseDate
    totalAmount
    items {
      id
      name
      quantity
      price
    }
  }
}
```

## 🧪 Testing with Sample Data

The OCR extraction works best with clear, well-lit receipt images. For testing purposes:

1. Use high-resolution receipt images
2. Ensure good contrast and lighting
3. Receipts should be flat and not folded
4. Text should be clearly visible

### Mock OCR Outputs

For testing without actual OCR processing, you can modify the `processReceiptImage` function in `backend/src/services/ocrService.ts` to return mock text:

```typescript
export async function processReceiptImage(imagePath: string): Promise<string> {
  // Mock OCR text for testing
  return `
    WALMART
    123 MAIN ST
    DATE: 12/25/2023
    
    MILK                 $4.99
    BREAD                $2.50
    EGGS x12             $3.99
    
    TOTAL                $11.48
  `;
}
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `UPLOAD_DIR` - Directory for uploaded files (default: ./uploads)

### Image Validation

- **Allowed types:** JPEG, PNG, WebP
- **Max file size:** 10MB
- **OCR processing:** Optimized for English text

## 🚀 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Docker Production

Update `docker-compose.yml` with production environment variables and use:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Database Schema

```prisma
model Receipt {
  id           String   @id @default(uuid())
  storeName    String
  purchaseDate DateTime
  totalAmount  Float
  items        Item[]
  imageUrl     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Item {
  id        String   @id @default(uuid())
  name      String
  quantity  Int?
  price     Float?
  receiptId String
  receipt   Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

## 🔮 How to Extend the App

### 1. Add User Authentication

**Backend:**
- Add User model to Prisma schema
- Implement JWT authentication
- Add user context to GraphQL resolvers
- Add user-receipt relationship

**Example:**
```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  receipts  Receipt[]
}

model Receipt {
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  // ... existing fields
}
```

### 2. Add Receipt Categorization

**Prisma Schema:**
```prisma
model Receipt {
  category  String?  // e.g., "groceries", "dining", "electronics"
  // ... existing fields
}
```

**GraphQL Schema:**
```graphql
input ReceiptFilterInput {
  category: String
  # ... existing filters
}
```

### 3. Export Data

Add export functionality:
- CSV export endpoint
- PDF report generation
- Excel export

**Example:**
```typescript
// backend/src/resolvers.ts
export const resolvers = {
  // ... existing resolvers
  Query: {
    // ... existing queries
    exportReceipts: async (_: any, args: { format: string, filter: ReceiptFilterInput }) => {
      // Implementation for CSV/PDF export
    },
  },
};
```

### 4. Background Processing with Queues

Use BullMQ for async OCR processing:

```bash
npm install bullmq ioredis
```

```typescript
// backend/src/services/queueService.ts
import { Queue } from 'bullmq';

const receiptQueue = new Queue('receipt-processing', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

export async function queueReceiptProcessing(filePath: string) {
  await receiptQueue.add('process-receipt', { filePath });
}
```

### 5. Advanced OCR Options

Switch to cloud OCR services for better accuracy:

**Google Vision API:**
```typescript
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();
const [result] = await client.textDetection(imagePath);
```

**AWS Textract:**
```typescript
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";

const client = new TextractClient({ region: "us-east-1" });
const command = new DetectDocumentTextCommand({ Document: { S3Object: {...} } });
```

### 6. Add Receipt Validation

- Validate extracted data quality
- Flag uncertain extractions
- Allow manual correction interface

### 7. Add Receipt Analytics

- Monthly spending reports
- Category breakdowns
- Store comparison
- Trend analysis

## 🐛 Troubleshooting

### OCR Not Working

- Ensure Tesseract.js is properly installed
- Check image quality and resolution
- Verify image format is supported
- Check server logs for OCR errors

### Database Connection Issues

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists
- Run Prisma migrations

### File Upload Fails

- Check upload directory permissions
- Verify file size limit (10MB)
- Ensure file type is allowed
- Check server logs for errors

## 📄 License

MIT License

## 👤 Author

Full Stack Developer Challenge - Receipt OCR & Data Extraction API

## 🙏 Acknowledgments

- Tesseract.js for OCR capabilities
- Apollo GraphQL for the GraphQL framework
- Prisma for the ORM
- Next.js team for the React framework


