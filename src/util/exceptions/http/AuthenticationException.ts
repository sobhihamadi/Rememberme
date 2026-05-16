import { HTTPException } from "./HttpException";


export class AuthenticationException extends HTTPException {
    constructor(message: string) {
        super(401,message);
        this.name = "AuthenticationException";
    }

}
export class InvalidTokenException extends AuthenticationException {
    constructor() {
        super("The provided token is invalid.");
        this.name = "InvalidTokenException";
    }
}
export class ExpiredTokenException extends AuthenticationException {
    constructor() {
        super("The provided token has expired.");
        this.name = "ExpiredTokenException";
    }
}
export class AuthenticationFailedException extends AuthenticationException {
    constructor() {
        super("Authentication Failed.");
        this.name = "AuthenticationFailedExpcetion";
    }
}