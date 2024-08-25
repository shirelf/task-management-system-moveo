import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwtService';


export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });
  
    try {
      req.user = await verifyToken(token);
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token', error: (err as Error).message });
    }
  };
  