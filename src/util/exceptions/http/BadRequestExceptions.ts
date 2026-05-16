import { HTTPException } from "./HttpException";



export class BadRequestException extends HTTPException {

    constructor(
        message: string='Bad Request',
        details?: Record<string, unknown>
    ) {
        super(400,message,details);
        this.name='Bad Request Exception';
    }
}