'use strict'

const { Pool } = require("pg");
const config = require('../src/config').config

module.exports.up = async function (next) {
  let pool = new Pool(config.postgres)
  let client = await pool.connect();
  await client.query('BEGIN');
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS "area_transport_fee" (
      id SERIAL PRIMARY KEY,
      area_city TEXT NOT NULL,
      basic_fee DECIMAL(11, 2) DEFAULT NULL,
      fraction_of_bill_fee DECIMAL(11, 2) DEFAULT NULL,
      distance_fee_per_km DECIMAL(11, 2) DEFAULT NULL,
      origin_latitude DECIMAL(9, 6) NOT NULL,
      origin_longitude DECIMAL(9, 6) NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE NOT NULL
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS "product_area_transport_fee" (
      product_id INTEGER REFERENCES "product"(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL ,
      transport_fee_id INTEGER REFERENCES "area_transport_fee"(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
      PRIMARY KEY (product_id, transport_fee_id)
    )`)
    await client.query(`CREATE INDEX IF NOT EXISTS product_area_transport_fee_index ON "product_area_transport_fee" (transport_fee_id)`)
    await client.query('COMMIT')
  } catch (exception) {
    await client.query(`ROLLBACK`)
    throw exception
  } finally {
    await client.release()
    await pool.end()
  }
}

module.exports.down = async function (next) {
  let pool = new Pool(config.postgres)
  await pool.query(`DROP TABLE IF EXISTS "product_area_transport_fee"`)
  await pool.query(`DROP TABLE IF EXISTS "area_transport_fee"`)
  await pool.end()
}
