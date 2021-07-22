import { User } from "../model/User";
import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from "../types";
import { Pool } from "pg";
import { IUserRepository } from "./IUserRepository";
import { Permission } from "../model/Permission";
import { NotFound } from "../exception/NotFound";
import { DuplicateResource } from "../exception/DuplicateResource";

@injectable()
export class UserRepositoryPostgres implements IUserRepository {
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private driver: Pool
    ) {}

    async createUser(username: string, password: string, permissions: Permission[]): Promise<User> {
        let connection = await this.driver.connect()
        await connection.query('BEGIN');
        try {
            var result = await connection.query(`
                INSERT INTO "user" (username, password, is_deactivated, is_verified) 
                VALUES ($1, $2, $3, $4)
                RETURNING id, username, password, is_deactivated, is_verified
            `, [username, password, false, false]);
            var userJson = result.rows[0];
            var user = new User(
                userJson['id'], 
                userJson['username'], 
                userJson['password'],
                userJson['is_deactivated'],
                userJson['is_verified'],
                [],
            );

            for (let permission of permissions) {
                var permissionResult = await connection.query(`
                    INSERT INTO "permission" (user_id, value)
                    VALUES ($1, $2)
                    RETURNING value
                `, [user.id, permission]);
                var permissionJson = permissionResult.rows[0];
                user.permissions.push(permissionJson['value']);
            }
                
            await connection.query('COMMIT');
            return user;
        } catch (error) {
            await connection.query('ROLLBACK');
            if (error.message === 'USERNAME_ALREADY_EXISTS') {
                throw new DuplicateResource("user", "username", username);
            } else {
                throw error;
            }
        } finally {
            connection.release()
        }
    } 

    async fetchUserByUsername(username: string) : Promise<User> {
        var result = await this.driver.query(`
            SELECT u.id, u.username, u.password, u.is_deactivated, u.is_verified
            FROM "user" u
            WHERE u.username = $1
        `, [username]);

        if (result.rowCount == 0) {
            throw new NotFound("user", "username", username);
        }
        var userJson = result.rows[0];
        var user = new User(
            userJson['id'], 
            userJson['username'], 
            userJson['password'],
            userJson['is_deactivated'],
            userJson['is_verified'],
            [],
        );

        result = await this.driver.query(`
            SELECT value as permission
            FROM "permission" 
            WHERE user_id = $1
        `, [user.id]);
        for (var row of result.rows) {
            user.permissions.push(row['permission'])
        }

        return user;
    }
}