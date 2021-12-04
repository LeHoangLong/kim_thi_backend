import { IBinaryRepository } from "./IBinaryRepository";
import fs from 'fs';
import { injectable } from "inversify";

@injectable()
export class BinaryRepositoryFileSystem implements IBinaryRepository {
    async save(namespace: string, id: string, data: Buffer) : Promise<boolean> {
        let path = this.getPath(namespace, id);
        let result = await new Promise<boolean>((resolve, reject) => {
            let splitPath = path.split('/')
            splitPath.pop()
            let joinedPath = splitPath.join("/")
            if (!fs.existsSync(joinedPath)) {
                fs.mkdirSync(joinedPath)
            }
            fs.writeFile(path, data, { flag: 'w' }, (error) => {
                if (error == null) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
        return result;
    }

    getPath(namespace: string, id: string) : string {
        return `public/products/images/${namespace}/${id}`;
    }
}