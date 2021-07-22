"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    "postgres": {
        "user": "admin",
        "password": "~admin~124679~",
        "host": "db",
        "database": "kimthi"
    },
    "postgres_test": {
        "user": "admin",
        "password": "~admin~124679~",
        "host": "db-test",
        "database": "kimthi"
    },
    "pagination": {
        "defaultSize": 10,
        "maxSize": 50
    }
};
exports.default = exports.config;
