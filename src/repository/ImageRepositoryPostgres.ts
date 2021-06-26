import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { NotFound } from "../exception/NotFound";
import { Image } from "../model/Image";
import { TYPES } from "../types";
import { IImageRepository } from "./IImageRepository";
import { uuid } from 'uuidv4';

@injectable()
export class ImageRepositoryPostgres implements IImageRepository {
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool,
    ) {}

    async fetchImageById(id: string) : Promise<Image> {
        let results = await this.client.query(`
            SELECT id, is_deleted, created_timestamp
            FROM "image"
            WHERE id = $1 AND is_deleted = FALSE
        `, [id]);
        if (results.rowCount == 0) {
            throw new NotFound("image", "id", id);
        } else {
            let result = results.rows[0];
            return {
                id: result['id'],
                isDeleted: result['is_deleted'],
                createdTimeStamp: result['created_timestamp'],
            }
        }
    }

    async createImage(imageId?: string) : Promise<Image> {
        if (imageId == undefined) {
            imageId = uuid()
        }
        let results = await this.client.query(`
            INSERT INTO "image" (
                id
            ) VALUES (
                $1
            ) returning created_timestamp
        `, [imageId]);
        return {
            id: imageId,
            isDeleted: false,
            createdTimeStamp: results.rows[0]['created_timestamp'],
        }
    }

    async deleteImage(imageId: string) : Promise<number> {
        let results = await this.client.query(`
            DELETE FROM "image" WHERE id = $1 RETURNING *
        `, [imageId]);

        return results.rowCount;
    }

    async fetchImages(offset: number, limit: number) : Promise<Image[]> {
        let results = await this.client.query(`
            SELECT id, is_deleted, created_timestamp
            FROM "image"
            WHERE is_deleted = FALSE
            ORDER BY created_timestamp DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset])
        let images : Image[] = []
        for (let i = 0; i < results.rowCount; i++) {
            let result = results.rows[i]
            images.push({
                id: result['id'],
                isDeleted: result['is_deleted'],
                createdTimeStamp: result['created_timestamp'],
            })
        }
        return images
    }

    async fetchNumberOfImages() : Promise<number> {
        let results = await this.client.query(`
            SELECT COUNT(*)
            FROM "image"
            WHERE is_deleted = FALSE
        `)
        return results.rows[0].count
    }

}