import { Router } from "express";
import { permissions } from "../config/roles";
import { VaultController } from "../controllers/vault.controller";
import { asyncHandler } from "../middleware/AsyncHandler";
import { Authentication } from "../middleware/auth";
import { hasPermission } from "../middleware/authorize";
import { VaultRepositoryPostgre } from "../repository/PostgreSql/VaultRepositoryPostgre";
import { VaultService } from "../services/Vault.service";

// ── Dependency wiring ─────────────────────────────────────────────────────────

const vaultRepository = new VaultRepositoryPostgre();
vaultRepository.init();

const vaultService    = new VaultService(vaultRepository);
const vaultController = new VaultController(vaultService);

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

// All vault routes require a valid session — mount Authentication once here
// rather than repeating it on every route definition below.
router.use(Authentication);

/**
 * POST /api/v1/vault
 * Save a new item to the vault (plain text → service encrypts).
 * Body: { userId, label, category, type, content?, tags? }
 *
 * GET  /api/v1/vault?userId=&category=&type=
 * Retrieve all items for a user filtered by category + type.
 */
router
    .route("/")
    .post(
        hasPermission(permissions.create_vault_item),
        asyncHandler(vaultController.createVaultItem)   // already bound in constructor
    )
    .get(
        hasPermission(permissions.read_vault_item),
        asyncHandler(vaultController.getItemsByContext)
    );

/**
 * GET    /api/v1/vault/:id  — fetch + decrypt a single item
 * PUT    /api/v1/vault/:id  — update + re-encrypt a single item
 * DELETE /api/v1/vault/:id  — permanently remove an item
 */
router
    .route("/:id")
    .get(
        hasPermission(permissions.read_vault_item),
        asyncHandler(vaultController.getVaultItemById)
    )
    .put(
        hasPermission(permissions.update_vault_item),
        asyncHandler(vaultController.updateVaultItem)
    )
    .delete(
        hasPermission(permissions.delete_vault_item),
        asyncHandler(vaultController.deleteVaultItem)
    );

export default router;