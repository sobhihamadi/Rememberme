/// <reference types="jest" />



import crypto from "crypto";
import { VaultCategory, VaultItemType } from "../../src/model/IVaultItem.model";
import { identifierVaultItem } from "../../src/model/VaultItem.model";
import { IVaultRepository, VaultService } from "../../src/services/Vault.service";
import { BadRequestException } from "../../src/util/exceptions/http/BadRequestExceptions";
import { NotFoundException } from "../../src/util/exceptions/http/NotFoundException";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Builds a minimal mock of identifierVaultItem so each test can
 * override only the fields it cares about.
 */
function buildMockVaultItem(overrides: Partial<{
    id: string;
    userId: string;
    label: string;
    category: VaultCategory;
    type: VaultItemType;
    content: string;
    encryptedValue: string;
    encryptionIv: string;
}> = {}): jest.Mocked<identifierVaultItem> {
    const data = {
        id: overrides.id ?? "item-1",
        userId: overrides.userId ?? "user-123",
        label: overrides.label ?? "My Password",
        category: overrides.category ?? VaultCategory.PERSONAL,
        type: overrides.type ?? VaultItemType.PASSWORD,
        content: overrides.content ?? "",
        encryptedValue: overrides.encryptedValue ?? "",
        encryptionIv: overrides.encryptionIv ?? "",
    };

    const item = {
        getid: jest.fn(() => data.id),
        getUserId: jest.fn(() => data.userId),
        getLabel: jest.fn(() => data.label),
        getCategory: jest.fn(() => data.category),
        getType: jest.fn(() => data.type),
        getContent: jest.fn(() => data.content),
        getEncryptedValue: jest.fn(() => data.encryptedValue),
        getEncryptionIv: jest.fn(() => data.encryptionIv),
        setContent: jest.fn((v: string) => { data.content = v; }),
        setEncryptedValue: jest.fn((v: string) => { data.encryptedValue = v; }),
        setEncryptionIv: jest.fn((v: string) => { data.encryptionIv = v; }),
    } as unknown as jest.Mocked<identifierVaultItem>;

    return item;
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

jest.mock("../../src/repository/IRepository"); // Mock the base repository to avoid accidental real DB calls

let vaultService: VaultService;
let vaultRepositoryMock: jest.Mocked<IVaultRepository>;

describe("VaultService", () => {

    beforeEach(() => {
        vaultRepositoryMock = {
            create: jest.fn(),
            get: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getByFilter: jest.fn(),
        } as jest.Mocked<IVaultRepository>;

        vaultService = new VaultService(vaultRepositoryMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ── createVaultItem ──────────────────────────────────────────────────────

    describe("createVaultItem", () => {
        it("should create a vault item without encryption when content is empty", async () => {
            const item = buildMockVaultItem({ content: "" });
        vaultRepositoryMock.create.mockResolvedValue(undefined as any);

            const result = await vaultService.createVaultItem(item);

            expect(vaultRepositoryMock.create).toHaveBeenCalledTimes(1);
            expect(vaultRepositoryMock.create).toHaveBeenCalledWith(item);
            expect(item.setEncryptedValue).not.toHaveBeenCalled();
            expect(result).toBe(item);
        });

        it("should encrypt content before saving when content is present", async () => {
            const item = buildMockVaultItem({ content: "super-secret" });
        vaultRepositoryMock.create.mockResolvedValue(undefined as any);

            await vaultService.createVaultItem(item);

            expect(item.setEncryptedValue).toHaveBeenCalledTimes(1);
            expect(item.setEncryptionIv).toHaveBeenCalledTimes(1);
            // Plain text must be cleared after encryption
            expect(item.setContent).toHaveBeenCalledWith("");
            expect(vaultRepositoryMock.create).toHaveBeenCalledTimes(1);
        });

        it("should throw BadRequestException when required fields are missing", async () => {
            const item = buildMockVaultItem({ userId: "", label: "" });

            await expect(vaultService.createVaultItem(item))
                .rejects
                .toThrow(BadRequestException);

            expect(vaultRepositoryMock.create).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when userId is missing", async () => {
            const item = buildMockVaultItem({ userId: "" });

            await expect(vaultService.createVaultItem(item))
                .rejects
                .toThrow(BadRequestException);
        });

        it("should throw BadRequestException when label is missing", async () => {
            const item = buildMockVaultItem({ label: "" });

            await expect(vaultService.createVaultItem(item))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    // ── getVaultItemById ─────────────────────────────────────────────────────

    describe("getVaultItemById", () => {
        it("should return the vault item with decrypted content when found", async () => {
            // Arrange: simulate a stored encrypted item
            const iv = crypto.randomBytes(16).toString("hex");
            const item = buildMockVaultItem({
                encryptedValue: "someEncryptedHex",
                encryptionIv: iv,
            });
            vaultRepositoryMock.get.mockResolvedValue(item);

            // Act
            const result = await vaultService.getVaultItemById("item-1");

            // Assert
            expect(vaultRepositoryMock.get).toHaveBeenCalledWith("item-1");
            expect(item.setContent).toHaveBeenCalledTimes(1);
            expect(result).toBe(item);
        });

        it("should return the item without calling setContent when no encrypted value exists", async () => {
            const item = buildMockVaultItem({ encryptedValue: "", encryptionIv: "" });
            vaultRepositoryMock.get.mockResolvedValue(item);

            const result = await vaultService.getVaultItemById("item-1");

            expect(item.setContent).not.toHaveBeenCalled();
            expect(result).toBe(item);
        });

        it("should throw NotFoundException when item does not exist", async () => {
vaultRepositoryMock.get.mockResolvedValue(null as any);

            await expect(vaultService.getVaultItemById("non-existent-id"))
                .rejects
                .toThrow(NotFoundException);

            expect(vaultRepositoryMock.get).toHaveBeenCalledWith("non-existent-id");
        });
    });

    // ── updateVaultItem ──────────────────────────────────────────────────────

    describe("updateVaultItem", () => {
        it("should update the vault item successfully", async () => {
            const item = buildMockVaultItem({ content: "" });
            vaultRepositoryMock.get.mockResolvedValue(item);
            vaultRepositoryMock.update.mockResolvedValue(undefined);

            await vaultService.updateVaultItem(item);

            expect(vaultRepositoryMock.get).toHaveBeenCalledWith(item.getid());
            expect(vaultRepositoryMock.update).toHaveBeenCalledWith(item);
        });

        it("should re-encrypt content when content is updated", async () => {
            const item = buildMockVaultItem({ content: "new-secret" });
            vaultRepositoryMock.get.mockResolvedValue(item);
            vaultRepositoryMock.update.mockResolvedValue(undefined);

            await vaultService.updateVaultItem(item);

            expect(item.setEncryptedValue).toHaveBeenCalledTimes(1);
            expect(item.setEncryptionIv).toHaveBeenCalledTimes(1);
            expect(item.setContent).toHaveBeenCalledWith("");
        });

        it("should throw NotFoundException when updating a non-existent item", async () => {
            const item = buildMockVaultItem();
vaultRepositoryMock.get.mockResolvedValue(null as any);

            await expect(vaultService.updateVaultItem(item))
                .rejects
                .toThrow(NotFoundException);

            expect(vaultRepositoryMock.update).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when required fields are missing on update", async () => {
            const item = buildMockVaultItem({ category: undefined as any });

            await expect(vaultService.updateVaultItem(item))
                .rejects
                .toThrow(BadRequestException);

            expect(vaultRepositoryMock.get).not.toHaveBeenCalled();
            expect(vaultRepositoryMock.update).not.toHaveBeenCalled();
        });
    });

    // ── deleteVaultItem ──────────────────────────────────────────────────────

    describe("deleteVaultItem", () => {
        it("should delete the vault item when it exists", async () => {
            const item = buildMockVaultItem();
            vaultRepositoryMock.get.mockResolvedValue(item);
            vaultRepositoryMock.delete.mockResolvedValue(undefined);

            await vaultService.deleteVaultItem("item-1");

            expect(vaultRepositoryMock.get).toHaveBeenCalledWith("item-1");
            expect(vaultRepositoryMock.delete).toHaveBeenCalledWith("item-1");
            expect(vaultRepositoryMock.delete).toHaveBeenCalledTimes(1);
        });

        it("should throw NotFoundException when deleting a non-existent item", async () => {
            vaultRepositoryMock.get.mockResolvedValue(null as any);

            await expect(vaultService.deleteVaultItem("ghost-id"))
                .rejects
                .toThrow(NotFoundException);

            expect(vaultRepositoryMock.delete).not.toHaveBeenCalled();
        });
    });

    // ── getItemsByContext ────────────────────────────────────────────────────

    describe("getItemsByContext", () => {
        it("should return decrypted items for a valid context", async () => {
            const iv = crypto.randomBytes(16).toString("hex");
            const mockItems = [
                buildMockVaultItem({ id: "item-1", encryptedValue: "enc1", encryptionIv: iv }),
                buildMockVaultItem({ id: "item-2", encryptedValue: "enc2", encryptionIv: iv }),
            ];
            vaultRepositoryMock.getByFilter.mockResolvedValue(mockItems);

            const result = await vaultService.getItemsByContext(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(vaultRepositoryMock.getByFilter).toHaveBeenCalledWith(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );
            // Each item should have been decrypted
            mockItems.forEach(item => {
                expect(item.setContent).toHaveBeenCalledTimes(1);
            });
            expect(result).toHaveLength(2);
        });

        it("should return an empty array when no items match the context", async () => {
            vaultRepositoryMock.getByFilter.mockResolvedValue([]);

            const result = await vaultService.getItemsByContext(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(result).toHaveLength(0);
        });

        it("should not call setContent for items without encrypted data", async () => {
            const mockItems = [
                buildMockVaultItem({ id: "item-1", encryptedValue: "", encryptionIv: "" }),
            ];
            vaultRepositoryMock.getByFilter.mockResolvedValue(mockItems);

            await vaultService.getItemsByContext(
                "user-123",
                VaultCategory.PERSONAL,
                VaultItemType.PASSWORD
            );

            expect(mockItems[0].setContent).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when userId is missing", async () => {
            await expect(
                vaultService.getItemsByContext("", VaultCategory.PERSONAL, VaultItemType.PASSWORD)
            ).rejects.toThrow(BadRequestException);

            expect(vaultRepositoryMock.getByFilter).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when category is missing", async () => {
            await expect(
                vaultService.getItemsByContext("user-123", undefined as any, VaultItemType.PASSWORD)
            ).rejects.toThrow(BadRequestException);

            expect(vaultRepositoryMock.getByFilter).not.toHaveBeenCalled();
        });

        it("should throw BadRequestException when type is missing", async () => {
            await expect(
                vaultService.getItemsByContext("user-123", VaultCategory.PERSONAL, undefined as any)
            ).rejects.toThrow(BadRequestException);

            expect(vaultRepositoryMock.getByFilter).not.toHaveBeenCalled();
        });
    });
});