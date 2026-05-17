/// <reference types="jest" />

import { IdentifierChatMessage } from "../../src/model/ChatMessage.model";
import { ChatRole } from "../../src/model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";
import {  ChatService } from "../../src/services/chat.service";
import { IChatRepository } from "../../src/repository/Ichatrepository";
import { BadRequestException } from "../../src/util/exceptions/http/BadRequestExceptions";
import { NotFoundException } from "../../src/util/exceptions/http/NotFoundException";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds a minimal mock of IdentifierChatMessage so each test can
 * override only the fields it cares about.
 */
function buildMockChatMessage(overrides: Partial<{
    id: string;
    userId: string;
    content: string;
    role: ChatRole;
}> = {}): jest.Mocked<IdentifierChatMessage> {
    const data = {
        id: overrides.id ?? "msg-1",
        userId: overrides.userId ?? "user-123",
        content: overrides.content ?? "Hello, how can I help?",
        role: overrides.role ?? ChatRole.USER,
    };

    const message = {
        getid: jest.fn(() => data.id),
        getUserId: jest.fn(() => data.userId),
        getContent: jest.fn(() => data.content),
        getRole: jest.fn(() => data.role),
    } as unknown as jest.Mocked<IdentifierChatMessage>;

    return message;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

let chatService: ChatService;
let chatRepositoryMock: jest.Mocked<IChatRepository>;

describe("ChatService", () => {

    beforeEach(() => {
        chatRepositoryMock = {
            create: jest.fn(),
            get: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getHistory: jest.fn(),
        } as unknown as jest.Mocked<IChatRepository>;

        chatService = new ChatService(chatRepositoryMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ── createMessage ─────────────────────────────────────────────────────────

    describe("createMessage", () => {
        it("should create a message and return it when valid", async () => {
            const message = buildMockChatMessage();
            chatRepositoryMock.create.mockResolvedValue(undefined as any);

            const result = await chatService.createMessage(message);

            expect(chatRepositoryMock.create).toHaveBeenCalledTimes(1);
            expect(chatRepositoryMock.create).toHaveBeenCalledWith(message);
            expect(result).toBe(message);
        });

        it("should create a message with AI role successfully", async () => {
            const message = buildMockChatMessage({ role: ChatRole.AI });
            chatRepositoryMock.create.mockResolvedValue(undefined as any);

            const result = await chatService.createMessage(message);

            expect(chatRepositoryMock.create).toHaveBeenCalledTimes(1);
            expect(result).toBe(message);
        });

        it("should throw BadRequestException when userId is missing", async () => {
            const message = buildMockChatMessage({ userId: "" });

            await expect(chatService.createMessage(message))
                .rejects
                .toThrow(BadRequestException);

            expect(chatRepositoryMock.create).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when content is missing", async () => {
            const message = buildMockChatMessage({ content: "" });

            await expect(chatService.createMessage(message))
                .rejects
                .toThrow(BadRequestException);

            expect(chatRepositoryMock.create).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when role is missing", async () => {
            const message = buildMockChatMessage({ role: undefined as any });

            await expect(chatService.createMessage(message))
                .rejects
                .toThrow(BadRequestException);

            expect(chatRepositoryMock.create).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when role is invalid", async () => {
            const message = buildMockChatMessage({ role: "INVALID_ROLE" as any });

            await expect(chatService.createMessage(message))
                .rejects
                .toThrow(BadRequestException);

            expect(chatRepositoryMock.create).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when multiple required fields are missing", async () => {
            const message = buildMockChatMessage({ userId: "", content: "" });

            await expect(chatService.createMessage(message))
                .rejects
                .toThrow(BadRequestException);

            expect(chatRepositoryMock.create).not.toHaveBeenCalled();
        });
    });

    // ── getMessageById ────────────────────────────────────────────────────────

   

    // ── updateMessage ─────────────────────────────────────────────────────────

   
        });

        

    

    // ── deleteMessage ─────────────────────────────────────────────────────────

   

    // ── getChatContext ────────────────────────────────────────────────────────

    describe("getChatContext", () => {
        it("should return messages for a valid context", async () => {
            const mockMessages = [
                buildMockChatMessage({ id: "msg-1", role: ChatRole.USER }),
                buildMockChatMessage({ id: "msg-2", role: ChatRole.AI }),
            ];
            chatRepositoryMock.getHistory.mockResolvedValue(mockMessages as any);

            const result = await chatService.getChatContext(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(chatRepositoryMock.getHistory).toHaveBeenCalledWith(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );
            expect(chatRepositoryMock.getHistory).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(2);
        });

        it("should return an empty array when no history exists", async () => {
            chatRepositoryMock.getHistory.mockResolvedValue([]);

            const result = await chatService.getChatContext(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(result).toHaveLength(0);
        });

        it("should throw BadRequestException when userId is missing", async () => {
            await expect(
                chatService.getChatContext("", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
            ).rejects.toThrow(BadRequestException);

            expect(chatRepositoryMock.getHistory).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when category is missing", async () => {
            await expect(
                chatService.getChatContext("user-123", undefined as any, VaultItemType.PASSWORD)
            ).rejects.toThrow(BadRequestException);

            expect(chatRepositoryMock.getHistory).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when type is missing", async () => {
            await expect(
                chatService.getChatContext("user-123", VaultCategory.PERSONAL, undefined as any)
            ).rejects.toThrow(BadRequestException);

            expect(chatRepositoryMock.getHistory).not.toHaveBeenCalled();
        });
    });

    // ── constructSystemPromptAndHistory ───────────────────────────────────────

    describe("constructSystemPromptAndHistory", () => {
        it("should format USER messages with role 'user'", async () => {
            const mockMessages = [
                buildMockChatMessage({ id: "msg-1", content: "What is my balance?", role: ChatRole.USER }),
            ];
            chatRepositoryMock.getHistory.mockResolvedValue(mockMessages as any);

            const result = await chatService.constructSystemPromptAndHistory(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ role: "user", content: "What is my balance?" });
        });

        it("should format AI messages with role 'assistant'", async () => {
            const mockMessages = [
                buildMockChatMessage({ id: "msg-2", content: "Your balance is $100.", role: ChatRole.AI }),
            ];
            chatRepositoryMock.getHistory.mockResolvedValue(mockMessages as any);

            const result = await chatService.constructSystemPromptAndHistory(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ role: "assistant", content: "Your balance is $100." });
        });

        it("should correctly format a mixed conversation history", async () => {
            const mockMessages = [
                buildMockChatMessage({ id: "msg-1", content: "Hello!", role: ChatRole.USER }),
                buildMockChatMessage({ id: "msg-2", content: "Hi, how can I help?", role: ChatRole.AI }),
                buildMockChatMessage({ id: "msg-3", content: "What is 2 + 2?", role: ChatRole.USER }),
            ];
            chatRepositoryMock.getHistory.mockResolvedValue(mockMessages as any);

            const result = await chatService.constructSystemPromptAndHistory(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ role: "user",      content: "Hello!" });
            expect(result[1]).toEqual({ role: "assistant", content: "Hi, how can I help?" });
            expect(result[2]).toEqual({ role: "user",      content: "What is 2 + 2?" });
        });

        it("should return an empty array when there is no chat history", async () => {
            chatRepositoryMock.getHistory.mockResolvedValue([]);

            const result = await chatService.constructSystemPromptAndHistory(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it("should throw BadRequestException when userId is missing", async () => {
            await expect(
                chatService.constructSystemPromptAndHistory("", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
            ).rejects.toThrow(BadRequestException);

            expect(chatRepositoryMock.getHistory).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when category is missing", async () => {
            await expect(
                chatService.constructSystemPromptAndHistory("user-123", undefined as any, VaultItemType.PASSWORD)
            ).rejects.toThrow(BadRequestException);

            expect(chatRepositoryMock.getHistory).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when type is missing", async () => {
            await expect(
                chatService.constructSystemPromptAndHistory("user-123", VaultCategory.PERSONAL, undefined as any)
            ).rejects.toThrow(BadRequestException);

            expect(chatRepositoryMock.getHistory).not.toHaveBeenCalled();
        });
    });