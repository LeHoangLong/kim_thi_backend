import { IBinaryRepository } from "./IBinaryRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import fs from 'fs';
import { Storage } from "@google-cloud/storage";

@injectable()
export class BinaryRepositoryGCloudStorage implements IBinaryRepository {
    constructor(
        @inject(TYPES.GOOGLE_CLOUD_STORAGE) private storage: Storage,
        @inject(TYPES.GOOGLE_CLOUD_STORAGE_BUCKET_NAME) private bucketName: string,
    ) {
    }

    async save(namespace: string, id: string, data: Buffer) : Promise<boolean> {
        let tempPath = this.getTempPath(namespace, id);
        let result = await new Promise<boolean>((resolve, reject) => {
            let splitPath = tempPath.split('/')
            splitPath.pop()
            let joinedPath = splitPath.join("/")
            if (!fs.existsSync(joinedPath)) {
                fs.mkdirSync(joinedPath)
            }
            fs.writeFile(tempPath, data, { flag: 'w' }, (error) => {
                if (error == null) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });

        if (result) {
            try {
                let response = await this.storage.bucket(this.bucketName).upload(tempPath, {
                    destination: `${namespace}:${id}`,
                });
            } catch (exception) {
                console.log('upload error: ')
                console.log(exception)
                result = false
            }
        }
        return result
    }

    getPath(namespace: string, id: string) : string {
        return `https://storage.googleapis.com/${this.bucketName}/${namespace}:${id}`
    }

    private getTempPath(namespace: string, id: string) : string {
        return `/tmp/${namespace}/${id}`;
    }
}