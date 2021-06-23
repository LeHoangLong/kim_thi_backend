import { Image } from "../model/Image";

export interface IImageRepository {
    fetchImageById(imageId: string) : Promise<Image>
    createImage(imageId?: string) : Promise<Image>
    deleteImage(imageId: string) : Promise<number>
}