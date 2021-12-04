import 'reflect-metadata'
import { inject, injectable } from "inversify";
import { Order } from "../model/Order";
import { CreateOrderArg, FetchOrderArg, FilterOrderArg, IOrderRepository } from "./IOrderRepository";
import { TYPES } from '../types';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import SQL from 'sql-template-strings';
import Decimal from 'decimal.js';
import { IAddressRepository } from './IAddressRepository';
import { ICustomerContactRepository } from './ICustomerContactRepository';
import { IAreaTransportFeeRepository } from './IAreaTransportFeeRepository';
import { EProductUnit, stringToEProductUnit } from '../model/ProductPrice';

@injectable()
export class OrderRepositoryPostgres implements IOrderRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
        @inject(TYPES.ADDRESS_REPOSITORY) private addressRepository: IAddressRepository,
        @inject(TYPES.CUSTOMER_CONTACT_REPOSITORY) private customerContactRepository: ICustomerContactRepository,
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private transportFeeRepository: IAreaTransportFeeRepository,
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
                    ) RETURNING id, payment_amount, order_time
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
                    orderTime: row.order_time,
                    paymentTime: null,
                    receivedTime: null,
                    startShippingTime: null,
                    cancellationTime: null,
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
                        price: new Decimal(arg.items[i].price),
                        unit: arg.items[i].unit,
                        quantity: new Decimal(arg.items[i].quantity),
                        productId: arg.items[i].productId,
                    })
                }
            })
        })

        return ret!
    }

    async jsonToOrders(json: any): Promise<Order[]> {
        let ret: Order[] = []
        for (let i = 0; i < json.length; i++) {
            let orderId = json[i]['order_id']
            let index = ret.findIndex(e => e.id === orderId)
            if (index === -1) {
                let address = await this.addressRepository.fetchAddressById(json[i].address_id)
                let customerContact = await this.customerContactRepository.findCustomerContactById(json[i].customer_contact_id)
                let areaTransportFee = await this.transportFeeRepository.fetchFeeById(json[i].area_transport_fee_id)
                
                let order : Order = {
                    id: orderId,
                    items: [],
                    isShipped: json[i]['is_shipped'],
                    isReceived: json[i]['is_received'],
                    isPaid: json[i]['is_paid'],
                    paymentTime: json[i]['payment_time'],
                    receivedTime: json[i]['received_time'],
                    startShippingTime: json[i]['start_delivery_time'],
                    cancellationTime: json[i]['cancel_time'],
                    isCancelled: json[i]['is_cancelled'],
                    cancellationReason: json[i]['cancel_reason'],
                    customerMessage: json[i]['customer_message'],
                    customerContact: customerContact,
                    paymentAmount: new Decimal(json[i]['payment_amount']),
                    address: address,
                    areaTransportFee: areaTransportFee,
                    orderTime: json[i]['order_time'],
                }
                ret.push(order)
                index = ret.length - 1
            }

            ret[index].items.push({
                id: json[i]['order_item_id'],
                productId: json[i]['product_id'],
                price: json[i]['price'],
                quantity: json[i]['quantity'],
                unit: json[i]['unit'],
            })
        }
        return ret
    }

    async fetchOrders(arg: FetchOrderArg): Promise<Order[]> {
        let ret: Order[] = []
        await this.connectionFactory.getConnection(this, async connection => {
            let query = SQL`
                SELECT
                    *,
                    o.id as order_id,
                    oi.id as order_item_id
                FROM (
                    SELECT 
                        id,
                        address_id,
                        is_shipped,
                        is_received,
                        is_paid,
                        is_cancelled,
                        start_delivery_time,
                        order_time,
                        received_time,
                        payment_time,
                        cancel_time,
                        cancel_reason,
                        payment_amount,
                        customer_message,
                        customer_contact_id,
                        area_transport_fee_id
                    FROM "order"
                    WHERE
                        (
                            (${arg.includeShippedOrders} = TRUE AND is_shipped = TRUE) OR
                            (${arg.includeReceivedOrders} = TRUE AND is_received = TRUE) OR
                            (${arg.includePaidOrders} = TRUE AND is_paid = TRUE) OR
                            (${arg.includeCancelledOrders} = TRUE AND is_cancelled = TRUE) OR
                            (${arg.includeOrderedOrders} = TRUE)
                        ) AND 
                        (${arg.orderId}::INTEGER IS NULL OR ${arg.orderId} = id) AND
                        (${arg.orderTimeStart}::TIMESTAMPTZ IS NULL OR ${arg.orderTimeStart} <= order_time) AND
                        (${arg.orderTimeEnd}::TIMESTAMPTZ IS NULL OR ${arg.orderTimeEnd} >= order_time) AND
                        (${arg.startId} <= id)
                    LIMIT ${arg.limit}
                    OFFSET ${arg.offset}
                ) o
                LEFT JOIN "order_item" oi
                ON oi.order_id = o.id
            `

            let response = await connection.query(query)
            ret = await this.jsonToOrders(response.rows)
        })
        return ret
    }
    
    async fetchNumberOfOrders(arg: FilterOrderArg): Promise<number> {
        let ret: number = 0
        await this.connectionFactory.getConnection(this, async connection => {
            let response = await connection.query(SQL`
                SELECT 
                    COUNT(*) 
                FROM "order" 
                WHERE
                    (
                        (${arg.includeShippedOrders} = TRUE AND is_shipped = TRUE) OR
                        (${arg.includeReceivedOrders} = TRUE AND is_received = TRUE) OR
                        (${arg.includePaidOrders} = TRUE AND is_paid = TRUE) OR
                        (${arg.includeCancelledOrders} = TRUE AND is_cancelled = TRUE) OR
                        (${arg.includeOrderedOrders} = TRUE)
                    ) AND 
                    (${arg.orderId}::INTEGER IS NULL OR ${arg.orderId} = id) AND
                    (${arg.orderTimeStart}::TIMESTAMPTZ IS NULL OR ${arg.orderTimeStart} <= order_time) AND
                    (${arg.orderTimeEnd}::TIMESTAMPTZ IS NULL OR ${arg.orderTimeEnd} >= order_time)
            `)

            ret = parseInt(response.rows[0].count)
        })

        return ret
    }

    async updateOrderStatus(arg: {
        orderId: number, 
        isShipped: boolean, 
        isReceived: boolean, 
        isCancelled: boolean, 
        isPaid: boolean
    }) : Promise<boolean> {
        let ret: boolean = false
        await this.connectionFactory.getConnection(this, async connection => {
            let query = SQL`
                UPDATE "order"
                SET
                    is_shipped = ${arg.isShipped},
                    is_received = ${arg.isReceived},
                    is_paid = ${arg.isPaid},
                    is_cancelled = ${arg.isCancelled}
                WHERE 
                    id = ${arg.orderId}
                RETURNING id
            `

            let response = await connection.query(query)
            if (response.rowCount == 0) {
                ret = false
            } else {
                ret = true
            }
        })

        return ret
    }
}