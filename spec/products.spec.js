'use strict';

const HTTPStatus = require('http-status');
const {expect} = require('chai');
const {startAPI, queryAPI, products} = require('./helpers');

describe('Products', () => {
    startAPI();
    products.deleteAll();

    describe('GET /products', () => {
       describe('When there is no product', () => {
           it('should return 200 (ok)', async () => {
               const {statusCode} = await queryAPI('GET', '/products');
               expect(statusCode).to.equal(HTTPStatus.OK);
           });

           it('should return an empty list', async () => {
               const {body} = await queryAPI('GET', '/products');
               expect(body).to.deep.equal([]);
           });
       });

        describe('When there is a single product', () => {
            beforeEach(async () => await products.add());

            it('should return 200 (ok)', async () => {
                const {statusCode} = await queryAPI('GET', '/products');
                expect(statusCode).to.equal(HTTPStatus.OK);
            });

            it('should return a list with one item', async () => {
                const {body} = await queryAPI('GET', '/products');
                expect(body.length).to.deep.equal(1);
            });
        });

        describe('When there are several products', () => {
            beforeEach(async () => {
                await products.add({ name: 't-shirt', weight: 0.1, price: 10 });
                await products.add({ name: 'mug'    , weight: 0.3, price: 8  });
                await products.add({ name: 'bottle' , weight: 0.2, price: 15 });
            });

            describe('When sorted by name', () => {
                it('should return the appropriate order', async () => {
                    const {body} = await queryAPI('GET', '/products?sort=name');
                    const nameList = body.map(product => product.name);
                    expect(nameList).to.deep.equal(['bottle', 'mug', 't-shirt']);
                });
            });

            describe('When sorted by weight', () => {
                it('should return the appropriate order', async () => {
                    const {body} = await queryAPI('GET', '/products?sort=weight');
                    const weightList = body.map(product => product.weight);
                    expect(weightList).to.deep.equal([0.1, 0.2, 0.3]);
                });
            });

            describe('When sorted by price', () => {
                it('should return the appropriate order', async () => {
                    const {body} = await queryAPI('GET', '/products?sort=price');
                    const priceList = body.map(product => product.price);
                    expect(priceList).to.deep.equal([8, 10, 15]);
                });
            });
        });
    });

    describe('GET /products/:id', () => {
        describe('When product does not exist', () => {
            it('should return 404 (not found)', async () => {
                const {statusCode} = await queryAPI('GET', '/products/unknown');
                expect(statusCode).to.equal(HTTPStatus.NOT_FOUND);
            });
        });

        describe('When the product exists', () => {
            beforeEach(async () => {
                const {headers} = await products.add();
                this.location = headers.location;
            });

            it('should return 200 (ok)', () => async () => {
                const { statusCode } = await queryAPI('GET', this.location);
                expect(statusCode).to.equal(HTTPStatus.OK);
            });

            it('should return the product', async () => {
                const { body } = await queryAPI('GET', this.location);
                expect(body.name).to.exist;
                expect(body.weight).to.exist;
                expect(body.price).to.exist;
            });
        });
    });

    describe('POST /products', () => {
        describe('When product data is missing or invalid', () => {
            it('should return 400 (bad request)', async () => {
                const {statusCode} = await queryAPI('POST', '/products', { body: {} });
                expect(statusCode).to.equal(HTTPStatus.BAD_REQUEST);
            });

            it('should return the keys in error', async () => {
                const {body, statusCode} = await queryAPI('POST', '/products', { body: {} });
                const contextList = body.data.map(item => item.context.key);
                expect(statusCode).to.equal(HTTPStatus.BAD_REQUEST);
                expect(contextList).to.contain('name', 'price', 'weight');
            });
        });

        describe('When product data is valid', () => {
            it('should return 201 (created)', async () => {
                const body = { name: 't-shirt', price: 20, weight: 0.1 };
                const {statusCode} = await queryAPI('POST', '/products', { body });
                expect(statusCode).to.equal(HTTPStatus.CREATED);
            });

            it('should return the product location', async () => {
                const body = { name: 't-shirt', price: 20, weight: 0.1 };
                const {headers} = await queryAPI('POST', '/products', { body });
                expect(headers.location).to.match(/products\/.+/);
            });

            it('should add a new product', async () => {
                const data = { name: 't-shirt', price: 20, weight: 0.1 };
                await queryAPI('POST', '/products', { body: data });
                const {body} = await queryAPI('GET', '/products');
                expect(body.length).to.equal(1);
            });

            it('should contain the appropriate data', async () => {
                const data = { name: 't-shirt', price: 20, weight: 0.1 };
                const {headers} = await queryAPI('POST', '/products', { body: data });
                const {body} = await queryAPI('GET', headers.location);
                expect(body.name).to.equal(data.name);
                expect(body.price).to.equal(data.price);
                expect(body.weight).to.equal(data.weight);
            });
        });
    });

    describe('DELETE /products', () => {
        describe('When there is no product', () => {
            it('should return 204 (no content)', async () => {
                const { statusCode } = await queryAPI('DELETE', '/products');
                expect(statusCode).to.equal(HTTPStatus.NO_CONTENT);
            });
        });

        describe('When there are products', () => {
            beforeEach(async () => {
                await products.add();
                await products.add();
            });

            it('should return 204 (no content)', async () => {
                const { statusCode } = await queryAPI('DELETE', '/products');
                expect(statusCode).to.equal(HTTPStatus.NO_CONTENT);
            });

            it('should remove all the products', async () => {
                const firstRequest = await queryAPI('GET', '/products');
                expect(firstRequest.body.length).to.equal(2);
                await queryAPI('DELETE', '/products');
                const secondRequest = await queryAPI('GET', '/products');
                expect(secondRequest.body.length).to.equal(0);
            });
        });
    });
});
