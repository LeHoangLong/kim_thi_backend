export class MockResponse {
    send(body: any) {
        return this
    }
    
    status(status: number) {
        return this
    }
}
