import Decimal from "decimal.js";
import { NotFound } from "../../exception/NotFound";
import { AreaTransportFee, TransportOrigin } from "../../model/AreaTransportFee";
import { CreateFeeArgs, CreateTransportOriginArgs, IAreaTransportFeeRepository } from "../../repository/IAreaTransportFeeRepository";

export class MockAreaTransportFeeRepository implements IAreaTransportFeeRepository {
    public fees : AreaTransportFee[] = []
    public origins:TransportOrigin[] = []
    public feesByProductId : Map<number, number[]> = new Map()
    public counter: number = 0 

    async fetchTransportOriginsById(ids: number[]): Promise<TransportOrigin[]> {
        let ret : TransportOrigin[] = []
        for (let i = 0; i < ids.length; i++) {
            let origin = this.origins.find(e => e.id === ids[i])
            if (origin)  {
                ret.push(origin)
            }
        } 
        return ret
    }

    async fetchNumberOfOrigins(): Promise<number> {
        return this.origins.length
    }

    async fetchTransportOrigins(limit: number, offset: number, ignoreDeleted?: boolean): Promise<TransportOrigin[]> {
        return this.origins.slice(offset, offset + limit)
    }
    
    async createTransportOrigin(args: CreateTransportOriginArgs): Promise<TransportOrigin> {
        this.origins.push({
            id: this.origins.length,
            isDeleted: false,
            latitude: args.latitude,
            longitude: args.longitude,
            address: args.address,
        })
        return this.origins[this.origins.length - 1]
    }

    deleteTransportOriginById(id: number): Promise<number> {
        throw new Error("Method not implemented.");
    }


    async fetchNumberOfFees(): Promise<number> {
        let count = 0
        for (let i = 0; i < this.fees.length; i++) {
            if (!this.fees[i].isDeleted) {
                count++
            }
        }
        return count
    }

    async createFee(args: CreateFeeArgs): Promise<AreaTransportFee> {
        let newFee = {
            id: this.counter++,
            areaCity: args.areaCity,
            basicFee: args.basicFee,
            name: args.name,
            billBasedTransportFee: args.billBasedTransportFee,
            distanceFeePerKm: args.distanceFeePerKm,
            transportOriginIds: args.transportOriginIds,
            isDeleted: args.isDeleted,
        }
        this.fees.push(newFee)
        return newFee
    }

    async deleteFee(feeId: number): Promise<number> {
        let deleted = 0
        let index = this.fees.findIndex(e => e.id === feeId);
        if (index !== -1) {
            this.fees[index].isDeleted = true
            return 1
        } else {
            return 0
        }
    }

    async fetchFees(limit: number, offset: number, ignoreDeleted: boolean = true): Promise<AreaTransportFee[]> {
        let ret : AreaTransportFee[] = []
        for (let i = offset; i < offset + limit && i < this.fees.length; i++) {
            if (!ignoreDeleted || !this.fees[i].isDeleted) {
                ret.push(this.fees[i])
            }
        }
        return ret
    }

    async fetchFeeById(id: number) : Promise<AreaTransportFee> {
        let fee = this.fees.find(e => e.id === id)
        if (!fee) {
            throw new NotFound("fee", "id", id.toString())
        }
        return fee
    }
}