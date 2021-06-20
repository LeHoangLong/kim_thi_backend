"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPES = void 0;
exports.TYPES = {
    POSTGRES_DRIVER: Symbol.for("POSTGRES_DRIVER"),
    USER_REPOSITORY: Symbol.for('USER_REPOSITORY'),
    USER_CONTROLLER: Symbol.for('USER_CONTROLLER'),
    USER_VIEW: Symbol.for('USER_VIEW'),
    JWT_SECRECT_KEY: Symbol.for('JWT_SECRECT_KEY'),
    JWT_DURATION_S: Symbol.for('JWT_DURATION_S'),
    JWT_AUTHENTICATOR: Symbol.for('JWT_AUTHENTICATOR'),
    USER_AUTHORIZER: Symbol.for('USER_AUTHORIZER'),
};
