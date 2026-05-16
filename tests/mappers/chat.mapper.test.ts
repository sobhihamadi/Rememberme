/// <reference types="jest" />


import { PostgreChatMapper } from "../../src/mappers/ChatMapper";
import {IdentifierChatMessage } from "../../src/model/ChatMessage.model";
import { ChatRole } from "../../src/model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";


describe("chat.mapper.test.ts", () => {
    it("should map a chat row to an ChatMessage correctly", () => {
          const mapper = new PostgreChatMapper();
        const cm = mapper.map({
            id: "123",
            userId: "user1",
            content: "Hello, world!",
            role: ChatRole.USER,
            categoryContext: VaultCategory.PERSONAL,
            typeContext: VaultItemType.PASSWORD,
            createdAt: new Date("2024-01-01T00:00:00Z")
                
        }

        )
        const expectedchatRow = new IdentifierChatMessage(
            "123",
            "user1",
             "Hello, world!",
            ChatRole.USER,
            VaultCategory.PERSONAL,
            VaultItemType.PASSWORD,
            new Date("2024-01-01T00:00:00Z")
        );
        expect(cm).toEqual(expectedchatRow);
    });
});
  
