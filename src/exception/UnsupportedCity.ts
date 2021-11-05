export class UnsupportedCity implements Error {
    readonly name: string = 'UnsupportedCity'
    constructor(
        public readonly message: string 
    ) {
    }
}