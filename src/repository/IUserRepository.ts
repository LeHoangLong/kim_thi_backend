import { Permission } from "../model/Permission";
import { User } from "../model/User";

export interface IUserRepository {
    createUser(username: string, password: string, permissions: Permission[]): Promise<User>;
    fetchUserByUsername(username: string) : Promise<User>;
}