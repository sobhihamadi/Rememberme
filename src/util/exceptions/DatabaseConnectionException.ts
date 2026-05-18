/**
 * Thrown when the application cannot establish or reuse a database connection.
 * Lives under util/exceptions (not http/) because it is not an HTTP-layer error —
 * it originates in the infrastructure layer and is caught by the global handler
 * which maps it to a 503 response.
 */
export class DatabaseConnectionException extends Error {
  constructor(message = "Failed to connect to the database.") {
    super(message);
    this.name = "DatabaseConnectionException";
  }
}