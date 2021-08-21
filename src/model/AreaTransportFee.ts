import Decimal from "decimal.js";

export interface BillBasedTransportFee {
    minBillValue?: Decimal,
    basicFee?: Decimal,
    fractionOfBill?: Decimal,
    fractionOfTotalTransportFee?: Decimal,
}

export interface TransportOrigin {
    id: number,
    address: string,
    latitude: Decimal,
    longitude: Decimal,
    isDeleted: boolean,
}

export interface AreaTransportFee {
    id: number,
    name: string,
    areaCity: string,
    basicFee?: Decimal,
    billBasedTransportFee: BillBasedTransportFee[],
    distanceFeePerKm?: Decimal,
    transportOriginIds: number[],
    isDeleted: boolean,
}

export interface AreaTransportFeeSummary {
    id: number,
    name: string,
    areaCity: string,
}