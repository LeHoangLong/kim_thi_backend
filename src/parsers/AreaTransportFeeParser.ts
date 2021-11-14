import { AreaTransportFee } from "../model/AreaTransportFee";

export function parseAreaTransportFee(areaTransportFee: AreaTransportFee) {
    let ret : AreaTransportFee = {
        ...areaTransportFee,
    }
    ret.basicFee = ret.basicFee.toString() as any
    if (ret.distanceFeePerKm !== undefined) {
        ret.distanceFeePerKm = ret.distanceFeePerKm.toString() as any
    }

    for (let i = 0; i < ret.billBasedTransportFee.length; i++) {
        let billBasedTransportFee = ret.billBasedTransportFee[i]
        if (billBasedTransportFee.basicFee !== undefined) {
            billBasedTransportFee.basicFee = billBasedTransportFee.basicFee.toString() as any
        }

        if (billBasedTransportFee.fractionOfBill !== undefined) {
            billBasedTransportFee.fractionOfBill = billBasedTransportFee.fractionOfBill.toString() as any
        }

        if (billBasedTransportFee.fractionOfTotalTransportFee !== undefined) {
            billBasedTransportFee.fractionOfTotalTransportFee = billBasedTransportFee.fractionOfTotalTransportFee.toString() as any
        }

        if (billBasedTransportFee.minBillValue !== undefined) {
            billBasedTransportFee.minBillValue = billBasedTransportFee.minBillValue.toString() as any
        }
    }
    return ret
}