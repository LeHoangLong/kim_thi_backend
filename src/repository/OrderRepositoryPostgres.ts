import 'reflect-metadata'
import { inject, injectable } from "inversify";
import { Order } from "../model/Order";
import { CreateOrderArg, IOrderRepository } from "./IOrderRepository";
import { TYPES } from '../types';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import SQL from 'sql-template-strings';
import Decimal from 'decimal.js';

@injectable()
export class OrderRepositoryPostgres implements IOrderRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory
    ) {}

    async createOrder(arg: CreateOrderArg): Promise<Order> {
        let ret: Order
        await this.connectionFactory.startTransaction(this, [], async () => {
            await this.connectionFactory.getConnection(this, async (connection) => {
                let query = SQL`
                    INSERT INTO "order" (
                        address_id,
                        customer_message,
                        payment_amount,
                        area_transport_fee_id,
                        customer_contact_id
                    ) VALUES (
                        ${arg.shippingAddress.id},
                        ${arg.message},
                        ${arg.paymentAmount.toString()},
                        ${arg.areaTransportFee.id},
                        ${arg.customerContact.id}
                    ) RETURNING id, payment_amount
                `

                let response = await connection.query(query)

                let row = response.rows[0]
                ret = {
                    id: row.id,
                    items: [],
                    isShipped: false,
                    isReceived: false,
                    isPaid: false,
                    isCancelled: false,
                    cancellationReason: '',
                    customerMessage: arg.message,
                    customerContact: arg.customerContact,
                    paymentAmount: new Decimal(row.payment_amount),
                    address: arg.shippingAddress,
                    areaTransportFee: arg.areaTransportFee,
                }

                let orderItemIds : number[] = []
                if (arg.items.length > 0) {
                    let orderItemQuery = SQL`
                        INSERT INTO "order_item" (
                            order_id,
                            unit,
                            price,
                            quantity,
                            product_id
                        ) VALUES
                    `
                    for (let i = 0; i < arg.items.length; i++) { 
                        orderItemQuery.append(SQL`
                            (
                                ${ret.id},
                                ${arg.items[i].unit},
                                ${arg.items[i].price.toString()},
                                ${arg.items[i].quantity.toString()},
                                ${arg.items[i].productId}
                            )
                        `)

                        if (i !== arg.items.length - 1) {
                            orderItemQuery.append(',')
                        }
                    }    

                    orderItemQuery.append(SQL`
                        RETURNING id
                    `)

                    let response = await connection.query(orderItemQuery)
                    for (let i = 0; i < response.rows.length; i++) {
                        orderItemIds.push(response.rows[i].id)
                    }
                }   
                
                for (let i = 0; i < arg.items.length; i++) {
                    ret.items.push({
                        id: orderItemIds[i],
                        price: arg.items[i].price,
                        unit: arg.items[i].unit,
                        quantity: arg.items[i].quantity,
                        productId: arg.items[i].productId,
                    })
                }
            })
        })

        return ret!
    }
}