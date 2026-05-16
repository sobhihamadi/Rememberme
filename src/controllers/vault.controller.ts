import { Request, Response, NextFunction } from "express";
import { VaultService } from "../services/Vault.service";
import { IdentifierVaultItem } from "../model/VaultItem.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";

export class VaultController {
    constructor(private readonly vaultService: VaultService) {
        // Bind all methods so they keep the correct `this` when passed to Express
        this.createVaultItem     = this.createVaultItem.bind(this);
        this.getVaultItemById    = this.getVaultItemById.bind(this);
        this.getItemsByContext   = this.getItemsByContext.bind(this);
        this.updateVaultItem     = this.updateVaultItem.bind(this);
        this.deleteVaultItem     = this.deleteVaultItem.bind(this);
    }

    // ── POST /api/v1/vault ───────────────────────────────────────────────────

    public async createVaultItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, label, category, type, content, tags } = req.body;

            if (!userId || !label || !category || !type) {
                throw new BadRequestException("userId, label, category, and type are required", {
                    UserIdMissing:  !userId,
                    LabelMissing:   !label,
                    CategoryMissing: !category,
                    TypeMissing:    !type,
                });
            }

            // Use the static factory — no more "Property 'create' does not exist" error
            const item = IdentifierVaultItem.create({
                userId,
                label,
                category: category as VaultCategory,
                type:     type     as VaultItemType,
                content,
                tags,
            });

            const created = await this.vaultService.createVaultItem(item);

            res.status(201).json({
                id:       created.getid(),
                userId:   created.getUserId(),
                label:    created.getLabel(),
                category: created.getCategory(),
                type:     created.getType(),
            });
        } catch (error) {
            next(error);
        }
    }

    // ── GET /api/v1/vault/:id ────────────────────────────────────────────────

    public async getVaultItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // req.params values are always strings in Express — cast is safe here
            const id = req.params.id as string;

            if (!id) {
                throw new BadRequestException("Vault item ID is required", {
                    ItemIdMissing: true,
                });
            }

            const item = await this.vaultService.getVaultItemById(id);

            res.status(200).json({
                id:       item.getid(),
                userId:   item.getUserId(),
                label:    item.getLabel(),
                category: item.getCategory(),
                type:     item.getType(),
                content:  item.getContent(),
                tags:     item.getTags(),
            });
        } catch (error) {
            next(error);
        }
    }

    // ── GET /api/v1/vault?userId=&category=&type= ────────────────────────────

    public async getItemsByContext(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // req.query values can be string | string[] | ParsedQs — cast each one
            const userId   = req.query.userId   as string;
            const category = req.query.category as VaultCategory;
            const type     = req.query.type     as VaultItemType;

            if (!userId || !category || !type) {
                throw new BadRequestException("userId, category, and type query params are required", {
                    UserIdMissing:   !userId,
                    CategoryMissing: !category,
                    TypeMissing:     !type,
                });
            }

            const items = await this.vaultService.getItemsByContext(userId, category, type);

            res.status(200).json(
                items.map((item) => ({
                    id:           item.getid(),
                    userId:       item.getUserId(),
                    label:        item.getLabel(),
                    category:     item.getCategory(),
                    type:         item.getType(),
                    content:      item.getContent(),
                    tags:         item.getTags(),
                    accessCount:  item.getAccessCount(),
                    lastAccessed: item.getLastAccessed(),
                    updatedAt:    item.getUpdatedAt(),
                }))
            );
        } catch (error) {
            next(error);
        }
    }

    // ── PUT /api/v1/vault/:id ────────────────────────────────────────────────

    public async updateVaultItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;

            if (!id) {
                throw new BadRequestException("Vault item ID is required", {
                    ItemIdMissing: true,
                });
            }

            const { userId, label, category, type, content, tags } = req.body;

            if (!userId || !label || !category || !type) {
                throw new BadRequestException("userId, label, category, and type are required", {
                    UserIdMissing:   !userId,
                    LabelMissing:    !label,
                    CategoryMissing: !category,
                    TypeMissing:     !type,
                });
            }

            // Pass the existing id so the service knows which record to update
            const item = IdentifierVaultItem.create({
                id,
                userId,
                label,
                category: category as VaultCategory,
                type:     type     as VaultItemType,
                content,
                tags,
            });

            await this.vaultService.updateVaultItem(item);

            res.status(200).json({ message: "Vault item updated successfully" });
        } catch (error) {
            next(error);
        }
    }

    // ── DELETE /api/v1/vault/:id ─────────────────────────────────────────────

    public async deleteVaultItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;

            if (!id) {
                throw new BadRequestException("Vault item ID is required", {
                    ItemIdMissing: true,
                });
            }

            await this.vaultService.deleteVaultItem(id);

            res.status(200).json({ message: "Vault item deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
}