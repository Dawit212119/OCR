import './globals.css'

export const metadata = {
  title: 'Receipt OCR & Data Extraction',
  description: 'Upload and extract data from receipts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


