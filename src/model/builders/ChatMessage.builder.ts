import { ChatMessage, IdentifierChatMessage } from "../ChatMessage.model";
import { ChatRole } from "../IChatMessage.model";
import { VaultCategory, VaultItemType } from "../IVaultItem.model";
import { ID } from "../../repository/IRepository";
import logger from "../../util/logger";

export class ChatMessageBuilder {
    private userId!: string;
    private content!: string;
    private role!: ChatRole;
    private categoryContext!: VaultCategory;
    private typeContext!: VaultItemType;
    private createdAt!: Date;

    public static newBuilder(): ChatMessageBuilder {
        return new ChatMessageBuilder();
    }

    setUserId(userId: string): ChatMessageBuilder {
        this.userId = userId;
        return this;
    }

    setContent(content: string): ChatMessageBuilder {
        this.content = content;
        return this;
    }

    setRole(role: ChatRole): ChatMessageBuilder {
        this.role = role;
        return this;
    }

    setCategoryContext(categoryContext: VaultCategory): ChatMessageBuilder {
        this.categoryContext = categoryContext;
        return this;
    }

    setTypeContext(typeContext: VaultItemType): ChatMessageBuilder {
        this.typeContext = typeContext;
        return this;
    }

    setCreatedAt(createdAt: Date): ChatMessageBuilder {
        this.createdAt = createdAt;
        return this;
    }

    build(): ChatMessage {
        const requiredFields = [this.userId, this.content, this.role, this.categoryContext, this.typeContext, this.createdAt];
        for (const field of requiredFields) {
            if (field === undefined || field === null) {
                logger.error('Required field is missing, could not build ChatMessage');
                throw new Error('Required field is missing');
            }
        }
        return new ChatMessage(
            this.userId,
            this.content,
            this.role,
            this.categoryContext,
            this.typeContext,
            this.createdAt
        );
    }
}

export class IdentifierChatMessageBuilder {
    private id!: ID;
    private chatMessage!: ChatMessage;

    public static NewBuilder(): IdentifierChatMessageBuilder {
        return new IdentifierChatMessageBuilder();
    }

    SetId(id: ID): IdentifierChatMessageBuilder {
        if (!id) {
            logger.error('ID cannot be empty');
            throw new Error('ID cannot be empty');
        }
        this.id = id;
        return this;
    }

    SetChatMessage(chatMessage: ChatMessage): IdentifierChatMessageBuilder {
        this.chatMessage = chatMessage;
        return this;
    }

    Build(): IdentifierChatMessage {
        if (!this.id || !this.chatMessage) {
            logger.error('ID and ChatMessage are required to build IdentifierChatMessage');
            throw new Error('ID and ChatMessage are required to build IdentifierChatMessage');
        }

        return new IdentifierChatMessage(
            this.id,
            this.chatMessage.getUserId(),
            this.chatMessage.getContent(),
            this.chatMessage.getRole(),
            this.chatMessage.getCategoryContext(),
            this.chatMessage.getTypeContext(),
            this.chatMessage.getCreatedAt()
        );
    }
}