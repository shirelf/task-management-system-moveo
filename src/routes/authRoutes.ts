import { Router } from 'express';
import { login, respondToNewPasswordChallenge } from '../services/cognitoService';
import { verifyToken } from '../services/jwtService';
import { Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { JwtPayload } from 'jsonwebtoken';

const router = Router();

// Login route
router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const data = await login(username, password);

        if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            res.json({ message: 'NEW_PASSWORD_REQUIRED', session: data.Session });
        } else if (data.AuthenticationResult) {
            res.json(data.AuthenticationResult);
        } else {
            res.status(400).json({ message: 'Authentication failed' });
        }
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// Respond to new password challenge route
router.post('/respond-to-new-password-challenge', async (req: Request, res: Response) => {
    const { username, newPassword, session } = req.body;

    try {
        const data = await respondToNewPasswordChallenge(username, newPassword, session);

        if (data.AuthenticationResult) {
            res.json(data.AuthenticationResult);
        } else {
            res.status(400).json({ message: 'Failed to set new password' });
        }
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

declare module 'express-serve-static-core' {
    interface Request {
      user?: JwtPayload;
    }
}

// Verify token route
router.get('/verify', authenticate, (req: Request, res: Response) => {
    res.json({ message: 'Token is valid', user: req.user });
});

export default router;
