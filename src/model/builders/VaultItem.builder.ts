import logger from '../../util/logger';
import { VaultItem, IdentifierVaultItem} from '../VaultItem.model';
import { VaultCategory, VaultItemType } from '../IVaultItem.model';
import { ID } from '../../repository/IRepository';

export class vaultitembuilder {
    private userId!: string;
    private category!: VaultCategory;
    private type!: VaultItemType;
    private label!: string;
    private encryptedValue!: string;
    private encryptionIv!: string;
    private content!: string;
    private tags!: string[];
    private accessCount!: number;
    private lastAccessed: Date | null = null;
    private createdAt!: Date;
    private updatedAt!: Date;

    public static newbuilder(): vaultitembuilder {
        return new vaultitembuilder();
    }

    setUserId(userId: string): vaultitembuilder { this.userId = userId; return this; }
    setCategory(category: VaultCategory): vaultitembuilder { this.category = category; return this; }
    setType(type: VaultItemType): vaultitembuilder { this.type = type; return this; }
    setLabel(label: string): vaultitembuilder { this.label = label; return this; }
    setEncryptedValue(val: string): vaultitembuilder { this.encryptedValue = val; return this; }
    setEncryptionIv(iv: string): vaultitembuilder { this.encryptionIv = iv; return this; }
    setContent(content: string): vaultitembuilder { this.content = content; return this; }
    setTags(tags: string[]): vaultitembuilder { this.tags = tags; return this; }
    setAccessCount(count: number): vaultitembuilder { this.accessCount = count; return this; }
    setLastAccessed(date: Date | null): vaultitembuilder { this.lastAccessed = date; return this; }
    setCreatedAt(date: Date): vaultitembuilder { this.createdAt = date; return this; }
    setUpdatedAt(date: Date): vaultitembuilder { this.updatedAt = date; return this; }

    build(): VaultItem {
        const requiredFields = [
            this.userId, this.category, this.type, this.label, 
            this.encryptedValue, this.encryptionIv, this.createdAt, this.updatedAt
        ];

        for (const field of requiredFields) {
            if (field === undefined || field === null) {
                logger.error('Required field is missing in VaultItemBuilder');
                throw new Error('Required field is missing');
            }
        }

        return new VaultItem(
            this.userId, this.category, this.type, this.label,
            this.encryptedValue, this.encryptionIv, this.content, this.tags,
            this.accessCount, this.lastAccessed, this.createdAt, this.updatedAt
        );
    }
}

export class IdentifierVaultItemBuilder {
    private _id!: ID;
    private vaultItem!: VaultItem;

    public static NewBuilder(): IdentifierVaultItemBuilder {
        return new IdentifierVaultItemBuilder();
    }

    SetId(id: ID): IdentifierVaultItemBuilder {
        if (!id) {
            logger.error('ID cannot be empty');
            throw new Error('ID cannot be empty');
        }
        this._id = id;
        return this;
    }

    SetVaultItem(vaultItem: VaultItem): IdentifierVaultItemBuilder {
        if (!vaultItem) {
            logger.error('VaultItem cannot be null');
            throw new Error('VaultItem cannot be null');
        }
        this.vaultItem = vaultItem;
        return this;
    }

    Build(): IdentifierVaultItem {
        if (!this._id || !this.vaultItem) {
            logger.error('ID or VaultItem is missing');
            throw new Error('ID or VaultItem is missing');
        }

        return new IdentifierVaultItem(
            this._id,
            this.vaultItem.getUserId(),
            this.vaultItem.getCategory(),
            this.vaultItem.getType(),
            this.vaultItem.getLabel(),
            this.vaultItem.getEncryptedValue(),
            this.vaultItem.getEncryptionIv(),
            this.vaultItem.getContent(),
            this.vaultItem.getTags(),
            this.vaultItem.getAccessCount(),
            this.vaultItem.getLastAccessed(),
            this.vaultItem.getCreatedAt(),
            this.vaultItem.getUpdatedAt()
        );
    }
}