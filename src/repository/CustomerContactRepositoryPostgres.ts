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
import { NotFound } from '../exception/NotFound';

@injectable()
export class CustomerContactRepositoryPostgres implements ICustomerContactRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory
    ) {}

    async findCustomerContactByPhoneNumber(phoneNumber: string): Promise<CustomerContact> {
        let ret : CustomerContact
        await this.connectionFactory.getConnection(this, async connection => {
            let response = await connection.query(`
                SELECT 
                    id,
                    email,
                    name
                FROM "customer_contact"
                WHERE phone_number = $1
                    AND is_deleted = FALSE
            `, [phoneNumber])
            if (response.rows.length > 0) {
                ret = {
                    id: response.rows[0].id,
                    email: response.rows[0].email,
                    name: response.rows[0].name,
                    phoneNumber: phoneNumber,
                    isDeleted: false,
                }
            } else {
                throw new NotFound("customer_contact", "phone_number", phoneNumber)
            }
        })

        return ret!
    }

    async createCustomerContact(arg: {phoneNumber?: string, email?: string, name?: string}) : Promise<CustomerContact> {
        let ret: CustomerContact
        try {
            await this.connectionFactory.getConnection(this, async (connection) => {
                let response = await connection.query(SQL`
                    INSERT INTO "customer_contact" (
                        email,
                        phone_number,
                        name
                    ) VALUES (
                        ${arg.email},
                        ${arg.phoneNumber},
                        ${arg.name}
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

                if (arg.name) {
                    ret.name = arg.name
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


    async findCustomerContactById(id: number): Promise<CustomerContact> {
        let ret: CustomerContact
        await this.connectionFactory.getConnection(this, async connection => {
            let response = await connection.query(SQL`
                SELECT
                    email,
                    phone_number,
                    name
                FROM "customer_contact"
                WHERE id = ${id} AND is_deleted = FALSE
            `)

            if (response.rows.length === 0) {
                throw new NotFound("customer_contact", "id", id.toString())
            }
            ret = {
                id: id,
                isDeleted: false,
            }

            if (response.rows[0].email !== null) {
                ret.email = response.rows[0].email
            }

            if (response.rows[0].phone_number !== null) {
                ret.phoneNumber = response.rows[0].phone_number
            }

            if (response.rows[0].name !== null) {
                ret.name = response.rows[0].name
            }
        })
        return ret!
    }
}