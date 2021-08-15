import { inject, injectable } from "inversify";
import { Connection, Pool, PoolClient } from "pg";
import { TYPES } from "../types";
import { IConnectionFactory } from "./IConnectionFactory";

class TransactionObjects {
    constructor(
        public objects: any[],
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
                        await connection.release()                        
                        this.noneTransactionObjects.delete(object)
                    } else {
                        noneTransactionObject.depth -= 1
                    }
                }
            }
        }
    }

    async getNumberOfConnections() : Promise<number> {
        return this.pool.totalCount - this.pool.idleCount
    }

    async startTransaction(caller: any, objects: any[], callback: () => void) {
        let transactionObjects : TransactionObjects | undefined;
        let isRootTransaction = false
        objects.push(caller)
        for (let j = 0; j < objects.length; j++) {
            let object = objects[j]
            for (let i = 0; i < this.transactionObjects.length; i++) {
                if (this.transactionObjects[i].doesContain(object)) {
                    transactionObjects = this.transactionObjects[i]
                }
            }
        }

        if (transactionObjects === undefined) {
            isRootTransaction = true
            let connection = await this.pool.connect()
            transactionObjects = new TransactionObjects(
                objects,
                connection, 
            )
        }

        for (let i = 0; i < objects.length; i++) {
            if (!transactionObjects.doesContain(objects[i])) {
                transactionObjects.objects.push(objects[i])
            }
        }

        let connection = transactionObjects.connection
        if (isRootTransaction) {
            await connection.query('BEGIN')
            try {
                this.transactionObjects.push(transactionObjects)
                await callback()
                await connection.query('COMMIT')
            } catch (exception) {
                await connection.query('ROLLBACK')
                throw exception
            } finally {
                let index = this.transactionObjects.indexOf(transactionObjects)
                this.transactionObjects.splice(index, 1)
                await connection.release()
            }
        } else {
            // do not handle any begin or commit as the root transaction will do that
            await callback()
        }
    }
}