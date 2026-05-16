/// <reference types="jest" />


import { identifierVaultItem } from "../../src/model/VaultItem.model";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";
import { VaultRepositoryPostgre } from "../../src/repository/PostgreSql/VaultRepositoryPostgre";
import { ConnectionManager } from "../../src/repository/PostgreSql/ConnectionManager";

// IMPORTANT: mock ConnectionManager BEFORE importing it from the test
jest.mock("../../src/repository/PostgreSql/ConnectionManager", () => {
    const vaultItems = new Map<string, any>();

    const pool = {
        query: jest.fn(async (sql: string, params?: any[]) => {
            const trimmed = sql.trim();

            if (trimmed.startsWith("CREATE TABLE IF NOT EXISTS vault_items")) {
                return { rows: [] };
            }

            if (trimmed.startsWith("TRUNCATE TABLE vault_items")) {
                vaultItems.clear();
                return { rows: [] };
            }

            if (trimmed.startsWith("INSERT INTO vault_items")) {
                const [
                    id, userId, category, type, label, encryptedValue,
                    encryptionIv, content, tags, accessCount, lastAccessed,
                    createdAt, updatedAt
                ] = params ?? [];
                
                if (vaultItems.has(id)) {
                    throw new Error('duplicate key value violates unique constraint "vault_items_pkey"');
                }
                
                vaultItems.set(id, {
                    id, userId, category, type, label, encryptedValue, 
                    encryptionIv, content, tags, accessCount, lastAccessed, 
                    createdAt, updatedAt
                });
                return { rows: [] };
            }

            if (trimmed.startsWith("UPDATE vault_items SET")) {
                // Assuming standard update params matching your model
                const [
                    userId, category, type, label, encryptedValue, 
                    encryptionIv, content, tags, accessCount, lastAccessed, 
                    updatedAt, id
                ] = params ?? [];

                const existing = vaultItems.get(id);
                if (existing) {
                    existing.userId = userId;
                    existing.category = category;
                    existing.type = type;
                    existing.label = label;
                    existing.encryptedValue = encryptedValue;
                    existing.encryptionIv = encryptionIv;
                    existing.content = content;
                    existing.tags = tags;
                    existing.accessCount = accessCount;
                    existing.lastAccessed = lastAccessed;
                    existing.updatedAt = updatedAt;
                }
                return { rows: [] };
            }

            if (trimmed.startsWith("DELETE FROM vault_items WHERE")) {
                const [id] = params ?? [];
                vaultItems.delete(id);
                return { rows: [] };
            }

            if (trimmed.startsWith("SELECT * FROM vault_items WHERE id = $1")) {
                const [id] = params ?? [];
                const row = vaultItems.get(id);
                return { rows: row ? [row] : [] };
            }

            if (trimmed.startsWith("SELECT * FROM vault_items WHERE \"userId\" = $1 AND \"category\" = $2 AND \"type\" = $3")) {
                const [userId, category, type] = params ?? [];
                const rows = Array.from(vaultItems.values()).filter(
                    item => item.userId === userId && item.category === category && item.type === type
                );
                // Sort by updatedAt DESC
                rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                return { rows };
            }

            return { rows: [] };
        }),
        end: jest.fn(async () => {}),
    };

    return {
        ConnectionManager: {
            getPostgreConnection: jest.fn().mockResolvedValue(pool),
        },
    };
});

describe("VaultRepositoryPostgre", () => {
    const repo = new VaultRepositoryPostgre();

    beforeAll(async () => {
        await repo.init();
    });

    beforeEach(async () => {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query("TRUNCATE TABLE vault_items RESTART IDENTITY CASCADE;");
    });

    afterAll(async () => {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.end();
    });

    it("should create a vault item", async () => {
        const id = `vault-${Math.random().toString(36).slice(2, 10)}`;
        const item = new identifierVaultItem(
            id, "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD, 
            "Netflix Password", "encrypted_str", "iv_str", "", 
            ["entertainment"], 0, null, new Date(), new Date()
        );

        const savedId = await repo.create(item);
        const fetched = await repo.get(savedId);

        expect(fetched.getid()).toBe(id);
        expect(fetched.getLabel()).toBe("Netflix Password");
        expect(fetched.getCategory()).toBe(VaultCategory.PERSONAL);
    });

    it("should fail to create an item with duplicate ID", async () => {
        const id = "duplicate-id-123";
        const item = new identifierVaultItem(
            id, "user-123", VaultCategory.WORK, VaultItemType.COMMAND, 
            "Docker build", "", "", "docker-compose up -d", 
            ["docker"], 0, null, new Date(), new Date()
        );

        await repo.create(item);
        await expect(repo.create(item)).rejects.toBeTruthy();
    });

    it("should get items by filter (userId, category, type)", async () => {
        const date1 = new Date("2026-05-10T10:00:00Z");
        const date2 = new Date("2026-05-11T10:00:00Z");

        const personalPassword1 = new identifierVaultItem(
            "id-1", "user-A", VaultCategory.PERSONAL, VaultItemType.PASSWORD, 
            "Spotify", "enc1", "iv1", "", [], 0, null, date1, date1
        );

        const personalPassword2 = new identifierVaultItem(
            "id-2", "user-A", VaultCategory.PERSONAL, VaultItemType.PASSWORD, 
            "Netflix", "enc2", "iv2", "", [], 0, null, date2, date2
        );

        const workNote = new identifierVaultItem(
            "id-3", "user-A", VaultCategory.WORK, VaultItemType.NOTE, 
            "Meeting Notes", "", "", "Blah blah", [], 0, null, date1, date1
        );

        await repo.create(personalPassword1);
        await repo.create(personalPassword2);
        await repo.create(workNote);

        const results = await repo.getByFilter("user-A", VaultCategory.PERSONAL, VaultItemType.PASSWORD);
        
        // Should only return 2 items, and the most recently updated one (date2) should be first
        expect(results.length).toBe(2);
        expect(results[0].getLabel()).toBe("Netflix");
        expect(results[1].getLabel()).toBe("Spotify");
    });
});