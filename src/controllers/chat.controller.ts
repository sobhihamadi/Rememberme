import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service";
import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";

export class ChatController {
    constructor(private readonly chatService: ChatService) {
        this.createMessage       = this.createMessage.bind(this);
        this.getChatContext      = this.getChatContext.bind(this);
        this.getFormattedHistory = this.getFormattedHistory.bind(this);
    }

    // ── POST /api/v1/chat ────────────────────────────────────────────────────
    // Saves one turn of the conversation (either the user's message or
    // the AI's response). The frontend calls this twice per exchange.

    public async createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, content, role, categoryContext, typeContext } = req.body;

            if (!userId || !content || !role) {
                throw new BadRequestException("userId, content, and role are required", {
                    UserIdMissing:  !userId,
                    ContentMissing: !content,
                    RoleMissing:    !role,
                });
            }

            if (!Object.values(ChatRole).includes(role as ChatRole)) {
                throw new BadRequestException(
                    `Invalid role: ${role}. Must be one of: ${Object.values(ChatRole).join(", ")}`,
                    { InvalidRole: true }
                );
            }

            const message = IdentifierChatMessage.create({
                userId,
                content,
                role:            role            as ChatRole,
                categoryContext: categoryContext as VaultCategory,
                typeContext:     typeContext     as VaultItemType,
            });

            const created = await this.chatService.createMessage(message);

            res.status(201).json({
                id:              created.getid(),
                userId:          created.getUserId(),
                content:         created.getContent(),
                role:            created.getRole(),
                categoryContext: created.getCategoryContext(),
                typeContext:     created.getTypeContext(),
                createdAt:       created.getCreatedAt(),
            });
        } catch (error) {
            next(error);
        }
    }

    // ── GET /api/v1/chat?userId=&category=&type= ─────────────────────────────
    // Loads the full ordered conversation for a vault context.
    // The frontend calls this on mount to hydrate the chat window.

    public async getChatContext(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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

            const messages = await this.chatService.getChatContext(userId, category, type);

            res.status(200).json(
                messages.map((msg) => ({
                    id:              msg.getid(),
                    userId:          msg.getUserId(),
                    content:         msg.getContent(),
                    role:            msg.getRole(),
                    categoryContext: msg.getCategoryContext(),
                    typeContext:     msg.getTypeContext(),
                    createdAt:       msg.getCreatedAt(),
                }))
            );
        } catch (error) {
            next(error);
        }
    }

    // ── GET /api/v1/chat/formatted?userId=&category=&type= ───────────────────
    // Returns the history already shaped for the Claude API messages array:
    // [{ role: "user" | "assistant", content: string }, ...]
    // The AI service layer calls this before building its API request.

    public async getFormattedHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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

            const formatted = await this.chatService.constructSystemPromptAndHistory(
                userId,
                category,
                type
            );

            res.status(200).json(formatted);
        } catch (error) {
            next(error);
        }
    }
}