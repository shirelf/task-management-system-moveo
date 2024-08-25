import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
  } from '@aws-sdk/client-cognito-identity-provider';
  import { login, respondToNewPasswordChallenge } from '../src/services/cognitoService';
  import { generateSecretHash } from '../src/utils/secretHash';
  
  jest.mock('@aws-sdk/client-cognito-identity-provider');
  jest.mock('../src/utils/secretHash');
  
describe('CognitoService', () => {
    let mockSend: jest.Mock;
  
    beforeEach(() => {
      mockSend = jest.fn();
      (CognitoIdentityProviderClient.prototype.send as jest.Mock).mockImplementation(mockSend);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe('login', () => {
      it('should initiate auth with correct parameters', async () => {
        mockSend.mockResolvedValueOnce({ AuthenticationResult: { AccessToken: 'fakeAccessToken' } });
        (generateSecretHash as jest.Mock).mockReturnValue('fakeSecretHash');
  
        await login('testuser', 'password123');
  
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith(expect.any(InitiateAuthCommand));
      });
  
      it('should handle errors during auth', async () => {
        const mockError = new Error('Auth failed');
        mockSend.mockRejectedValueOnce(mockError);
  
        await expect(login('testuser', 'password123')).rejects.toThrow('Auth failed');
      });
    });
  
    describe('respondToNewPasswordChallenge', () => {
      it('should respond to new password challenge with correct parameters', async () => {
        mockSend.mockResolvedValueOnce({ ChallengeName: 'NEW_PASSWORD_REQUIRED' });
        (generateSecretHash as jest.Mock).mockReturnValue('fakeSecretHash');
  
        await respondToNewPasswordChallenge('testuser', 'newpassword123', 'fakeSession');
  
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith(expect.any(RespondToAuthChallengeCommand));
      });
  
      it('should handle errors during new password challenge response', async () => {
        const mockError = new Error('Challenge response failed');
        mockSend.mockRejectedValueOnce(mockError);
  
        await expect(
          respondToNewPasswordChallenge('testuser', 'newpassword123', 'fakeSession')
        ).rejects.toThrow('Challenge response failed');
      });
    });
  });