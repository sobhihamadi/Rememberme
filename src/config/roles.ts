/**
 * roles.ts — VaultMind RBAC (Role-Based Access Control)
 *
 * Three roles:
 *   admin  — platform operator, full access
 *   user   — authenticated subscriber, owns and manages their own vault
 *   guest  — unauthenticated visitor, can only register or log in
 *
 * Permissions follow the pattern: <verb>_<resource>
 * This makes it trivial to check them programmatically in middleware.
 */

// ── Roles ────────────────────────────────────────────────────────────────────

export enum roles {
    admin = "admin",
    user  = "user",
    guest = "guest",
}

// ── Permissions ──────────────────────────────────────────────────────────────

export enum permissions {

    // --- Vault item permissions -------------------------------------------
    create_vault_item  = "create_vault_item",   // Save a new item to the vault
    read_vault_item    = "read_vault_item",      // Retrieve / decrypt an item
    update_vault_item  = "update_vault_item",    // Edit an existing item
    delete_vault_item  = "delete_vault_item",    // Remove an item permanently

    // --- Chat permissions -------------------------------------------------
    send_chat_message  = "send_chat_message",   // POST a new AI chat message
    read_chat_history  = "read_chat_history",   // GET conversation history
    delete_chat_message = "delete_chat_message", // Remove a single message

    // --- User / account permissions ---------------------------------------
    register           = "register",            // Create a new account (guests too)
    read_own_profile   = "read_own_profile",    // GET your own user record
    update_own_profile = "update_own_profile",  // PATCH name, email, uiMode, tier…
    delete_own_account = "delete_own_account",  // Self-service account deletion

    // --- Auth permissions -------------------------------------------------
    login              = "login",               // Obtain access + refresh tokens
    logout             = "logout",              // Invalidate tokens / clear cookies
    refresh_token      = "refresh_token",       // Exchange refresh token for a new access token

    // --- Admin-only permissions -------------------------------------------
    read_all_users     = "read_all_users",      // GET /admin/users
    delete_any_user    = "delete_any_user",     // Force-delete any account
    read_any_vault     = "read_any_vault",      // Inspect any user's vault (moderation)
    delete_any_vault_item = "delete_any_vault_item", // Remove abusive content
    read_any_chat      = "read_any_chat",       // Audit chat logs (compliance)
}

// ── Role → Permission mapping ────────────────────────────────────────────────

export type RolesPermissions = {
    [key in roles]: permissions[];
};

export const rolePermission: RolesPermissions = {

    // admin has every permission — spread all enum values
    [roles.admin]: [...Object.values(permissions)],

    // A standard authenticated user owns only their own data
    [roles.user]: [
        permissions.create_vault_item,
        permissions.read_vault_item,
        permissions.update_vault_item,
        permissions.delete_vault_item,

        permissions.send_chat_message,
        permissions.read_chat_history,
        permissions.delete_chat_message,

        permissions.read_own_profile,
        permissions.update_own_profile,
        permissions.delete_own_account,

        permissions.login,
        permissions.logout,
        permissions.refresh_token,
    ],

    // A guest has not authenticated — they can only register or log in
    [roles.guest]: [
        permissions.register,
        permissions.login,
    ],
};

// ── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Safely converts a raw string (e.g. from a JWT payload) to the roles enum.
 * Throws if the value is not a recognised role — never silently falls back.
 */
export const toRole = (role: string): roles => {
    switch (role) {
        case roles.admin: return roles.admin;
        case roles.user:  return roles.user;
        case roles.guest: return roles.guest;
        default:
            throw new Error(`Invalid role: "${role}". Expected one of: ${Object.values(roles).join(", ")}`);
    }
};

/**
 * Returns true if the given role has the requested permission.
 *
 * Usage in middleware:
 *   if (!hasPermission(req.user.role, permissions.create_vault_item)) {
 *       return res.status(403).json({ error: "Forbidden" });
 *   }
 */
export const hasPermission = (role: roles, permission: permissions): boolean => {
    return rolePermission[role]?.includes(permission) ?? false;
};

/**
 * Returns the full permission set for a given role.
 * Useful when you want to send the client a list of what it can do.
 */
export const getPermissions = (role: roles): permissions[] => {
    return rolePermission[role] ?? [];
};