import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express from 'express';
import { ProductController } from '../controller/ProductController';
const config = require('../config').config;
import { EProductUnitToString } from '../model/ProductPrice';
import { EndUserGeocoderController } from '../controller/EndUserGeocoderController';

@injectable()
export class EndUserGeocodingView {
    constructor(
        @inject(TYPES.END_USER_GEOCODER_CONTROLLER) public geocoderController: EndUserGeocoderController,
    ) {}

    async geocode(request: express.Request, response: express.Response) {
        if (typeof(request.body.address) !== 'string' || request.body.address.length === 0) {
            return response.status(400).send()
        } else {
            try {
                let address = await this.geocoderController.geocode(request.body.address)
                return response.status(200).send({
                    latitude: address.latitude.toString(),
                    longitude: address.longitude.toString(),
                    city: address.city,
                })
            } catch (exception) {
                console.log('end user geocoding exception')
                console.log(exception)
                response.status(404).send()
            }
        }
    }
}