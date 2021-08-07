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
import { Request, Response } from 'express';
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
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                fractionOfBill: new Decimal(10000.05),
                distanceFeePerKm: new Decimal(10000.05),
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            });
            chai.expect(fee.areaCity, "city")
            chai.expect(fee.basicFee?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.fractionOfBill?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.distanceFeePerKm?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.originLatitude.comparedTo(new Decimal(150.000005))).to.be.eql(0)
            chai.expect(fee.originLongitude.comparedTo(new Decimal(100.000005))).to.be.eql(0)
        })
    })

    describe('fetch transport fee', async function () {
        it('should succeed', async function() {
            await areaTransportFeeRepository.createFee({
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                fractionOfBill: new Decimal(10000.05),
                distanceFeePerKm: new Decimal(10000.05),
                originLatitude: new Decimal(150.000005),
                originLongitude: new Decimal(100.000005),
                isDeleted: false,
            });
            let fees = await areaTransportFeeRepository.fetchFees(1, 0)
            let fee = fees[0]
            chai.expect(fee.areaCity, "city")
            chai.expect(fee.basicFee?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.fractionOfBill?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.distanceFeePerKm?.comparedTo(new Decimal(10000.05))).to.be.eql(0)
            chai.expect(fee.originLatitude.comparedTo(new Decimal(150.000005))).to.be.eql(0)
            chai.expect(fee.originLongitude.comparedTo(new Decimal(100.000005))).to.be.eql(0)
        })
    })

    describe('delete transport fee', function () {
        it('should succeed', async function() {
            let fee = await areaTransportFeeRepository.createFee({
                areaCity: "city",
                basicFee: new Decimal(10000.05),
                fractionOfBill: new Decimal(10000.05),
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