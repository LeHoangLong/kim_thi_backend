import Decimal from "decimal.js";

export interface AreaTransportFee {
    id: number,
    areaCity: string,
    basicFee?: Decimal,
    fractionOfBill?: Decimal,
    distanceFeePerKm?: Decimal,
    originLatitude: Decimal,
    originLongitude: Decimal,
    isDeleted: boolean,
}