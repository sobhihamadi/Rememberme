
import config from "../../config";
import { Pool } from "pg";
import { DatabaseConnectionException } from "../../util/exceptions/DatabaseConnectionexception";
import "dotenv/config";
export class ConnectionManager {
  private constructor() {}

  private static pool: Pool | null = null;

  public static async getPostgreConnection(): Promise<Pool> {
    if (this.pool == null) {
      try {
        this.pool = new Pool({
          connectionString: config.storagePath.postgres.url,
          ssl: { rejectUnauthorized: false },
        });
      } catch  {
        throw new DatabaseConnectionException("Failed to connect to PostgreSQL.");
      }
    }
    return this.pool;
  }
}
