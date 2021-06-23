import { inject, injectable } from "inversify";
import { NotFound } from "../exception/NotFound";
import { Image } from "../model/Image";
import { IBinaryRepository } from "../repository/IBinaryRepository";
import { IImageRepository } from "../repository/IImageRepository";
import { TYPES } from "../types";

export interface ImageWithPath extends Image {
    path: string,
}

@injectable()
export class ProductImageController {
    constructor(
        @inject(TYPES.IMAGE_REPOSITORY) public imageRepository: IImageRepository,
        @inject(TYPES.BINARY_REPOSITORY) public binaryRepository: IBinaryRepository,
    ) {

    }

    async createImage(data: Buffer) : Promise<Image> {
        let image = await this.imageRepository.createImage();
        try {
            await this.binaryRepository.save("product_images", image.id, data);
            return image;
        } catch (exception) {
            this.imageRepository.deleteImage(image.id);
            throw exception
        }
    }

    async fetchImageWithPath(imageId: string) : Promise<ImageWithPath> {
        let image = await this.imageRepository.fetchImageById(imageId);
        let path = await this.binaryRepository.getPath("product_images", image.id)
        return {
            ...image,
            path: path,
        };
    }
}