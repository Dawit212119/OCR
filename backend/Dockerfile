FROM node:18-alpine

WORKDIR /app

# Install system dependencies for Tesseract.js
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["npm", "run", "dev"]


