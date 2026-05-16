//ChatRepositoryPostgre.ts

import { ConnectionManager } from "./ConnectionManager";
import { IdentifierChatMessage } from "../../model/ChatMessage.model";
import { VaultCategory, VaultItemType } from "../../model/IVaultItem.model";
import { IChatRow, PostgreChatMapper } from "../../mappers/ChatMapper";
import { ID, Initializable } from "../../repository/IRepository";
import logger from "../../util/logger";

const CREATE_CHAT_TABLE = `
    CREATE TABLE IF NOT EXISTS chat_messages (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "categoryContext" TEXT,
        "typeContext" TEXT,
        "createdAt" TIMESTAMP NOT NULL
    );
`;

export class ChatRepositoryPostgre implements Initializable {
    private mapper = new PostgreChatMapper();

    async init(): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query(CREATE_CHAT_TABLE);
        logger.info("Chat table initialized.");
    }

    async create(message: IdentifierChatMessage): Promise<ID> {
        const conn = await ConnectionManager.getPostgreConnection();
        const query = `
            INSERT INTO chat_messages ("id", "userId", "content", "role", "categoryContext", "typeContext", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await conn.query(query, [
            message.getid(), message.getUserId(), message.getContent(), message.getRole(),
            message.getCategoryContext(), message.getTypeContext(), message.getCreatedAt()
        ]);
        return message.getid();
    }

    // Retrieves history specifically for the "Personal > Password" view, for example
    async getHistory(userId: string, category: VaultCategory, type: VaultItemType): Promise<IdentifierChatMessage[]> {
        const conn = await ConnectionManager.getPostgreConnection();
        const query = `
            SELECT * FROM chat_messages 
            WHERE "userId" = $1 AND "categoryContext" = $2 AND "typeContext" = $3 
            ORDER BY "createdAt" ASC
        `;
        const result = await conn.query<IChatRow>(query, [userId, category, type]);
        return result.rows.map(row => this.mapper.map(row));
    }
}