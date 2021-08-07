import Decimal from "decimal.js";
import { AreaTransportFee } from "../model/AreaTransportFee";

export interface CreateFeeArgs {
    areaCity: string,
    basicFee?: Decimal,
    fractionOfBill?: Decimal,
    distanceFeePerKm?: Decimal,
    originLatitude: Decimal,
    originLongitude: Decimal,
    isDeleted: boolean,
}
export interface IAreaTransportFeeRepository {
    createFee(args: CreateFeeArgs) : Promise<AreaTransportFee>;
    deleteFee(feeId: number) : Promise<number>;
    fetchFees(limit: number, offset: number, ignoreDeleted?: boolean) : Promise<AreaTransportFee[]>;
}