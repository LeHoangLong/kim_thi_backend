import { inject, injectable } from "inversify";
import { Pool, PoolClient } from "pg";
import { NotFound } from "../exception/NotFound";
import { Image } from "../model/Image";
import { TYPES } from "../types";
import { IImageRepository } from "./IImageRepository";
import { v4 } from 'uuid';
import { IConnectionFactory } from "../services/IConnectionFactory";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";

@injectable()
export class ImageRepositoryPostgres implements IImageRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private factory: PostgresConnectionFactory,
    ) {}

    async fetchImageById(id: string) : Promise<Image> {
        let image : Image
        await this.factory.getConnection(this, async function(connection: PoolClient) {
            let results = await connection.query(`
                SELECT id, is_deleted, created_timestamp
                FROM "image"
                WHERE id = $1 AND is_deleted = FALSE
            `, [id]);
        
            if (results.rowCount == 0) {
                throw new NotFound("image", "id", id);
            } else {
                let result = results.rows[0];
                image = {
                    id: result['id'],
                    isDeleted: result['is_deleted'],
                    createdTimeStamp: result['created_timestamp'],
                }
            }
        })
        return image!;
    }

    async createImage(imageId?: string) : Promise<Image> {
        if (imageId == undefined) {
            imageId = v4()
        }
        let image : Image
        await this.factory.getConnection(this, async function(connection: PoolClient) {
            let results = await connection.query(`
                INSERT INTO "image" (
                    id
                ) VALUES (
                    $1
                ) returning created_timestamp
            `, [imageId]);
            image = {
                id: imageId!,
                isDeleted: false,
                createdTimeStamp: results.rows[0]['created_timestamp'],
            }
        })
        return image!
    }
                
    async deleteImage(imageId: string) : Promise<number> {
        let deleted = 0
        await this.factory.getConnection(this, async function(connection: PoolClient) {
            let results = await connection.query(`
                DELETE FROM "image" WHERE id = $1 RETURNING *
            `, [imageId]);
            deleted = results.rowCount
        })
        return deleted;
    }

    async fetchImages(offset: number, limit: number) : Promise<Image[]> {
        let images: Image[] = []
        await this.factory.getConnection(this, async function(connection: PoolClient) {
            let results = await connection.query(`
                SELECT id, is_deleted, created_timestamp
                FROM "image"
                WHERE is_deleted = FALSE
                ORDER BY created_timestamp DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset])
            for (let i = 0; i < results.rowCount; i++) {
                let result = results.rows[i]
                images.push({
                    id: result['id'],
                    isDeleted: result['is_deleted'],
                    createdTimeStamp: result['created_timestamp'],
                })
            }
        })
        return images
    }

    async fetchNumberOfImages() : Promise<number> {
        let count = 0
        await this.factory.getConnection(this, async function(connection: PoolClient) {
            let results = await connection.query(`
                SELECT COUNT(*)
                FROM "image"
                WHERE is_deleted = FALSE
            `)
            count = results.rows[0].count
        })
        return count
    }

}