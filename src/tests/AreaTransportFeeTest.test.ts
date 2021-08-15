import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../types';
import { myContainer } from "../inversify.config";
import { ProductView } from '../view/ProductView';
import { IProductRepository } from '../repository/IProductRepository';
import { IProductPriceRepository } from '../repository/IPriceRepository';
import { IImageRepository } from '../repository/IImageRepository';
import { IBinaryRepository } from '../repository/IBinaryRepository';
import { MockProductRepository } from './mocks/MockProductRepository';
import { MockProductPriceRepository } from './mocks/MockProductPriceRepository';
import { MockImageRepository } from './mocks/MockImageRepository';
import { MockBinaryRepository } from './mocks/MockBinaryRepository';
import { request, Request, response, Response } from 'express';
import chai from 'chai'
import { EProductUnit } from '../model/ProductPrice';
import { MockProductCategoryRepository } from './mocks/MockProductCategoryRepository';
import { IProductCategoryRepository } from '../repository/IProductCategoryRepository';
import { IConnectionFactory } from '../services/IConnectionFactory';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import { DatabaseError, PoolClient } from 'pg';
import { Product } from '../model/Product';
import chaiSubset from 'chai-subset';

import chaiAsPromised from 'chai-as-promised'
import { Image } from '../model/Image';
import { ProductRepositoryPostgres } from '../repository/ProductRepositoryPostgres';
import { PriceRepositoryPostgres } from '../repository/PriceRepositoryPostgres';
import { ImageRepositoryPostgres } from '../repository/ImageRepositoryPostgres';
import { BinaryRepositoryFileSystem } from '../repository/BinaryRepositoryFilesystem';
import { ProductCategoryRepositoryPostgres } from '../repository/ProductCategoryRepositoryPostgres';
import { IAreaTransportFeeRepository } from '../repository/IAreaTransportFeeRepository';
import Decimal from 'decimal.js';
import { MockAreaTransportFeeRepository } from './mocks/MockAreaTransportFeeRepository';
import { TransportFeeView } from '../view/TransportFeeView';
import { MockGeocoder } from './mocks/MockGeocoder';
import { Geocoder } from 'node-geocoder';
import { AreaTransportFeeRepositoryPostgres } from '../repository/AreaTransportFeeRepositoryPostgres';
chai.use(chaiAsPromised);
chai.use(chaiSubset)


describe('Area transport fee repository test', async function() {
    let areaTransportFeeRepository: IAreaTransportFeeRepository
    beforeEach(async function() {
        areaTransportFeeRepository = myContainer.get<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY)
    })

    describe('create transport fee', async function() {
        it('should succeed', async function() {
            let fee = await areaTransportFeeRepository.createFee({
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
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            });
            chai.expect(fee.areaCity, "city")
            chai.expect(fee.name, "fee_1")
            chai.expect(fee.basicFee?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.distanceFeePerKm?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.billBasedTransportFee).to.be.eql([{
                minBillValue: new Decimal('100.01'),
                basicFee: new Decimal('10.01'),
                fractionOfBill: new Decimal('0.02'),
                fractionOfTotalTransportFee: new Decimal('0.03'),
            }])
            chai.expect(fee.originLatitude.comparedTo(new Decimal(150.000005))).to.be.eql(0)
            chai.expect(fee.originLongitude.comparedTo(new Decimal(100.000005))).to.be.eql(0)
        })
    })

    describe('fetch transport fee', async function () {
        it('should succeed', async function() {
            await areaTransportFeeRepository.createFee({
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                name: 'fee_1',
                billBasedTransportFee: [
                    {
                        minBillValue: new Decimal('100.01'),
                        basicFee: new Decimal('10.01'),
                        fractionOfBill: new Decimal('0.02'),
                        fractionOfTotalTransportFee: new Decimal('0.03'),
                    },
                    {
                        minBillValue: new Decimal('100.02'),
                        basicFee: new Decimal('10.02'),
                        fractionOfBill: new Decimal('0.03'),
                        fractionOfTotalTransportFee: new Decimal('0.04'),
                    },
                ],
                distanceFeePerKm: new Decimal(10000.05),
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            });
            let fees = await areaTransportFeeRepository.fetchFees(1, 0)
            let fee = fees[0]
            chai.expect(fee.name).to.be.equal('fee_1')
            chai.expect(fee.areaCity, "city")
            chai.expect(fee.basicFee?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.distanceFeePerKm?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.originLatitude.comparedTo(new Decimal(150.000005))).to.be.eql(0)
            chai.expect(fee.originLongitude.comparedTo(new Decimal(100.000005))).to.be.eql(0)
            chai.expect(fee.billBasedTransportFee).to.be.eql([
                {
                    minBillValue: new Decimal('100.01'),
                    basicFee: new Decimal('10.01'),
                    fractionOfBill: new Decimal('0.02'),
                    fractionOfTotalTransportFee: new Decimal('0.03'),
                },
                {
                    minBillValue: new Decimal('100.02'),
                    basicFee: new Decimal('10.02'),
                    fractionOfBill: new Decimal('0.03'),
                    fractionOfTotalTransportFee: new Decimal('0.04'),
                },
            ])
        })
    })

    describe('delete transport fee', function () {
        it('should succeed', async function() {
            let fee = await areaTransportFeeRepository.createFee({
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                name: '',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(10000.05),
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            });
            let numberOfDeleted = await areaTransportFeeRepository.deleteFee(fee.id)
            chai.expect(numberOfDeleted).to.be.eql(1)

            let fees = await areaTransportFeeRepository.fetchFees(1, 0)
            chai.expect(fees.length).to.be.eql(0)
        })

    })
})


describe('Area transport fee view test', async () => {
    let context : any = {}
    beforeEach(() => {
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const mockImageRepository = new MockImageRepository()
        const mockBinaryRepository = new MockBinaryRepository()
        const mockProductRepository = new MockProductRepository()
        const mockProductPriceRepository = new MockProductPriceRepository()
        const mockProductCategoryRepository = new MockProductCategoryRepository()
        const mockAreaTransportFeeRepository = new MockAreaTransportFeeRepository()
        const mockGeocoder = new MockGeocoder()

        myContainer.rebind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).toConstantValue(mockProductRepository)
        myContainer.rebind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).toConstantValue(mockProductPriceRepository)
        myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository)
        myContainer.rebind<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY).toConstantValue(mockProductCategoryRepository)
        myContainer.rebind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).toConstantValue(mockAreaTransportFeeRepository)
        myContainer.rebind<Geocoder>(TYPES.GOOGLE_GEOCODER).toConstantValue(mockGeocoder)

        context.now = now
        context.areaTransportFeeRepository = mockAreaTransportFeeRepository

        let request: any = {}
        let response: any = {
            status() : any {
                return this
            },
            send() : any {

            },
        }

        context.request = request
        context.response = response
        context.statusSpy = sinon.spy(context.response, "status")
        context.sendSpy = sinon.spy(context.response, "send")
        context.mockProductRepository = mockProductRepository
        context.mockGeocoder = mockGeocoder
    })
    describe('create area transport fee view', async () => {
        it('Should succeed', async () => {
            context.request.body = {
                name: 'fee_1',
                city: 'city_1',
                originAddress: 'test-address',
                basicFee: '1000.01'
            }
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            await areaTransportFeeView.createAreaTransportView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 201)
            sinon.assert.calledOnceWithExactly(context.sendSpy, {
                id: 0,
                name: 'fee_1',
                areaCity: 'test-city',
                basicFee: '1000.01',
                billBasedTransportFee: [],
                originLatitude: '10.000001',
                originLongitude: '20.000001',
                isDeleted: false
            })
        })
    })
    describe('fetch area transport fee view', async () => {
        beforeEach(async () => {
            let mockRepository = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            await mockRepository.createFee({
                areaCity: "city-1",
                basicFee: new Decimal(10000.05),
                name: 'fee_1',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(10000.05),
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            })
            await mockRepository.createFee({
                areaCity: "city-2",
                basicFee: new Decimal(20000.05),
                name: 'fee_2',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(20000.05),
                originLatitude: new Decimal(250.000005),
                originLongitude: new Decimal(200.000005),
                isDeleted: false,
            })
        })
        it('should succeed', async () => {
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            context.request.query = {
                limit: 2,
                offset: 1,
            }
            await areaTransportFeeView.fetchAreaTransportView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            sinon.assert.calledOnceWithExactly(context.sendSpy, [{
                id: 1,
                name: 'fee_2',
                areaCity: "city-2",
                basicFee: '20000.05',
                billBasedTransportFee: [],
                distanceFeePerKm: '20000.05',
                originLatitude: '250.000005',
                originLongitude: '200.000005',
                isDeleted: false,
            }])
        })
    })


    describe('Update area transport fee view', async () => {
        beforeEach(async () => {
            let mockRepository = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            let createdFee = await mockRepository.createFee({
                areaCity: "city-1",
                basicFee: new Decimal(10000.05),
                name: '',
                billBasedTransportFee: [],
                distanceFeePerKm: new Decimal(10000.05),
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            })
            context.createdFee = createdFee
        })

        it('can delete transport fee', async () => {
            let mockAreaTransportFee = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            mockAreaTransportFee.feesByProductId.set(0, [context.createdFee.id])
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            context.request.params = {
                id: context.createdFee.id,
            }
            await areaTransportFeeView.deleteAreaTransportFeeView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 204)
        })


        it('can update transport fee', async () => {
            let mockAreaTransportFee = context.areaTransportFeeRepository as MockAreaTransportFeeRepository
            mockAreaTransportFee.feesByProductId.set(0, [context.createdFee.id])
            let areaTransportFeeView = myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW)
            context.request.body = {
                originAddress: 'test-address',
                basicFee: '1000.01'
            }
            context.request.params = {
                id: context.createdFee.id
            }
            await areaTransportFeeView.updateAreaTransportFeeView(context.request, context.response)
            sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
            chai.expect(mockAreaTransportFee.fees[mockAreaTransportFee.fees.length - 1].basicFee).to.be.eql(new Decimal('1000.01'))
        })
    })
})