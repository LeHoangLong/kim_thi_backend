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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("../types");
const bcrypt_1 = __importDefault(require("bcrypt"));
const Permission_1 = require("../model/Permission");
let UserController = class UserController {
    constructor(repository, jwtAuthentication) {
        this.repository = repository;
        this.jwtAuthentication = jwtAuthentication;
    }
    signUpNormalUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            var encryptedPassword = yield bcrypt_1.default.hash(password, 10);
            return this.repository.createUser(username, encryptedPassword, []);
        });
    }
    signUpAdmin(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('sign up admin');
            var encryptedPassword = yield bcrypt_1.default.hash(password, 10);
            return this.repository.createUser(username, encryptedPassword, [Permission_1.Permission.ADMIN]);
        });
    }
    logIn(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            var user = yield this.repository.fetchUserByUsername(username);
            let compare = yield bcrypt_1.default.compare(password, user.password);
            if (compare) {
                if (this.jwtAuthentication !== null) {
                    return [this.jwtAuthentication.generateToken(user.username), this.jwtAuthentication.durationS];
                }
                else {
                    return null;
                }
            }
            else {
                return null;
            }
        });
    }
};
UserController = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.USER_REPOSITORY)),
    __param(1, inversify_1.inject(types_1.TYPES.JWT_AUTHENTICATOR))
], UserController);
exports.UserController = UserController;
