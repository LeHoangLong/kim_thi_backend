export class DeletedResource implements Error {
    public name: string = 'DeletedResource'
    constructor(
        public message: string,
    ) {
    }
}