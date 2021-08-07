import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express, { CookieOptions } from 'express';
import { ProductImageController } from '../controller/ImageController';
const config = require('../config').config;
import fileUpload from  "express-fileupload"
import { NotFound } from '../exception/NotFound';

@injectable()
export class ImageView {
    constructor(
        @inject(TYPES.PRODUCT_IMAGE_CONTROLLER) private imageController : ProductImageController,
    ) {
    }

    async fetchImageById(request: express.Request, response: express.Response) {
        try {
            let image = await this.imageController.fetchImageById(request.params.id)
            return response.status(200).send(image)
        } catch (exception) {
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                return response.status(500).send(exception)
            }
        }
    }
    
    async fetchImages(request: express.Request, response: express.Response) {
        let limit = request.body.limit;
        let offset = request.body.offset;
        if (limit === undefined) {
            limit = config.pagination.defaultSize;
        }
        if (offset === undefined) {
            offset = 0;
        }
        
        let imagesWithPath = await this.imageController.fetchImagesWithPath(offset, limit)
        return response.status(200).send(imagesWithPath)
    }

    async createImage(request: express.Request, response: express.Response) {
        if (request.files !== undefined) {
            let data = (request.files['image'] as fileUpload.UploadedFile)?.data
            if (data === undefined) {
                return response.status(400).send()
            } else {
                let image = await this.imageController.createImage(data)
                return response.status(201).send(image)
            }
        } else {
            return response.status(400).send()
        }
    }

    async fetchNumberOfImages(request: express.Request, response: express.Response) {
        let numberOfImages = await this.imageController.fetcNumberOfImages()
        return response.status(200).send(numberOfImages)
    }
}