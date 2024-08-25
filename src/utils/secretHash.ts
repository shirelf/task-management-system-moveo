import * as crypto from 'crypto';
import { COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from '../config/envConfig';

export const generateSecretHash = (username: string): string => {
    return crypto.createHmac('sha256', COGNITO_CLIENT_SECRET!)
        .update(username + COGNITO_CLIENT_ID!)
        .digest('base64');
};
