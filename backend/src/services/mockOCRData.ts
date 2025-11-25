/**
 * Mock OCR text samples for testing without actual receipt images
 * These simulate real OCR output from various receipt types
 */

export const mockReceiptTexts = {
  supermarket: `
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

THANK YOU FOR SHOPPING
`,

  restaurant: `
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

THANK YOU!
`,

  pharmacy: `
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

CARD ENDING: 1234
AUTH: 567890
`,

  gasStation: `
SHELL STATION
321 HIGHWAY 1
CITY, STATE 11111

PUMP: 3
DATE: 12/22/2023
TIME: 08:30

REGULAR GAS 10.5 GAL @ $3.49
FUEL                        $36.65
COFFEE                       $2.49
SANDWICH                     $4.99

SUBTOTAL                   $44.13
TOTAL                       $44.13

THANK YOU!
`,
};

/**
 * Returns a random mock receipt text
 */
export function getRandomMockReceipt(): string {
  const texts = Object.values(mockReceiptTexts);
  return texts[Math.floor(Math.random() * texts.length)];
}


