declare module 'graphql-upload/graphqlUploadExpress' {
  import type { RequestHandler } from 'express';
  
  interface GraphQLUploadExpressOptions {
    maxFileSize?: number;
    maxFiles?: number;
  }
  
  const graphqlUploadExpress: (
    options?: GraphQLUploadExpressOptions
  ) => RequestHandler;
  
  export default graphqlUploadExpress;
}

