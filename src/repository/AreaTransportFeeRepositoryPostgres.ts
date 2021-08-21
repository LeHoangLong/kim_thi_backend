import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { AreaTransportFee, BillBasedTransportFee, TransportOrigin } from "../model/AreaTransportFee";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { CreateFeeArgs, CreateTransportOriginArgs, IAreaTransportFeeRepository } from "./IAreaTransportFeeRepository";
import sql from "sql-template-strings"
import Decimal from "decimal.js";

@injectable()
export class AreaTransportFeeRepositoryPostgres implements IAreaTransportFeeRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
    ) {}

    async createFee(args: CreateFeeArgs) : Promise<AreaTransportFee> {
        let fee : AreaTransportFee
        await this.connectionFactory.startTransaction(this, [this], async () => {
            await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
                let query = sql`
                INSERT INTO "area_transport_fee" (
                    name,
                    area_city,
                    basic_fee,
                    bill_based_fee,
                    distance_fee_per_km,
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
                        ${args.isDeleted}
                    ) RETURNING id, bill_based_fee
                `)

                let response = await connection.query(query)
                let newFeeId = response.rows[0].id

                //create transport origins
                if (args.transportOriginIds.length > 0) {
                    query = sql`
                    INSERT INTO "area_transport_fee_transport_origin" (
                        area_transport_fee_id, transport_origin_id
                    ) VALUES 
                `
                    for (let i = 0; i < args.transportOriginIds.length; i++) {
                        query.append(sql`(${newFeeId}, ${args.transportOriginIds[i]})`) 
                        
                        if (i !== args.transportOriginIds.length - 1) {
                            query.append(',')
                        }
                    }
                    await connection.query(query)
                }

                fee = {
                    id: response.rows[0].id,
                    name: args.name,
                    areaCity: args.areaCity,
                    basicFee: args.basicFee,
                    billBasedTransportFee: args.billBasedTransportFee,
                    distanceFeePerKm: args.distanceFeePerKm,
                    transportOriginIds: args.transportOriginIds,
                    isDeleted: args.isDeleted,
                }
            })
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
            transportOriginIds: [],
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
                SELECT * FROM 
                    (SELECT 
                        id,
                        name,
                        area_city,
                        basic_fee,
                        bill_based_fee,
                        distance_fee_per_km,
                        is_deleted
                    FROM  "area_transport_fee"
                    WHERE (${ignoreDeleted} = FALSE OR is_deleted = FALSE)
                    ORDER BY created_time DESC, id DESC
                    LIMIT ${limit}
                    OFFSET ${offset}) transport
                LEFT JOIN "area_transport_fee_transport_origin" origin
                ON origin.area_transport_fee_id = transport.id
            `)

            for (let i = 0; i < response.rows.length; i++) {
                let index = ret.findIndex(e => e.id === response.rows[i].id)
                if (index === -1) {
                    ret.push(this.__jsonToFee(response.rows[i]))
                    index = ret.length - 1
                }
                if (response.rows[i].transport_origin_id !== null) {
                    ret[index].transportOriginIds.push(response.rows[i].transport_origin_id)
                }
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

    async fetchFeeById(id: number) : Promise<AreaTransportFee> {
        let ret : AreaTransportFee
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                SELECT * FROM 
                    (SELECT 
                        id,
                        name,
                        area_city,
                        basic_fee,
                        bill_based_fee,
                        distance_fee_per_km,
                        is_deleted
                    FROM  "area_transport_fee"
                    WHERE (is_deleted = FALSE AND id = ${id})
                    ORDER BY created_time DESC, id DESC
                ) transport
                LEFT JOIN "area_transport_fee_transport_origin" origin
                ON origin.area_transport_fee_id = transport.id
            `)

            ret = this.__jsonToFee(response.rows[0])

            for (let i = 0; i < response.rows.length; i++) {
                if (response.rows[i].transport_origin_id !== null) {
                    ret.transportOriginIds.push(response.rows[i].transport_origin_id)
                }
            }
        })
        return ret!
    }

    async fetchNumberOfOrigins() : Promise<number> {
        let ret = 0
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                SELECT COUNT(*) FROM "transport_origin" WHERE is_deleted = FALSE
            `)
            ret = parseInt(response.rows[0].count)
        })

        return ret
    }
    
    async fetchTransportOriginsById(ids: number[]) : Promise<TransportOrigin[]> {
        let ret : TransportOrigin[] = []
        if (ids.length === 0) {
            return []
        }
        await this.connectionFactory.getConnection(this, async (connection) => {
            let query = sql`
                SELECT 
                    id,
                    address,
                    latitude,
                    longitude,
                    is_deleted
                FROM "transport_origin"
                WHERE is_deleted = FALSE
                    AND id IN (
            `

            for (let i = 0; i < ids.length; i++) {
                query.append(sql`${ids[i]}`)
                if (i != ids.length - 1) {
                    query.append(',')
                } else {
                    query.append(')')
                }
            }

            query.append('ORDER BY created_time DESC, id DESC')
            let response = await connection.query(query)
            for (let i = 0; i < response.rows.length; i++) {
                ret.push(this._jsonToTransportOrigin(response.rows[i]))
            }
        })
        return ret
    }

    async fetchTransportOrigins(limit: number, offset: number, ignoreDeleted: boolean = true) : Promise<TransportOrigin[]> {
        let ret : TransportOrigin[] = []
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                SELECT 
                    id,
                    address,
                    latitude,
                    longitude,
                    is_deleted
                FROM "transport_origin"
                WHERE (${ignoreDeleted} = FALSE OR is_deleted = FALSE)
                ORDER BY created_time DESC, id DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `)

            for (let i = 0; i < response.rows.length; i++) {
                ret.push(this._jsonToTransportOrigin(response.rows[i]))
            }
        })
        return ret
    }

    private _jsonToTransportOrigin(json: any) : TransportOrigin {
        return {
            id: json.id,
            address: json.address,
            latitude: new Decimal(json.latitude),
            longitude: new Decimal(json.longitude),
            isDeleted: json.is_deleted,
        }
    }

    async createTransportOrigin(args: CreateTransportOriginArgs) : Promise<TransportOrigin> {
        let createdTransportOrgin : TransportOrigin
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                INSERT INTO "transport_origin" (
                    address,
                    latitude,
                    longitude
                ) VALUES (
                    ${args.address}, 
                    ${args.latitude.toString()}, 
                    ${args.longitude.toString()}
                ) RETURNING id
            `)
            createdTransportOrgin = this._jsonToTransportOrigin({
                ...args,
                id: response.rows[0].id
            })
        })

        return createdTransportOrgin!
    }

    async deleteTransportOriginById(id: number) : Promise<number> {
        let ret: number = 0
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(sql`
                UPDATE "transport_origin" 
                SET is_deleted = TRUE 
                WHERE id = ${id}
            `)
            ret = response.rowCount
        })
        return ret
    }
}