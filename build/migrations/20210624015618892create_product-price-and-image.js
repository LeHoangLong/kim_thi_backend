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
const { Client, Pool } = require("pg");
const config = require('../config').config;
module.exports.up = function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = new Pool(config.postgres);
        let client = yield pool.connect();
        yield client.query('BEGIN');
        try {
            yield client.query(`
            CREATE TABLE IF NOT EXISTS "image" (
                id TEXT PRIMARY KEY,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                created_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
            )
        `);
            yield client.query(`
            CREATE TABLE IF NOT EXISTS "product" (
                id SERIAL PRIMARY KEY ,
                serial_number TEXT NOT NULL,
                name TEXT NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                avatar_id TEXT REFERENCES image(id) ON DELETE NO ACTION ON UPDATE CASCADE NOT NULL,
                rank INTEGER NOT NULL CHECK(rank >= 0),
                created_time TIMESTAMPTZ DEFAULT NOW() NOT NULL
            )
        `);
            yield client.query(`
            CREATE TABLE IF NOT EXISTS "product_category" (
                category TEXT PRIMARY KEY,
                created_time TIMESTAMPTZ DEFAULT NOW() NOT NULL
            )
        `);
            yield client.query(`
            CREATE TABLE IF NOT EXISTS "product_product_category" (
                category TEXT REFERENCES "product_category"(category) ON DELETE CASCADE ON UPDATE CASCADE,
                product_id INTEGER REFERENCES "product"(id) ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY (category, product_id)
            )
        `);
            yield client.query(`
            CREATE INDEX IF NOT EXISTS "product_category_index" ON "product_product_category"(product_id)
        `);
            yield client.query(`
            CREATE TABLE IF NOT EXISTS "product_price" (
                id SERIAL PRIMARY KEY,
                unit INTEGER CHECK (unit >= 0 AND unit < 1) NOT NULL,
                default_price REAL NOT NULL,
                is_default BOOLEAN NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                product_id INTEGER REFERENCES "product"(id) ON DELETE NO ACTION ON UPDATE CASCADE NOT NULL
            )
        `);
            yield client.query(`
            CREATE TABLE IF NOT EXISTS "product_price_level" (
                id SERIAL PRIMARY KEY,
                min_quantity INTEGER CHECK (min_quantity >= 0) NOT NULL,
                product_price_id INTEGER REFERENCES "product_price"(id) ON DELETE NO ACTION ON UPDATE CASCADE,
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                price REAL NOT NULL
            )
        `);
            yield client.query(`
            CREATE INDEX IF NOT EXISTS product_id_index ON "product"(id)
        `);
            yield client.query(`
            CREATE INDEX IF NOT EXISTS product_price_product_id ON "product_price"(product_id)
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
        next();
    });
};
module.exports.down = function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = new Pool(config.postgres);
        let client = yield pool.connect();
        yield client.query('BEGIN');
        try {
            yield client.query('DROP TABLE IF EXISTS "product_price_level"');
            yield client.query('DROP TABLE IF EXISTS "product_price"');
            yield client.query('DROP TABLE IF EXISTS "product_product_category"');
            yield client.query('DROP TABLE IF EXISTS "product_category"');
            yield client.query('DROP TABLE IF EXISTS "product"');
            yield client.query('DROP TABLE IF EXISTS "image"');
            yield client.query('COMMIT');
        }
        catch (exception) {
            yield client.query('ROLLBACK');
            throw exception;
        }
        finally {
            yield client.release();
        }
        next();
    });
};
