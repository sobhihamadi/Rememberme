import { identifierVaultItem } from "../model/VaultItem.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";


// Interface for what the DB returns for Vault
export interface IVaultRow {
    id: string;
    userId: string;
    category: VaultCategory;
    type: VaultItemType;
    label: string;
    encryptedValue: string;
    encryptionIv: string;
    content: string;
    tags: string[]; // PG driver handles TEXT[] as JS Array automatically
    accessCount: number;
    lastAccessed: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export class PostgreVaultMapper {
    map(row: IVaultRow): identifierVaultItem {
        return new identifierVaultItem(
            row.id, row.userId, row.category, row.type, row.label,
            row.encryptedValue, row.encryptionIv, row.content, row.tags,
            row.accessCount, row.lastAccessed, row.createdAt, row.updatedAt
        );
    }
}