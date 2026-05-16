import { User, UserID, SubscriptionTier, UIMode } from "../user.model";
import { roles } from "../../config/roles";
import logger from "../../util/logger";

export class UserBuilder {
    private id!: UserID;
    private name!: string;
    private email!: string;
    private password!: string;
    private role!: roles;
    private tier!: SubscriptionTier;
    private uiMode!: UIMode;
    private encryptionSalt!: string;
    private createdAt?: Date;

    public static newBuilder(): UserBuilder {
        return new UserBuilder();
    }

    setId(id: UserID): UserBuilder { this.id = id; return this; }
    setName(name: string): UserBuilder { this.name = name; return this; }
    setEmail(email: string): UserBuilder { this.email = email; return this; }
    setPassword(password: string): UserBuilder { this.password = password; return this; }
    setRole(role: roles): UserBuilder { this.role = role; return this; }
    setTier(tier: SubscriptionTier): UserBuilder { this.tier = tier; return this; }
    setUiMode(uiMode: UIMode): UserBuilder { this.uiMode = uiMode; return this; }
    setEncryptionSalt(salt: string): UserBuilder { this.encryptionSalt = salt; return this; }
    setCreatedAt(date: Date): UserBuilder { this.createdAt = date; return this; }

    build(): User {
        const required = [this.id, this.name, this.email, this.password, this.encryptionSalt];
        for (const field of required) {
            if (!field) {
                logger.error('Required field missing for User building');
                throw new Error('Required field missing');
            }
        }

        return new User({
            id: this.id,
            name: this.name,
            email: this.email,
            password: this.password,
            role: this.role,
            tier: this.tier,
            uiMode: this.uiMode,
            encryptionSalt: this.encryptionSalt,
            createdAt: this.createdAt
        });
    }
}