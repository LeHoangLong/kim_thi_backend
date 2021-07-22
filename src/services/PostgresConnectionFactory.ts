import { inject, injectable } from "inversify";
import { Connection, Pool, PoolClient } from "pg";
import { TYPES } from "../types";
import { IConnectionFactory } from "./IConnectionFactory";

class TransactionObjects {
    constructor(
        public readonly objects: any[],
        public readonly connection: PoolClient,
    ) {}

    doesContain(object: any) : boolean {
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i] == object) {
                return true
            }
        }
        return false
    }
}

class NoneTransactionObject {
    constructor(
        public depth : number,
        public readonly connection: PoolClient,
    ) {}

}

@injectable()
export class PostgresConnectionFactory implements IConnectionFactory{
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private pool: Pool,
        private transactionObjects : TransactionObjects[] = [],
        private noneTransactionObjects: Map<any, NoneTransactionObject> = new Map()
    ) {
    }

    async getConnection(object: any, callback: (connection: PoolClient) => void) : Promise<void> {
        let connection : PoolClient | undefined = undefined;
        let isIntransaction = false
        for (let i = 0; i < this.transactionObjects.length; i++) {
            if (this.transactionObjects[i].doesContain(object)) {
                connection = this.transactionObjects[i].connection
                isIntransaction = true
            }
        }
        if (connection === undefined) {
            let noneTransactionObject = this.noneTransactionObjects.get(object)
            if (noneTransactionObject === undefined) {
                connection = await this.pool.connect()
                noneTransactionObject = new NoneTransactionObject(0, connection)
                this.noneTransactionObjects.set(object, noneTransactionObject)
            } else {
                connection = noneTransactionObject.connection
                noneTransactionObject.depth += 1
            }
        }
        try {
            await callback(connection)
        } finally {
            if (!isIntransaction) {
                let noneTransactionObject = this.noneTransactionObjects.get(object)
                if (noneTransactionObject !== undefined) {
                    if (noneTransactionObject.depth === 0) {
                        connection.release()                        
                    } else {
                        noneTransactionObject.depth -= 1
                    }
                }
            }
        }
    }

    async startTransaction(objects: any[], callback: () => void) {
        let connection = await this.pool.connect()
        let transactionObjects = new TransactionObjects(
            objects,
            connection, 
        )
        connection.query('BEGIN')
        try {
            this.transactionObjects.push(transactionObjects)
            await callback()
            connection.query('COMMIT')
        } catch (exception) {
            connection.query('ROLLBACK')
            throw exception
        } finally {
            let index = this.transactionObjects.indexOf(transactionObjects)
            this.transactionObjects.splice(index, 1)
            connection.release()
        }
    }
}