import { ConnectionManager } from "./ConnectionManager";
import { IdentifierChatMessage } from "../../model/ChatMessage.model";
import { VaultCategory, VaultItemType } from "../../model/IVaultItem.model";
import { IChatRow, PostgreChatMapper } from "../../mappers/ChatMapper";
import { IChatRepository } from "../Ichatrepository";
import { ID } from "../IRepository";
import logger from "../../util/logger";

const CREATE_CHAT_TABLE = `
    CREATE TABLE IF NOT EXISTS chat_messages (
        "id"              TEXT PRIMARY KEY,
        "userId"          TEXT NOT NULL,
        "content"         TEXT NOT NULL,
        "role"            TEXT NOT NULL,
        "categoryContext" TEXT,
        "typeContext"     TEXT,
        "createdAt"       TIMESTAMP NOT NULL
    );
`;

export class ChatRepositoryPostgre implements IChatRepository {
    private mapper = new PostgreChatMapper();

    async init(): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query(CREATE_CHAT_TABLE);
        logger.info("Chat table initialized.");
    }

    async create(message: IdentifierChatMessage): Promise<ID> {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query(
            `INSERT INTO chat_messages
                ("id", "userId", "content", "role", "categoryContext", "typeContext", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                message.getid(),
                message.getUserId(),
                message.getContent(),
                message.getRole(),
                message.getCategoryContext(),
                message.getTypeContext(),
                message.getCreatedAt(),
            ]
        );
        return message.getid();
    }

    async getHistory(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<IdentifierChatMessage[]> {
        const conn = await ConnectionManager.getPostgreConnection();
        const result = await conn.query<IChatRow>(
            `SELECT * FROM chat_messages
             WHERE "userId"          = $1
               AND "categoryContext" = $2
               AND "typeContext"     = $3
             ORDER BY "createdAt" ASC`,
            [userId, category, type]
        );
        return result.rows.map((row: IChatRow) => this.mapper.map(row));
    }

    async deleteByContext(
        userId: string,
        category: VaultCategory,
        type: VaultItemType
    ): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query(
            `DELETE FROM chat_messages
             WHERE "userId"          = $1
               AND "categoryContext" = $2
               AND "typeContext"     = $3`,
            [userId, category, type]
        );
        logger.info(`Chat history cleared for user ${userId} [${category}/${type}]`);
    }
}