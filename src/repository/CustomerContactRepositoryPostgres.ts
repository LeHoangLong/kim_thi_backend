import 'reflect-metadata'
import { inject, injectable } from "inversify";
import { ICustomerContactRepository } from "./ICustomerContactRepository";
import { TYPES } from '../types';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import { Connection, DatabaseError } from 'pg';
import { CustomerContact } from '../model/CustomerContact';
import SQL from 'sql-template-strings';
import { PostgresError } from 'pg-error-enum';
import { DuplicateResource } from '../exception/DuplicateResource';

@injectable()
export class CustomerContactRepositoryPostgres implements ICustomerContactRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory
    ) {}

    async createCustomerContact(arg: {phoneNumber?: string, email?: string}) : Promise<CustomerContact> {
        let ret: CustomerContact
        try {
            await this.connectionFactory.getConnection(this, async (connection) => {
                let response = await connection.query(SQL`
                    INSERT INTO "customer_contact" (
                        email,
                        phone_number
                    ) VALUES (
                        ${arg.email},
                        ${arg.phoneNumber}
                    ) RETURNING id
                `)
                ret = {
                    id: response.rows[0].id,
                    isDeleted: false,
                }

                if (arg.email) {
                    ret.email = arg.email
                }

                if (arg.phoneNumber) {
                    ret.phoneNumber = arg.phoneNumber
                }
            })
            return ret!
        } catch (exception) {
            if (exception instanceof DatabaseError) {
                if (exception.code === PostgresError.UNIQUE_VIOLATION) {
                    throw new DuplicateResource("customer_contact", "email_or_phone_number", arg.email + "_"  + arg.phoneNumber)
                }
            }

            throw exception
        }
    }
}