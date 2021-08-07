import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { AreaTransportFee } from "../model/AreaTransportFee";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { CreateFeeArgs, IAreaTransportFeeRepository } from "./IAreaTransportFeeRepository";
import sql from "sql-template-strings"
import Decimal from "decimal.js";

@injectable()
export class AreaTransportFeeRepositoryPostgres implements IAreaTransportFeeRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
    ) {}

    async createFee(args: CreateFeeArgs) : Promise<AreaTransportFee> {
        let fee : AreaTransportFee

        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response = await connection.query(sql`
                INSERT INTO "area_transport_fee" (
                    area_city,
                    basic_fee,
                    fraction_of_bill_fee,
                    distance_fee_per_km,
                    origin_latitude,
                    origin_longitude,
                    is_deleted
                ) VALUES (
                    ${args.areaCity}, 
                    ${args.basicFee?.toString()}, 
                    ${args.fractionOfBill?.toString()},
                    ${args.distanceFeePerKm?.toString()},
                    ${args.originLatitude?.toString()},
                    ${args.originLongitude?.toString()},
                    ${args.isDeleted}
                ) RETURNING id`
            )

            fee = {
                id: response.rows[0].id,
                areaCity: args.areaCity,
                basicFee: args.basicFee,
                fractionOfBill: args.fractionOfBill,
                distanceFeePerKm: args.distanceFeePerKm,
                originLatitude: args.originLatitude,
                originLongitude: args.originLongitude,
                isDeleted: args.isDeleted,
            }
        })

        return fee!
    }

    private __jsonToFee(json: any) {
        return {
            id: json.id,
            areaCity: json.area_city,
            basicFee: new Decimal(json.basic_fee),
            fractionOfBill: new Decimal(json.fraction_of_bill_fee),
            distanceFeePerKm: new Decimal(json.distance_fee_per_km),
            originLatitude: new Decimal(json.origin_latitude),
            originLongitude: new Decimal(json.origin_longitude),
            isDeleted: json.is_deleted,
        }
    }

    async deleteFee(feeId: number) : Promise<number> {
        let numberOfDeleted = 0
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                UPDATE "area_transport_fee" 
                SET is_deleted = TRUE
                WHERE id = ${feeId}`
            )
            numberOfDeleted = response.rowCount
        })
        return numberOfDeleted
    }

    async fetchFees(limit: number, offset: number, ignoreDeleted: boolean = true) : Promise<AreaTransportFee[]> {
        let ret : AreaTransportFee[] = []
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                SELECT 
                    id,
                    area_city,
                    basic_fee,
                    fraction_of_bill_fee,
                    distance_fee_per_km,
                    origin_latitude,
                    origin_longitude,
                    is_deleted
                FROM  "area_transport_fee"
                WHERE (${ignoreDeleted} = FALSE OR is_deleted = FALSE)
                ORDER BY id DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `)

            for (let i = 0; i < response.rows.length; i++) {
                ret.push(this.__jsonToFee(response.rows[i]))
            }
        })
        return ret
    }
}