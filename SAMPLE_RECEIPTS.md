# Sample Receipts & Mock OCR Outputs

This document contains sample receipt images and their expected OCR outputs for testing purposes.

## Test Data

### Supermarket Receipt (Walmart)

**Expected OCR Output:**
```
WALMART SUPERCENTER
123 MAIN STREET
CITY, STATE 12345
PHONE: (555) 123-4567

RECEIPT #12345
DATE: 12/25/2023
TIME: 14:35

MILK GALLON 2%         $4.99
BREAD WHITE            $2.50
EGGS DOZEN x2          $7.98
CHICKEN BREAST 2LB     $9.98
BANANAS 2.5 LB         $1.87
APPLES GALA 3 LB       $4.47
ORANGE JUICE 64OZ      $4.99

SUBTOTAL              $36.78
TAX                    $2.94
TOTAL                  $39.72
```

**Expected Extracted Data:**
- Store Name: "WALMART SUPERCENTER"
- Date: 2023-12-25
- Total: $39.72
- Items: 7 items with prices

### Restaurant Receipt

**Expected OCR Output:**
```
JOE'S ITALIAN RESTAURANT
456 OAK AVENUE
CITY, STATE 67890
(555) 987-6543

TABLE: 12
SERVER: MARIA
DATE: 12/24/2023
TIME: 19:45

PENNE ARRABIATA        $16.99
SPAGHETTI CARBONARA    $18.99
CAESAR SALAD           $12.99
GARLIC BREAD x2        $8.00
SOFT DRINKS x2         $6.00

SUBTOTAL              $62.97
TAX                    $5.04
TIP                    $12.60
TOTAL                  $80.61
```

**Expected Extracted Data:**
- Store Name: "JOE'S ITALIAN RESTAURANT"
- Date: 2023-12-24
- Total: $80.61
- Items: 5 items

### Pharmacy Receipt (CVS)

**Expected OCR Output:**
```
CVS PHARMACY #1234
789 ELM STREET
CITY, STATE 54321
PHONE: (555) 555-5555

TRANSACTION: 123456
DATE: 12/23/2023 10:15 AM

TYLENOL 500MG 100CT     $12.99
COLD MEDICINE           $8.49
BANDAGES                $4.99
COTTON SWABS            $2.99

SUBTOTAL              $29.46
TAX                    $2.36
TOTAL                  $31.82
```

**Expected Extracted Data:**
- Store Name: "CVS PHARMACY"
- Date: 2023-12-23
- Total: $31.82
- Items: 4 items

## Using Mock Data for Testing

To use mock OCR data instead of actual OCR processing, you can modify `backend/src/services/ocrService.ts`:

```typescript
import { getRandomMockReceipt } from './mockOCRData';

export async function processReceiptImage(imagePath: string): Promise<string> {
  // Use mock data for testing
  if (process.env.USE_MOCK_OCR === 'true') {
    return getRandomMockReceipt();
  }
  
  // Actual OCR processing...
}
```

Then set `USE_MOCK_OCR=true` in your `.env` file during development.

## Creating Test Receipt Images

1. Create receipt images in various formats:
   - JPEG (.jpg)
   - PNG (.png)
   - WebP (.webp)

2. Store them in a `test-receipts/` directory

3. Use these for integration testing

## OCR Accuracy Tips

For best OCR results:
- Use high-resolution images (minimum 300 DPI)
- Ensure good lighting and contrast
- Keep receipts flat and unfolded
- Avoid blurry or angled images
- Clear, printed text works better than handwritten


