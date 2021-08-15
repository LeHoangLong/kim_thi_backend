import Decimal from "decimal.js";
import { AreaTransportFee, BillBasedTransportFee } from "../model/AreaTransportFee";

export interface CreateFeeArgs {
    areaCity: string,
    name: string,
    basicFee?: Decimal,
    billBasedTransportFee: BillBasedTransportFee[],
    distanceFeePerKm?: Decimal,
    originLatitude: Decimal,
    originLongitude: Decimal,
    isDeleted: boolean,
}
export interface IAreaTransportFeeRepository {
    createFee(args: CreateFeeArgs) : Promise<AreaTransportFee>;
    deleteFee(feeId: number) : Promise<number>;
    fetchFees(limit: number, offset: number, ignoreDeleted?: boolean) : Promise<AreaTransportFee[]>;
    // fetchAreaTransportFeesByProductId(productId: number, limit: number, offset: number, ignoreDeleted?: boolean) : Promise<AreaTransportFee[]>;
    fetchNumberOfFees() : Promise<number>;
}