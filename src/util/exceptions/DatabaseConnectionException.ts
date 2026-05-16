export class DatabaseConnectionException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DatabaseConnectionException";
    }
}