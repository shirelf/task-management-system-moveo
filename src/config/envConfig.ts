import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
export const COGNITO_REGION = process.env.COGNITO_REGION;
export const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
export const PORT = process.env.PORT || '3001';
export const MONGODB_URI = process.env.MONGODB_URI;

if (!COGNITO_USER_POOL_ID) {
  throw new Error("COGNITO_USER_POOL_ID is not defined in the environment variables.");
}

if (!COGNITO_CLIENT_ID) {
  throw new Error("COGNITO_CLIENT_ID is not defined in the environment variables.");
}

if (!COGNITO_REGION) {
  throw new Error("COGNITO_REGION is not defined in the environment variables.");
}

if (!COGNITO_CLIENT_SECRET) {
  throw new Error("COGNITO_CLIENT_SECRET is not defined in the environment variables.");
}

if (!PORT) {
    throw new Error("PORT is not defined in the environment variables.");
  }

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in the environment variables.");
}