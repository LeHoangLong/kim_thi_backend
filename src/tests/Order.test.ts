import Decimal from "decimal.js"
import myContainer from "../inversify.config"
import { Address } from "../model/Address"
import { IAddressRepository } from "../repository/IAddressRepository"
import { TYPES } from "../types"
import chai from 'chai'
import { ICustomerContactRepository } from "../repository/ICustomerContactRepository"
import { CustomerContact } from "../model/CustomerContact"
import { IOrderRepository } from "../repository/IOrderRepository"
import { EProductUnit } from "../model/ProductPrice"
import { AreaTransportFee } from "../model/AreaTransportFee"
import { IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository"
import { EndUserOrderView } from "../view/EndUserOrderView"
import { Request, request, Response } from "express"
import sinon, { SinonSpy } from "sinon"
import { IProductRepository } from "../repository/IProductRepository"
import { Product } from "../model/Product"
import { IImageRepository } from "../repository/IImageRepository"
import { Image } from "../model/Image"
import { ProductController } from "../controller/ProductController"
import { MockOrderRepository } from "./mocks/MockOrderRepository"
import { OrderRepositoryPostgres } from "../repository/OrderRepositoryPostgres"
import { MockEndUserTransportFeeController } from "./mocks/MockTransportFeeController"
import { EndUserTransportFeeController } from "../controller/EndUserTransportFeeController"
import { MockEndUserAddressController } from "./mocks/MockEndUserAddressController"
import { EndUserAddressController } from "../controller/EndUserAddressController"
import { Order } from "../model/Order"
import { MockEmailService } from "./mocks/MockEmailService"
import { IEmailService } from "../services/IEmailService"
import { EMailService } from "../services/EmailService"
import { AdminOrderView } from "../view/AdminOrderView"

describe('Order tests', async () => {
    
    describe('Test order repository', async () => {
        let customerContact: CustomerContact
        let address: Address
        let areaTransportFee: AreaTransportFee
        let product: Product
        let image: Image
        
        describe('create order', async () => {
            beforeEach(async () => {
                let customerContactRepository = myContainer.get<ICustomerContactRepository>(TYPES.CUSTOMER_CONTACT_REPOSITORY)
                customerContact = await customerContactRepository.createCustomerContact({phoneNumber: '+1234567', email: 'email@google.com'})
                let addressRepostory = myContainer.get<IAddressRepository>(TYPES.ADDRESS_REPOSITORY)
                address = await addressRepostory.createAddress('address-1', new Decimal('10.000001'), new Decimal('20.000002'), 'city-1')
                let areaTransportFeeRepository = myContainer.get<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY)
                areaTransportFee = await areaTransportFeeRepository.createFee({
                    name: 'fee_1',
                    areaCity: "city",
                    basicFee: new Decimal(10000.05),
                    billBasedTransportFee: [{
                        minBillValue: new Decimal('100.01'),
                        basicFee: new Decimal('10.01'),
                        fractionOfBill: new Decimal('0.02'),
                        fractionOfTotalTransportFee: new Decimal('0.03'),
                    }],
                    distanceFeePerKm: new Decimal(10000.05),
                    transportOriginIds: [],
                    isDeleted: false,
                });

                let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
                image = await imageRepository.createImage()

                let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
                let productWithPricesAndImages = await productController.createProduct({
                    serialNumber: '0', 
                    name: 'product-0',
                    avatarId: image.id,
                    description: 'description',
                    rank: 1,
                    wholesalePrices: ['wholesale-price-1', 'wholesale-price-2'],
                    defaultPrice: {
                        id: null,
                        unit: EProductUnit.KG,
                        defaultPrice: new Decimal('100.05'),
                        isDeleted: false,
                        priceLevels: [],
                        isDefault: true,
                    },
                    alternativePrices: [],
                    categories: [],
                    imagesId: [],
                })

                product = productWithPricesAndImages.product
            })
            it('should succeed', async () => {
                let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                let order = await orderRepository.createOrder({
                    items: [
                        {
                            id: -1,
                            quantity: new Decimal(1),
                            price: new Decimal('100.05'),
                            unit: EProductUnit.KG,
                            productId: product.id!,
                        },
                        {
                            id: -1,
                            quantity: new Decimal(2),
                            price: new Decimal('200.05'),
                            unit: EProductUnit.KG,
                            productId: product.id!,
                        },
                    ],
                    message: 'message-1',
                    paymentAmount: new Decimal('100000.001'),
                    customerContact: customerContact,
                    shippingAddress: address,
                    areaTransportFee: areaTransportFee,
                })

                chai.expect(order).to.eql({
                    id: order.id,
                    items: [
                        {
                            id: order.items[0].id,
                            quantity: new Decimal(1),
                            price: new Decimal('100.05'),
                            productId: product.id,
                            unit: EProductUnit.KG,
                        },
                        {
                            id: order.items[1].id,
                            quantity: new Decimal(2),
                            price: new Decimal('200.05'),
                            productId: product.id,
                            unit: EProductUnit.KG,
                        },
                    ],
                    isShipped: false,
                    isReceived: false,
                    isPaid: false,
                    isCancelled: false,
                    cancellationReason: '',
                    customerMessage: 'message-1',
                    customerContact: customerContact,
                    paymentAmount: new Decimal('100000.001'),
                    address: address,
                    areaTransportFee: areaTransportFee,
                    orderTime: order.orderTime,
                    cancellationTime: null,
                    paymentTime: null,
                    receivedTime: null,
                    startShippingTime: null,
                })

                chai.expect(order.orderTime).to.be.instanceOf(Date)
            })

            describe('fetch order', async () => {
                let order: Order
                beforeEach(async () => {
                    let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                    order = await orderRepository.createOrder({
                        items: [
                            {
                                id: -1,
                                quantity: new Decimal(1),
                                price: new Decimal('100.05'),
                                unit: EProductUnit.KG,
                                productId: product.id!,
                            },
                            {
                                id: -1,
                                quantity: new Decimal(2),
                                price: new Decimal('200.05'),
                                unit: EProductUnit.KG,
                                productId: product.id!,
                            },
                        ],
                        message: 'message-1',
                        paymentAmount: new Decimal('100000.001'),
                        customerContact: customerContact,
                        shippingAddress: address,
                        areaTransportFee: areaTransportFee,
                    })
                })

                it('should succeed', async () => {
                    let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                    let orders = await orderRepository.fetchOrders({
                        startId: 0,
                        limit: 1,
                        offset: 0,
                        includeOrderedOrders: true,
                    })

                    chai.expect(orders.length).to.eql(1)
                    let order = orders[0]
                    // verify that order is parsed correctly
                    chai.expect(order.id).to.eql(order.id)
                    chai.expect(order.items).to.eql([
                        {
                            id: order.items[0].id,
                            quantity: '1',
                            price: '100.05',
                            productId: product.id,
                            unit: EProductUnit.KG,
                        },
                        {
                            id: order.items[1].id,
                            quantity: '2',
                            price: '200.05',
                            productId: product.id,
                            unit: EProductUnit.KG,
                        },
                    ])
                    chai.expect(order.isShipped).to.be.false
                    chai.expect(order.isReceived).to.be.false
                    chai.expect(order.isPaid).to.be.false
                    chai.expect(order.isCancelled).to.be.false
                    chai.expect(order.cancellationReason).to.eql('')
                    chai.expect(order.customerMessage).to.eql('message-1')
                    chai.expect(order.cancellationReason).to.eql('')
                    chai.expect(order.customerContact).to.eql(customerContact)
                    chai.expect(order.paymentAmount).to.eql(new Decimal('100000.001'))
                    chai.expect(order.address).to.eql(address)
                    chai.expect(order.areaTransportFee).to.eql(areaTransportFee)
                    chai.expect(order.areaTransportFee).to.eql(areaTransportFee)
                    chai.expect(order.orderTime).to.eql(order.orderTime)
                    chai.expect(order.paymentTime).to.eql(null)
                    chai.expect(order.receivedTime).to.eql(null)
                    chai.expect(order.startShippingTime).to.eql(null)
                    chai.expect(order.cancellationTime).to.eql(null)
                })

                it('can fetch by id', async () => {
                    let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                    let orders = await orderRepository.fetchOrders({
                        orderId: order.id,
                        startId: 0,
                        limit: 1,
                        offset: 0,
                        includeOrderedOrders: true,
                    })

                    chai.expect(orders.length).to.eql(1)
                    chai.expect(orders[0].id).to.eql(order.id)
                })

                it('should not have any orders', async () => {
                    let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                    let orders = await orderRepository.fetchOrders({
                        startId: 0,
                        limit: 1,
                        offset: 0,
                        includeCancelledOrders: false,
                    })

                    chai.expect(orders.length).to.eql(0)
                })

                it('should get number of orders', async () => {
                    let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                    let number = await orderRepository.fetchNumberOfOrders({
                        includeOrderedOrders: true
                    })

                    chai.expect(number).to.eql(1)

                    number = await orderRepository.fetchNumberOfOrders({
                        includeShippedOrders: true
                    })

                    chai.expect(number).to.eql(0)
                })

                describe('update order', async () => {
                    it('should succeed', async () => {
                        let number = 0
                        let orderRepository = myContainer.get<IOrderRepository>(TYPES.ORDER_REPOSITORY)
                        
                        number = await orderRepository.fetchNumberOfOrders({
                            includeReceivedOrders: true
                        })

                        chai.expect(number).to.eql(0)

                        let updated = await orderRepository.updateOrderStatus({
                            orderId: order.id,
                            isCancelled: false,
                            isPaid: false,
                            isShipped: false,
                            isReceived: true,
                        })

                        chai.expect(updated).to.be.true
                        number = await orderRepository.fetchNumberOfOrders({
                            includeOrderedOrders: true
                        })
                        chai.expect(number).to.eql(1)

                        number = await orderRepository.fetchNumberOfOrders({
                            includeReceivedOrders: true
                        })

                        chai.expect(number).to.eql(1)


                        updated = await orderRepository.updateOrderStatus({
                            orderId: order.id,
                            isCancelled: false,
                            isPaid: false,
                            isShipped: true,
                            isReceived: false,
                        })

                        chai.expect(updated).to.be.true

                        number = await orderRepository.fetchNumberOfOrders({
                            includeReceivedOrders: true
                        })

                        chai.expect(number).to.eql(0)

                        number = await orderRepository.fetchNumberOfOrders({
                            includeShippedOrders: true
                        })
                        chai.expect(number).to.eql(1)

                        updated = await orderRepository.updateOrderStatus({
                            orderId: order.id,
                            isCancelled: false,
                            isPaid: true,
                            isShipped: false,
                            isReceived: false,
                        })

                        chai.expect(updated).to.be.true

                        number = await orderRepository.fetchNumberOfOrders({
                            includeShippedOrders: true
                        })
                        chai.expect(number).to.eql(0)

                        number = await orderRepository.fetchNumberOfOrders({
                            includePaidOrders: true
                        })

                        chai.expect(number).to.eql(1)

                        updated = await orderRepository.updateOrderStatus({
                            orderId: order.id,
                            isCancelled: true,
                            isPaid: false,
                            isShipped: false,
                            isReceived: false,
                        })

                        chai.expect(updated).to.be.true

                        number = await orderRepository.fetchNumberOfOrders({
                            includeShippedOrders: true
                        })

                        chai.expect(number).to.eql(0)

                        number = await orderRepository.fetchNumberOfOrders({
                            includeCancelledOrders: true
                        })
                        chai.expect(number).to.eql(1)
                    })
                })
            })
        })
    })

    describe('Test enduser order view', async () => {
        let request: any
        let response: any
        let sendSpy: SinonSpy
        let statusSpy: SinonSpy
        let product: Product
        let image: Image
        let mockOrderRepository: MockOrderRepository
        let mockEndUserTransportFeeController: MockEndUserTransportFeeController
        let mockEndUserAddressController: MockEndUserAddressController
        let mockEmailService: MockEmailService
        beforeEach(async  () => {
            request = {

            }
            response = {
                status(statusCode: number): any {
                    return this
                },
                send(): any {
                    return this
                },
            }

            statusSpy = sinon.spy(response, "status")
            sendSpy = sinon.spy(response, "send")

            let imageRepository = myContainer.get<IImageRepository>(TYPES.IMAGE_REPOSITORY)
            image = await imageRepository.createImage()

            let productController = myContainer.get<ProductController>(TYPES.PRODUCT_CONTROLLER)
            let productWithPricesAndImages = await productController.createProduct({
                serialNumber: '0', 
                name: 'product-0',
                avatarId: image.id,
                rank: 1,
                wholesalePrices: ['wholesale-price-1', 'wholesale-price-2'],
                description: 'description',
                defaultPrice: {
                    id: null,
                    unit: EProductUnit.KG,
                    defaultPrice: new Decimal('100.05'),
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: true,
                },
                alternativePrices: [],
                categories: [],
                imagesId: [],
            })

            product = productWithPricesAndImages.product

            mockOrderRepository = new MockOrderRepository()
            myContainer.rebind<IOrderRepository>(TYPES.ORDER_REPOSITORY).toConstantValue(mockOrderRepository)

            mockEndUserTransportFeeController = new MockEndUserTransportFeeController()
            myContainer.rebind<EndUserTransportFeeController>(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER).toConstantValue(mockEndUserTransportFeeController)
        
            mockEndUserAddressController = new MockEndUserAddressController()
            myContainer.rebind<EndUserAddressController>(TYPES.END_USER_ADDRESS_CONTROLLER).toConstantValue(mockEndUserAddressController)

            mockEmailService = new MockEmailService()
            myContainer.rebind<IEmailService>(TYPES.EMAIL_SERVICE).toConstantValue(mockEmailService)

            mockEndUserTransportFeeController.transportFees.push({
                id: 0,
                name: 'address-1',
                areaCity: 'city',
                basicFee: new Decimal('100'),
                billBasedTransportFee: [{
                    fractionOfBill: new Decimal('0.01')
                }],
                distanceFeePerKm: new Decimal(0),
                transportOriginIds: [0],
                isDeleted: false,
            })

            mockEndUserTransportFeeController.transportOrigins.push({
                id: 0,
                address: 'origin-1',
                latitude: new Decimal('100.000001'),
                longitude: new Decimal('200.000001'),
                city: 'city',
                isDeleted: false,           
            })
        })

        afterEach(() => {
            myContainer.rebind<IOrderRepository>(TYPES.ORDER_REPOSITORY).to(OrderRepositoryPostgres)
            myContainer.rebind<EndUserTransportFeeController>(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER).to(EndUserTransportFeeController)
            myContainer.rebind<EndUserAddressController>(TYPES.END_USER_ADDRESS_CONTROLLER).to(EndUserAddressController)
            myContainer.rebind<IEmailService>(TYPES.EMAIL_SERVICE).to(EMailService)
        })

        describe('create order', async () => {
            it('should succeed', async () => {
                let endUserOrderView = myContainer.get<EndUserOrderView>(TYPES.END_USER_ORDER_VIEW)
                request.body = {
                    items: [
                        {
                            productId: product.id,
                            unit: 'kg',
                            quantity: '10',
                        }
                    ],
                    address: {
                        latitude: '100.000001',
                        longitude: '200.000001',
                    },
                    customerContact: {
                        phoneNumber: '+84123456',
                        name: 'name',
                    },
                    expectedPrice: '1110.505',
                    customerMessage: 'message-1'
                }
            
                await endUserOrderView.createOrder(request as Request, response as Response)
                sinon.assert.calledOnceWithExactly(statusSpy, 201)
                sinon.assert.calledOnce(sendSpy)
                chai.expect(sendSpy.getCall(0).args[0].id).to.eql(0)
                chai.expect(sendSpy.getCall(0).args[0].items).to.eql([{
                    id: 0,
                    unit: 'KG',
                    productId: product.id,
                    quantity: '10',
                    price: '100.05',
                }])
                chai.expect(sendSpy.getCall(0).args[0].isShipped).to.eql(false)
                chai.expect(sendSpy.getCall(0).args[0].isReceived).to.eql(false)
                chai.expect(sendSpy.getCall(0).args[0].isPaid).to.eql(false)
                chai.expect(sendSpy.getCall(0).args[0].isCancelled).to.eql(false)
                chai.expect(sendSpy.getCall(0).args[0].customerMessage).to.eql('message-1')
                chai.expect(sendSpy.getCall(0).args[0].customerContact).to.eql({
                    id: sendSpy.getCall(0).args[0].customerContact.id,
                    isDeleted: false,
                    phoneNumber: '+84123456',
                    name: 'name',
                })
                chai.expect(sendSpy.getCall(0).args[0].paymentAmount).to.eql('1110.505')
                chai.expect(sendSpy.getCall(0).args[0].address).to.eql({
                    id: 0,
                    address: 'address',
                    city: 'city',
                    latitude: '100.000001',
                    longitude: '200.000001',
                    isDeleted: false,
                })
                chai.expect(sendSpy.getCall(0).args[0].areaTransportFee).to.eql({  
                    id: 0,
                    name: 'address-1',
                    areaCity: 'city',
                    basicFee: '100',
                    billBasedTransportFee: [
                        {
                            fractionOfBill: "0.01"
                        },
                    ],
                    distanceFeePerKm: '0',
                    transportOriginIds: [ 0 ],
                    isDeleted: false
                })
                chai.expect(mockOrderRepository.orders.length).to.eql(1)
                chai.expect(mockEmailService.sentEmails.length).to.eql(1)
                chai.expect(mockEmailService.sentEmails[0].content).to.eql(`Tên khách: name\nĐịa chỉ: address\n\tTên hàng\t|\tSố lượng\t|\tĐơn vị\n\tproduct-0\t|\t10\t|\tKG\n`)
            })
            it('should fail if mismatch', async () => {
                
                let endUserOrderView = myContainer.get<EndUserOrderView>(TYPES.END_USER_ORDER_VIEW)
                request.body = {
                    items: [
                        {
                            productId: product.id,
                            unit: 'kg',
                            quantity: '10',
                        }
                    ],
                    address: {
                        latitude: '100.000001',
                        longitude: '200.000001',
                    },
                    customerContact: {
                        phoneNumber: '+84123456',
                        name: 'name',
                    },
                    expectedPrice: '1000.5001',
                    customerMessage: 'message-1'
                }
                
                await endUserOrderView.createOrder(request as Request, response as Response)
                sinon.assert.calledOnceWithExactly(statusSpy, 400)          
                chai.expect(mockOrderRepository.orders.length).to.eql(0)
                chai.expect(mockEmailService.sentEmails.length).to.eql(0)
            })
        })

        describe('fetch and update order', async () => {
            beforeEach(async () => {
                for (let i = 0; i < 100; i++) {
                    await mockOrderRepository.createOrder({
                        items: [
                            {
                                id: i * 2,
                                productId: i * 2,
                                price: new Decimal(`${i}.0001`),
                                quantity: new Decimal(i + 1),
                                unit: EProductUnit.KG,
                            },
                            {
                                id: i * 2 + 1,
                                productId: i * 2 + 1,
                                price: new Decimal(`${i}.0002`),
                                quantity: new Decimal(i + 1),
                                unit: EProductUnit.KG,
                            },
                        ],
                        message: `message-${i}`,
                        paymentAmount: new Decimal(`${i}.0001`),
                        customerContact: {
                            id: 0,
                            isDeleted: false,
                            phoneNumber: '123456'
                        },
                        shippingAddress: {
                            id: 0,
                            address: 'address-1',
                            latitude: new Decimal('10.000001'),
                            longitude: new Decimal('20.000001'),
                            city: 'city-1',
                            isDeleted: false,
                        },
                        areaTransportFee: {
                            id: 0,
                            name: 'area-1',
                            areaCity: 'city-1',
                            basicFee: new Decimal('100'),
                            billBasedTransportFee: [],
                            distanceFeePerKm: undefined,
                            transportOriginIds: [],
                            isDeleted: false,
                        },
                    })
                }
            })

            describe('fetch order', async () => {
                function verifyOrder(json: any, orderId: number) {
                    chai.expect(json).to.eql({
                        id: orderId,
                        items: [
                            {
                                id: 0,
                                productId: orderId * 2,
                                price: `${orderId}.0001`,
                                quantity: `${orderId+1}`,
                                unit: 'KG',
                            },
                            {
                                id: 1,
                                productId: orderId * 2 + 1,
                                price: `${orderId}.0002`,
                                quantity: `${orderId+1}`,
                                unit: 'KG',
                            },
                        ],
                        isShipped: false,
                        isReceived: false,
                        isPaid: false,
                        isCancelled: false,
                        cancellationReason: '',
                        customerMessage: `message-${orderId}`,
                        customerContact: {
                            id: 0,
                            isDeleted: false,
                            phoneNumber: '123456'
                        },
                        paymentAmount: `${orderId}.0001`,
                        address: {
                            id: 0,
                            address: 'address-1',
                            latitude: '10.000001',
                            longitude: '20.000001',
                            city: 'city-1',
                            isDeleted: false,
                        },
                        areaTransportFee: {
                            id: 0,
                            name: 'area-1',
                            areaCity: 'city-1',
                            basicFee: '100',
                            billBasedTransportFee: [],
                            distanceFeePerKm: undefined,
                            transportOriginIds: [],
                            isDeleted: false,
                        },
                        orderTime: json.orderTime,
                        paymentTime: null,
                        receivedTime: null,
                        startShippingTime: null,
                        cancellationTime: null,
                    })
                }

                it('with start id', async () => {
                    let adminOrderView = myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW)
                    request.query = {}
                    request.query.startId = '1'
                    request.query.limit = '1'
                    request.query.offset = '1'
                    request.query.includeOrderedOrders = 'true'
                    
                    await adminOrderView.fetchOrderSummaries(request, response)
                    sinon.assert.calledOnceWithExactly(statusSpy, 200)
                    sinon.assert.calledOnce(sendSpy)
                    verifyOrder(sendSpy.getCall(0).args[0][0], 2)
                })
                it('fetch order with id', async () => {
                    let adminOrderView = myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW)
                    request.params = {}
                    request.params.id = '0'

                    await adminOrderView.fetchOrderDetailById(request, response)
                    sinon.assert.calledOnceWithExactly(statusSpy, 200)
                    sinon.assert.calledOnce(sendSpy)
                    verifyOrder(sendSpy.getCall(0).args[0], 0)
                    
                })
            })
            describe('fetch number of orders', async () => {
                it('should return 0', async () => {
                    let adminOrderView = myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW)
                    request.query = {}
                    request.query.includeShippedOrders = 'true'
                    
                    await adminOrderView.fetchNumberOfOrders(request, response)
                    sinon.assert.calledOnceWithExactly(statusSpy, 200)
                    sinon.assert.calledOnceWithExactly(sendSpy, '0')
                })
            })

            describe('update order', async () => {
                it('should succeed', async () => {
                    chai.expect(mockOrderRepository.orders[1].isShipped).to.be.false
                    let adminOrderView = myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW)
                    request.body = {}
                    request.params = {}
                    request.params.id = '1'
                    request.body.isShipped = 'true'
                    await adminOrderView.updateOrderStatus(request, response)
                    sinon.assert.calledOnceWithExactly(statusSpy, 200)
                    sinon.assert.calledOnce(sendSpy)
                    chai.expect(sendSpy.getCall(0).args[0].isShipped).to.be.true

                    chai.expect(mockOrderRepository.orders[1].isShipped).to.be.true

                    statusSpy.resetHistory()
                    sendSpy.resetHistory()
                    request.query = {}
                    request.query.includeShippedOrders = 'true'
                    
                    await adminOrderView.fetchNumberOfOrders(request, response)
                    sinon.assert.calledOnceWithExactly(statusSpy, 200)
                    sinon.assert.calledOnceWithExactly(sendSpy, '1')
                })
            })
        })
    })
})