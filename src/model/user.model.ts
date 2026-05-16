import { ID, id } from "../repository/IRepository";
import { roles } from "../config/roles";

// Define tiers to match your pricing model
export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
    // FAMILY = "family" //uncomment if you want to add a family tier in the future
}

// Define UI preferences
export enum UIMode {
  SIMPLE = "simple",
  PRO = "pro"
}

export type UserID = ID;

export interface IUser {
  id: UserID;
  name: string;
  email: string;
  password: string;
  role: roles;
  tier: SubscriptionTier;          // Added for pricing logic
  uiMode: UIMode;                  // Added for Dual Interface
  encryptionSalt: string;          // Added for E2EE
  createdAt?: Date;
}

export class User implements IUser, id {
  public id: UserID;
  public name: string;
  public email: string;
  public password: string;
  public role: roles;
  public tier: SubscriptionTier;
  public uiMode: UIMode;
  public encryptionSalt: string;
  public createdAt: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || roles.user;
    this.tier = data.tier || SubscriptionTier.FREE;
    this.uiMode = data.uiMode || UIMode.SIMPLE;
    this.encryptionSalt = data.encryptionSalt;
    this.createdAt = data.createdAt || new Date();
  }

  public getid(): ID {
    return this.id;
  }
}