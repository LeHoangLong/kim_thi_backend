import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import SQL from "sql-template-strings";
import { NotFound } from "../exception/NotFound";
import { Address } from "../model/Address";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { IAddressRepository } from "./IAddressRepository";

@injectable()
export class AddressRepositoryPostgres implements IAddressRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory
    ) {

    }
    
    async fetchAddressById(id: number): Promise<Address> {
        let ret: Address
        await this.connectionFactory.getConnection(this, async connection => {
            let response = await connection.query(SQL`
                SELECT 
                    id,
                    address,
                    latitude,
                    longitude,
                    city
                FROM "address" 
                WHERE id = ${id} AND is_deleted = FALSE
            `)

            if (response.rows.length === 0) {
                throw new NotFound("address", "id", id.toString())
            }
            ret = {
                id: response.rows[0].id,
                address: response.rows[0].address,
                latitude: new Decimal(response.rows[0].latitude),
                longitude: new Decimal(response.rows[0].longitude),
                city: response.rows[0].city,
                isDeleted: false,
            }
        })

        return ret!
    }

    async createAddress(address: string, latitude: Decimal, longitude: Decimal, city: string): Promise<Address> {
        let ret: Address
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(SQL`
                INSERT INTO "address" (
                    address,
                    latitude,
                    longitude,
                    city
                ) VALUES (
                    ${address},
                    ${latitude.toString()},
                    ${longitude.toString()},
                    ${city}
                ) RETURNING id
            `)

            ret = {
                id: response.rows[0].id,
                address: address,
                latitude: latitude,
                longitude: longitude,
                city: city,
                isDeleted: false,
            }
        })

        return ret!
    }
}