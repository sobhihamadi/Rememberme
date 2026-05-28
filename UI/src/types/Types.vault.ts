// ── Mirrors backend enums exactly (all-caps) ─────────────────────────────────

export const VaultCategory = {
  PERSONAL: 'PERSONAL',
  WORK: 'WORK',
  NOTES: 'NOTES',
} as const;

export type VaultCategory = typeof VaultCategory[keyof typeof VaultCategory];

export const VaultItemType = {
  PASSWORD: 'PASSWORD',
  CODE: 'CODE',
  COMMAND: 'COMMAND',
  NOTE: 'NOTE',
} as const;

export type VaultItemType = typeof VaultItemType[keyof typeof VaultItemType];

// ── Display helpers (what the sidebar shows) ──────────────────────────────────

/** Maps the backend enum to the human-readable sidebar label */
export const CATEGORY_DISPLAY: Record<VaultCategory, string> = {
  [VaultCategory.PERSONAL]: 'Personal',
  [VaultCategory.WORK]:     'Work',
  [VaultCategory.NOTES]:    'Notes',
};

/** Maps the sidebar label back to the backend enum */
export const CATEGORY_FROM_DISPLAY: Record<string, VaultCategory> = {
  Personal: VaultCategory.PERSONAL,
  Work:     VaultCategory.WORK,
  Notes:    VaultCategory.NOTES,
};

// ── Vault item shapes ─────────────────────────────────────────────────────────

/** What the API returns for a vault item */
export interface VaultItemResponse {
  id:           string;
  userId:       string;
  label:        string;
  category:     VaultCategory;
  type:         VaultItemType;
  content?:     string;
  tags?:        string[];
  accessCount?: number;
  lastAccessed?: string;
  updatedAt?:   string;
}

/** What we send to create a vault item */
export interface CreateVaultItemRequest {
  userId:   string;
  label:    string;
  category: VaultCategory;
  type:     VaultItemType;
  content?: string;
  tags?:    string[];
}

/** What we send to update a vault item */
export interface UpdateVaultItemRequest extends CreateVaultItemRequest {
  id: string;
}