"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1)
            throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f)
            throw new TypeError("Generator is already executing.");
        while (_)
            try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return { value: op[1], done: false };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2])
                            _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            }
            catch (e) {
                op = [6, e];
                y = 0;
            }
            finally {
                f = t = 0;
            }
        if (op[0] & 5)
            throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositoryPostgres = void 0;
var User_1 = require("../model/User");
require("reflect-metadata");
var inversify_1 = require("inversify");
var types_1 = require("../types");
var NotFound_1 = require("../exception/NotFound");
var DuplicateResource_1 = require("../exception/DuplicateResource");
var UserRepositoryPostgres = /** @class */ (function () {
    function UserRepositoryPostgres(driver) {
        this.driver = driver;
    }
    UserRepositoryPostgres.prototype.createUser = function (username, password, permissions) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, result, userJson, user, _i, permissions_1, permission, permissionResult, permissionJson, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('create user');
                        return [4 /*yield*/, this.driver.connect()];
                    case 1:
                        connection = _a.sent();
                        return [4 /*yield*/, connection.query('BEGIN')];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 10, 12, 13]);
                        return [4 /*yield*/, connection.query("\n                INSERT INTO \"user\" (username, password, is_deactivated, is_verified) \n                VALUES ($1, $2, $3, $4)\n                RETURNING id, username, password, is_deactivated, is_verified\n            ", [username, password, false, false])];
                    case 4:
                        result = _a.sent();
                        userJson = result.rows[0];
                        user = new User_1.User(userJson['id'], userJson['username'], userJson['password'], userJson['is_deactivated'], userJson['is_verified'], []);
                        _i = 0, permissions_1 = permissions;
                        _a.label = 5;
                    case 5:
                        if (!(_i < permissions_1.length))
                            return [3 /*break*/, 8];
                        permission = permissions_1[_i];
                        return [4 /*yield*/, connection.query("\n                    INSERT INTO \"permission\" (user_id, value)\n                    VALUES ($1, $2)\n                    RETURNING value\n                ", [user.id, permission])];
                    case 6:
                        permissionResult = _a.sent();
                        permissionJson = permissionResult.rows[0];
                        user.permissions.push(permissionJson['value']);
                        _a.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8:
                        console.log('commit');
                        return [4 /*yield*/, connection.query('COMMIT')];
                    case 9:
                        _a.sent();
                        return [2 /*return*/, user];
                    case 10:
                        error_1 = _a.sent();
                        console.log('error');
                        return [4 /*yield*/, connection.query('ROLLBACK')];
                    case 11:
                        _a.sent();
                        if (error_1.message === 'USERNAME_ALREADY_EXISTS') {
                            throw new DuplicateResource_1.DuplicateResource("user", "username", username);
                        }
                        else {
                            throw error_1;
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        connection.release();
                        return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    UserRepositoryPostgres.prototype.fetchUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var result, userJson, user, _i, _a, row;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.driver.query("\n            SELECT u.id, u.username, u.password, u.is_deactivated, u.is_verified\n            FROM \"user\" u\n            WHERE u.username = $1\n        ", [username])];
                    case 1:
                        result = _b.sent();
                        if (result.rowCount == 0) {
                            throw new NotFound_1.NotFound("user", "username", username);
                        }
                        userJson = result.rows[0];
                        user = new User_1.User(userJson['id'], userJson['username'], userJson['password'], userJson['is_deactivated'], userJson['is_verified'], []);
                        return [4 /*yield*/, this.driver.query("\n            SELECT value as permission\n            FROM \"permission\" \n            WHERE user_id = $1\n        ", [user.id])];
                    case 2:
                        result = _b.sent();
                        for (_i = 0, _a = result.rows; _i < _a.length; _i++) {
                            row = _a[_i];
                            user.permissions.push(row['permission']);
                        }
                        return [2 /*return*/, user];
                }
            });
        });
    };
    UserRepositoryPostgres = __decorate([
        inversify_1.injectable(),
        __param(0, inversify_1.inject(types_1.TYPES.POSTGRES_DRIVER))
    ], UserRepositoryPostgres);
    return UserRepositoryPostgres;
}());
exports.UserRepositoryPostgres = UserRepositoryPostgres;
