import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { CreateFeeArgs, IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository";
import { TYPES } from "../types";
import node_geocoder, { Geocoder } from "node-geocoder";
import { AreaTransportFee, TransportOrigin } from "../model/AreaTransportFee";
import { NotFound } from "../exception/NotFound";
import { IConnectionFactory } from "../services/IConnectionFactory";
import { ProductController } from "./ProductController";
import { IProductRepository } from "../repository/IProductRepository";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";
import { IProductPriceRepository } from "../repository/IPriceRepository";

export interface CreatAreaTransportFeeArgs {
    name: string,
    city: string,
    transportOriginIds: [],
    basicFee?: Decimal,
    fractionOfBill?: Decimal,
    distanceFeePerKm?: Decimal,
}

@injectable()
export class TransportFeeController {
    constructor(
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private repository: IAreaTransportFeeRepository,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory:  IConnectionFactory,
        @inject(TYPES.PRODUCT_CONTROLLER) public readonly productController: ProductController,
        @inject(TYPES.PRODUCT_REPOSITORY) private productRepository: IProductRepository,
        @inject(TYPES.PRODUCT_PRICE_REPOSITORY) private productPriceRepository: IProductPriceRepository,
        @inject(TYPES.GOOGLE_GEOCODER) private geocoder: Geocoder,
    ) {
    }

    async createTransportOrigin(address: string) : Promise<TransportOrigin> {
        let decodedAddress = await this.geocoder.geocode(address)
        if (!decodedAddress[0].latitude) {
            throw new NotFound("address", "latitude", address)
        } else if (!decodedAddress[0].longitude) {
            throw new NotFound("address", "longitude", address)
        }

        return this.repository.createTransportOrigin({
            address: address,
            latitude: new Decimal(decodedAddress[0].latitude),
            longitude: new Decimal(decodedAddress[0].longitude),
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
        if (!cityRes[0].city) {
            throw new NotFound("address", "city", args.city)
        } 

        let createArgsFee : CreateFeeArgs = {
            name: args.name,
            areaCity: cityRes[0].city,
            basicFee: args.basicFee,
            billBasedTransportFee: [],
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

    /*
    private async fetchAllTransportFees(productId: number) : Promise<AreaTransportFee[]> {
        let ret : AreaTransportFee[] = []
        let limit = 100
        let offset = 0
        let tempAreaTransportFees : AreaTransportFee[] = []
        do {
            tempAreaTransportFees = await this.repository.fetchAreaTransportFeesByProductId(productId, limit, offset, false)
            ret = ret.concat(tempAreaTransportFees)
            offset += tempAreaTransportFees.length
        } while (tempAreaTransportFees.length === limit)
        return ret
    }

    // Should already be in a transaction
    private async updateProductWithTransportFee(currentFeeId: number, newFee?: AreaTransportFee) {
        let offset = 0
        let limit = 100
        let toBeUpdatedProducts : Product[] = []
        // update corresponding product
        do {
            toBeUpdatedProducts = await this.productRepository.fetchProductsByAreaTransportFee(currentFeeId, limit, offset, true)
            for (let i = 0; i < toBeUpdatedProducts.length; i++) {
                let product = toBeUpdatedProducts[i]
                let currentTransportFees = await this.fetchAllTransportFees(product.id!)
                let index = currentTransportFees.findIndex(e => e.id === currentFeeId)
                let newTransportFeeIds: number[] = []
                for (let j = 0; j < currentTransportFees.length; j++) {
                    if (j != index) {
                        newTransportFeeIds.push(currentTransportFees[j].id)
                    } else if (newFee) {
                        newTransportFeeIds.push(newFee.id)
                    }
                }

                let currentProductCategories : ProductCategory[] = await this.productRepository.fetchProductCategories(product.id!)
                let currentPrices : ProductPrice[] = await this.productPriceRepository.fetchPricesByProductId(product.id!)
                index = currentPrices.findIndex(e => e.isDefault === true)
                let [defaultPrice] = currentPrices.splice(index, 1)

                await this.productController.updateProduct(product.id!, {
                    serialNumber: product.serialNumber,
                    name: product.name,
                    avatarId: product.avatarId,
                    defaultPrice: defaultPrice,
                    alternativePrices: currentPrices,
                    rank: product.rank,
                    categories: currentProductCategories,
                    areaTransportFeeIds: newTransportFeeIds,
                })
            }
            offset += toBeUpdatedProducts.length
        } while (toBeUpdatedProducts.length === limit)
    }
    */
}