import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        isAdmin: boolean;
    };
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map