"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(id, username, password, isDeactivated, isVerified, permissions) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.isDeactivated = isDeactivated;
        this.isVerified = isVerified;
        this.permissions = permissions;
    }
    ;
}
exports.User = User;
