import bcrypt from "bcrypt";
import { IUserRepository } from "../repository/IUserRepository";
import { User, IUser, UserID } from "../model/user.model";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";

const SALT_ROUNDS = 12;

export class UserService {
  constructor(private readonly userRepository: IUserRepository<User>) {}

  public async create(data: Omit<IUser, "id">): Promise<User> {
    const id: UserID = `user-${Date.now()}`;

    // Hash the password before persisting — never store plaintext
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = new User({ id, ...data, password: hashedPassword });
    await this.userRepository.create(user);
    return user;
  }

  public async getall(): Promise<User[]> {
    return this.userRepository.getall();
  }

  public async get(id: UserID): Promise<User> {
    return this.userRepository.get(id);
  }

  public async update(id: UserID, data: User): Promise<User> {
    const existing = await this.userRepository.get(id);

    if (data.name     !== undefined) existing.name   = data.name;
    if (data.email    !== undefined) existing.email  = data.email;
    if (data.role     !== undefined) existing.role   = data.role;
    if (data.tier     !== undefined) existing.tier   = data.tier;
    if (data.uiMode   !== undefined) existing.uiMode = data.uiMode;

    // Re-hash only when the caller explicitly provides a new password
    if (data.password !== undefined) {
      existing.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    await this.userRepository.update(existing);
    return existing;
  }

  public async delete(id: UserID): Promise<void> {
    await this.userRepository.get(id); // throws NotFoundException if missing
    await this.userRepository.delete(id);
  }

  public async validateUserCredentials(
    email: string,
    password: string
  ): Promise<User> {
    // Cast needed because IUserRepository<User> doesn't expose getbyemail
    // (it lives only on the concrete PostgreSQL implementation)
    const user: User = await (this.userRepository as any).getbyemail(email);

    if (!user) {
      // Use the same generic message for both "not found" and "wrong password"
      // to avoid leaking whether an e-mail address is registered
      throw new NotFoundException("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new NotFoundException("Invalid credentials");
    }

    return user;
  }
}