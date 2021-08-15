import Decimal from "decimal.js";

export interface BillBasedTransportFee {
    minBillValue?: Decimal,
    basicFee?: Decimal,
    fractionOfBill?: Decimal,
    fractionOfTotalTransportFee?: Decimal,
}

export interface AreaTransportFee {
    id: number,
    name: string,
    areaCity: string,
    basicFee?: Decimal,
    billBasedTransportFee: BillBasedTransportFee[],
    distanceFeePerKm?: Decimal,
    originLatitude: Decimal,
    originLongitude: Decimal,
    isDeleted: boolean,
}