import { config } from 'dotenv';
config();

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { resolvers } from './resolvers';
import { typeDefs } from './typeDefs';
import path from 'path';
import fs from 'fs';
import { graphqlUploadExpress } from 'graphql-upload-minimal';

// config() was called at the top

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Serve uploads directory
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
});

async function startServer() {
  await server.start();

  // File upload middleware (must be before body parsers and expressMiddleware)
  app.use(graphqlUploadExpress({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
  }));

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        return {
          req,
        };
      },
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📁 Upload directory: ${path.resolve(UPLOAD_DIR)}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

