import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../middleware/AsyncHandler";
import { UserPostgreSQLRepository } from "../repository/PostgreSql/UserRepository";
import { AuthenticationService } from "../services/authentication.service";
import { UserService } from "../services/user.service";
import { userRepository } from "../repository/PostgreSql/repositories";

// ── Dependency wiring ─────────────────────────────────────────────────────────


const userService   = new UserService(userRepository);
const authService   = new AuthenticationService();
const authController = new AuthController(authService, userService);

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Sets httpOnly cookies (token + refreshToken) on success.
 */
router.post(
    "/login",
    asyncHandler(authController.login.bind(authController))
);

/**
 * GET /api/v1/auth/logout
 * Clears the auth cookies. No body needed.
 */
router.get(
    "/logout",
    asyncHandler(authController.logout.bind(authController))
);

export default router;