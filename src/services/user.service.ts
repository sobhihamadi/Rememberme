import crypto from "crypto";
import { IUserRepository } from "../repository/IUserRepository";
import { User, IUser, UserID } from "../model/user.model";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";

export class UserService {
  constructor(private readonly userRepository: IUserRepository<User>) {}

   public async create( data: Omit<IUser, "id">): Promise<User> {
    const id: UserID = `user-${Date.now()}`;
    const user = new User({ id, ...data });

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

    if (data.name !== undefined) existing.name = data.name;
    if (data.email !== undefined) existing.email = data.email;
    if (data.password !== undefined) existing.password = data.password;
    if (data.role !== undefined) existing.role = data.role;
    
    // Handling the new fields for the current project
    if (data.tier !== undefined) existing.tier = data.tier;
    if (data.uiMode !== undefined) existing.uiMode = data.uiMode;

    await this.userRepository.update(existing);
    return existing;
  }

  public async delete(id: UserID): Promise<void> {
    await this.userRepository.get(id);
    await this.userRepository.delete(id);
  }

  public async validateUserCredentials(email: string, password: string): Promise<User> {
    // Using the getbyemail method from your UserPostgreSQLRepository
    const user: User = await (this.userRepository as any).getbyemail(email);
    
    if (!user) {
      throw new NotFoundException("Invalid user credentials, user not found");
    }
    
    if (user.password !== password) {
      throw new NotFoundException("Invalid user credentials");
    }
    
    return user;
  }
}