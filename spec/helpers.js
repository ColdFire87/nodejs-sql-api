'use strict';

const got = require('got');
const faker = require('faker');
const application = require('./../');

// API details
const PROTO = 'http';
const HOST  = process.env.HOST || 'localhost';
const PORT  = process.env.PORT || 1337;

/**
 * Helper method to make sure the app is running before running the tests.
 */
const startAPI = () => {
    let server;
    before(async () => {
        const app = await application();
        server = app.listen(PORT);
    });
    after(() => server.close());
};

/**
 * Helper method to issue API requests
 * @param method {string} HTTP verb
 * @param resource {string} URL path (eg '/products')
 * @param options {object} Request options (post body, etc)
 * @returns {Promise<*>}
 */
const queryAPI = async (method, resource, options) => {
    const customOptions = Object.assign({}, options, { json: true, method });

    let response;
    try {
        response = await got(`${PROTO}://${HOST}:${PORT}${resource}`, customOptions);
    } catch (error) {
        response = error.response;
    }
    return response;
};

/**
 * Product helpers
 * @type {{add(Object): Promise<*>, deleteAll(): void}}
 */
const products = {
    /**
     * Issue a request to the API to add a product
     * @param data {object|} Specify product data. If not provided, use faker to get fixture.
     * @returns {Promise<*>}
     */
    async add(data) {
        const defaultProduct = {
            name  : faker.commerce.product(),
            price : faker.finance.amount(),
            weight: faker.random.number()
        };
        const body = Object.assign(defaultProduct, data);
        return await queryAPI('POST', '/products', { body });
    },
    /**
     * Delete all products from db
     */
    deleteAll() { beforeEach(async () => await queryAPI('DELETE', '/products', {})); }
};

module.exports = { startAPI, queryAPI, products };