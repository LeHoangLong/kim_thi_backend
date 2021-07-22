"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthorizer = void 0;
const inversify_1 = require("inversify");
const Permission_1 = require("../model/Permission");
let AdminAuthorizer = class AdminAuthorizer {
    authorize(request, response, next) {
        if (!request.context ||
            request.context.user === undefined ||
            !request.context.user.permissions.includes(Permission_1.Permission.ADMIN)) {
            console.log('request.context.user.permissions');
            console.log(request.context.user.permissions);
            return response.status(401).send();
        }
        else {
            next();
        }
    }
};
AdminAuthorizer = __decorate([
    inversify_1.injectable()
], AdminAuthorizer);
exports.AdminAuthorizer = AdminAuthorizer;
