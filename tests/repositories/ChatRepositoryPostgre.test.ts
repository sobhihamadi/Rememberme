/// <reference types="jest" />


import { IdentifierChatMessage } from "../../src/model/ChatMessage.model";
import { ChatRole } from "../../src/model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";
import { ChatRepositoryPostgre } from "../../src/repository/PostgreSql/ChatRepositoryPostgre";
import { ConnectionManager } from "../../src/repository/PostgreSql/ConnectionManager";

// IMPORTANT: mock ConnectionManager BEFORE importing it from the test
jest.mock("../../src/repository/PostgreSql/ConnectionManager", () => {
    const chatMessages = new Map<string, any>();

    const pool = {
        query: jest.fn(async (sql: string, params?: any[]) => {
            const trimmed = sql.trim();

            if (trimmed.startsWith("CREATE TABLE IF NOT EXISTS chat_messages")) {
                return { rows: [] };
            }

            if (trimmed.startsWith("TRUNCATE TABLE chat_messages")) {
                chatMessages.clear();
                return { rows: [] };
            }

            if (trimmed.startsWith("INSERT INTO chat_messages")) {
                const [
                    id, userId, content, role, categoryContext, typeContext, createdAt
                ] = params ?? [];
                
                if (chatMessages.has(id)) {
                    throw new Error('duplicate key value violates unique constraint "chat_messages_pkey"');
                }
                
                chatMessages.set(id, {
                    id, userId, content, role, categoryContext, typeContext, createdAt
                });
                return { rows: [] };
            }

            // SELECT * FROM chat_messages WHERE "userId" = $1 AND "categoryContext" = $2 AND "typeContext" = $3 ORDER BY "createdAt" ASC
          // tests/repositories/ChatRepositoryPostgre.test.ts

// ... inside the mock query function ...

// Improved SELECT mock logic
if (trimmed.includes("SELECT * FROM chat_messages") && trimmed.includes("WHERE")) {
    const [userId, categoryContext, typeContext] = params ?? [];
    
    const rows = Array.from(chatMessages.values()).filter(
        msg => msg.userId === userId && 
               msg.categoryContext === categoryContext && 
               msg.typeContext === typeContext
    );

    // Sort by createdAt ASC (oldest to newest)
    rows.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return timeA - timeB;
    });

    return { rows };
}
            return { rows: [] };
        }),
        end: jest.fn(async () => {}),
    };

    return {
        ConnectionManager: {
            getPostgreConnection: jest.fn().mockResolvedValue(pool),
        },
    };
});


describe("ChatRepositoryPostgre", () => {
    const repo = new ChatRepositoryPostgre();

    beforeAll(async () => {
        await repo.init();
    });

    beforeEach(async () => {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.query("TRUNCATE TABLE chat_messages RESTART IDENTITY CASCADE;");
    });

    afterAll(async () => {
        const conn = await ConnectionManager.getPostgreConnection();
        await conn.end();
    });

    it("should create a chat message", async () => {
        const id = `chat-${Math.random().toString(36).slice(2, 10)}`;
        const message = new IdentifierChatMessage(
            id, "user-123", "Save my docker command", ChatRole.USER, 
            VaultCategory.WORK, VaultItemType.COMMAND, new Date()
        );

        const savedId = await repo.create(message);
        expect(savedId).toBe(id);
    });

    it("should retrieve chat history ordered by time ascending", async () => {
        const time1 = new Date("2026-05-14T10:00:00Z");
        const time2 = new Date("2026-05-14T10:01:00Z");
        
        const msg1 = new IdentifierChatMessage(
            "msg-1", "user-123", "My bank pin is 1234", ChatRole.USER, 
            VaultCategory.PERSONAL, VaultItemType.PASSWORD, time1
        );
        const msg2 = new IdentifierChatMessage(
            "msg-2", "user-123", "I have saved your bank pin.", ChatRole.AI, 
            VaultCategory.PERSONAL, VaultItemType.PASSWORD, time2
        );

        // Different context, should not appear in results
        const msg3 = new IdentifierChatMessage(
            "msg-3", "user-123", "Remind me to call John.", ChatRole.USER, 
            VaultCategory.WORK, VaultItemType.NOTE, time1
        );

        await repo.create(msg2); // Insert out of order to test sorting
        await repo.create(msg1);
        await repo.create(msg3);

        const history = await repo.getHistory("user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD);

        expect(history.length).toBe(2);
        
        // Assert sorting: oldest message first
        expect(history[0].getid()).toBe("msg-1");
        expect(history[0].getRole()).toBe(ChatRole.USER);
        
        expect(history[1].getid()).toBe("msg-2");
        expect(history[1].getRole()).toBe(ChatRole.AI);
    });
});