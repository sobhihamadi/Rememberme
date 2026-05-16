import { Request, Response } from "express";
import { AuthenticationService } from "../services/authentication.service";
import { UserService } from "../services/user.service";
import { BadRequestException } from "../util/exceptions/http/BadRequestExceptions";
import { userPayload } from "../config/db_mode";
import { toRole } from "../config/roles";

export class AuthController {
    constructor(
        private readonly authService: AuthenticationService,
        private readonly userService: UserService
    ) {}

    public async login(req: Request, res: Response) {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new BadRequestException("Email and password are required", {
                EmailMissing: !email,
                PasswordMissing: !password,
            });
        }

        const user = await this.userService.validateUserCredentials(email, password);

        const payload: userPayload = { userId: user.id, role: toRole(user.role) };
        this.authService.PersistAuthentication(res, payload);

        res.status(200).json({ message: "Login successful" });
    }

    public async logout(_req: Request, res: Response) {
        this.authService.clearToken(res);
        res.status(200).json({ message: "Logout successful" });
    }
}