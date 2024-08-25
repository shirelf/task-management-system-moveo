import * as jwt from 'jsonwebtoken';
import * as jose from 'node-jose';
import axios from 'axios';
import { COGNITO_CLIENT_ID, COGNITO_REGION, COGNITO_USER_POOL_ID } from '../config/envConfig';
import { JwtPayload } from 'jsonwebtoken';

// Fetch the JWKS and build a key store
const getKeyStore = async (): Promise<jose.JWK.KeyStore> => {
    const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
    const response = await axios.get(url);
    const keystore = await jose.JWK.asKeyStore(response.data);
    return keystore;
  };

// Function to verify JWT token using node-jose
export const verifyToken = async (token: string): Promise<JwtPayload> => {
    const keystore = await getKeyStore();
    const decodedHeader = jwt.decode(token, { complete: true })?.header;
  
    if (!decodedHeader || !decodedHeader.kid) {
      throw new Error('Invalid token header');
    }
  
    const key = keystore.get(decodedHeader.kid);
    if (!key) {
      throw new Error('Key not found in keystore');
    }
  
    return jwt.verify(token, key.toPEM(), {
      audience: COGNITO_CLIENT_ID,
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
    }) as JwtPayload;
  };