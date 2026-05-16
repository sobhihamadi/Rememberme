import crypto from "crypto";
import { ID } from "../repository/IRepository";
import { IChatMessage, IIdentifierChatMessage, ChatRole } from "./IChatMessage.model";
import { VaultCategory, VaultItemType } from "./IVaultItem.model";

export class ChatMessage implements IChatMessage {
    private userId: string;
    private content: string;
    private role: ChatRole;
    private categoryContext: VaultCategory;
    private typeContext: VaultItemType;
    private createdAt: Date;

    constructor(
        userId: string,
        content: string,
        role: ChatRole,
        categoryContext: VaultCategory,
        typeContext: VaultItemType,
        createdAt: Date
    ) {
        this.userId = userId;
        this.content = content;
        this.role = role;
        this.categoryContext = categoryContext;
        this.typeContext = typeContext;
        this.createdAt = createdAt;
    }

    getUserId(): string { return this.userId; }
    getContent(): string { return this.content; }
    getRole(): ChatRole { return this.role; }
    getCategoryContext(): VaultCategory { return this.categoryContext; }
    getTypeContext(): VaultItemType { return this.typeContext; }
    getCreatedAt(): Date { return this.createdAt; }
}

export class IdentifierChatMessage extends ChatMessage implements IIdentifierChatMessage {
    constructor(
        private id: ID,
        userId: string,
        content: string,
        role: ChatRole,
        categoryContext: VaultCategory,
        typeContext: VaultItemType,
        createdAt: Date
    ) {
        super(userId, content, role, categoryContext, typeContext, createdAt);
    }

    getid(): ID { return this.id; }

    /**
     * Static factory — used by controllers to build a new message from raw
     * request body data without repeating the long constructor call.
     *
     * Sensible defaults:
     * - id        → crypto.randomUUID()
     * - createdAt → now
     */
    static create(data: {
        id?: string;
        userId: string;
        content: string;
        role: ChatRole;
        categoryContext?: VaultCategory;
        typeContext?: VaultItemType;
    }): IdentifierChatMessage {
        return new IdentifierChatMessage(
            data.id ?? crypto.randomUUID(),
            data.userId,
            data.content,
            data.role,
            data.categoryContext as VaultCategory,
            data.typeContext as VaultItemType,
            new Date()
        );
    }
}