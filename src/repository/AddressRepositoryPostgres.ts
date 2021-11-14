import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import SQL from "sql-template-strings";
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