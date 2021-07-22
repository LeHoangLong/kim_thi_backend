"use strict";
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
const Permission_1 = require("../model/Permission");
const User_1 = require("../model/User");
require("reflect-metadata");
const sinon_1 = __importDefault(require("sinon"));
const types_1 = require("../types");
const inversify_config_1 = require("../inversify.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
describe('User test', function () {
    var context = {};
    this.beforeEach(function () {
        context = {};
        var fakeHasedPassword = bcrypt_1.default.hashSync("password", 10);
        const fakeUserDriver = {
            createUser(username, password, permissions) {
                return __awaiter(this, void 0, void 0, function* () {
                    password = bcrypt_1.default.hashSync(password, 10);
                    return new User_1.User(0, username, password, false, false, permissions);
                });
            },
            fetchUserByUsername(username) {
                return __awaiter(this, void 0, void 0, function* () {
                    return new User_1.User(0, username, fakeHasedPassword, false, false, [Permission_1.Permission.ADMIN]);
                });
            },
        };
        const jwtAuthenticator = {
            generateToken(username) {
                return "token";
            },
            durationS: 1000
        };
        context.generateTokenSpy = sinon_1.default.spy(jwtAuthenticator, "generateToken");
        inversify_config_1.myContainer.rebind(types_1.TYPES.JWT_AUTHENTICATOR).toConstantValue(jwtAuthenticator);
        inversify_config_1.myContainer.rebind(types_1.TYPES.USER_REPOSITORY).toConstantValue(fakeUserDriver);
        context.view = inversify_config_1.myContainer.get(types_1.TYPES.USER_VIEW);
        context.request = {
            body: {
                username: 'username',
                password: 'password'
            }
        };
        context.response = {
            status(status) { return this; },
            cookie(name, value, option) { return this; },
            send() { },
        };
        context.cookieSpy = sinon_1.default.spy(context.response, "cookie");
        context.statusSpy = sinon_1.default.spy(context.response, "status");
        context.sendSpy = sinon_1.default.spy(context.response, "send");
    });
    it("should be able to login", function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.view.loginView(context.request, context.response);
            sinon_1.default.assert.calledOnceWithExactly(context.cookieSpy, "jwt", "token", {
                maxAge: 1000
            });
            sinon_1.default.assert.calledOnceWithExactly(context.generateTokenSpy, "username");
            sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
            sinon_1.default.assert.calledOnce(context.sendSpy);
        });
    });
    it('should reject if password is incorrect', function () {
        return __awaiter(this, void 0, void 0, function* () {
            context.request.body.password = 'password2';
            yield context.view.loginView(context.request, context.response);
            sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 404);
            sinon_1.default.assert.calledOnce(context.sendSpy);
        });
    });
});
