// back-end/src/common/interfaces/authenticated-request.interface.ts
import { Request } from 'express';

// Define the structure of the user payload attached by the AuthGuard
interface AuthenticatedUser {
  userId: string; // Or ObjectId if you store it as such
  // Add other user properties from the JWT payload if needed (e.g., roles, email)
  roles?: string[];
  email?: string;
}

// Extend the default Request interface
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
