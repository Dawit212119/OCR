import { PrismaClient } from '@prisma/client';
import { createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { processReceiptWithTextract, processReceiptImage } from './services/ocrService';
import { extractReceiptData } from './services/dataExtractor';
import { v4 as uuidv4 } from 'uuid';
import { GraphQLUpload } from 'graphql-upload-minimal';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();
const unlinkAsync = promisify(unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'donbvuegd',
  api_key: process.env.CLOUDINARY_API_KEY || '582761999175547',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HwWwE57ri7nqG15DWPsV2v8pmII',
});

export const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    receipts: async (_: any, args: { filter?: { storeName?: string; startDate?: string; endDate?: string } }) => {
      const { filter } = args;

      const where: any = {};

      if (filter?.storeName) {
        where.storeName = {
          contains: filter.storeName,
          mode: 'insensitive',
        };
      }

      if (filter?.startDate || filter?.endDate) {
        where.purchaseDate = {};
        if (filter.startDate) {
          where.purchaseDate.gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
          where.purchaseDate.lte = new Date(filter.endDate);
        }
      }

      return await prisma.receipt.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: {
          purchaseDate: 'desc',
        },
      });
    },

    receipt: async (_: any, args: { id: string }) => {
      return await prisma.receipt.findUnique({
        where: { id: args.id },
        include: {
          items: true,
        },
      });
    },
  },

  Mutation: {
    uploadReceipt: async (_: any, args: { file: Promise<any> }) => {
      console.log('Starting uploadReceipt mutation...');
      try {
        const file = await args.file;
        console.log('File received:', file);
        const { createReadStream, filename, mimetype } = await file;
        console.log('File details:', { filename, mimetype });

        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimes.includes(mimetype)) {
          throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        let fileSize = 0;

        const stream = createReadStream();
        const fileId = uuidv4();
        const fileExtension = filename.split('.').pop() || 'jpg';
        const savedFilename = `${fileId}.${fileExtension}`;
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = join(uploadDir, savedFilename);

        console.log('Saving file to:', filePath);

        // Save file to disk temporarily for processing
        return await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(filePath);

        stream.on('data', (chunk: Buffer) => {
          fileSize += chunk.length;
          if (fileSize > maxSize) {
            writeStream.destroy();
            stream.destroy();
            unlinkAsync(filePath).catch(() => { });
            reject(new Error('File size exceeds 10MB limit.'));
            return;
          }
          writeStream.write(chunk);
        });

        stream.on('end', async () => {
          writeStream.end();

          // Wait for write stream to finish
          writeStream.on('finish', async () => {
            let extractedData;
            
            try {
              console.log('Processing OCR for file:', filePath);
              
              // Try AWS Textract first
              try {
                extractedData = await processReceiptWithTextract(filePath);
                console.log('Data extracted with Textract:', extractedData);
              } catch (textractError: any) {
                console.warn('Textract failed (likely missing/invalid creds), falling back to Tesseract:', textractError.message);
                
                // Fallback to Tesseract
                const ocrText = await processReceiptImage(filePath);
                console.log('OCR processed with Tesseract. Text length:', ocrText?.length);

                if (!ocrText || ocrText.trim().length === 0) {
                  throw new Error('No text could be extracted from the receipt image.');
                }

                extractedData = extractReceiptData(ocrText);
                console.log('Data extracted with Tesseract:', extractedData);
              }

              // Upload to Cloudinary
              console.log('Uploading to Cloudinary...');
              const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
                folder: 'receipts',
                public_id: fileId,
              });
              console.log('Cloudinary upload success:', cloudinaryResult.secure_url);

              // Clean up local file
              await unlinkAsync(filePath);

              // Save to database
              console.log('Saving to database...');
              const receipt = await prisma.receipt.create({
                data: {
                  storeName: extractedData.storeName || 'Unknown Store',
                  purchaseDate: extractedData.purchaseDate || new Date(),
                  totalAmount: extractedData.totalAmount || 0,
                  tax: extractedData.taxAmount || 0,
                  imageUrl: cloudinaryResult.secure_url,
                  items: {
                    create: extractedData.items.map((item: any) => ({
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                  },
                },
                include: {
                  items: true,
                },
              });
              console.log('Receipt saved:', receipt.id);

              // Return formatted receipt with ISO string for date to avoid "Invalid Date" on frontend
              resolve({
                ...receipt,
                purchaseDate: receipt.purchaseDate.toISOString(),
                createdAt: receipt.createdAt.toISOString(),
                updatedAt: receipt.updatedAt.toISOString(),
              });
            } catch (error: any) {
              console.error('Error in processing:', error);
              // Clean up file on error
              unlinkAsync(filePath).catch(() => { });
              reject(new Error(`Failed to process receipt: ${error.message}`));
            }
          });
        });

        stream.on('error', (error: Error) => {
          writeStream.destroy();
          unlinkAsync(filePath).catch(() => { });
          reject(error);
        });

        writeStream.on('error', (error: Error) => {
          stream.destroy();
          reject(error);
        });
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  },
},
};

