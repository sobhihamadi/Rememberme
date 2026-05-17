import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { IChatRepository } from "../repository/Ichatrepository";

export class ChatService {
    constructor(private readonly chatRepository: IChatRepository) {}

    /**
     * Appends a new message (user turn or AI turn) to the conversation log.
     */
    public async createMessage(message: IdentifierChatMessage): Promise<IdentifierChatMessage> {
        this.validateMessage(message);
        await this.chatRepository.create(message);
        return message;
    }

    /**
     * Retrieves the full ordered conversation history for a vault context.
     */
    public async getChatContext(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<IdentifierChatMessage[]> {
        this.validateContext(userId, category, type);
        return this.chatRepository.getHistory(userId, category, type);
    }

    /**
     * Returns history already shaped for the Claude API messages array:
     * [{ role: "user" | "assistant", content: string }, ...]
     * The AI layer calls this before constructing its API request.
     */
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

    /**
     * Wipes the entire conversation log for a vault context.
     * Called by VaultService.deleteVaultItem — NOT exposed as an API endpoint.
     */
    public async clearHistory(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<void> {
        this.validateContext(userId, category, type);
        await this.chatRepository.deleteByContext(userId, category, type);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private validateMessage(message: IdentifierChatMessage): void {
        if (!message.getUserId() || !message.getContent() || !message.getRole()) {
            throw new BadRequestException("userId, content, and role are required", {
                UserNotDefined:  !message.getUserId(),
                ContentEmpty:    !message.getContent(),
                RoleNotDefined:  !message.getRole(),
            });
        }

        if (!Object.values(ChatRole).includes(message.getRole())) {
            throw new BadRequestException(`Invalid role: ${message.getRole()}`);
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