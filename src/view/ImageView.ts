import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import express, { CookieOptions } from 'express';
import { ProductImageController } from '../controller/ImageController';
import config from '../../config.json';
import fileUpload from  "express-fileupload"

@injectable()
export class ImageView {
    constructor(
        @inject(TYPES.PRODUCT_IMAGE_CONTROLLER) private imageController : ProductImageController,
    ) {
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