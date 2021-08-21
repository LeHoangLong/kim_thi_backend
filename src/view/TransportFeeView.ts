import { inject, injectable } from "inversify";
import { CreatAreaTransportFeeArgs, TransportFeeController } from "../controller/TransportFeeController";
import { TYPES } from "../types";
import express from 'express'
import { config } from "../config";
import Decimal from "decimal.js";
import { AreaTransportFee, TransportOrigin } from "../model/AreaTransportFee";
import { NotFound } from "../exception/NotFound";

@injectable()
export class TransportFeeView {
    constructor(
        @inject(TYPES.TRANSPORT_FEE_CONTROLLER) public controller: TransportFeeController
    ) {}

    async fetchTransportOriginByIdsView(request: express.Request, response: express.Response) {
        let ids : number[] = []
        if (typeof(request.query.ids) === typeof('') && !isNaN(parseInt(request.query.ids as any))) {
            ids = [parseInt(request.query.ids as any)]
        } else {
            for (let i = 0; i < request.query.ids!.length!; i++) {
                let id = parseInt((request.query.ids as any)[i])
                if (!isNaN(id)) {
                    ids.push(id)
                }
            }
        }
        let origins = await this.controller.fetchTransportOriginByIds(ids)
        let ret: any[] = []
        for (let i = 0; i < origins.length; i++) {
            ret.push(this.transportOriginToJson(origins[i]))
        }
        return response.status(200).send(ret)
    }

    async fetchTransportOriginView(request: express.Request, response: express.Response)  {
        let limit = parseInt(request.query.limit as string)
        if (isNaN(limit)) {
            limit = config.pagination.defaultSize
        }

        let offset = parseInt(request.query.offset as string)
        if (isNaN(offset)) {
            offset = 0
        }

        let origins = await this.controller.fetchTransportOrigins(limit, offset)
        let ret: any[] = []
        for (let i = 0; i < origins.length; i++) {
            ret.push(this.transportOriginToJson(origins[i]))
        }
        response.status(200).send(ret)
    }

    async fetchTransportOriginCountView(request: express.Request, response: express.Response)  {
        let count = await this.controller.fetchNumberOfTransportOrigins()
        response.status(200).send(count.toString())
    }

    async createTransportOriginView(request: express.Request, response: express.Response) {
        if (!request.body.address) {
            response.status(400).send()
            return
        } 
        let origin = await this.controller.createTransportOrigin(request.body.address)
        return response.status(201).send(this.transportOriginToJson(origin))
    }

    private transportOriginToJson(origin: TransportOrigin) : any {
        let latitude = origin.latitude.toString()
        let longitude = origin.longitude.toString()
        return {
            ...origin,
            latitude,
            longitude,
        }
    }

    async createAreaTransportView(request: express.Request, response: express.Response) : Promise<void> {
        let fee = await this.controller.createTransportFee(this.jsonToCreatAreaTransportFeeArgs(request.body))
        response.status(201).send(this.feeToJson(fee))
    } 

    async fetchNumberOfAreaTransportView(request: express.Request, response: express.Response) {
        let number = await this.controller.fetchNumberOfFees()
        response.status(200).send(number)
    }
    
    async fetchAreaTransportDetailView(request: express.Request, response: express.Response) {
        let id = parseInt(request.params.id)
        if (isNaN(id)) {
            return response.status(400).send()
        }

        try {
            let fee = await this.controller.fetchFeeById(id)
            return response.status(200).send(this.feeToJson(fee))
        } catch (exception) {
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                throw exception
            } 
        }
    }

    async fetchAreaTransportView(request: express.Request, response: express.Response) {
        let limit = parseInt(request.query.limit as string)
        if (isNaN(limit)) {
            limit = config.pagination.defaultSize
        }

        let offset = parseInt(request.query.offset as string)
        if (isNaN(offset)) {
            offset = 0
        }
        let fees = await this.controller.fetchFees(limit, offset)
        let ret : any[] = []
        for (let i = 0; i < fees.length; i++) {
            ret.push(this.feeToJson(fees[i]))
        }
        return response.status(200).send(ret)
    }

    async updateAreaTransportFeeView(request: express.Request, response: express.Response) {
        let feeId = parseInt(request.params.id)
        if (isNaN(feeId)) {
            return response.status(400).send()
        }

        let newFee = await this.controller.updateFee(feeId, this.jsonToCreatAreaTransportFeeArgs(request.body))
        return response.status(200).send(this.feeToJson(newFee))
    }

    async deleteAreaTransportFeeView(request: express.Request, response: express.Response) {
        let feeId = parseInt(request.params.id)
        if (isNaN(feeId)) {
            return response.status(400).send()
        }

        await this.controller.deleteFee(feeId)
        return response.status(204).send()
    }

    jsonToCreatAreaTransportFeeArgs(json: any) : CreatAreaTransportFeeArgs {
        return {
            name: json.name,
            city: json.city,
            transportOriginIds: json.transportOriginIds,
            basicFee: json.basicFee !== undefined? new Decimal(json.basicFee) : undefined,
            fractionOfBill: json.fractionOfBill !== undefined? new Decimal(json.fractionOfBill) : undefined,
            distanceFeePerKm: json.distanceFeePerKm !== undefined? new Decimal(json.distanceFeePerKm) : undefined,
        }
    }

    feeToJson(fee: AreaTransportFee) : any {
        let ret : any = {...fee}
        if (fee.basicFee) {
            ret.basicFee = fee.basicFee.toString()
        } else {
            delete ret.basicFee
        }

        if (fee.distanceFeePerKm) {
            ret.distanceFeePerKm = fee.distanceFeePerKm.toString()
        } else {
            delete ret.distanceFeePerKm
        }

        return ret
    }
}