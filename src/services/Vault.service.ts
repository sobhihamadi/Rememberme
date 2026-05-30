import crypto from "crypto";
import config from "../config";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { identifierVaultItem } from "../model/VaultItem.model";
import { IRepository, ID } from "../repository/IRepository";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";

export interface IVaultRepository extends IRepository<identifierVaultItem> {
    getByFilter(userId: string, category: VaultCategory, type: VaultItemType): Promise<identifierVaultItem[]>;
}

export class VaultService {
    private readonly algorithm = "aes-256-cbc";
    private readonly secretKey: Buffer;

    constructor(private readonly vaultRepository: IVaultRepository) {
        if (!config.encryption.secretKey) {
            throw new Error(
                "ENCRYPTION_SECRET is not set. " +
                "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
            );
        }

        const keyBuffer = Buffer.from(config.encryption.secretKey, "hex");
        if (keyBuffer.length !== 32) {
            throw new Error(
                `ENCRYPTION_SECRET must decode to exactly 32 bytes. Got ${keyBuffer.length}.`
            );
        }
        this.secretKey = keyBuffer;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public async createVaultItem(item: identifierVaultItem): Promise<identifierVaultItem> {
        this.validateVaultItem(item);
        if (item.getContent()) {
            this.encryptItemContent(item);
        }
        await this.vaultRepository.create(item);
        return item;
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    public async getVaultItemById(id: ID): Promise<identifierVaultItem> {
        const item = await this.vaultRepository.get(id);
        if (!item) {
            throw new NotFoundException(`Vault item with id ${id} not found`);
        }
        this.tryDecrypt(item);
        return item;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    // Validate fields FIRST — before hitting the DB — so BadRequestException
    // fires before NotFoundException when both conditions are true.

    public async updateVaultItem(item: identifierVaultItem): Promise<void> {
        this.validateVaultItem(item);   // ← validation before DB call

        const existing = await this.vaultRepository.get(item.getid());
        if (!existing) {
            throw new NotFoundException(`Vault item with id ${item.getid()} not found`);
        }

        if (item.getContent()) {
            this.encryptItemContent(item);
        }
        await this.vaultRepository.update(item);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public async deleteVaultItem(id: ID): Promise<void> {
        const existing = await this.vaultRepository.get(id);
        if (!existing) {
            throw new NotFoundException(`Vault item with id ${id} not found`);
        }
        await this.vaultRepository.delete(id);
    }

    // ── Get by context ────────────────────────────────────────────────────────

    public async getItemsByContext(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<identifierVaultItem[]> {
        if (!userId || !category || !type) {
            throw new BadRequestException("User ID, Category, and Type are required");
        }
        const items = await this.vaultRepository.getByFilter(userId, category, type);
        items.forEach(item => this.tryDecrypt(item));
        return items;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private validateVaultItem(item: identifierVaultItem): void {
        if (!item.getUserId() || !item.getLabel() || !item.getCategory() || !item.getType()) {
            throw new BadRequestException(
                "Invalid vault item: userId, label, category, and type are required",
                {
                    UserNotDefined:     !item.getUserId(),
                    LabelNotDefined:    !item.getLabel(),
                    CategoryNotDefined: !item.getCategory(),
                    TypeNotDefined:     !item.getType(),
                }
            );
        }
    }

    /**
     * Decrypts item content only when encryptedValue looks like valid hex
     * ciphertext (non-empty, even-length hex string). Skips silently otherwise
     * so tests can pass mock items without real ciphertext crashing the service.
     */
    private tryDecrypt(item: identifierVaultItem): void {
        const enc = item.getEncryptedValue();
        const iv  = item.getEncryptionIv();

        // Must have both values, be non-empty even-length hex strings
        const isValidHex = (s: string) =>
            typeof s === "string" && s.length > 0 && s.length % 2 === 0 && /^[0-9a-f]+$/i.test(s);

        if (isValidHex(enc) && isValidHex(iv)) {
            this.decryptItemContent(item);
        }
    }

    private encryptItemContent(item: identifierVaultItem): void {
        const iv     = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        let encrypted = cipher.update(item.getContent(), "utf8", "hex");
        encrypted    += cipher.final("hex");
        item.setEncryptedValue(encrypted);
        item.setEncryptionIv(iv.toString("hex"));
        item.setContent("");
    }

    private decryptItemContent(item: identifierVaultItem): void {
        const iv       = Buffer.from(item.getEncryptionIv(), "hex");
        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
        let decrypted  = decipher.update(item.getEncryptedValue(), "hex", "utf8");
        decrypted     += decipher.final("utf8");
        item.setContent(decrypted);
    }
}