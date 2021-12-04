import myContainer from "../inversify.config"
import { TYPES } from "../types"
import { IBinaryRepository } from "../repository/IBinaryRepository"
import { BinaryRepositoryGCloudStorage } from "../repository/BinaryRepositoryGCloudStorage"
import fs from 'fs'
import chai from 'chai'
import { v4 } from "uuid"
import axios, { Axios } from "axios"


if (process.env.FULL_TEST) {
    describe('Google cloud binary repository test', async function() {
        this.beforeEach(() => {
            myContainer.rebind<string>(TYPES.GOOGLE_CLOUD_STORAGE_BUCKET_NAME).toConstantValue('kim-thi-test')
            myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).to(BinaryRepositoryGCloudStorage)
        })

        it('upload file', async () => {
            let repository = myContainer.get<BinaryRepositoryGCloudStorage>(TYPES.BINARY_REPOSITORY)
            let data = fs.readFileSync('src/tests/data/pho.jpeg')
            let id = v4()
            let ret = await repository.save('test', id, data)
            chai.expect(ret).to.eql(true)

            // check that data is created
            let path = await repository.getPath('test', id)
            let response = await axios.get(path)
            chai.expect(response.status).to.eql(200)
        })
    })
}
