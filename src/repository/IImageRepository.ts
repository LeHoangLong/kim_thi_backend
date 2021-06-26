import { Image } from "../model/Image";

export interface IImageRepository {
    fetchImageById(imageId: string) : Promise<Image>
    fetchImages(offset: number, limit: number) : Promise<Image[]>
    fetchNumberOfImages() : Promise<number>;
    createImage(imageId?: string) : Promise<Image>
    deleteImage(imageId: string) : Promise<number>
}