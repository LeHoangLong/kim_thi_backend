import { PoolClient } from 'pg';
import 'reflect-metadata';
import myContainer from '../inversify.config';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import { TYPES } from '../types';
import chai from 'chai'

describe('Postgres connection factory test', async function() {
    let context : any = {}
    beforeEach(async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        await factory.getConnection(1, async function(connection: PoolClient) {
            await connection.query(`CREATE TABLE IF NOT EXISTS "test"(id SERIAL PRIMARY KEY)`)
            await connection.query(`DELETE FROM "test"`)
        })
    })
    it('get connection ok', async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        chai.expect(await factory.getNumberOfConnections()).to.eql(0)
        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(0)
            await connection.query(`INSERT INTO "test"(id) VALUES (1)`);
            response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(1)
        })
        chai.expect(await factory.getNumberOfConnections()).to.eql(0)

        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(1)
        })

        chai.expect(await factory.getNumberOfConnections()).to.eql(0)
    })

    it('nested connection', async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(0)
            await factory.getConnection(1, async function(connection: PoolClient) {
                await connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
                chai.expect(parseInt(response.rows[0].count)).equals(1)
            })
            response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(1)
        })
    })

    it('transaction success', async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
    
        await factory.startTransaction(0, [1], async function() {
            await factory.getConnection(1, async function(connection: PoolClient) {
                await connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
                chai.expect(parseInt(response.rows[0].count)).equals(1)
            })
        })

        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(1)
        })
    })

    it('transaction exception', async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
    
        let exceptionRaise = 0
        try {
            await factory.startTransaction(0, [1], async function() {
                await factory.getConnection(1, async function(connection: PoolClient) {
                    await connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                    let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
                    chai.expect(parseInt(response.rows[0].count)).equals(1)
                    throw new Error("abc")
                })    
            })
        } catch (exception: any) {
            chai.expect(exception.toString()).to.equal("Error: abc")
            exceptionRaise = 1
        }
        chai.expect(exceptionRaise).equal(1)

        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(0)
        })

        exceptionRaise = 0
        try {
            await factory.startTransaction(0, [1], async function() {
                await factory.getConnection(1, async function(connection: PoolClient) {
                    await connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                    let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
                    chai.expect(parseInt(response.rows[0].count)).equals(1)
                })    
                throw new Error("abc")
            })
        } catch (exception: any) {
            chai.expect(exception.toString()).to.equal("Error: abc")
            exceptionRaise = 1
        }
        chai.expect(exceptionRaise).equal(1)

        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(0)
        })
    })

    it('nested transaction', async () => {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        try {
            await factory.startTransaction(0, [1], async function() {
                await factory.startTransaction(0, [1], async () => {
                    await factory.getConnection(1, async function(connection: PoolClient) {
                        await connection.query(`INSERT INTO "test"(id) VALUES (1)`);
                        let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
                        chai.expect(parseInt(response.rows[0].count)).equals(1)
                    })    
                })
                // should be in same transaction
                await factory.getConnection(1, async function(connection: PoolClient) {
                    let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
                    chai.expect(parseInt(response.rows[0].count)).equals(1)
                })    
                // thus, if we throw here, transaction should not be committed
                throw new Error("abc")
            })
        } catch (exception) {

        }

        // should not be commited
        await factory.getConnection(1, async function(connection: PoolClient) {
            let response = await connection.query(`SELECT COUNT(*) FROM "test"`)
            chai.expect(parseInt(response.rows[0].count)).equals(0)
        })    


    })
})