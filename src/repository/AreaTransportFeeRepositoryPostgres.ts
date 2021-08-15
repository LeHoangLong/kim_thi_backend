import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { AreaTransportFee, BillBasedTransportFee } from "../model/AreaTransportFee";
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
            let query = sql`
            INSERT INTO "area_transport_fee" (
                name,
                area_city,
                basic_fee,
                bill_based_fee,
                distance_fee_per_km,
                origin_latitude,
                origin_longitude,
                is_deleted
            ) VALUES (
                ${args.name},
                ${args.areaCity}, 
                ${args.basicFee?.toString()}, 
                ARRAY[
            `
            

            for (let i = 0; i < args.billBasedTransportFee.length; i++) {
                let fee = args.billBasedTransportFee[i]
                query.append(sql`
                    ROW(
                        ${fee.minBillValue?.toString()}, 
                        ${fee.fractionOfBill?.toString()}, 
                        ${fee.fractionOfTotalTransportFee?.toString()}, 
                        ${fee.basicFee?.toString()}
                    )::bill_based_fee
                `)
                if (i !== args.billBasedTransportFee.length - 1) {
                    query.append(',')
                }
            }

            query.append(sql`
                ]::bill_based_fee[],
                    ${args.distanceFeePerKm?.toString()},
                    ${args.originLatitude?.toString()},
                    ${args.originLongitude?.toString()},
                    ${args.isDeleted}
                ) RETURNING id, bill_based_fee
            `)

            let response = await connection.query(query)

            fee = {
                id: response.rows[0].id,
                name: args.name,
                areaCity: args.areaCity,
                basicFee: args.basicFee,
                billBasedTransportFee: args.billBasedTransportFee,
                distanceFeePerKm: args.distanceFeePerKm,
                originLatitude: args.originLatitude,
                originLongitude: args.originLongitude,
                isDeleted: args.isDeleted,
            }
        })

        return fee!
    }

    private __jsonToFee(json: any) : AreaTransportFee {
        let ret: AreaTransportFee = {
            id: json.id,
            name: json.name,
            areaCity: json.area_city,
            basicFee: new Decimal(json.basic_fee),
            billBasedTransportFee: [],
            distanceFeePerKm: new Decimal(json.distance_fee_per_km),
            originLatitude: new Decimal(json.origin_latitude),
            originLongitude: new Decimal(json.origin_longitude),
            isDeleted: json.is_deleted,
        }

        let billBasedFeeStr = json.bill_based_fee as string
        let matches = billBasedFeeStr.match(/(\(.*?\))/g)
        if (matches) {
            for (let i = 0; i < matches?.length; i++) {
                let str = matches[i]
                str = str.substr(1, str.length - 2)
                let items = str.split(',')
                let billBasedTransportFee : BillBasedTransportFee = {}
                if (items[0] !== 'null') {
                    billBasedTransportFee.minBillValue = new Decimal(items[0])
                }   
                
                if (items[1] !== 'null') {
                    billBasedTransportFee.fractionOfBill = new Decimal(items[1])
                }

                if (items[2] !== 'null') {
                    billBasedTransportFee.fractionOfTotalTransportFee = new Decimal(items[2])
                }

                if (items[3] !== 'null') {
                    billBasedTransportFee.basicFee = new Decimal(items[3])
                }
                ret.billBasedTransportFee.push(billBasedTransportFee)
            }
        }
        return ret
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
                    name,
                    area_city,
                    basic_fee,
                    bill_based_fee,
                    distance_fee_per_km,
                    origin_latitude,
                    origin_longitude,
                    is_deleted
                FROM  "area_transport_fee"
                WHERE (${ignoreDeleted} = FALSE OR is_deleted = FALSE)
                ORDER BY created_time DESC, id DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `)

            for (let i = 0; i < response.rows.length; i++) {
                ret.push(this.__jsonToFee(response.rows[i]))
            }
        })
        return ret
    }

    async fetchNumberOfFees() : Promise<number> {
        let ret : number = 0
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                SELECT COUNT(*) FROM "area_transport_fee" WHERE is_deleted = FALSE
            `)
            ret = response.rows[0].count
        })

        return ret
    }

    /*
    async fetchAreaTransportFeesByProductId(productId: number, limit: number, offset: number, ignoreDeleted: boolean = true) : Promise<AreaTransportFee[]> {
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
                JOIN "product_area_transport_fee" patf
                ON patf.product_id = ${productId}
                    AND  id = patf.transport_fee_id
                    AND (${ignoreDeleted} = FALSE OR is_deleted = FALSE)
                LIMIT ${limit}
                OFFSET ${offset}
                ORDER BY created_time DESC, id DESC
            `)

            for (let i = 0; i < response.rows.length; i++) {
                ret.push(this.__jsonToFee(response.rows[i]))
            }
        })

        return ret
    }*/
}