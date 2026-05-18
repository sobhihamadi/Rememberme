import crypto from "crypto";
import config from "../config";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { identifierVaultItem } from "../model/VaultItem.model";
import { IRepository, ID } from "../repository/IRepository";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";

/**
 * Specialized repository interface for Vault Items to include 
 * the filtering logic used in the UI/Service layer.
 */
export interface IVaultRepository extends IRepository<identifierVaultItem> {
    getByFilter(userId: string, category: VaultCategory, type: VaultItemType): Promise<identifierVaultItem[]>;
}

export class VaultService {
    private readonly algorithm = "aes-256-cbc";
    // Uses a defined secret or generates a fallback (fallback not recommended for production persistence)
    private readonly secretKey: Buffer = config.encryption.secretKey
    ? Buffer.from(config.encryption.secretKey, "hex")
    : crypto.randomBytes(32);

    constructor(private readonly vaultRepository: IVaultRepository) {}

    /**
     * Creates a new vault item, encrypting content if present.
     */
    public async createVaultItem(item: identifierVaultItem): Promise<identifierVaultItem> {
        this.validateVaultItem(item);

        if (item.getContent()) {
            this.encryptItemContent(item);
        }

        await this.vaultRepository.create(item);
        return item;
    }

    /**
     * Retrieves a vault item by ID and decrypts its content for use.
     */
    public async getVaultItemById(id: ID): Promise<identifierVaultItem> {
        const item = await this.vaultRepository.get(id);
        
        if (!item) {
            throw new NotFoundException(`Vault item with id ${id} not found`);
        }

        if (item.getEncryptedValue() && item.getEncryptionIv()) {
            this.decryptItemContent(item);
        }

        return item;
    }

    /**
     * Updates an existing vault item, re-encrypting if content is updated.
     */
    public async updateVaultItem(item: identifierVaultItem): Promise<void> {
        this.validateVaultItem(item);

        const existing = await this.vaultRepository.get(item.getid());
        if (!existing) {
            throw new NotFoundException(`Vault item with id ${item.getid()} not found`);
        }

        if (item.getContent()) {
            this.encryptItemContent(item);
        }

        await this.vaultRepository.update(item);
    }

    /**
     * Deletes a vault item by ID.
     */
    public async deleteVaultItem(id: ID): Promise<void> {
        const existing = await this.vaultRepository.get(id);
        if (!existing) {
            throw new NotFoundException(`Vault item with id ${id} not found`);
        }

        await this.vaultRepository.delete(id);
    }

    /**
     * Retrieves all items for a specific user and context, ensuring all are decrypted.
     */
    public async getItemsByContext(userId: string, category: VaultCategory, type: VaultItemType): Promise<identifierVaultItem[]> {
        if (!userId || !category || !type) {
            throw new BadRequestException("User ID, Category, and Type are required for filtered retrieval");
        }

        const items = await this.vaultRepository.getByFilter(userId, category, type);
        
        // Decrypt all retrieved items in the list
        items.forEach(item => {
            if (item.getEncryptedValue() && item.getEncryptionIv()) {
                this.decryptItemContent(item);
            }
        });

        return items;
    }

    /**
     * Internal validation logic matching the OrderManagement style.
     */
    private validateVaultItem(item: identifierVaultItem): void {
        if (!item.getUserId() || !item.getLabel() || !item.getCategory() || !item.getType()) {
            const details = {
                UserNotDefined: !item.getUserId(),
                LabelNotDefined: !item.getLabel(),
                CategoryNotDefined: !item.getCategory(),
                TypeNotDefined: !item.getType()
            };
            throw new BadRequestException("Invalid vault item: userId, label, category, and type are required", details);
        }
    }

    /**
     * AES Encryption logic. Clears plain text after processing to ensure 
     * sensitive data doesn't leak into logs or unencrypted DB fields.
     */
    private encryptItemContent(item: identifierVaultItem): void {
        const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        
        let encrypted = cipher.update(item.getContent(), "utf8", "hex");
        encrypted += cipher.final("hex");

        item.setEncryptedValue(encrypted);
        item.setEncryptionIv(iv.toString("hex"));
        // Security: clear plain text before it leaves the service layer
        item.setContent(""); 
    }

    /**
     * AES Decryption logic. Populates the content field from the encrypted value.
     */
    private decryptItemContent(item: identifierVaultItem): void {
        try {
            const iv = Buffer.from(item.getEncryptionIv(), "hex");
const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
            
            let decrypted = decipher.update(item.getEncryptedValue(), "hex", "utf8");
            decrypted += decipher.final("utf8");

            item.setContent(decrypted);
        } catch (error) {
            // Handle cases where decryption might fail (e.g., wrong key/corrupt data)
            item.setContent("[DECRYPTION_FAILED]");
        }
    }
}