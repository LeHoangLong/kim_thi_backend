import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { DuplicateResource } from "../exception/DuplicateResource";
import { IncorrectValue } from "../exception/IncorrectValue";
import { NotFound } from "../exception/NotFound";
import { UnsupportedCity } from "../exception/UnsupportedCity";
import { AreaTransportFee } from "../model/AreaTransportFee";
import { CustomerContact } from "../model/CustomerContact";
import { Order, OrderItem } from "../model/Order";
import { EProductUnit } from "../model/ProductPrice";
import { parseOrder } from "../parsers/OrderParser";
import { ICustomerContactRepository } from "../repository/ICustomerContactRepository";
import { IOrderRepository } from "../repository/IOrderRepository";
import { IConnectionFactory } from "../services/IConnectionFactory";
import { IEmailService } from "../services/IEmailService";
import { TYPES } from "../types";
import { EndUserAddressController } from "./EndUserAddressController";
import { EndUserProductController, ProductAndPrice } from "./EndUserProductController";
import { EndUserTransportFeeController } from "./EndUserTransportFeeController";

export interface CreateOrderArgOrderItem {
    productId: number,
    unit: EProductUnit,
    quantity: Decimal,
}

export interface CreateOrderArg {
    items: CreateOrderArgOrderItem[],
    address: {
        latitude: Decimal,
        longitude: Decimal,
    },
    contact: {
        name: string,
        phoneNumber: string,
    },
    expectedPrice: Decimal,
    customerMessage: string,
}

@injectable()
export class EndUserOrderController {
    constructor(
        @inject(TYPES.ORDER_REPOSITORY) private orderRepository: IOrderRepository,
        @inject(TYPES.END_USER_ADDRESS_CONTROLLER) private addressController: EndUserAddressController,
        @inject(TYPES.CUSTOMER_CONTACT_REPOSITORY) private customerContactRepository: ICustomerContactRepository,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: IConnectionFactory,
        @inject(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER) private transportFeeController: EndUserTransportFeeController,    
        @inject(TYPES.END_USER_PRODUCT_CONTROLLER) private productController: EndUserProductController,
        @inject(TYPES.EMAIL_SERVICE) private emailService: IEmailService,
        @inject(TYPES.ADMIN_EMAIL) private adminEmail: string,
    ) {

    }
    // throw IncorrectValue if expectedPrice is different
    // throw DeletedResource if product is deleted
    async createOrder(arg: CreateOrderArg) : Promise<Order> {
        let ret: Order
        await this.connectionFactory.startTransaction(this, [
            this.orderRepository, 
            this.addressController, 
            this.customerContactRepository,
        ], async () => {
            let address = await this.addressController.createAddress(arg.address.latitude, arg.address.longitude)
            let shippingFee: AreaTransportFee
            try {
                let temp: any
                [shippingFee, temp] = await this.transportFeeController.findBestTransportFee(address.city, address.latitude, address.longitude)
            } catch (exception) {
                if (exception instanceof NotFound) {
                    throw new UnsupportedCity(`${address.latitude.toString()};${address.longitude.toString()} is not supported`)
                } else {
                    throw exception
                }
            }
            let uniqueProductIds : number[] = []
            for (let i = 0; i < arg.items.length; i++) {
                if (uniqueProductIds.indexOf(arg.items[i].productId) === -1) {
                    uniqueProductIds.push(arg.items[i].productId)
                }
            }
            let productAndPrices: ProductAndPrice[] = []
            for (let i = 0; i < uniqueProductIds.length; i++) {
                let productAndPrice = await this.productController.fetchProductAndPrice(uniqueProductIds[i])
                productAndPrices.push(productAndPrice)
            }

            let itemsTotal = new Decimal(0)
            let orderItems: OrderItem[] = []
            for (let i = 0; i < arg.items.length; i++) {
                let productAndPrice = productAndPrices.find(e => e.product.id === arg.items[i].productId)
                // find highest price level
                let price = productAndPrice!.price
                let highestLevel = new Decimal(0)
                let quantity = arg.items[i].quantity
                let priceValue = price.defaultPrice
                for (let j = 0; j < price.priceLevels.length; j++) {
                    if (quantity.greaterThan(new Decimal(price.priceLevels[j].minQuantity)) &&
                        price.priceLevels[j].minQuantity.greaterThan(highestLevel)) {
                        priceValue =  price.priceLevels[j].price
                        highestLevel = price.priceLevels[j].minQuantity
                    }
                }
                itemsTotal = itemsTotal.add(quantity.mul(priceValue))
                orderItems.push({
                    id: -1,
                    price: priceValue,
                    quantity: quantity,
                    unit: arg.items[i].unit,
                    productId: arg.items[i].productId,
                })
            }

            let total = itemsTotal.add(0) // copy value
            total = total.add(shippingFee.basicFee)
            for (let i = 0; i < shippingFee.billBasedTransportFee.length; i++) {
                let billBasedTransportFee = shippingFee.billBasedTransportFee[i]
                if (billBasedTransportFee.minBillValue === undefined || billBasedTransportFee.minBillValue.lessThanOrEqualTo(itemsTotal)) {
                    if (billBasedTransportFee.basicFee) {
                        total = total.add(billBasedTransportFee.basicFee)
                    }

                    if (billBasedTransportFee.fractionOfBill) {
                        total = total.add(itemsTotal.mul(billBasedTransportFee.fractionOfBill))
                    }
    
                    if (billBasedTransportFee.fractionOfTotalTransportFee) {
                        total = total.add(billBasedTransportFee.fractionOfTotalTransportFee.mul(shippingFee.basicFee))
                    }
                }
            }

            let contact : CustomerContact
            try {
                contact = await this.customerContactRepository.findCustomerContactByPhoneNumber(arg.contact.phoneNumber)
            } catch (exception) {
                if (exception instanceof NotFound) {
                    contact = await this.customerContactRepository.createCustomerContact({
                        phoneNumber: arg.contact.phoneNumber,
                        name: arg.contact.name,
                    })
                } else {
                    throw exception
                }
            }

            if (total.equals(arg.expectedPrice)) {
                let order = await this.orderRepository.createOrder({
                    items: orderItems,
                    message: arg.customerMessage,
                    paymentAmount: total,
                    customerContact: contact,
                    shippingAddress: address,
                    areaTransportFee: shippingFee,
                })
                await this.emailService.sendEmail(this.adminEmail, JSON.stringify(parseOrder(order), null, 2), 'Đơn hàng mới')
                ret = order
            } else {
                throw new IncorrectValue('Mismatch expected price')
            }

        })

        return ret!
    }
}