'use strict'

const config = require("../config.json");
const { Client, Pool } = require("pg");

module.exports.up = async function (next) {
    let client = new Client(config.postgres)
    await client.connect()
    await client.query('BEGIN');
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "image" (
                id TEXT PRIMARY KEY,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                created_timestamp TIMESTAMPTZ DEFAULT NOW()
            )
        `)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "product_price" (
                id SERIAL PRIMARY KEY,
                unit INTEGER CHECK (unit >= 0 AND unit < 1),
                min_quantity INTEGER CHECK (min_quantity >= 0) NOT NULL,
                price REAL NOT NULL
            )
        `)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "product" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                avatar_id TEXT REFERENCES image(id) ON DELETE NO ACTION ON UPDATE CASCADE,
                rank INTEGER NOT NULL CHECK(rank > 0),
                display_price_id INTEGER REFERENCES product_price(id) ON DELETE NO ACTION ON UPDATE CASCADE,
                created_time TIMESTAMPTZ DEFAULT NOW()
            )
        `)
        await client.query('COMMIT');
    } catch (exception) {
        await client.query('ROLLBACK');
        throw exception
    }
    next()
}

module.exports.down = async function (next) {
    let client = new Client(config.postgres)
    await client.connect()
    await client.query('BEGIN');
    try {
        await client.query('DROP TABLE IF EXISTS "product"')
        await client.query('DROP TABLE IF EXISTS "product_price"')
        await client.query('DROP TABLE IF EXISTS "image"')
        await client.query('COMMIT');
    } catch (exception) {
        await client.query('ROLLBACK');
        throw exception
    }
    next()
}