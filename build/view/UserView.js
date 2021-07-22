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
exports.UserView = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("../types");
let UserView = class UserView {
    constructor(controller) {
        this.controller = controller;
    }
    loginView(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            let username = request.body.username;
            let password = request.body.password;
            var ret = yield this.controller.logIn(username, password);
            if (ret === null) {
                return response.status(404).send();
            }
            else {
                var [jwt, maxAge] = ret;
                let option = {
                    maxAge: maxAge
                };
                response.cookie("jwt", jwt, option);
                return response.status(200).send();
            }
        });
    }
    getUserView(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            // If a request reaches here, the request must have already been authenticated
            // and a user must be set in context
            return response.status(200).send({
                'username': request.context.user.username
            });
        });
    }
};
UserView = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.USER_CONTROLLER))
], UserView);
exports.UserView = UserView;
