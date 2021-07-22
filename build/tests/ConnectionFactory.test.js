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
require("reflect-metadata");
const inversify_config_1 = __importDefault(require("../inversify.config"));
const types_1 = require("../types");
const chai_1 = __importDefault(require("chai"));
describe('Postgres connection factory test', function () {
    return __awaiter(this, void 0, void 0, function* () {
        let context = {};
        beforeEach(function () {
            return __awaiter(this, void 0, void 0, function* () {
                let factory = inversify_config_1.default.get(types_1.TYPES.CONNECTION_FACTORY);
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield connection.query(`CREATE TABLE IF NOT EXISTS "test"(id SERIAL PRIMARY KEY)`);
                        yield connection.query(`DELETE FROM "test"`);
                    });
                });
            });
        });
        it('get connection ok', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let factory = inversify_config_1.default.get(types_1.TYPES.CONNECTION_FACTORY);
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(0);
                        yield connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                        response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                    });
                });
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                    });
                });
            });
        });
        it('nested connection', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let factory = inversify_config_1.default.get(types_1.TYPES.CONNECTION_FACTORY);
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(0);
                        yield factory.getConnection(1, function (connection) {
                            return __awaiter(this, void 0, void 0, function* () {
                                yield connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                                let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                                chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                            });
                        });
                        response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                    });
                });
            });
        });
        it('transaction success', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let factory = inversify_config_1.default.get(types_1.TYPES.CONNECTION_FACTORY);
                yield factory.startTransaction([1], function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield factory.getConnection(1, function (connection) {
                            return __awaiter(this, void 0, void 0, function* () {
                                yield connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                                let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                                chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                            });
                        });
                    });
                });
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                    });
                });
            });
        });
        it('transaction exception', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let factory = inversify_config_1.default.get(types_1.TYPES.CONNECTION_FACTORY);
                let exceptionRaise = 0;
                try {
                    yield factory.startTransaction([1], function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            yield factory.getConnection(1, function (connection) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    yield connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                                    let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                                    chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                                    throw new Error("abc");
                                });
                            });
                        });
                    });
                }
                catch (exception) {
                    chai_1.default.expect(exception.toString()).to.equal("Error: abc");
                    exceptionRaise = 1;
                }
                chai_1.default.expect(exceptionRaise).equal(1);
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(0);
                    });
                });
                exceptionRaise = 0;
                try {
                    yield factory.startTransaction([1], function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            yield factory.getConnection(1, function (connection) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    yield connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                                    let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                                    chai_1.default.expect(parseInt(response.rows[0].count)).equals(1);
                                });
                            });
                            throw new Error("abc");
                        });
                    });
                }
                catch (exception) {
                    chai_1.default.expect(exception.toString()).to.equal("Error: abc");
                    exceptionRaise = 1;
                }
                chai_1.default.expect(exceptionRaise).equal(1);
                yield factory.getConnection(1, function (connection) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let response = yield connection.query(`SELECT COUNT(*) FROM "test"`);
                        chai_1.default.expect(parseInt(response.rows[0].count)).equals(0);
                    });
                });
            });
        });
    });
});
