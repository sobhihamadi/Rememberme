import { HTTPException } from "./HttpException";


export class serviceexception extends HTTPException {
    constructor(message: string) {
        super(500,message);
        this.name = "serviceexception";
    }
}