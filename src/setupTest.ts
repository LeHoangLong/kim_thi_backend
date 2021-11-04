import { Pool } from "pg";
import { myContainer } from "./inversify.config"
import { TYPES } from "./types";
import { IConnectionFactory } from "./services/IConnectionFactory";
import { PostgresConnectionFactory } from "./services/PostgresConnectionFactory";
var migrate = require('migrate')
var config = require('./config').config

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
                throw err;
            } else {
                set.down(function(err: any) {
                    if (err) {
                        throw err;
                    }
                    set.up(function(err: any) {
                        if (err) {
                            throw err;
                        }
                        resolve(true)
                    });
                });
            }
        })
    })  
})

after(async function() {
    await myContainer.get<Pool>(TYPES.POSTGRES_DRIVER).end()
})