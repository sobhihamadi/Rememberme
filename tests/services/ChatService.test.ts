/// <reference types="jest" />

import { IdentifierChatMessage } from "../../src/model/ChatMessage.model";
import { ChatRole } from "../../src/model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";
import { ChatService } from "../../src/services/chat.service";
import { IChatRepository } from "../../src/repository/Ichatrepository";
import { BadRequestException } from "../../src/util/exceptions/http/BadRequestExceptions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMockChatMessage(overrides: Partial<{
  id:      string;
  userId:  string;
  content: string;
  role:    ChatRole;
}> = {}): jest.Mocked<IdentifierChatMessage> {
  const data = {
    id:      overrides.id      ?? "msg-1",
    userId:  overrides.userId  ?? "user-123",
    content: overrides.content ?? "Hello, how can I help?",
    role:    overrides.role    ?? ChatRole.USER,
  };

  return {
    getid:      jest.fn(() => data.id),
    getUserId:  jest.fn(() => data.userId),
    getContent: jest.fn(() => data.content),
    getRole:    jest.fn(() => data.role),
  } as unknown as jest.Mocked<IdentifierChatMessage>;
}

// ─── Suite setup ──────────────────────────────────────────────────────────────

let chatService: ChatService;
let repo: jest.Mocked<IChatRepository>;

beforeEach(() => {
  // Every method that IChatRepository declares is present in the mock.
  // Previously deleteByContext and init were missing, which caused silent
  // failures whenever clearHistory() was called in production code paths.
  repo = {
    init:            jest.fn().mockResolvedValue(undefined),
    create:          jest.fn().mockResolvedValue(undefined),
    getHistory:      jest.fn().mockResolvedValue([]),
    deleteByContext: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IChatRepository>;

  chatService = new ChatService(repo);
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── createMessage ────────────────────────────────────────────────────────────

describe("createMessage", () => {
  it("saves a USER message and returns it", async () => {
    const msg = buildMockChatMessage();
    const result = await chatService.createMessage(msg);

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(msg);
    expect(result).toBe(msg);
  });

  it("saves an AI message successfully", async () => {
    const msg = buildMockChatMessage({ role: ChatRole.AI });
    const result = await chatService.createMessage(msg);

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(result).toBe(msg);
  });

  it("throws BadRequestException when userId is empty", async () => {
    const msg = buildMockChatMessage({ userId: "" });
    await expect(chatService.createMessage(msg)).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when content is empty", async () => {
    const msg = buildMockChatMessage({ content: "" });
    await expect(chatService.createMessage(msg)).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when role is missing", async () => {
    const msg = buildMockChatMessage({ role: undefined as any });
    await expect(chatService.createMessage(msg)).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when role is an unrecognised value", async () => {
    const msg = buildMockChatMessage({ role: "INVALID_ROLE" as any });
    await expect(chatService.createMessage(msg)).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when both userId and content are empty", async () => {
    const msg = buildMockChatMessage({ userId: "", content: "" });
    await expect(chatService.createMessage(msg)).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// ─── getChatContext ───────────────────────────────────────────────────────────

describe("getChatContext", () => {
  it("returns messages for a valid context", async () => {
    const messages = [
      buildMockChatMessage({ id: "msg-1", role: ChatRole.USER }),
      buildMockChatMessage({ id: "msg-2", role: ChatRole.AI }),
    ];
    repo.getHistory.mockResolvedValue(messages as any);

    const result = await chatService.getChatContext(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );

    expect(repo.getHistory).toHaveBeenCalledWith(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );
    expect(result).toHaveLength(2);
  });

  it("returns an empty array when no history exists", async () => {
    repo.getHistory.mockResolvedValue([]);
    const result = await chatService.getChatContext(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );
    expect(result).toHaveLength(0);
  });

  it("throws BadRequestException when userId is empty", async () => {
    await expect(
      chatService.getChatContext("", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
    ).rejects.toThrow(BadRequestException);
    expect(repo.getHistory).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when category is missing", async () => {
    await expect(
      chatService.getChatContext("user-123", undefined as any, VaultItemType.PASSWORD)
    ).rejects.toThrow(BadRequestException);
    expect(repo.getHistory).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when type is missing", async () => {
    await expect(
      chatService.getChatContext("user-123", VaultCategory.PERSONAL, undefined as any)
    ).rejects.toThrow(BadRequestException);
    expect(repo.getHistory).not.toHaveBeenCalled();
  });
});

// ─── constructSystemPromptAndHistory ─────────────────────────────────────────

describe("constructSystemPromptAndHistory", () => {
  it("maps USER role to 'user'", async () => {
    repo.getHistory.mockResolvedValue([
      buildMockChatMessage({ content: "What is my balance?", role: ChatRole.USER }),
    ] as any);

    const result = await chatService.constructSystemPromptAndHistory(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );

    expect(result).toEqual([{ role: "user", content: "What is my balance?" }]);
  });

  it("maps AI role to 'assistant'", async () => {
    repo.getHistory.mockResolvedValue([
      buildMockChatMessage({ content: "Your balance is $100.", role: ChatRole.AI }),
    ] as any);

    const result = await chatService.constructSystemPromptAndHistory(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );

    expect(result).toEqual([{ role: "assistant", content: "Your balance is $100." }]);
  });

  it("formats a mixed conversation correctly", async () => {
    repo.getHistory.mockResolvedValue([
      buildMockChatMessage({ id: "1", content: "Hello!",             role: ChatRole.USER }),
      buildMockChatMessage({ id: "2", content: "Hi, how can I help?", role: ChatRole.AI }),
      buildMockChatMessage({ id: "3", content: "What is 2 + 2?",     role: ChatRole.USER }),
    ] as any);

    const result = await chatService.constructSystemPromptAndHistory(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );

    expect(result).toEqual([
      { role: "user",      content: "Hello!" },
      { role: "assistant", content: "Hi, how can I help?" },
      { role: "user",      content: "What is 2 + 2?" },
    ]);
  });

  it("returns an empty array when there is no history", async () => {
    repo.getHistory.mockResolvedValue([]);
    const result = await chatService.constructSystemPromptAndHistory(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );
    expect(result).toEqual([]);
  });

  it("throws BadRequestException when userId is missing", async () => {
    await expect(
      chatService.constructSystemPromptAndHistory("", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
    ).rejects.toThrow(BadRequestException);
    expect(repo.getHistory).not.toHaveBeenCalled();
  });
});

// ─── clearHistory ─────────────────────────────────────────────────────────────

describe("clearHistory", () => {
  it("calls deleteByContext with the correct arguments", async () => {
    await chatService.clearHistory("user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD);

    expect(repo.deleteByContext).toHaveBeenCalledTimes(1);
    expect(repo.deleteByContext).toHaveBeenCalledWith(
      "user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD
    );
  });

  it("throws BadRequestException when userId is empty", async () => {
    await expect(
      chatService.clearHistory("", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
    ).rejects.toThrow(BadRequestException);
    expect(repo.deleteByContext).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when category is missing", async () => {
    await expect(
      chatService.clearHistory("user-123", undefined as any, VaultItemType.PASSWORD)
    ).rejects.toThrow(BadRequestException);
    expect(repo.deleteByContext).not.toHaveBeenCalled();
  });

  it("throws BadRequestException when type is missing", async () => {
    await expect(
      chatService.clearHistory("user-123", VaultCategory.PERSONAL, undefined as any)
    ).rejects.toThrow(BadRequestException);
    expect(repo.deleteByContext).not.toHaveBeenCalled();
  });

  it("propagates repository errors", async () => {
    repo.deleteByContext.mockRejectedValue(new Error("DB down"));
    await expect(
      chatService.clearHistory("user-123", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
    ).rejects.toThrow("DB down");
  });
});