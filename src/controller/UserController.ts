import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import { IUserRepository } from '../repository/IUserRepository';
import bcrypt from 'bcrypt';
import { User } from '../model/User';
import { Permission } from '../model/Permission';
import { JwtAuthenticator } from '../middleware/JwtAuthenticator';


@injectable()
export class UserController {
    constructor(
        @inject(TYPES.USER_REPOSITORY) private repository: IUserRepository,
        @inject(TYPES.JWT_AUTHENTICATOR) private jwtAuthentication: JwtAuthenticator | null,
    ) {}

    async signUpNormalUser(username: string, password: string) : Promise<User> {
        let encryptedPassword = await bcrypt.hash(password, 10);
        return this.repository.createUser(username, encryptedPassword, []);
    }

    async signUpAdmin(username: string, password: string) : Promise<User> {
        let encryptedPassword = await bcrypt.hash(password, 10);
        return this.repository.createUser(username, encryptedPassword, [Permission.ADMIN]);
    }

    async logIn(username: string, password: string) : Promise<[string, number] | null> {
        let user = await this.repository.fetchUserByUsername(username);
        let compare = await bcrypt.compare(password, user.password);
        if (compare) {
            if (this.jwtAuthentication !== null) {
                return [this.jwtAuthentication.generateToken(user.username), this.jwtAuthentication.durationS];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
}