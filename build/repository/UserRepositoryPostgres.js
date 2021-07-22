"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositoryPostgres = void 0;
const User_1 = require("../model/User");
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("../types");
const NotFound_1 = require("../exception/NotFound");
const DuplicateResource_1 = require("../exception/DuplicateResource");
let UserRepositoryPostgres = class UserRepositoryPostgres {
    constructor(driver) {
        this.driver = driver;
    }
    createUser(username, password, permissions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('create user');
            let connection = yield this.driver.connect();
            yield connection.query('BEGIN');
            try {
                var result = yield connection.query(`
                INSERT INTO "user" (username, password, is_deactivated, is_verified) 
                VALUES ($1, $2, $3, $4)
                RETURNING id, username, password, is_deactivated, is_verified
            `, [username, password, false, false]);
                var userJson = result.rows[0];
                var user = new User_1.User(userJson['id'], userJson['username'], userJson['password'], userJson['is_deactivated'], userJson['is_verified'], []);
                for (let permission of permissions) {
                    var permissionResult = yield connection.query(`
                    INSERT INTO "permission" (user_id, value)
                    VALUES ($1, $2)
                    RETURNING value
                `, [user.id, permission]);
                    var permissionJson = permissionResult.rows[0];
                    user.permissions.push(permissionJson['value']);
                }
                console.log('commit');
                yield connection.query('COMMIT');
                return user;
            }
            catch (error) {
                console.log('error');
                yield connection.query('ROLLBACK');
                if (error.message === 'USERNAME_ALREADY_EXISTS') {
                    throw new DuplicateResource_1.DuplicateResource("user", "username", username);
                }
                else {
                    throw error;
                }
            }
            finally {
                connection.release();
            }
        });
    }
    fetchUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = yield this.driver.query(`
            SELECT u.id, u.username, u.password, u.is_deactivated, u.is_verified
            FROM "user" u
            WHERE u.username = $1
        `, [username]);
            if (result.rowCount == 0) {
                throw new NotFound_1.NotFound("user", "username", username);
            }
            var userJson = result.rows[0];
            var user = new User_1.User(userJson['id'], userJson['username'], userJson['password'], userJson['is_deactivated'], userJson['is_verified'], []);
            result = yield this.driver.query(`
            SELECT value as permission
            FROM "permission" 
            WHERE user_id = $1
        `, [user.id]);
            for (var row of result.rows) {
                user.permissions.push(row['permission']);
            }
            return user;
        });
    }
};
UserRepositoryPostgres = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.POSTGRES_DRIVER))
], UserRepositoryPostgres);
exports.UserRepositoryPostgres = UserRepositoryPostgres;
