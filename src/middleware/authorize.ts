import { NextFunction, Request, Response } from "express";
import { permissions, roles, rolePermission } from "../config/roles";
import { authRequest } from "../config/db_mode";
import { AuthenticationFailedException } from "../util/exceptions/http/AuthenticationException";
import logger from "../util/logger";
import { HTTPException } from "../util/exceptions/http/HttpException";

export class InsufficientPermissionException extends HTTPException {
    constructor() {
        super(403, "You do not have permission to perform this action.");
        this.name = "InsufficientPermissionException";
    }
}

export class InvalidRoleException extends HTTPException {
    constructor(role: string) {
        super(403, `Unrecognised role: "${role}".`);
        this.name = "InvalidRoleException";
    }
}

/**
 * Guards a route by checking that the authenticated user's role
 * includes the required permission.
 *
 * Usage:
 *   router.post('/', Authentication, hasPermission(permissions.create_vault_item), handler);
 */
export function hasPermission(permission: permissions) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const authReq = req as authRequest;

            if (!authReq.user) {
                throw new AuthenticationFailedException();
            }

            const { role } = authReq.user;

            if (!rolePermission[role]) {
                logger.error(`hasPermission: unrecognised role "${role}"`);
                throw new InvalidRoleException(role);
            }

            if (!rolePermission[role].includes(permission)) {
                logger.warn(`hasPermission: role "${role}" denied — missing permission "${permission}"`);
                throw new InsufficientPermissionException();
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Guards a route by checking that the authenticated user has one of
 * the allowed roles (coarser-grained than hasPermission).
 *
 * Usage:
 *   router.get('/admin/users', Authentication, hasRole([roles.admin]), handler);
 */
export function hasRole(allowedRoles: roles[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const authReq = req as authRequest;

            if (!authReq.user) {
                throw new AuthenticationFailedException();
            }

            const { role } = authReq.user;

            if (!allowedRoles.includes(role)) {
                logger.warn(`hasRole: role "${role}" is not in allowed list [${allowedRoles.join(", ")}]`);
                throw new InsufficientPermissionException();
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}