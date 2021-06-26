import { IBinaryRepository } from "./IBinaryRepository";
import fs from 'fs';
import { injectable } from "inversify";

@injectable()
export class BinaryRepositoryFileSystem implements IBinaryRepository {
    async save(namespace: string, id: string, data: Buffer) : Promise<boolean> {
        let path = this.getPath(namespace, id);
        let result = await new Promise<boolean>((resolve, reject) => {
            fs.writeFile(path, data, (error) => {
                if (error != null) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
        return result;
    }

    getPath(namespace: string, id: string) : string {
        let path = require.resolve('module');
        return `${path}/../../public/products/images/${id}`;
    }
}