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

export function extractReceiptData(ocrText: string): ExtractedReceiptData {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const result: ExtractedReceiptData = {
    storeName: null,
    purchaseDate: null,
    totalAmount: null,
    taxAmount: null,
    items: [],
  };
  
  // Extract store name (look for largest text at top, usually centered)
  // For now, we take the first line that isn't empty and isn't just numbers or small punctuation
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 2 && !/^\d+$/.test(line) && !/receipt|check|order|table/i.test(line)) {
      result.storeName = line;
      break;
    }
  }
  
  // Extract date patterns (various formats)
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          result.purchaseDate = parseDate(line);
          if (result.purchaseDate) break;
        } catch (e) {
          // Continue searching
        }
      }
    }
    if (result.purchaseDate) break;
  }
  
  // Extract total amount (prioritize "Total" over "Subtotal")
  // And extract Tax
  const totalPatterns = [
    /grand total[:\s]+.*$/i,
    /^total[:\s]+.*$/i, // Start of line anchor. Safe because we trim() lines.
    /balance due[:\s]+.*$/i,
    /amount due[:\s]+.*$/i,
  ];

  const taxPatterns = [
    /tax[:\s]+[\$\*]?([\d,]+\.?\d*)/i,
    /vat[:\s]+[\$\*]?([\d,]+\.?\d*)/i,
    /(?:tax|tak)\s+\d+\s+\d+%[:\s]*[\$\*]?([\d,]+\.?\d*)/i, // Matches "TAX 1 15%" or "TAK 1 15%"
  ];

  const serviceChargePatterns = [
    /service charge[:\s]+[\$\*]?([\d,]+\.?\d*)/i,
    /s\.?\s*charge[:\s]+[\$\*]?([\d,]+\.?\d*)/i,
  ];

  let serviceCharge = 0;
  
  for (const line of lines) {
    // Check for Total
    for (const pattern of totalPatterns) {
      if (pattern.test(line) && !line.toLowerCase().includes('subtotal')) {
        // Extract ALL numbers from the line that looks like a total
        // Regex to match numbers like 1,234.56 or 1106.88 or even *1106.88
        // We ignore "3" if there's a bigger number.
        const numberMatches = line.match(/([\d,]+\.?\d{2,})/g); // Require at least 2 decimal-like digits to avoid "3"
        
        if (numberMatches) {
           const numbers = numberMatches.map(n => parseFloat(n.replace(/,/g, '')));
           const maxVal = Math.max(...numbers);
           
           if (maxVal > 0) {
             console.log(`Found potential Total: ${maxVal} in line: "${line}"`);
             if (!result.totalAmount || maxVal > result.totalAmount) {
               result.totalAmount = maxVal;
             }
           }
        }
      }
    }

    // Check for Tax
    for (const pattern of taxPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) {
          if (!result.taxAmount || amount > result.taxAmount) {
             result.taxAmount = amount;
          }
        }
      }
    }

    // Check for Service Charge
    for (const pattern of serviceChargePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) {
          serviceCharge = amount;
        }
      }
    }
  }

  // Add Service Charge to Tax Amount if found (to show it in the UI field)
  // REMOVED: User wants Tax to match the specific tax line. 
  // Service Charge will be captured as an item instead.
  /* if (serviceCharge > 0) {
    result.taxAmount = (result.taxAmount || 0) + serviceCharge;
  } */
  
  // Extract items (lines with potential product names and prices)
  for (const line of lines) {
    // Skip lines that are likely headers, totals, or dates, or masked card numbers
    // Removed "service charge" from exclusion list so it can be added as an item
    if (
      /total|subtotal|tax|date|time|receipt|store|amount|visa|mastercard|amex|credit|change|cash|auth|approval|terminal|merchant|tip|bal|balance|vat|sol|gst/i.test(line) ||
      /x{4,}|[*]{4,}/i.test(line) || // Masked card numbers (xxxx or ****)
      datePatterns.some(p => p.test(line))
    ) {
      // Exception: Allow "Service Charge" to be processed as an item if found
      if (!/service charge/i.test(line)) {
          continue;
      }
    }
    
    // Look for lines with potential item names and prices
    // Matches: "Item Name 10.00" or "Item Name *10.00"
    // Also handles: "HABESHA BEER 2 25.00 *50.00" (Name Qty UnitPrice Total)
    const priceMatch = line.match(/[\$\*]?(\d+\.\d{2})\s*$/) || line.match(/\s+[\$\*]?(\d+\.\d{2})/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      // Remove price from line to get potential name
      let restOfLine = line.replace(priceMatch[0], '').trim();
      
      let quantity = null;
      let itemName = restOfLine;

      // Check for "Qty UnitPrice" pattern at end of name: "2 25.00"
      // Regex: (Quantity) (UnitPrice)
      // We also handle cases where dot is missing in unit price if OCR messed up: "1 16000"
      const qtyUnitPriceMatch = restOfLine.match(/\s+(\d+)\s+(\d+[\.,]?\d*)\s*$/);
      if (qtyUnitPriceMatch) {
         const potentialQty = parseInt(qtyUnitPriceMatch[1]);
         // If we found a match, we assume it's Qty + UnitPrice.
         // We rely on the fact that TotalPrice (extracted earlier) = Qty * UnitPrice approx.
         // But here we just extract.
         quantity = potentialQty;
         itemName = restOfLine.replace(qtyUnitPriceMatch[0], '').trim();
      } else {
         // Try to extract leading quantity if present (e.g. "1 House Salad")
         const leadingQtyMatch = itemName.match(/^(\d+)\s+(.*)/);
         if (leadingQtyMatch) {
           quantity = parseInt(leadingQtyMatch[1]);
           itemName = leadingQtyMatch[2];
         }
      }

      // Clean up noise from item name
      // Remove trailing chars that look like part of price or noise
      itemName = itemName.replace(/[^\w\s\-\(\)\*&]/g, '').trim();
      
      // Skip if item name is too short or looks like a total
      if (itemName.length >= 2 && itemName.length < 100 && price > 0 && price < 10000) {
        result.items.push({
          name: itemName,
          quantity: quantity, // leading quantity usually overrides embedded quantity logic
          price: price,
        });
      }
    }
  }
  
  // If no date found, use current date
  if (!result.purchaseDate) {
    result.purchaseDate = new Date();
  }
  
  // If no store name found, use default
  if (!result.storeName) {
    result.storeName = 'Unknown Store';
  }
  
  return result;
}

function parseDate(dateString: string): Date | null {
  // Try various date formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let year, month, day;
      
      if (format === formats[2]) {
        // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // DD/MM/YYYY or DD-MM-YYYY (Prioritize DD first for international/Ethiopian receipts)
        // Previously was MM/DD, but DD/MM is more common globally. 
        // If day > 12, it's definitely day. If both <= 12, it's ambiguous, but we default to DD/MM.
        const firstPart = parseInt(match[1]);
        const secondPart = parseInt(match[2]);
        
        if (secondPart > 12) {
           // Must be MM/DD/YYYY (since 2nd part is > 12, it's Day)
           month = firstPart - 1;
           day = secondPart;
        } else {
           // Default to DD/MM/YYYY
           day = firstPart;
           month = secondPart - 1;
        }
        
        year = parseInt(match[3]);
        if (year < 100) {
          year += 2000; // Convert 2-digit year to 4-digit
        }
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}


