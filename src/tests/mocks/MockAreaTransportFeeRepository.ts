import Decimal from "decimal.js";
import { AreaTransportFee } from "../../model/AreaTransportFee";
import { CreateFeeArgs, IAreaTransportFeeRepository } from "../../repository/IAreaTransportFeeRepository";

export class MockAreaTransportFeeRepository implements IAreaTransportFeeRepository {
    public fees : AreaTransportFee[] = []
    public feesByProductId : Map<number, number[]> = new Map()
    public counter: number = 0 

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
            originLatitude: args.originLatitude,
            originLongitude: args.originLongitude,
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

    
    async fetchAreaTransportFeesByProductId(productId: number, limit: number, offset: number, ignoreDeleted?: boolean): Promise<AreaTransportFee[]> {
        let ret: AreaTransportFee[] = []
        let ids = this.feesByProductId.get(productId)
        if (ids) {
            for (let i = offset; i < offset + limit && i < ids.length; i++) {
                let fee = this.fees.find(e => e.id === ids![i])
                if (fee && (!ignoreDeleted || fee.isDeleted)) {
                    ret.push(fee)
                }
            }
        }
        return ret
    }
    
}