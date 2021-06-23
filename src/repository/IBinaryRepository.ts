export interface IBinaryRepository {
    save(namespace: string, id: string, data: Buffer) : Promise<boolean>;
    getPath(namespace: string, id: string) : string;
}