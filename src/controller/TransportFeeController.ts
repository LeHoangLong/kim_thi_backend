import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { CreateFeeArgs, IAreaTransportFeeRepository } from "../repository/IAreaTransportFeeRepository";
import { TYPES } from "../types";
import node_geocoder, { Geocoder } from "node-geocoder";
import { AreaTransportFee } from "../model/AreaTransportFee";
import { NotFound } from "../exception/NotFound";
import { IConnectionFactory } from "../services/IConnectionFactory";

export interface CreatAreaTransportFeeArgs {
    originAddress: string,
    basicFee?: Decimal,
    fractionOfBill?: Decimal,
    distanceFeePerKm?: Decimal,
}

@injectable()
export class TransportFeeController {
    private geocoder : Geocoder;
    constructor(
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private repository: IAreaTransportFeeRepository,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory:  IConnectionFactory,
    ) {
        this.geocoder = node_geocoder({
            provider: 'google',
            apiKey: 'AIzaSyA30V1U6ANKqisXXm4V6hIaewF6qbyZSkI',
        })
    }

    async createTransportFee(args : CreatAreaTransportFeeArgs) : Promise<AreaTransportFee> {
        const res = await this.geocoder.geocode(args.originAddress);
        if (res.length === 0) {
            throw new NotFound("address", "address", args.originAddress)
        } else {
            if (!res[0].city) {
                throw new NotFound("address", "city", args.originAddress)
            } else if (!res[0].latitude) {
                throw new NotFound("address", "latitude", args.originAddress)
            } else if (!res[0].longitude) {
                throw new NotFound("address", "longitude", args.originAddress)
            } else {
                let createArgsFee : CreateFeeArgs = {
                    areaCity: res[0].city,
                    basicFee: args.basicFee,
                    fractionOfBill: args.fractionOfBill,
                    distanceFeePerKm: args.distanceFeePerKm,
                    originLatitude: new Decimal(res[0].latitude),
                    originLongitude: new Decimal(res[0].longitude),
                    isDeleted: false,
                }
                return this.repository.createFee(createArgsFee)
            }
        }
    }

    async fetchFees(limit: number, offset: number) : Promise<AreaTransportFee[]> {
        return this.repository.fetchFees(limit, offset)
    }

    async deleteFee(feeId: number) : Promise<number> {
        return this.repository.deleteFee(feeId)
    }

    async updateFee(feeId: number, args : CreatAreaTransportFeeArgs) : Promise<AreaTransportFee> {
        let updatedFee: AreaTransportFee | undefined
        await this.connectionFactory.startTransaction([], async () => {
            await this.deleteFee(feeId)
            updatedFee = await this.createTransportFee(args) 
        })
        if (!updatedFee) {
            throw new NotFound("area_transport_fee", "id", feeId.toString())
        }
        return updatedFee
    }
}