import 'reflect-metadata'
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import { IAreaTransportFeeRepository } from '../repository/IAreaTransportFeeRepository';
import { AreaTransportFee, TransportOrigin } from '../model/AreaTransportFee';
import Decimal from 'decimal.js';
import { NotFound } from '../exception/NotFound';

@injectable()
export class EndUserTransportFeeController {
    constructor(
        @inject(TYPES.AREA_TRANSPORT_FEE_REPOSITORY) private areaTransportFeeRepository : IAreaTransportFeeRepository
    ) {}

    async findBestTransportFee(city: string, latitude: Decimal, longitude: Decimal) : Promise<[AreaTransportFee, TransportOrigin | null]> {
        let transportFees = await this.areaTransportFeeRepository.fetchFeesByCity(city, 100000, 0)
        let ret: AreaTransportFee | null = null
        let retTransportOrigin: TransportOrigin | null = null
        let minTransportFeeCost = new Decimal(-1)
        for (let i = 0; i < transportFees.length; i++) {
            let transportOrigins = await this.areaTransportFeeRepository.fetchTransportOriginsById(transportFees[i].transportOriginIds)
            let minCostIndex = -1
            let minCost = new Decimal(-1)
            let cost = transportFees[i].basicFee
            for (let j = 0; j < transportOrigins.length; j++) {
                let latitudeDiff = latitude.sub(transportOrigins[j].latitude)
                let longitudeDiff = longitude.sub(transportOrigins[j].longitude)
                let distance = latitudeDiff.mul(latitudeDiff).add(longitudeDiff.mul(longitudeDiff)).sqrt()
                let distanceCost : Decimal = distance
                // if (transportFees[i].distanceFeePerKm) {
                //     distanceCost = distance.mul(transportFees[i].distanceFeePerKm!)
                // } else {
                //     distanceCost = distance
                // }

                if (minCost.equals(new Decimal(-1)) || distanceCost.lessThan(minCost)) {
                    minCost = distance
                    minCostIndex = j
                }
            }

            // if (transportFees[i].distanceFeePerKm) {
            //     cost = cost.add(minCost)
            // }

            if (minTransportFeeCost.equals(-1) || cost.lessThan(minTransportFeeCost)) {
                minTransportFeeCost = cost
                ret = transportFees[i]
                if (minCostIndex !== -1) {
                    retTransportOrigin = transportOrigins[minCostIndex]
                } else {
                    retTransportOrigin = null
                }
            }
        }

        if (ret === null) {
            throw new NotFound("AreaTransportFee", "city", city)
        } else {
            return [ret, retTransportOrigin]
        }
    }
}