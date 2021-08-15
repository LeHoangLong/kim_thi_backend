import { BatchResult, Entry, Geocoder, Location, Query } from "node-geocoder";

export class MockGeocoder implements Geocoder {
    async geocode(query: string | Query, cb?: (err: any, data: Entry[]) => void): Promise<Entry[]> {
        return [{
            city: 'test-city',
            latitude: 10.000001,
            longitude: 20.000001,
        }]
    }

    batchGeocode(queries: string[] | Query[], cb?: (err: any, data: BatchResult[]) => void): Promise<BatchResult[]> {
        throw "Not implemented";
    }

    reverse(loc: Location, cb?: (err: any, data: Entry[]) => void): Promise<Entry[]> {
        throw "Not implemented";
    }
        
}