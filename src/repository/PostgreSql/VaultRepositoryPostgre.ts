//vaultRepositoryPostgre.ts
import { ConnectionManager } from "./ConnectionManager";
import { identifierVaultItem } from "../../model/VaultItem.model";
import { VaultCategory, VaultItemType } from "../../model/IVaultItem.model";
import { IVaultRow, PostgreVaultMapper } from "../../mappers/VaultMapper";
import { ID, IRepository, Initializable } from "../IRepository";
import logger from "../../util/logger";

const CREATE_VAULT_TABLE = `
    CREATE TABLE IF NOT EXISTS vault_items (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "encryptedValue" TEXT,
        "encryptionIv" TEXT,
        "content" TEXT,
        "tags" TEXT[],
        "accessCount" INTEGER DEFAULT 0,
        "lastAccessed" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
    );
`;

export class VaultRepositoryPostgre implements IRepository<identifierVaultItem>, Initializable {
    private mapper = new PostgreVaultMapper();

    async init(): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query(CREATE_VAULT_TABLE);
        logger.info("Vault table initialized.");
    }

    async create(item: identifierVaultItem): Promise<ID> {
        const conn = await ConnectionManager.getPostgreConnection();
        const query = `
            INSERT INTO vault_items 
            ("id", "userId", "category", "type", "label", "encryptedValue", "encryptionIv", "content", "tags", "accessCount", "lastAccessed", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        await conn.query(query, [
            item.getid(), item.getUserId(), item.getCategory(), item.getType(), item.getLabel(),
            item.getEncryptedValue(), item.getEncryptionIv(), item.getContent(), item.getTags(),
            item.getAccessCount(), item.getLastAccessed(), item.getCreatedAt(), item.getUpdatedAt()
        ]);
        return item.getid();
    }

    // New Filtered Retrieval for your UI logic
    async getByFilter(userId: string, category: VaultCategory, type: VaultItemType): Promise<identifierVaultItem[]> {
        const conn = await ConnectionManager.getPostgreConnection();
        const query = `SELECT * FROM vault_items WHERE "userId" = $1 AND "category" = $2 AND "type" = $3 ORDER BY "updatedAt" DESC`;
        const result = await conn.query<IVaultRow>(query, [userId, category, type]);
        return result.rows.map((row: IVaultRow) => this.mapper.map(row));

    }

    async get(id: ID): Promise<identifierVaultItem> {
        const conn = await ConnectionManager.getPostgreConnection();
        const result = await conn.query<IVaultRow>(`SELECT * FROM vault_items WHERE id = $1`, [id]);
        if (result.rows.length === 0) throw new Error("Item not found");
        return this.mapper.map(result.rows[0]);
    }

    async update (item: identifierVaultItem): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();
        const query = `
            UPDATE vault_items SET 
            "userId" = $1, "category" = $2, "type" = $3, "label" = $4, 
            "encryptedValue" = $5, "encryptionIv" = $6, "content" = $7, 
            "tags" = $8, "accessCount" = $9, "lastAccessed" = $10, 
            "createdAt" = $11, "updatedAt" = $12
            WHERE id = $13
        `;
        await conn.query(query, [
            item.getUserId(), item.getCategory(), item.getType(), item.getLabel(),
            item.getEncryptedValue(), item.getEncryptionIv(), item.getContent(), item.getTags(),
            item.getAccessCount(), item.getLastAccessed(), item.getCreatedAt(), new Date(), // Update timestamp
            item.getid()
        ]);
    }

    async delete(id: ID): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query(`DELETE FROM vault_items WHERE id = $1`, [id]);
        logger.info(`Item deleted: ${id}`);
        
    }
}