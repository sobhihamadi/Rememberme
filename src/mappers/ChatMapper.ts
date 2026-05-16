import { ChatMessage, IdentifierChatMessage } from "../model/ChatMessage.model";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { IMapper } from "./IMapper";


export interface IChatRow {
    id: string;
    userId: string;
    content: string;
    role: ChatRole;
    categoryContext: VaultCategory;
    typeContext: VaultItemType;
    createdAt: Date;
}


export class PostgreChatMapper implements IMapper<IChatRow,IdentifierChatMessage> {
    map(data: IChatRow): IdentifierChatMessage {
        return new IdentifierChatMessage(
            data.id, data.userId, data.content, data.role, 
            data.categoryContext, data.typeContext, data.createdAt
        );

    };
    reverseMap(data: IdentifierChatMessage): IChatRow {
        return {
            id: data.getid(),
            userId: data.getUserId(),
            content: data.getContent(),
            role: data.getRole(),
            categoryContext: data.getCategoryContext(),
            typeContext: data.getTypeContext(),
            createdAt: data.getCreatedAt()
        };
        
    }
}