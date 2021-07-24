export interface IConnectionFactory {
    startTransaction(objects: any[], callback: () => Promise<void>) : Promise<void>;
    getNumberOfConnections() : Promise<number>;
}