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
exports.PostgresConnectionFactory = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../types");
class TransactionObjects {
    constructor(objects, connection) {
        this.objects = objects;
        this.connection = connection;
    }
    doesContain(object) {
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i] == object) {
                return true;
            }
        }
        return false;
    }
}
class NoneTransactionObject {
    constructor(depth, connection) {
        this.depth = depth;
        this.connection = connection;
    }
}
let PostgresConnectionFactory = class PostgresConnectionFactory {
    constructor(pool, transactionObjects = [], noneTransactionObjects = new Map()) {
        this.pool = pool;
        this.transactionObjects = transactionObjects;
        this.noneTransactionObjects = noneTransactionObjects;
    }
    getConnection(object, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let connection = undefined;
            let isIntransaction = false;
            for (let i = 0; i < this.transactionObjects.length; i++) {
                if (this.transactionObjects[i].doesContain(object)) {
                    connection = this.transactionObjects[i].connection;
                    isIntransaction = true;
                }
            }
            if (connection === undefined) {
                let noneTransactionObject = this.noneTransactionObjects.get(object);
                if (noneTransactionObject === undefined) {
                    connection = yield this.pool.connect();
                    noneTransactionObject = new NoneTransactionObject(0, connection);
                    this.noneTransactionObjects.set(object, noneTransactionObject);
                }
                else {
                    connection = noneTransactionObject.connection;
                    noneTransactionObject.depth += 1;
                }
            }
            try {
                yield callback(connection);
            }
            finally {
                if (!isIntransaction) {
                    let noneTransactionObject = this.noneTransactionObjects.get(object);
                    if (noneTransactionObject !== undefined) {
                        if (noneTransactionObject.depth === 0) {
                            connection.release();
                        }
                        else {
                            noneTransactionObject.depth -= 1;
                        }
                    }
                }
            }
        });
    }
    startTransaction(objects, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let connection = yield this.pool.connect();
            let transactionObjects = new TransactionObjects(objects, connection);
            connection.query('BEGIN');
            try {
                this.transactionObjects.push(transactionObjects);
                yield callback();
                connection.query('COMMIT');
            }
            catch (exception) {
                connection.query('ROLLBACK');
                throw exception;
            }
            finally {
                let index = this.transactionObjects.indexOf(transactionObjects);
                this.transactionObjects.splice(index, 1);
                connection.release();
            }
        });
    }
};
PostgresConnectionFactory = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.POSTGRES_DRIVER))
], PostgresConnectionFactory);
exports.PostgresConnectionFactory = PostgresConnectionFactory;
