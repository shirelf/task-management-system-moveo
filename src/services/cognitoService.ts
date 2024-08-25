import {
    AuthFlowType,
    ChallengeNameType,
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CLIENT_ID, COGNITO_REGION, COGNITO_USER_POOL_ID } from '../config/envConfig';
import { generateSecretHash } from '../utils/secretHash';

const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

export const login = async (username: string, password: string) => {
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH' as AuthFlowType,
        ClientId: COGNITO_CLIENT_ID!,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
            SECRET_HASH: generateSecretHash(username)
        }
    };

    const command = new InitiateAuthCommand(params);
    return cognitoClient.send(command);
};

export const respondToNewPasswordChallenge = async (username: string, newPassword: string, session: string) => {
    const params = {
        ChallengeName: 'NEW_PASSWORD_REQUIRED' as ChallengeNameType,
        ClientId: COGNITO_CLIENT_ID!,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
          SECRET_HASH: generateSecretHash(username)
        },
        Session: session
      };

    const command = new RespondToAuthChallengeCommand(params);
    return cognitoClient.send(command);
};
