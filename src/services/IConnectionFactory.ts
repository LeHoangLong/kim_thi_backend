export interface IConnectionFactory {
    startTransaction(caller: any, objects: any[], callback: () => Promise<void>) : Promise<void>;
    getNumberOfConnections() : Promise<number>;
}