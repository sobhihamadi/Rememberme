import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";
import { IRepository, ID } from "../repository/IRepository";

// Extending the base repository to include domain-specific queries for chats
export interface IChatRepository extends IRepository<IdentifierChatMessage> {
    getHistory(userId: string, category: VaultCategory, type: VaultItemType): Promise<IdentifierChatMessage[]>;
}

export class ChatService {

    constructor(private readonly chatRepository: IChatRepository) {}

    // Create message
    public async createMessage(message: IdentifierChatMessage): Promise<IdentifierChatMessage> {
        this.validateMessage(message);
        
        await this.chatRepository.create(message);
        return message;
    }

    // Get message by ID
    public async getMessageById(messageId: ID): Promise<IdentifierChatMessage> {
        const message = await this.chatRepository.get(messageId);
        
        if (!message) {
            throw new NotFoundException(`Chat message with id ${messageId} not found`);
        }
        
        return message;
    }

    // Update message
    public async updateMessage(message: IdentifierChatMessage): Promise<void> {
        this.validateMessage(message);
        
        const existing = await this.chatRepository.get(message.getid());
        if (!existing) {
            throw new NotFoundException(`Chat message with id ${message.getid()} not found`);
        }
        
        await this.chatRepository.update(message);
    }

    // Delete message
    public async deleteMessage(messageId: ID): Promise<void> {
        const existing = await this.chatRepository.get(messageId);
        
        if (!existing) {
            throw new NotFoundException(`Chat message with id ${messageId} not found`);
        }
        
        await this.chatRepository.delete(messageId);
    }

    // Retrieve historical chat context
    public async getChatContext(userId: string, category: VaultCategory, type: VaultItemType): Promise<IdentifierChatMessage[]> {
        if (!userId || !category || !type) {
            throw new BadRequestException("User ID, Category, and Type are required to fetch chat context");
        }

        return await this.chatRepository.getHistory(userId, category, type);
    }

    // Construct formatted payload for LLM/AI consumption
    public async constructSystemPromptAndHistory(userId: string, category: VaultCategory, type: VaultItemType): Promise<any[]> {
        const history = await this.getChatContext(userId, category, type);
        
        // This formats the internal chat model into the structure required by an AI provider (e.g., Gemini/OpenAI)
        const formattedHistory = history.map(msg => ({
            role: msg.getRole() === ChatRole.AI ? "assistant" : "user",
            content: msg.getContent()
        }));

        return formattedHistory;
    }

    // Validation logic
    private validateMessage(message: IdentifierChatMessage): void {
        if (!message.getUserId() || !message.getContent() || !message.getRole()) {
            const details = {
                UserNotDefined: !message.getUserId(),
                ContentEmpty: !message.getContent(),
                RoleNotDefined: !message.getRole()
            };
            throw new BadRequestException("Invalid chat message: userId, content, and role are required", details);
        }

        if (!Object.values(ChatRole).includes(message.getRole() as ChatRole)) {
            throw new BadRequestException(`Invalid role type: ${message.getRole()}`);
        }
    }
}