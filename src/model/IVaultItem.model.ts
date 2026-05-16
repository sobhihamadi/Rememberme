import { id } from "../repository/IRepository";

export enum VaultCategory {
    PERSONAL = 'PERSONAL',
    WORK = 'WORK',
    NOTES = 'NOTES',
}

export enum VaultItemType {
    PASSWORD = 'PASSWORD',
    CODE = 'CODE',
    COMMAND = 'COMMAND',
    NOTE = 'NOTE',
}

export interface IVaultItem {
    getCategory(): VaultCategory;
    getType(): VaultItemType;
    getLabel(): string;
}

export interface IIdentifierVaultItem extends IVaultItem, id {}