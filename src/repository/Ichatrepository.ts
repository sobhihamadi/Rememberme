import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { ID, Initializable } from "../repository/IRepository";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";

/**
 * Chat messages are append-only records of a conversation.
 * They are never individually fetched by ID, updated, or deleted by the user —
 * the vault item owns that lifecycle. When a vault item is deleted, its chat
 * history is cleaned up via a DB cascade (or a service-level call to deleteByContext).
 *
 * So IChatRepository intentionally does NOT extend IRepository<IdentifierChatMessage>.
 */
export interface IChatRepository extends Initializable {
    /**
     * Appends a new message to the conversation log.
     */
    create(message: IdentifierChatMessage): Promise<ID>;

    /**
     * Retrieves the full ordered conversation history for a specific
     * user + category + type context (e.g. user-123, PERSONAL, PASSWORD).
     */
    getHistory(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<IdentifierChatMessage[]>;

    /**
     * Deletes ALL messages belonging to a vault context.
     * Called by VaultService when a vault item is deleted,
     * not directly exposed as an API endpoint.
     */
    deleteByContext(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<void>;
}