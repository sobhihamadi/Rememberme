import { ChatRepositoryPostgre } from "./ChatRepositoryPostgre";
import { VaultRepositoryPostgre } from "./VaultRepositoryPostgre";
import { UserPostgreSQLRepository } from "./UserRepository";

export const chatRepository  = new ChatRepositoryPostgre();
export const vaultRepository = new VaultRepositoryPostgre();
export const userRepository  = new UserPostgreSQLRepository();