'use client';

import { useState } from 'react';
import { uploadReceipt, getReceipts } from './lib/graphql';

interface Item {
  id: string;
  name: string;
  quantity: number | null;
  price: number | null;
}

interface Receipt {
  id: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  tax?: number;
  items: Item[];
  imageUrl: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStore, setFilterStore] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setReceipt(null);

    try {
      const result = await uploadReceipt(file);
      setReceipt(result);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to process receipt. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const filter: any = {};
      if (filterStore) filter.storeName = filterStore;
      if (filterStartDate) filter.startDate = filterStartDate;
      if (filterEndDate) filter.endDate = filterEndDate;

      const results = await getReceipts(filter);
      setReceipts(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch receipts.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Receipt OCR & Data Extraction
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Upload Receipt</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                Select Receipt Image
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {file && (
              <div className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Processing...' : 'Process Receipt'}
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Search Receipts</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  placeholder="Filter by store..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Search Receipts
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Display */}
        {receipt && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Extracted Receipt Data</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Store Name:</span>
                  <p className="text-lg font-semibold text-gray-800">{receipt.storeName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Purchase Date:</span>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(receipt.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Tax:</span>
                  <p className="text-lg font-semibold text-gray-800">
                    {receipt.tax ? `$${receipt.tax.toFixed(2)}` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <p className="text-lg font-semibold text-indigo-600">
                    ${receipt.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Items:</span>
                  <p className="text-lg font-semibold text-gray-800">{receipt.items.length}</p>
                </div>
              </div>

              {receipt.imageUrl && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Receipt Image:</span>
                  <img
                    src={receipt.imageUrl.startsWith('http') ? receipt.imageUrl : `http://localhost:4000${receipt.imageUrl}`}
                    alt="Receipt"
                    className="mt-2 max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {receipt.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Items Purchased:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {receipt.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.price ? `$${item.price.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Receipts List */}
        {receipts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Search Results</h2>
            <div className="space-y-4">
              {receipts.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{r.storeName}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(r.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-indigo-600">
                      ${r.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{r.items.length} items</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


