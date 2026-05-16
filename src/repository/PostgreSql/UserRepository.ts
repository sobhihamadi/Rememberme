//userrepository.ts
import { User, SubscriptionTier, UIMode } from "../../model/user.model";
import { ID, IRepository, Initializable } from "../IRepository";
import { ConnectionManager } from "./ConnectionManager";
import logger from "../../util/logger";
import { DbException, InitializationException } from "../../util/exceptions/repositoryExceptions";
import { NotFoundException } from "../../util/exceptions/http/NotFoundException";


const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    tier TEXT NOT NULL DEFAULT 'free',
    ui_mode TEXT NOT NULL DEFAULT 'simple',
    encryption_salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const INSERT_SQL = `
  INSERT INTO users (id, name, email, password, role, tier, ui_mode, encryption_salt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

const SELECT_BY_ID_SQL = `
  SELECT id, name, email, password, role, tier, ui_mode as uiMode, encryption_salt as encryptionSalt, created_at as createdAt
  FROM users
  WHERE id = ?;
`;

const SELECT_ALL_SQL = `
  SELECT id, name, email, password, role, tier, ui_mode as uiMode, encryption_salt as encryptionSalt, created_at as createdAt
  FROM users;
`;

const UPDATE_SQL = `
  UPDATE users
  SET name = ?, email = ?, password = ?, role = ?, tier = ?, ui_mode = ?
  WHERE id = ?;
`;

const DELETE_SQL = `
  DELETE FROM users
  WHERE id = ?;
`;


export class UserPostgreSQLRepository implements IRepository<User>, Initializable {

  constructor() {}

  async init(): Promise<void> {
    try {
      const conn = await ConnectionManager.getPostgreConnection();
      await conn.query(CREATE_TABLE_SQL);
    } catch (error: unknown) {
      logger.error("Error initializing User repository: %o", error);
      throw new InitializationException("Failed to initialize user repository");
    }
  }

  /**
   * Maps a database row to a User model instance.
   * Note: The SQL alias 'as' handles the camelCase conversion for SQLite.
   */
   mapRowToUser(row: any): User {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      tier: row.tier as SubscriptionTier,
      uiMode: row.uiMode as UIMode,
      encryptionSalt: row.encryptionSalt,
      createdAt: new Date(row.createdAt)
    });
  }

  async create(user: User): Promise<ID> {
      const conn = await ConnectionManager.getPostgreConnection();
    try {
    
      await conn.query("BEGIN TRANSACTION;");

      await conn.query(INSERT_SQL, [
        user.id,
        user.name,
        user.email,
        user.password,
        user.role,
        user.tier,
        user.uiMode,
        user.encryptionSalt
      ]);

      await conn.query("COMMIT;");
      return user.getid();
    } catch (error: unknown) {
      if (conn) await conn.query("ROLLBACK;");
      logger.error("Error creating user %s: %o", user.id, error);
      throw new DbException("Failed to create user.");
    }
  }

  async get(id: ID): Promise<User> {
    try {
      const conn = await ConnectionManager.getPostgreConnection();
      const row = await conn.query(SELECT_BY_ID_SQL, [id]);

      if (!row) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      return this.mapRowToUser(row);
    } catch (error: unknown) {
      logger.error("Error getting user %s: %o", id, error);
      if (error instanceof NotFoundException) throw error;
      throw new DbException("Failed to get user.");
    }
  }

  async getall(): Promise<User[]> {
    try {
      const conn = await ConnectionManager.getPostgreConnection();
      const result = await conn.query(SELECT_ALL_SQL);
      return result.rows.map((r: any) => this.mapRowToUser(r));
    } catch (error: unknown) {
      logger.error("Error getting all users: %o", error);
      throw new DbException("Failed to get all users.");
    }
  }

  async update(user: User): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();

    try {
      await conn.query("BEGIN TRANSACTION;");

      await conn.query(UPDATE_SQL, [
        user.name,
        user.email,
        user.password,
        user.role,
        user.tier,
        user.uiMode,
        user.id,
      ]);

      await conn.query("COMMIT;");
    } catch (error: unknown) {
      if (conn) await conn.query("ROLLBACK;");
      logger.error("Error updating user %s: %o", user.id, error);
      throw new DbException("Failed to update user.");
    }
  }

  async delete(id: ID): Promise<void> {
        const conn = await ConnectionManager.getPostgreConnection();

    try {
      await conn.query("BEGIN TRANSACTION;");

      const result = await conn.query(DELETE_SQL, [id]);

      if (result.rowCount === 0) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      await conn.query("COMMIT;");
    } catch (error: unknown) {
      if (conn) await conn.query("ROLLBACK;");
      logger.error("Error deleting user %s: %o", id, error);
      if (error instanceof NotFoundException) throw error;
      throw new DbException("Failed to delete user.");
    }
  }

  async getbyemail(email: string): Promise<User> {
    const conn = await ConnectionManager.getPostgreConnection();
    
    const SELECT_BY_EMAIL_SQL = `
      SELECT id, name, email, password, role, tier, ui_mode as uiMode, encryption_salt as encryptionSalt, created_at as createdAt
      FROM users
      WHERE email = ?;
    `;

    const row = await conn.query(SELECT_BY_EMAIL_SQL, [email]);
    if (!row) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    
    return this.mapRowToUser(row);
  }
}