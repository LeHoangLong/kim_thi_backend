import { inject, injectable } from "inversify";
import SQL from "sql-template-strings";
import { PriceRequest, PriceRequestItem } from "../model/PriceRequest";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { CreatePriceRequestArgs, CreatePriceRequestItemArgs, IPriceRequestRepository } from "./iPriceRequestRepository";

@injectable()
export class PriceRequestRepositoryPostgres implements IPriceRequestRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory
    ) {}

    async createPriceRequest(arg: CreatePriceRequestArgs) : Promise<PriceRequest> {
        let ret : PriceRequest
        await this.connectionFactory.startTransaction(this, [], async () => {
            await this.connectionFactory.getConnection(this, async (connection) => {
                let response = await connection.query(SQL`
                    INSERT INTO "price_request" (
                        customer_address,
                        customer_message,
                        customer_phone,
                        customer_name
                    ) VALUES (
                        ${arg.customerAddress},
                        ${arg.customerMessage},
                        ${arg.customerPhone},
                        ${arg.customerName}
                    ) RETURNING id, created_time
                `)
                let items = await this.createRequestItems(response.rows[0].id, arg.items);
                ret = {
                    id: response.rows[0].id,
                    items: items,
                    customerAddress: arg.customerAddress,
                    customerMessage: arg.customerMessage,
                    customerPhone: arg.customerPhone,
                    customerName: arg.customerName,
                    createdTime: response.rows[0].created_time,
                }
            });
        })
        return ret!
    }

    private async createRequestItems(
        requestId: number, 
        items: CreatePriceRequestItemArgs[]
    ) : Promise<PriceRequestItem[]> {
        let ret: PriceRequestItem[] = []

        await this.connectionFactory.startTransaction(this, [], async () => {
            await this.connectionFactory.getConnection(this, async (connection) => {
                for (let i = 0; i < items.length; i++) {
                    let reponse = await connection.query(SQL`
                        INSERT INTO "price_request_item" (
                            price_request_id,
                            unit,
                            quantity,
                            product_id
                        ) VALUES (
                            ${requestId},
                            ${items[i].unit},
                            ${items[i].quantity.toString()},
                            ${items[i].productId}
                        ) RETURNING id
                    `)
                    ret.push({
                        id: reponse.rows[0].id,
                        productId: items[i].productId,
                        quantity: items[i].quantity,
                        unit: items[i].unit,
                    })
                }
            });
        })

        return ret
    }
}