export class ItemNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ItemNotFoundException";
    }
    
}
export class InvalidItemException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidItemException";
    }   }
export class InitializationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InitializationException";
    }
}
export class DbException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DbException";
    }}



