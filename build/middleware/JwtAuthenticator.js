"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.JwtAuthenticator = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const inversify_1 = require("inversify");
const types_1 = require("../types");
const NotFound_1 = require("../exception/NotFound");
let JwtAuthenticator = class JwtAuthenticator {
    constructor(driver, secretKey, durationS) {
        this.secretKey = secretKey;
        this.durationS = durationS;
        this.driver = driver;
    }
    generateToken(username) {
        return jsonwebtoken_1.default.sign({ username: username }, this.secretKey, {
            expiresIn: this.durationS
        });
    }
    authenticate(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (request.cookies != undefined && request.cookies.jwt != undefined) {
                    let payload = jsonwebtoken_1.default.verify(request.cookies.jwt, this.secretKey);
                    if ('username' in payload) {
                        let username = payload.username;
                        try {
                            var user = yield this.driver.fetchUserByUsername(username);
                            request.context.user = user;
                            next();
                        }
                        catch (error) {
                            if (error instanceof NotFound_1.NotFound) {
                                return response.status(403).send();
                            }
                            else {
                                return response.status(502).send(error.toString());
                            }
                        }
                    }
                    else {
                        next();
                    }
                }
                else {
                    next();
                }
            }
            catch (error) {
                if (error instanceof jsonwebtoken_1.TokenExpiredError) {
                    return response.status(403).send();
                }
                else {
                    response.status(502).send(error.toString());
                    throw error;
                }
            }
        });
    }
};
JwtAuthenticator = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.USER_REPOSITORY)),
    __param(1, inversify_1.inject(types_1.TYPES.JWT_SECRECT_KEY)),
    __param(2, inversify_1.inject(types_1.TYPES.JWT_DURATION_S))
], JwtAuthenticator);
exports.JwtAuthenticator = JwtAuthenticator;
