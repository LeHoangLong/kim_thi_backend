import { PoolClient } from 'pg';
import 'reflect-metadata';
import myContainer from '../inversify.config';
import { PostgresConnectionFactory } from '../services/PostgresConnectionFactory';
import { TYPES } from '../types';
import chai from 'chai'
import { IProductCategoryRepository } from '../repository/IProductCategoryRepository';

describe('ProductCategory repository test', async function() {
    beforeEach(async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        await factory.getConnection(1, async function(connection: PoolClient) {
            await connection.query('DELETE FROM "product_category"')
        })
    })
    it('Should create category', async function() {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        let productCategoryRepository = myContainer.get<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY);
        await productCategoryRepository.createProductCategory('test')
        await factory.getConnection(1, async (connection: PoolClient) => {
            let response = await connection.query('SELECT * FROM "product_category"')
            chai.expect(response.rows.length).to.equal(1)
            chai.expect(response.rows[0].category).to.equal('test')
            chai.expect(response.rows[0]).to.have.property('created_time')
        })
    })

    it('Should fetch category', async () => {
        let productCategoryRepository = myContainer.get<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY);
        for (let i = 0; i < 10; i++) {
            await productCategoryRepository.createProductCategory(`test_${i}`)
        }
        let response = await productCategoryRepository.fetchAllCategories(2, 1)
        chai.expect(response.length).to.equal(2)
        chai.expect(response[0]).to.eql({
            category: 'test_8'
        })
        chai.expect(response[1]).to.eql({
            category: 'test_7'
        })
    })

    it('Should delete category', async () => {
        let factory = myContainer.get<PostgresConnectionFactory>(TYPES.CONNECTION_FACTORY)
        let productCategoryRepository = myContainer.get<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY);
        for (let i = 0; i < 10; i++) {
            await productCategoryRepository.createProductCategory(`test_${i}`)
        }
        await productCategoryRepository.deleteProductCategory('test_1')
        await factory.getConnection(1, async (connection: PoolClient) => {
            let response = await connection.query(`SELECT * FROM "product_category" WHERE category = $1`, ['test_1'])
            chai.expect(response.rows.length).to.eql(0)
            response = await connection.query(`SELECT COUNT(*) FROM "product_category"`)
            chai.expect(parseInt(response.rows[0].count)).to.eql(9)
        })
    })

})