import { Role } from './enums';

declare global {
  namespace Express {
    interface Request {
      query: Record<string, any>;
    }
    interface User {
      id: string;
      email: string;
      role: Role;
      name: string;
    }
  }
}
