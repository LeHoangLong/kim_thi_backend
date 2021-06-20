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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Permission_1 = require("../src/model/Permission");
var User_1 = require("../src/model/User");
require("reflect-metadata");
var sinon_1 = __importDefault(require("sinon"));
var types_1 = require("../src/types");
var inversify_config_1 = require("../src/inversify.config");
var bcrypt_1 = __importDefault(require("bcrypt"));
describe('User test', function () {
    var context = {};
    this.beforeEach(function () {
        context = {};
        var fakeHasedPassword = bcrypt_1.default.hashSync("password", 10);
        var fakeUserDriver = {
            createUser: function (username, password, permissions) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        password = bcrypt_1.default.hashSync(password, 10);
                        return [2 /*return*/, new User_1.User(0, username, password, false, false, permissions)];
                    });
                });
            },
            fetchUserByUsername: function (username) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, new User_1.User(0, username, fakeHasedPassword, false, false, [Permission_1.Permission.ADMIN])];
                    });
                });
            },
        };
        var jwtAuthenticator = {
            generateToken: function (username) {
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
            status: function (status) { },
            cookie: function (name, value, option) { }
        };
        context.cookieSpy = sinon_1.default.spy(context.response, "cookie");
        context.statusSpy = sinon_1.default.spy(context.response, "status");
    });
    it("should be able to login", function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.view.loginView(context.request, context.response)];
                    case 1:
                        _a.sent();
                        sinon_1.default.assert.calledOnceWithExactly(context.cookieSpy, "jwt", "token", {
                            maxAge: 1000
                        });
                        sinon_1.default.assert.calledOnceWithExactly(context.generateTokenSpy, "username");
                        sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should reject if password is incorrect', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context.request.body.password = 'password2';
                        return [4 /*yield*/, context.view.loginView(context.request, context.response)];
                    case 1:
                        _a.sent();
                        sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 404);
                        return [2 /*return*/];
                }
            });
        });
    });
});
