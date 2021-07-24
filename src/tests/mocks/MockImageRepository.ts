import { NotFound } from "../../exception/NotFound"
import { Image } from "../../model/Image"
import { IImageRepository } from "../../repository/IImageRepository"

export class MockImageRepository implements IImageRepository {
    createdImages: Map<string, Image>

    constructor(
        public shouldCreateIfNotFound: boolean = true,
    ) {
        this.createdImages = new Map<string, Image>()
    }

    async fetchImageById(imageId: string) : Promise<Image> {
        if (this.createdImages.has(imageId)) {
            return this.createdImages.get(imageId)!
        } else if (this.shouldCreateIfNotFound) {
            return {
                id: imageId,
                isDeleted: false,
                createdTimeStamp: new Date(),
            }
        } else {
            throw new NotFound("image", "id", imageId)
        }
    }

    async createImage(imageId?: string) : Promise<Image> {
        if (imageId === undefined) {
            imageId = this.createdImages.size.toString()
        }
        let newImage : Image = {
            id: imageId,
            createdTimeStamp: new Date(),
            isDeleted: false,
        }
        this.createdImages.set(imageId, newImage)
        return newImage
    }
    
    deleteImage(imageId: string) : Promise<number> {
        throw ""
    }

    async fetchImages(offset: number, limit: number) : Promise<Image[]> {
        let ret: Image[] = []
        if (this.shouldCreateIfNotFound) {
            for (let i = 0; i < limit; i++) {
                ret.push({
                    id: (i + offset).toString(),
                    isDeleted: false,
                    createdTimeStamp: new Date(),
                })
            }
        } else {
            let sortedImaged = Array.from(this.createdImages.values())
            sortedImaged.sort((a, b) => (b.createdTimeStamp.getTime() - a.createdTimeStamp.getTime()))
            return sortedImaged.slice(offset, offset + limit)
        }
        return ret
    }

    async fetchNumberOfImages() : Promise<number> {
        return this.createdImages.size
    }
}