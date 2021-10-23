'use strict'

const UserRepositoryPostgres = require('../build/src/repository/UserRepositoryPostgres').UserRepositoryPostgres;
const UserController = require('../build/src/controller/UserController').UserController;
const { NotFound } = require("../build/src/exception/NotFound");
const { Client, Pool } = require("pg");
const config = require('../src/config').config

console.log('initial migration')
module.exports.up = async function (next) {
    console.log('initial migration up')
    console.log('config.postgres')
    console.log(config.postgres)
    let pool = new Pool(config.postgres)
    console.log('initial migration connecting')
    let client = await pool.connect();
    console.log('initial migration connected')
    await client.query('BEGIN');
    try {
      await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_deactivated BOOLEAN NOT NULL DEFAULT FALSE,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          createdTime TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )`);
      await client.query(`
        CREATE TABLE IF NOT EXISTS "permission" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE CASCADE,
          value INTEGER CHECK(value >= 0 AND value < 1)
        )
        `)
      await client.query('COMMIT');
    } catch (exception) {
      await client.query('ROLLBACK');
      throw exception;
    } finally {
      await client.release();
    }

    client = await pool.connect();
    await client.query('BEGIN');
    try {
      let userDriver = new UserRepositoryPostgres(pool);
      try {
        await userDriver.fetchUserByUsername("kimthi0209");
      } catch (exception) {
        if (exception instanceof NotFound) {
          let controller = new UserController(userDriver, null);
          await controller.signUpAdmin("kimthi0209", "1nghinle1dem");
        } else {
          throw exception;
        }
      }
      console.log('initial migration success')
      await client.query('COMMIT');
    } catch (exception) {
      console.log('rollback')
      await client.query('ROLLBACK');
      throw exception;
    } finally {
      console.log('initial migration done')
      await client.release()
      await pool.end()
    }

    next()
}

module.exports.down = async function (next) {
  console.log('initial migration down')
  let pool = new Pool(config.postgres)
  let client = await pool.connect();
  await client.query('DROP TABLE IF EXISTS "permission"');
  await client.query('DROP TABLE IF EXISTS "user"');
  await client.release()
  await pool.end()
}