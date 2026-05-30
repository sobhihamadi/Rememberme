import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { IChatRepository } from "../repository/Ichatrepository";

export class ChatService {
    constructor(private readonly chatRepository: IChatRepository) {}

    public async createMessage(message: IdentifierChatMessage): Promise<IdentifierChatMessage> {
        this.validateMessage(message);
        await this.chatRepository.create(message);
        return message;
    }

    public async getChatContext(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<IdentifierChatMessage[]> {
        this.validateContext(userId, category, type);
        return this.chatRepository.getHistory(userId, category, type);
    }

    public async constructSystemPromptAndHistory(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<{ role: "user" | "assistant"; content: string }[]> {
        const history = await this.getChatContext(userId, category, type);
        return history.map((msg) => ({
            role: msg.getRole() === ChatRole.AI ? "assistant" : "user",
            content: msg.getContent(),
        }));
    }

    public async clearHistory(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<void> {
        this.validateContext(userId, category, type);
        await this.chatRepository.deleteByContext(userId, category, type);
    }

    private validateMessage(message: IdentifierChatMessage): void {
        const userId  = message.getUserId();
        const content = message.getContent();
        const role    = message.getRole();

        const userIdMissing  = typeof userId  !== "string" || userId.trim()  === "";
        const contentMissing = typeof content !== "string" || content.trim() === "";
        // role must be a string AND one of the known enum values
        const roleMissing    = typeof role !== "string" ||
                               !Object.values(ChatRole).includes(role as ChatRole);

        if (userIdMissing || contentMissing || roleMissing) {
            throw new BadRequestException("userId, content, and role are required", {
                UserNotDefined: userIdMissing,
                ContentEmpty:   contentMissing,
                RoleNotDefined: roleMissing,
            });
        }
    }

    private validateContext(userId: string, category: VaultCategory, type: VaultItemType): void {
        if (!userId || !category || !type) {
            throw new BadRequestException("userId, category, and type are required", {
                UserIdMissing:   !userId,
                CategoryMissing: !category,
                TypeMissing:     !type,
            });
        }
    }
}