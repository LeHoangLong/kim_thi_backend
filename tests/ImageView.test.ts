import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../src/types';
import { myContainer } from "../src/inversify.config";
import { IImageRepository } from '../src/repository/IImageRepository';
import { IBinaryRepository } from '../src/repository/IBinaryRepository';
import { MockImageRepository } from './mocks/MockImageRepository';
import { MockBinaryRepository } from './mocks/MockBinaryRepository';
import { Request, response, Response } from 'express';
import { ImageView } from '../src/view/ImageView';
import { MockResponse } from './mocks/MockResponse';
import chai from 'chai'

describe('Product view test', async function() {
    let context : any = {}
    this.beforeEach(function() {
        let mockResponse = new MockResponse();
        var now = new Date();
        var clock = sinon.useFakeTimers(now);
        const mockImageRepository = new MockImageRepository()
        const mockBinaryRepository = new MockBinaryRepository()
        let imageRepository = myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        let binaryRepository = myContainer.rebind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository)
        let imageView = myContainer.get<ImageView>(TYPES.IMAGE_VIEW)
        context.imageView = imageView
        context.imageRepository = imageRepository
        context.binaryRepository = mockBinaryRepository
        context.response = mockResponse
        context.statusSpy = sinon.spy(context.response, "status")
        context.sendSpy = sinon.spy(context.response, "send")
        context.now = now
        context.response = mockResponse
    })

    it('fetch images', async function() {
        let request = {
            body: {
                offset: 5,
                limit: 2,
            }
        }

        await context.imageView.fetchImages(request as Request, context.response as Response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200)
        sinon.assert.calledOnceWithExactly(context.sendSpy, [
            {
              id: '5',
              isDeleted: false,
              createdTimeStamp: context.now,
              path: 'product_images_5'
            },
            {
              id: '6',
              isDeleted: false,
              createdTimeStamp: context.now,
              path: 'product_images_6'
            }
        ])
    })

    it('create image', async function() {
        let request = {
            files: {
                image: {
                    data: Buffer.from([0, 1, 2]),
                }
            }
        }
        const mockImageRepository = new MockImageRepository(true)
        let imageRepository = myContainer.rebind<IImageRepository>(TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository)
        await (context.imageView as ImageView).createImage(request as any as Request, context.response as Response)
        sinon.assert.calledOnceWithExactly(context.statusSpy, 201)
        sinon.assert.calledOnceWithExactly(context.sendSpy, {
            id: '0',
            isDeleted: false,
            createdTimeStamp: context.now,
            path: 'product_images_0'
        })
        chai.expect((context.binaryRepository as MockBinaryRepository).savedBinary.size).to.equals(1)
        chai.expect((context.binaryRepository as MockBinaryRepository).savedBinary.get('product_images_0')!.length).to.equals(3)
        chai.expect((context.binaryRepository as MockBinaryRepository).savedBinary.get('product_images_0')![0]).to.equals(0)
        chai.expect((context.binaryRepository as MockBinaryRepository).savedBinary.get('product_images_0')![1]).to.equals(1)
        chai.expect((context.binaryRepository as MockBinaryRepository).savedBinary.get('product_images_0')![2]).to.equals(2)

        let request_2 = {

        }

        let response_2 = new MockResponse()
        let response2_statusSpy = sinon.spy(response_2, "status")
        let response2_sendSpy = sinon.spy(response_2, "send")
        await (context.imageView as ImageView).fetchNumberOfImages(request_2 as Request, response_2 as Response)
        sinon.assert.calledOnceWithExactly(response2_statusSpy, 200)
        sinon.assert.calledOnceWithExactly(response2_sendSpy, 1)
    })
})