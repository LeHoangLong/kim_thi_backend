'use strict'

const { Client, Pool } = require("pg");
const config = require('../src/config').config

module.exports.up = async function () {
    let pool = new Pool(config.postgres)
    let client = await pool.connect();
    await client.query('BEGIN');
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "image" (
                id TEXT PRIMARY KEY,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                created_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
            )
        `)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "product" (
                id SERIAL PRIMARY KEY ,
                serial_number TEXT NOT NULL,
                name TEXT NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                avatar_id TEXT REFERENCES image(id) ON DELETE NO ACTION ON UPDATE CASCADE NOT NULL,
                rank INTEGER NOT NULL CHECK(rank >= 0),
                created_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                wholesale_prices TEXT[] DEFAULT '{}' NOT NULL
            )
        `)

        await client.query(`
            CREATE TABLE IF NOT EXISTS "product_category" (
                category TEXT PRIMARY KEY,
                created_time TIMESTAMPTZ DEFAULT NOW() NOT NULL
            )
        `)

        await client.query(`
            CREATE TABLE IF NOT EXISTS "product_product_category" (
                category TEXT REFERENCES "product_category"(category) ON DELETE CASCADE ON UPDATE CASCADE,
                product_id INTEGER REFERENCES "product"(id) ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY (category, product_id)
            )
        `)

        await client.query(`
            CREATE INDEX IF NOT EXISTS "product_category_index" ON "product_product_category"(product_id)
        `)

        await client.query(`
            CREATE TABLE IF NOT EXISTS "product_price" (
                id SERIAL PRIMARY KEY,
                unit INTEGER CHECK (unit >= 0 AND unit < 1) NOT NULL,
                default_price DECIMAL NOT NULL,
                is_default BOOLEAN NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                product_id INTEGER REFERENCES "product"(id) ON DELETE NO ACTION ON UPDATE CASCADE NOT NULL
            )
        `)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "product_price_level" (
                id SERIAL PRIMARY KEY,
                min_quantity DECIMAL CHECK (min_quantity >= 0) NOT NULL,
                product_price_id INTEGER REFERENCES "product_price"(id) ON DELETE NO ACTION ON UPDATE CASCADE,
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                price DECIMAL NOT NULL
            )
        `)
        await client.query(`
            CREATE INDEX IF NOT EXISTS product_id_index ON "product"(id)
        `)
        await client.query(`
            CREATE INDEX IF NOT EXISTS product_price_product_id ON "product_price"(product_id)
        `)
        await client.query('COMMIT');
    } catch (exception) {
        await client.query('ROLLBACK');
        throw exception
    }  finally {
        await client.release()
        await pool.end()
    }
}

module.exports.down = async function (next) {
    let pool = new Pool(config.postgres)
    let client = await pool.connect();
    await client.query('BEGIN');
    try {
        await client.query('DROP TABLE IF EXISTS "product_price_level"')
        await client.query('DROP TABLE IF EXISTS "product_price"')
        await client.query('DROP TABLE IF EXISTS "product_product_category"')
        await client.query('DROP TABLE IF EXISTS "product_category"')
        await client.query('DROP TABLE IF EXISTS "product"')
        await client.query('DROP TABLE IF EXISTS "image"')
        await client.query('COMMIT');
    } catch (exception) {
        await client.query('ROLLBACK');
        throw exception
    }  finally {
        await client.release()
        await pool.end()
    }
}