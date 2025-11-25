import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Upload

  type Receipt {
    id: ID!
    storeName: String!
    purchaseDate: String!
    totalAmount: Float!
    tax: Float
    items: [Item!]!
    imageUrl: String!
    createdAt: String!
    updatedAt: String!
  }

  type Item {
    id: ID!
    name: String!
    quantity: Int
    price: Float
    receiptId: String!
    createdAt: String!
  }

  input ReceiptFilterInput {
    storeName: String
    startDate: String
    endDate: String
  }

  type Query {
    receipts(filter: ReceiptFilterInput): [Receipt!]!
    receipt(id: ID!): Receipt
  }

  type Mutation {
    uploadReceipt(file: Upload!): Receipt!
  }

  type ExtractionResult {
    success: Boolean!
    receipt: Receipt
    error: String
  }
`;
