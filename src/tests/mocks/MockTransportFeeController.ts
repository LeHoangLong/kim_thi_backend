import Decimal from "decimal.js";
import { injectable } from "inversify";
import { EndUserTransportFeeController } from "../../controller/EndUserTransportFeeController";
import { NotFound } from "../../exception/NotFound";
import { AreaTransportFee, TransportOrigin } from "../../model/AreaTransportFee";
import { IAreaTransportFeeRepository } from "../../repository/IAreaTransportFeeRepository";

@injectable()
export class MockEndUserTransportFeeController extends EndUserTransportFeeController {
    public transportFees: AreaTransportFee[] = []
    public transportOrigins: TransportOrigin[] = []

    constructor() {
        super(null as any as IAreaTransportFeeRepository)
    }

    async findBestTransportFee(city: string, latitude: Decimal, longitude: Decimal) : Promise<[AreaTransportFee, TransportOrigin | null]> {
        let e = this.transportFees.find(e => e.areaCity === city)
        if (e === undefined) {
            throw new NotFound("AreaTransportFee", "areaCity", city)
        } else {
            let transportOrigin = this.transportOrigins.find(origin => e!.transportOriginIds.includes(origin.id) && origin.city === city)
            return [e, transportOrigin?? null]
        }

        return [{
            id: 0,
            name: 'address-' + city,
            areaCity: city,
            basicFee: new Decimal(0),
            billBasedTransportFee: [],
            distanceFeePerKm: new Decimal(0),
            transportOriginIds: [0],
            isDeleted: false,
        }, {
            id: 0,
            address: 'origin-' + city,
            latitude: latitude,
            longitude: longitude,
            city: city,
            isDeleted: false,           
        }]
    }
    
}