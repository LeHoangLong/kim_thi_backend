import { inject, injectable } from "inversify";
import { CreatAreaTransportFeeArgs, TransportFeeController } from "../controller/TransportFeeController";
import { TYPES } from "../types";
import express from 'express'
import { config } from "../config";
import Decimal from "decimal.js";
import { AreaTransportFee } from "../model/AreaTransportFee";

@injectable()
export class TransportFeeView {
    constructor(
        @inject(TYPES.TRANSPORT_FEE_CONTROLLER) public controller: TransportFeeController
    ) {}

    async createAreaTransportView(request: express.Request, response: express.Response) : Promise<void> {
        let fee = await this.controller.createTransportFee(this.jsonToCreatAreaTransportFeeArgs(request.body))
        response.status(201).send(this.feeToJson(fee))
    } 

    async fetchNumberOfAreaTransportView(request: express.Request, response: express.Response) {
        let number = await this.controller.fetchNumberOfFees()
        response.status(200).send(number)
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
            originAddress: json.originAddress,
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

        if (fee.originLatitude) {
            ret.originLatitude = fee.originLatitude.toString()
        } else {
            delete ret.originLatitude
        }

        if (fee.originLongitude) {
            ret.originLongitude = fee.originLongitude.toString()
        } else {
            delete ret.originLongitude
        }

        return ret
    }
}