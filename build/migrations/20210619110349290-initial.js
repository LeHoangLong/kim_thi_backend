'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const config = require("../config");
const UserRepositoryPostgres = require('../build/src/repository/UserRepositoryPostgres').UserRepositoryPostgres;
const UserController = require('../build/src/controller/UserController').UserController;
const { NotFound } = require("../build/src/exception/NotFound");
const { Client, Pool } = require("pg");
const config = require('../config').config;
module.exports.up = function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = new Pool(config.postgres);
        let client = yield pool.connect();
        yield client.query('BEGIN');
        try {
            yield client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_deactivated BOOLEAN NOT NULL DEFAULT FALSE,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          createdTime TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`);
            yield client.query(`
        CREATE TABLE IF NOT EXISTS "permission" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE CASCADE,
          value INTEGER CHECK(value >= 0 AND value < 1)
        )
        `);
            yield client.query('COMMIT');
        }
        catch (exception) {
            yield client.query('ROLLBACK');
            throw exception;
        }
        finally {
            yield client.release();
        }
        client = yield pool.connect();
        yield client.query('BEGIN');
        try {
            let userDriver = new UserRepositoryPostgres(pool);
            try {
                yield userDriver.fetchUserByUsername("kimthi0209");
            }
            catch (exception) {
                if (exception instanceof NotFound) {
                    let controller = new UserController(userDriver, null);
                    yield controller.signUpAdmin("kimthi0209", "1nghinle1dem");
                }
                else {
                    throw exception;
                }
            }
            yield client.query('COMMIT');
        }
        catch (exception) {
            console.log('rollback');
            yield client.query('ROLLBACK');
            throw exception;
        }
        finally {
            yield client.release();
        }
        next();
    });
};
module.exports.down = function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = new Pool(config.postgres);
        let client = yield pool.connect();
        yield client.query('DROP TABLE IF EXISTS "permission"');
        yield client.query('DROP TABLE IF EXISTS "user"');
        yield client.release();
        next();
    });
};
