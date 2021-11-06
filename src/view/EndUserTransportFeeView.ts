import 'reflect-metadata'
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import { EndUserTransportFeeController } from '../controller/EndUserTransportFeeController';
import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { NotFound } from '../exception/NotFound';

@injectable()
export class EndUserTransportFeeView {
    constructor(
        @inject(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER) private feeController: EndUserTransportFeeController,
    ) {}

    async fetchBillBasedTransportFee(request: Request, response: Response) {
        let city = request.query.city
        let latitude = new Decimal(request.query.latitude as string)
        let longitude = new Decimal(request.query.longitude as string)
        if (typeof(city) !== 'string' || city.length == 0 ||
            latitude.isNaN() || longitude.isNaN()
        ) {
            return response.status(400).send()
        }
        try {
            let [transportFee, transportOrigin] = await this.feeController.findBestTransportFee(city, latitude, longitude)
            return response.status(200).send(transportFee.billBasedTransportFee)
        } catch (exception) {
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                return response.status(500).send()
            }
        }
    }

    async fetchAreaTransportFee(request: Request, response: Response) {
        let city = request.query.city
        let latitude = new Decimal(request.query.latitude as string)
        let longitude = new Decimal(request.query.longitude as string)
        if (typeof(city) !== 'string' || city.length == 0 ||
            latitude.isNaN() || longitude.isNaN()
        ) {
            return response.status(400).send()
        }
        try {
            let [transportFee, transportOrigin] = await this.feeController.findBestTransportFee(city, latitude, longitude)
            return response.status(200).send({
                addressId: transportFee.id,
                transportFee: transportFee.basicFee,
            })
        } catch (exception) {
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                return response.status(500).send()
            }
        }
    }
}