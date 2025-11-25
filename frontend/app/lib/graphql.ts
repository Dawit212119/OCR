import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('http://localhost:4000/graphql');

const UPLOAD_RECEIPT = `
  mutation UploadReceipt($file: Upload!) {
    uploadReceipt(file: $file) {
      id
      storeName
      purchaseDate
      totalAmount
      tax
      imageUrl
      items {
        id
        name
        quantity
        price
      }
    }
  }
`;

const GET_RECEIPTS = `
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
`;

export async function uploadReceipt(file: File) {
  // Use multipart/form-data for GraphQL file uploads
  const formData = new FormData();
  
  // GraphQL multipart request format
  const operations = {
    query: UPLOAD_RECEIPT,
    variables: {
      file: null,
    },
  };
  
  const map = {
    '0': ['variables.file'],
  };
  
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  formData.append('0', file);

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    body: formData,
    headers: {
      'apollo-require-preflight': 'true',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let error;
    try {
      error = JSON.parse(text);
    } catch {
      throw new Error('Upload failed: ' + text);
    }
    throw new Error(error.errors?.[0]?.message || 'Upload failed');
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.uploadReceipt;
}

export async function getReceipts(filter?: {
  storeName?: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await client.request(GET_RECEIPTS, { filter });
  return response.receipts;
}

