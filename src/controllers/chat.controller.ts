import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service";
import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";

export class ChatController {
    constructor(private readonly chatService: ChatService) {
        // Bind all methods so they keep the correct `this` when passed to Express
        this.createMessage          = this.createMessage.bind(this);
        this.getMessageById         = this.getMessageById.bind(this);
        this.getChatContext         = this.getChatContext.bind(this);
        this.getFormattedHistory    = this.getFormattedHistory.bind(this);
        this.updateMessage          = this.updateMessage.bind(this);
        this.deleteMessage          = this.deleteMessage.bind(this);
    }

    // ── POST /api/v1/chat ────────────────────────────────────────────────────

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
                throw new BadRequestException(`Invalid role: ${role}. Must be one of: ${Object.values(ChatRole).join(", ")}`, {
                    InvalidRole: true,
                });
            }

            // Use the static factory — no more "Property 'create' does not exist" error
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

    // ── GET /api/v1/chat/:id ─────────────────────────────────────────────────

    public async getMessageById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // req.params values are always strings in Express — cast is safe here
            const id = req.params.id as string;

            if (!id) {
                throw new BadRequestException("Message ID is required", {
                    MessageIdMissing: true,
                });
            }

            const message = await this.chatService.getMessageById(id);

            res.status(200).json({
                id:              message.getid(),
                userId:          message.getUserId(),
                content:         message.getContent(),
                role:            message.getRole(),
                categoryContext: message.getCategoryContext(),
                typeContext:     message.getTypeContext(),
                createdAt:       message.getCreatedAt(),
            });
        } catch (error) {
            next(error);
        }
    }

    // ── GET /api/v1/chat?userId=&category=&type= ─────────────────────────────

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

            const formatted = await this.chatService.constructSystemPromptAndHistory(userId, category, type);

            res.status(200).json(formatted);
        } catch (error) {
            next(error);
        }
    }

    // ── PUT /api/v1/chat/:id ─────────────────────────────────────────────────

    public async updateMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;

            if (!id) {
                throw new BadRequestException("Message ID is required", {
                    MessageIdMissing: true,
                });
            }

            const { userId, content, role, categoryContext, typeContext } = req.body;

            if (!userId || !content || !role) {
                throw new BadRequestException("userId, content, and role are required", {
                    UserIdMissing:  !userId,
                    ContentMissing: !content,
                    RoleMissing:    !role,
                });
            }

            if (!Object.values(ChatRole).includes(role as ChatRole)) {
                throw new BadRequestException(`Invalid role: ${role}`, {
                    InvalidRole: true,
                });
            }

            const message = IdentifierChatMessage.create({
                id,
                userId,
                content,
                role:            role            as ChatRole,
                categoryContext: categoryContext as VaultCategory,
                typeContext:     typeContext     as VaultItemType,
            });

            await this.chatService.updateMessage(message);

            res.status(200).json({ message: "Chat message updated successfully" });
        } catch (error) {
            next(error);
        }
    }

    // ── DELETE /api/v1/chat/:id ──────────────────────────────────────────────

    public async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;

            if (!id) {
                throw new BadRequestException("Message ID is required", {
                    MessageIdMissing: true,
                });
            }

            await this.chatService.deleteMessage(id);

            res.status(200).json({ message: "Chat message deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
}