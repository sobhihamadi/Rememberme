import { Router } from "express";
import { permissions, roles } from "../config/roles";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/AsyncHandler";
import { Authentication } from "../middleware/auth";
import { hasPermission, hasRole } from "../middleware/authorize";
import { UserPostgreSQLRepository } from "../repository/PostgreSql/UserRepository";
import { UserService } from "../services/user.service";

// ── Dependency wiring ─────────────────────────────────────────────────────────

const userRepository = new UserPostgreSQLRepository();
userRepository.init();

const userService    = new UserService(userRepository);
const userController = new UserController(userService);

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

/**
 * POST /api/v1/users
 * Register a new account — public, no token required.
 */
router.post(
    "/",
    asyncHandler(userController.createUser.bind(userController))
);

/**
 * GET /api/v1/users
 * List all users — admin only.
 */
router.get(
    "/",
    Authentication,
    hasRole([roles.admin]),
    asyncHandler(userController.getAllUsers.bind(userController))
);

/**
 * GET  /api/v1/users/:id  — read a user profile (own profile or admin)
 * PUT  /api/v1/users/:id  — update a user profile
 * DELETE /api/v1/users/:id — delete an account
 */
router
    .route("/:id")
    .get(
        Authentication,
        hasPermission(permissions.read_own_profile),
        asyncHandler(userController.getUserById.bind(userController))
    )
    .put(
        Authentication,
        hasPermission(permissions.update_own_profile),
        asyncHandler(userController.updateUser.bind(userController))
    )
    .delete(
        Authentication,
        hasPermission(permissions.delete_own_account),
        asyncHandler(userController.deleteUser.bind(userController))
    );

export default router;