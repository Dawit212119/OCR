import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
import { createWorker, PSM } from 'tesseract.js';
import fs from 'fs';

// Interface matching the one in dataExtractor.ts
interface ExtractedReceiptData {
  storeName: string | null;
  purchaseDate: Date | null;
  totalAmount: number | null;
  taxAmount: number | null;
  items: Array<{
    name: string;
    quantity: number | null;
    price: number | null;
  }>;
}

export async function processReceiptImage(imagePath: string): Promise<string> {
  try {
    console.log('Starting OCR processing (Tesseract) for:', imagePath);
    
    const worker = await createWorker('eng');
    
    // Configure OCR for receipt scanning
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO_OSD,
    });
    
    const { data: { text } } = await worker.recognize(imagePath);
    
    await worker.terminate();
    
    console.log('Tesseract OCR completed. Text length:', text.length);
    return text;
  } catch (error: any) {
    console.error('Tesseract OCR processing error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

export async function processReceiptWithTextract(imagePath: string): Promise<ExtractedReceiptData> {
  try {
    console.log('Starting AWS Textract AnalyzeExpense for:', imagePath);

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS Credentials");
    }

    const client = new TextractClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    });

    const imageBuffer = fs.readFileSync(imagePath);

    const command = new AnalyzeExpenseCommand({
      Document: {
        Bytes: imageBuffer,
      },
    });

    const response = await client.send(command);
    const result: ExtractedReceiptData = {
      storeName: null,
      purchaseDate: null,
      totalAmount: null,
      taxAmount: null,
      items: [],
    };

    if (!response.ExpenseDocuments || response.ExpenseDocuments.length === 0) {
      throw new Error("No expense documents found in the image.");
    }

    const doc = response.ExpenseDocuments[0];

    // Helper to get text from fields
    const getField = (type: string) => {
      const field = doc.SummaryFields?.find(f => f.Type?.Text === type);
      return field?.ValueDetection?.Text;
    };

    // Store Name (VENDOR_NAME)
    result.storeName = getField("VENDOR_NAME") || "Unknown Store";

    // Date (INVOICE_RECEIPT_DATE)
    const dateStr = getField("INVOICE_RECEIPT_DATE");
    if (dateStr) {
      result.purchaseDate = new Date(dateStr);
      if (isNaN(result.purchaseDate.getTime())) {
        result.purchaseDate = new Date(); // Fallback
      }
    } else {
      result.purchaseDate = new Date();
    }

    // Total (TOTAL)
    const totalStr = getField("TOTAL");
    if (totalStr) {
      result.totalAmount = parseFloat(totalStr.replace(/[^0-9.]/g, ""));
    }

    // Tax (TAX)
    const taxStr = getField("TAX");
    if (taxStr) {
      result.taxAmount = parseFloat(taxStr.replace(/[^0-9.]/g, ""));
    }

    // Items (LINE_ITEM_GROUP)
    if (doc.LineItemGroups) {
      for (const group of doc.LineItemGroups) {
        if (group.LineItems) {
          for (const item of group.LineItems) {
            let name = "";
            let price = 0;
            let quantity = null;

            for (const field of item.LineItemExpenseFields || []) {
              const type = field.Type?.Text;
              const value = field.ValueDetection?.Text;

              if (type === "ITEM") name = value || "";
              if (type === "PRICE") price = parseFloat((value || "0").replace(/[^0-9.]/g, ""));
              if (type === "QUANTITY") quantity = parseInt((value || "1").replace(/[^0-9]/g, ""), 10);
            }

            if (name) {
              result.items.push({ name, price, quantity });
            }
          }
        }
      }
    }

    console.log("Textract Analysis Complete:", result);
    return result;

  } catch (error: any) {
    console.error('Textract processing error:', error);
    throw error; // Re-throw to allow fallback
  }
}
