import { id } from "../repository/IRepository";
import { VaultCategory, VaultItemType } from "./IVaultItem.model";

export enum ChatRole {
    USER = 'USER',
    AI = 'AI'
}

export interface IChatMessage {
    getUserId(): string;
    getContent(): string;
    getRole(): ChatRole;
    getCategoryContext(): VaultCategory;
    getTypeContext(): VaultItemType;
    getCreatedAt(): Date;
}

export interface IIdentifierChatMessage extends IChatMessage, id {}