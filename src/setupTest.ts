import { Pool } from "pg";
import { myContainer, resetContainer } from "./inversify.config"
import { TYPES } from "./types";
import { IConnectionFactory } from "./services/IConnectionFactory";
import { PostgresConnectionFactory } from "./services/PostgresConnectionFactory";

var migrate = require('migrate')
var config = require('./config').config

before(() => {
    let configPostgres = config.postgres_test
    process.env.PGUSER = configPostgres.user
    process.env.PGHOST = configPostgres.host
    process.env.PGPASSWORD = configPostgres.password
    process.env.PGDATABASE = configPostgres.database
})

before(async function() {
    config["postgres"] = config.postgres_test
    await myContainer.get<Pool>(TYPES.POSTGRES_DRIVER).end()
    myContainer.rebind<Pool>(TYPES.POSTGRES_DRIVER).toConstantValue(new Pool(config.postgres_test));
    myContainer.rebind<IConnectionFactory>(TYPES.CONNECTION_FACTORY).toConstantValue(new PostgresConnectionFactory(myContainer.get<Pool>(TYPES.POSTGRES_DRIVER)))
})

beforeEach(async () => {  
    await new Promise((resolve, reject) => {
        migrate.load({
            stateStore: './migrations-state/.migrate-test'
        }, function(err: any, set: any) {
            if (err) {
                console.log('err 1')
                console.log(err)
                throw err;
            } else {
                set.down(function(err: any) {
                    if (err) {
                        console.log('err 2')
                        console.log(err)
                        throw err;
                    }
                    set.up(function(err: any) {
                        if (err) {
                            console.log('err 3')
                            console.log(err)
                            throw err;
                        }
                        resolve(true)
                    });
                });
            }
        })
    })  
})

afterEach(async function() {
    await myContainer.get<Pool>(TYPES.POSTGRES_DRIVER).end()
    resetContainer()
})