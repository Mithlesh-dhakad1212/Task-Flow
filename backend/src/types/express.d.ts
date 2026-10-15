import { type AuthUser } from '../auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthUser;
    }
  }
}

export {};
