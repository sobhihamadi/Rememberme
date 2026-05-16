import { ID } from "../repository/IRepository";
import { VaultCategory, VaultItemType } from "./IVaultItem.model";

export class VaultItem {
    private userId: string;
    private category: VaultCategory;
    private type: VaultItemType;
    private label: string;
    private encryptedValue: string;
    private encryptionIv: string;
    private content: string;
    private tags: string[];
    private accessCount: number;
    private lastAccessed: Date | null;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        userId: string, category: VaultCategory, type: VaultItemType, label: string,
        encryptedValue: string, encryptionIv: string, content: string, tags: string[],
        accessCount: number, lastAccessed: Date | null, createdAt: Date, updatedAt: Date
    ) {
        this.userId = userId;
        this.category = category;
        this.type = type;
        this.label = label;
        this.encryptedValue = encryptedValue;
        this.encryptionIv = encryptionIv;
        this.content = content;
        this.tags = tags;
        this.accessCount = accessCount;
        this.lastAccessed = lastAccessed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Getters ---
    getUserId(): string { return this.userId; }
    getCategory(): VaultCategory { return this.category; }
    getType(): VaultItemType { return this.type; }
    getLabel(): string { return this.label; }
    getEncryptedValue(): string { return this.encryptedValue; }
    getEncryptionIv(): string { return this.encryptionIv; }
    getContent(): string { return this.content; }
    getTags(): string[] { return this.tags; }
    getAccessCount(): number { return this.accessCount; }
    getLastAccessed(): Date | null { return this.lastAccessed; }
    getCreatedAt(): Date { return this.createdAt; }
    getUpdatedAt(): Date { return this.updatedAt; }

    // --- Setters for Service Logic ---
    setEncryptedValue(value: string): void { this.encryptedValue = value; }
    setEncryptionIv(iv: string): void { this.encryptionIv = iv; }
    setContent(content: string): void { this.content = content; }
    setUpdatedAt(date: Date): void { this.updatedAt = date; }
}

export class identifierVaultItem extends VaultItem {
    constructor(
        private id: ID,
        userId: string, category: VaultCategory, type: VaultItemType, label: string,
        encryptedValue: string, encryptionIv: string, content: string, tags: string[],
        accessCount: number, lastAccessed: Date | null, createdAt: Date, updatedAt: Date
    ) {
        super(userId, category, type, label, encryptedValue, encryptionIv, content, tags, accessCount, lastAccessed, createdAt, updatedAt);
    }

    getid(): ID {
        return this.id;
    }
}