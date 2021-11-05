import Decimal from "decimal.js";
import { AreaTransportFee, BillBasedTransportFee, TransportOrigin } from "../model/AreaTransportFee";

export interface CreateFeeArgs {
    areaCity: string,
    name: string,
    basicFee?: Decimal,
    billBasedTransportFee: BillBasedTransportFee[],
    distanceFeePerKm?: Decimal,
    transportOriginIds: number[],
    isDeleted: boolean,
}

export interface CreateTransportOriginArgs {
    address: string,
    latitude: Decimal,
    longitude: Decimal,
    city: string,
}
export interface IAreaTransportFeeRepository {
    createFee(args: CreateFeeArgs) : Promise<AreaTransportFee>;
    deleteFee(feeId: number) : Promise<number>;
    fetchFees(limit: number, offset: number, ignoreDeleted?: boolean) : Promise<AreaTransportFee[]>;
    fetchFeeById(id: number) : Promise<AreaTransportFee>
    fetchNumberOfFees() : Promise<number>;
    // fetchAreaTransportFeesByProductId(productId: number, limit: number, offset: number, ignoreDeleted?: boolean) : Promise<AreaTransportFee[]>;
    
    fetchNumberOfOrigins() : Promise<number>
    fetchTransportOriginsById(ids: number[]) : Promise<TransportOrigin[]>
    fetchTransportOrigins(limit: number, offset: number, ignoreDeleted?: boolean) : Promise<TransportOrigin[]>
    createTransportOrigin(args: CreateTransportOriginArgs) : Promise<TransportOrigin>
    deleteTransportOriginById(id: number) : Promise<number>
}