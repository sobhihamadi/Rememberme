import { Request, Response, NextFunction } from "express";
import { VaultAiService, VaultAction } from "../services/Vaultaiservice";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";

export class AiController {
    constructor(private readonly vaultAiService: VaultAiService) {
        this.ask = this.ask.bind(this);
    }

    /**
     * POST /api/v1/ai/ask
     *
     * Body: { userId, category, type, action, message }
     *
     * action = "save"     → user clicked "New Vault"  button
     * action = "retrieve" → user clicked "My Vault"   button
     *                       (update + delete detected inside chat)
     */
    public async ask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, category, type, action, message } = req.body;

            // ── Validate required fields ──────────────────────────────────
            if (!userId || !category || !type || !action || !message) {
                throw new BadRequestException(
                    "userId, category, type, action, and message are required",
                    {
                        UserIdMissing:   !userId,
                        CategoryMissing: !category,
                        TypeMissing:     !type,
                        ActionMissing:   !action,
                        MessageMissing:  !message,
                    }
                );
            }

            // ── Validate category ─────────────────────────────────────────
            if (!Object.values(VaultCategory).includes(category as VaultCategory)) {
                throw new BadRequestException(
                    `Invalid category: "${category}". Must be one of: ${Object.values(VaultCategory).join(", ")}`
                );
            }

            // ── Validate type ─────────────────────────────────────────────
            if (!Object.values(VaultItemType).includes(type as VaultItemType)) {
                throw new BadRequestException(
                    `Invalid type: "${type}". Must be one of: ${Object.values(VaultItemType).join(", ")}`
                );
            }

            // ── Validate action ───────────────────────────────────────────
            const validActions: VaultAction[] = ["save", "retrieve"];
            if (!validActions.includes(action as VaultAction)) {
                throw new BadRequestException(
                    `Invalid action: "${action}". Must be "save" or "retrieve".`
                );
            }

            // ── Call AI service ───────────────────────────────────────────
            const reply = await this.vaultAiService.ask(
                userId,
                category as VaultCategory,
                type     as VaultItemType,
                action   as VaultAction,
                message
            );

            res.status(200).json({ reply });

        } catch (error) {
            next(error);
        }
    }
}