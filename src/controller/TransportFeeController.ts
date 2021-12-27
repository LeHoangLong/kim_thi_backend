import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { CreateFeeArgs, IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository";
import { TYPES } from "../types";
import { AreaTransportFee, BillBasedTransportFee, TransportOrigin } from "../model/AreaTransportFee";
import { NotFound } from "../exception/NotFound";
import { IConnectionFactory } from "../services/IConnectionFactory";
import { ProductController } from "./ProductController";
import { IProductRepository } from "../repository/IProductRepository";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";
import { IProductPriceRepository } from "../repository/IPriceRepository";
import { GeocoderController } from "./GeocoderController";

export interface CreatAreaTransportFeeArgs {
    name: string,
    city: string,
    transportOriginIds: [],
    basicFee: Decimal,
    fractionOfBill?: Decimal,
    distanceFeePerKm?: Decimal,
    billBasedTransportFees: BillBasedTransportFee[]
}

@injectable()
export class TransportFeeController {
    constructor(
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private repository: IAreaTransportFeeRepository,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory:  IConnectionFactory,
        @inject(TYPES.PRODUCT_CONTROLLER) public readonly productController: ProductController,
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private productPriceRepository: IProductPriceRepository,
        @inject(TYPES.GEOCODER_CONTROLLER) private geocoder: GeocoderController,
    ) {
    }

    async createTransportOrigin(address: string) : Promise<TransportOrigin> {
        let decodedAddress = await this.geocoder.geocode(address)

        return this.repository.createTransportOrigin({
            address: address,
            latitude: decodedAddress.latitude,
            longitude: decodedAddress.longitude,
            city: decodedAddress.city,
        })
    }

    fetchTransportOrigins(limit: number, offset: number) : Promise<TransportOrigin[]> {
        return this.repository.fetchTransportOrigins(limit, offset)
    }

    fetchTransportOriginByIds(ids: number[]) : Promise<TransportOrigin[]> {
        return this.repository.fetchTransportOriginsById(ids)
    }

    fetchNumberOfTransportOrigins() : Promise<number> {
        return this.repository.fetchNumberOfOrigins()
    }

    async createTransportFee(args : CreatAreaTransportFeeArgs) : Promise<AreaTransportFee> {
        const cityRes = await this.geocoder.geocode(args.city);

        let createArgsFee : CreateFeeArgs = {
            name: args.name,
            areaCity: cityRes.city,
            basicFee: args.basicFee,
            billBasedTransportFee: args.billBasedTransportFees,
            distanceFeePerKm: args.distanceFeePerKm,
            transportOriginIds: args.transportOriginIds,
            isDeleted: false,
        }
        return this.repository.createFee(createArgsFee)
    }

    async fetchFeeById(id: number) : Promise<AreaTransportFee> {
        return this.repository.fetchFeeById(id)
    }

    async fetchFees(limit: number, offset: number) : Promise<AreaTransportFee[]> {
        return this.repository.fetchFees(limit, offset)
    }

    async deleteFee(feeId: number) : Promise<number> {
        let ret: number = 0
        await this.connectionFactory.startTransaction(this, [
            this.productRepository, 
            this.productController, 
            this.productPriceRepository,
            this.repository,
        ], async () => {
            ret = await this.repository.deleteFee(feeId)
            // await this.updateProductWithTransportFee(feeId)
        })
        return ret
    }

    async fetchNumberOfFees() : Promise<number> {
        return this.repository.fetchNumberOfFees()
    }

    async updateFee(feeId: number, args : CreatAreaTransportFeeArgs) : Promise<AreaTransportFee> {
        let updatedFee: AreaTransportFee | undefined
        await this.connectionFactory.startTransaction(this, [
            this.productRepository, 
            this.productController, 
            this.productPriceRepository,
            this.repository,
        ], async () => {
            await this.repository.deleteFee(feeId)
            updatedFee = await this.createTransportFee(args) 
        })
        if (!updatedFee) {
            throw new NotFound("area_transport_fee", "id", feeId.toString())
        }
        return updatedFee
    }
}