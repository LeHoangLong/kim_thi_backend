'use strict'

const { Pool } = require("pg");
const config = require('../src/config').config

module.exports.up = async function (next) {
  let pool = new Pool(config.postgres)
  let client = await pool.connect();
  await client.query('BEGIN');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "address" (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        latitude DECIMAL(9, 6) NOT NULL,
        longitude DECIMAL(9, 6) NOT NULL,
        city TEXT NOT NULL,
        is_deleted BOOLEAN DEFAULT FALSE
      )
    `)

    await client.query(`
        CREATE TABLE IF NOT EXISTS "customer_contact" (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE,
          phone_number TEXT UNIQUE,
          CONSTRAINT constraint_1 CHECK(email IS NOT NULL OR phone_number IS NOT NULL),
          is_deleted BOOLEAN DEFAULT FALSE,
          name TEXT
        )
    `)

    await client.query(`
        CREATE UNIQUE INDEX phone_number_idx ON "customer_contact"(phone_number) WHERE is_deleted = TRUE
    `)

    await client.query(`
        CREATE UNIQUE INDEX email_idx ON "customer_contact"(email) WHERE is_deleted = TRUE
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "order" (
        id SERIAL PRIMARY KEY,
        address_id INTEGER REFERENCES "address"(id) ON UPDATE CASCADE ON DELETE NO ACTION,
        is_shipped BOOLEAN DEFAULT FALSE,
        is_received BOOLEAN DEFAULT FALSE,
        is_paid BOOLEAN DEFAULT FALSE,
        is_cancelled BOOLEAN DEFAULT FALSE,
        start_delivery_time TIMESTAMPTZ,
        received_time TIMESTAMPTZ,
        payment_time TIMESTAMPTZ,
        cancel_time TIMESTAMPTZ,
        cancel_reason TEXT DEFAULT '',
        payment_amount DECIMAL NOT NULL,
        customer_message TEXT DEFAULT '',
        customer_contact_id INTEGER REFERENCES "customer_contact"(id) ON DELETE NO ACTION ON UPDATE CASCADE NOT NULL,
        area_transport_fee_id INTEGER REFERENCES "area_transport_fee"(id) ON DELETE NO ACTION ON UPDATE CASCADE NOT NULL
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "order_item" (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES "order"(id) ON UPDATE CASCADE ON DELETE NO ACTION,
        unit INTEGER,
        price DECIMAL NOT NULL,
        quantity DECIMAL NOT NULL,
        product_id INTEGER NOT NULL REFERENCES "product"(id) ON DELETE NO ACTION ON UPDATE CASCADE
      )
    `)

    await client.query('COMMIT')
  } catch (exception) {
    console.log('exception')
    console.log(exception)
    await client.query(`ROLLBACK`)
    throw exception
  } finally {
    await client.release()
    await pool.end()
  }
}

module.exports.down = async function (next) {
  
  let pool = new Pool(config.postgres)
  let client = await pool.connect();
  await client.query('BEGIN');
  try {
      await client.query('DROP TABLE IF EXISTS "order_item"')
      await client.query('DROP TABLE IF EXISTS "order"')
      await client.query('DROP TABLE IF EXISTS "customer_contact"')
      await client.query('DROP TABLE IF EXISTS "address"')
      await client.query('COMMIT');
  } catch (exception) {
      await client.query('ROLLBACK');
      throw exception
  }  finally {
      await client.release()
      await pool.end()
  }
}
