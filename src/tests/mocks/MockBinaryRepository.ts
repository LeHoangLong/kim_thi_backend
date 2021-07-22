import { IBinaryRepository } from "../../repository/IBinaryRepository"

export class MockBinaryRepository implements IBinaryRepository {
    constructor(
        public savedBinary : Map<string, Buffer> = new Map()
    ) {}
    async save(namespace: string, id: string, data: Buffer) : Promise<boolean> {
        let path = this.getPath(namespace, id)
        this.savedBinary.set(path, data)
        return true
    }

    getPath(namespace: string, id: string) : string {
        return namespace + "_" + id
    }
}
