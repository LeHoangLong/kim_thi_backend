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
const pg_1 = require("pg");
const inversify_config_1 = require("./inversify.config");
const types_1 = require("./types");
const PostgresConnectionFactory_1 = require("./services/PostgresConnectionFactory");
var migrate = require('migrate');
const config_1 = __importDefault(require("./config"));
before(function () {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.default["postgres"] = config_1.default.postgres_test;
        yield inversify_config_1.myContainer.get(types_1.TYPES.POSTGRES_DRIVER).end();
        inversify_config_1.myContainer.rebind(types_1.TYPES.POSTGRES_DRIVER).toConstantValue(new pg_1.Pool(config_1.default.postgres_test));
        inversify_config_1.myContainer.rebind(types_1.TYPES.CONNECTION_FACTORY).toConstantValue(new PostgresConnectionFactory_1.PostgresConnectionFactory(inversify_config_1.myContainer.get(types_1.TYPES.POSTGRES_DRIVER)));
    });
});
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve, reject) => {
        migrate.load({
            stateStore: './migrations-state/.migrate-test'
        }, function (err, set) {
            if (err) {
                console.log(err);
                throw err;
            }
            else {
                set.down(function (err) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    set.up(function (err) {
                        if (err) {
                            console.log(err);
                            throw err;
                        }
                        resolve(true);
                    });
                });
            }
        });
    });
}));
after(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield inversify_config_1.myContainer.get(types_1.TYPES.POSTGRES_DRIVER).end();
    });
});
