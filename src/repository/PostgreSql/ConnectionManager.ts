import config from "../../config";
import { Pool } from "pg";
import { DatabaseConnectionException } from "../../util/exceptions/DatabaseConnectionException"; // ← capital E

export class ConnectionManager {
  private constructor() {}

  private static pool: Pool | null = null;

  public static async getPostgreConnection(): Promise<Pool> {
    if (this.pool !== null) return this.pool;

    try {
      this.pool = new Pool({
        connectionString: config.storagePath.postgres.url,
        ssl: { rejectUnauthorized: false },
      });

      // Eagerly verify the connection so a misconfigured DATABASE_URL
      // surfaces at startup rather than on the first request.
      await this.pool.query("SELECT 1");

      return this.pool;
    } catch {
      this.pool = null; // reset so the next call retries
      throw new DatabaseConnectionException(
        "Failed to connect to PostgreSQL. Check DATABASE_URL and network access."
      );
    }
  }
}