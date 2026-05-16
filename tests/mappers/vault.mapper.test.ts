/// <reference types="jest" />

import { PostgreVaultMapper } from "../../src/mappers/VaultMapper";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";


describe("VaultMapper", () => {
     it("should correctly map a database row to an IdentifierVaultItem", () => {
           const mapper = new PostgreVaultMapper();
           const vault = mapper.map({
                id: "123",
                userId: "user1",
                category: VaultCategory.NOTES,
                type: VaultItemType.NOTE,
                label: "My Email Account",
                encryptedValue: "encrypted123",
                encryptionIv: "iv123",
                content: "",
                tags: ["email", "personal"],
                accessCount: 5,
                lastAccessed: new Date("2024-01-01T12:00:00Z"),
                createdAt: new Date("2023-01-01T12:00:00Z"),
                updatedAt: new Date("2024-01-01T12:00:00Z")
            });                
         const expectedvault = {
             id: "123",
             userId: "user1",
             category: VaultCategory.NOTES,
             type: VaultItemType.NOTE,
             label: "My Email Account",
             encryptedValue: "encrypted123",
             encryptionIv: "iv123",
             content: "",
             tags: ["email", "personal"],
             accessCount: 5,
             lastAccessed: new Date("2024-01-01T12:00:00Z"),
             createdAt: new Date("2023-01-01T12:00:00Z"),
             updatedAt: new Date("2024-01-01T12:00:00Z")
         
         };
            
            expect(vault).toEqual(expectedvault);
         
            
            
   
         });

});
      