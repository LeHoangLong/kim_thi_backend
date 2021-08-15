'use strict'

const { Pool } = require("pg");
const config = require('../src/config').config

module.exports.up = async function (next) {
  let pool = new Pool(config.postgres)
  let client = await pool.connect();
  await client.query('BEGIN');
  try {
    await client.query('DROP TYPE IF EXISTS bill_based_fee')
    await client.query(`
      CREATE TYPE bill_based_fee AS (
        min_bill_value DECIMAL(11, 2),
        fraction_of_bill DECIMAL(4, 4),
        fraction_of_total_transport_fee DECIMAL(4, 4),
        basic_fee DECIMAL(11, 2)
      )
    `)
    await client.query(`CREATE TABLE IF NOT EXISTS "area_transport_fee" (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      area_city TEXT NOT NULL,
      basic_fee DECIMAL(11, 2) DEFAULT NULL,
      bill_based_fee bill_based_fee[],
      distance_fee_per_km DECIMAL(11, 2) DEFAULT NULL,
      origin_latitude DECIMAL(9, 6) NOT NULL,
      origin_longitude DECIMAL(9, 6) NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
      created_time TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`)

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
