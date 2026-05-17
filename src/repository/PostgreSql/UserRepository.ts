import { User, SubscriptionTier, UIMode } from "../../model/user.model";
import { ID, IRepository, Initializable } from "../IRepository";
import { ConnectionManager } from "./ConnectionManager";
import logger from "../../util/logger";
import { DbException, InitializationException } from "../../util/exceptions/repositoryExceptions";
import { NotFoundException } from "../../util/exceptions/http/NotFoundException";

// ── SQL — all placeholders are PostgreSQL style ($1, $2 …) ───────────────────

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id               TEXT        PRIMARY KEY,
    name             TEXT        NOT NULL,
    email            TEXT        NOT NULL UNIQUE,
    password         TEXT        NOT NULL,
    role             TEXT        NOT NULL DEFAULT 'user',
    tier             TEXT        NOT NULL DEFAULT 'free',
    ui_mode          TEXT        NOT NULL DEFAULT 'simple',
    encryption_salt  TEXT        NOT NULL,
    created_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
  );
`;

const INSERT_SQL = `
  INSERT INTO users (id, name, email, password, role, tier, ui_mode, encryption_salt)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
`;

const SELECT_BY_ID_SQL = `
  SELECT
    id, name, email, password, role, tier,
    ui_mode         AS "uiMode",
    encryption_salt AS "encryptionSalt",
    created_at      AS "createdAt"
  FROM users
  WHERE id = $1;
`;

const SELECT_BY_EMAIL_SQL = `
  SELECT
    id, name, email, password, role, tier,
    ui_mode         AS "uiMode",
    encryption_salt AS "encryptionSalt",
    created_at      AS "createdAt"
  FROM users
  WHERE email = $1;
`;

const SELECT_ALL_SQL = `
  SELECT
    id, name, email, password, role, tier,
    ui_mode         AS "uiMode",
    encryption_salt AS "encryptionSalt",
    created_at      AS "createdAt"
  FROM users;
`;

const UPDATE_SQL = `
  UPDATE users
  SET name = $1, email = $2, password = $3, role = $4, tier = $5, ui_mode = $6
  WHERE id = $7;
`;

const DELETE_SQL = `
  DELETE FROM users
  WHERE id = $1;
`;

// ── Repository ────────────────────────────────────────────────────────────────

export class UserPostgreSQLRepository implements IRepository<User>, Initializable {

    async init(): Promise<void> {
        try {
            const conn = await ConnectionManager.getPostgreConnection();
            await conn.query(CREATE_TABLE_SQL);
            logger.info("Users table initialized.");
        } catch (error) {
            logger.error("Error initializing User repository: %o", error);
            throw new InitializationException("Failed to initialize user repository");
        }
    }

    private mapRowToUser(row: any): User {
        return new User({
            id:             row.id,
            name:           row.name,
            email:          row.email,
            password:       row.password,
            role:           row.role,
            tier:           row.tier           as SubscriptionTier,
            uiMode:         row.uiMode         as UIMode,
            encryptionSalt: row.encryptionSalt,
            createdAt:      new Date(row.createdAt),
        });
    }

    async create(user: User): Promise<ID> {
        const conn = await ConnectionManager.getPostgreConnection();
        try {
            await conn.query(INSERT_SQL, [
                user.id,
                user.name,
                user.email,
                user.password,
                user.role,
                user.tier,
                user.uiMode,
                user.encryptionSalt,
            ]);
            return user.getid();
        } catch (error) {
            logger.error("Error creating user %s: %o", user.id, error);
            throw new DbException("Failed to create user.");
        }
    }

    async get(id: ID): Promise<User> {
        try {
            const conn = await ConnectionManager.getPostgreConnection();
            const result = await conn.query(SELECT_BY_ID_SQL, [id]);

            if (result.rows.length === 0) {
                throw new NotFoundException(`User with id ${id} not found`);
            }

            return this.mapRowToUser(result.rows[0]);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            logger.error("Error getting user %s: %o", id, error);
            throw new DbException("Failed to get user.");
        }
    }

    async getall(): Promise<User[]> {
        try {
            const conn = await ConnectionManager.getPostgreConnection();
            const result = await conn.query(SELECT_ALL_SQL);
            return result.rows.map((r: any) => this.mapRowToUser(r));
        } catch (error) {
            logger.error("Error getting all users: %o", error);
            throw new DbException("Failed to get all users.");
        }
    }

    async getbyemail(email: string): Promise<User> {
        try {
            const conn = await ConnectionManager.getPostgreConnection();
            const result = await conn.query(SELECT_BY_EMAIL_SQL, [email]);

            if (result.rows.length === 0) {
                throw new NotFoundException(`User with email ${email} not found`);
            }

            return this.mapRowToUser(result.rows[0]);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            logger.error("Error getting user by email %s: %o", email, error);
            throw new DbException("Failed to get user by email.");
        }
    }

    async update(user: User): Promise<void> {
        try {
            const conn = await ConnectionManager.getPostgreConnection();
            const result = await conn.query(UPDATE_SQL, [
                user.name,
                user.email,
                user.password,
                user.role,
                user.tier,
                user.uiMode,
                user.id,
            ]);

            if (result.rowCount === 0) {
                throw new NotFoundException(`User with id ${user.id} not found`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            logger.error("Error updating user %s: %o", user.id, error);
            throw new DbException("Failed to update user.");
        }
    }

    async delete(id: ID): Promise<void> {
        try {
            const conn = await ConnectionManager.getPostgreConnection();
            const result = await conn.query(DELETE_SQL, [id]);

            if (result.rowCount === 0) {
                throw new NotFoundException(`User with id ${id} not found`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            logger.error("Error deleting user %s: %o", id, error);
            throw new DbException("Failed to delete user.");
        }
    }
}