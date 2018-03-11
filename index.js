'use strict';

const path = require('path');
// HTTP response status codes
const HTTPStatus = require('http-status');
const express = require('express');
const bunyan = require('bunyan');
// Parse POST json body
const bodyParser = require('body-parser');
// Promise-based Node.js ORM for Postgres, MySQL, SQLite and Microsoft SQL Server
const Sequelize = require('sequelize');
// Object schema description language and validator for JavaScript objects
const Joi = require('joi');

const env = process.env.NODE_ENV || 'development';
const conf = require(path.resolve(__dirname, 'conf', env));

// Logger
const logLevel = process.env.LOG_LEVEL || 'info';
const logger = bunyan.createLogger({ name: conf.appName, level: logLevel });

// DB Configuration
const sequelize =
    env === 'production'
        ? new Sequelize(conf.db.uri)
        : new Sequelize(
            conf.db.database,
            conf.db.username,
            conf.db.password,
            conf.db.sequelize);

// Schemas and models
const Product = sequelize.define('product', {
    name: Sequelize.STRING,
    price: Sequelize.INTEGER,
    weight: Sequelize.INTEGER
});

const productsSchema = Joi.object().keys({
    name: Joi.required(),
    price: Joi.required(),
    weight: Joi.required()
});

module.exports = async () => {
    const app = express();
    await sequelize.sync();

    app.use(bodyParser.json());

    // Log each request entering our API
    app.use((req, res, next) => {
        logger.debug({
            method: req.method,
            host: req.headers.host,
            url: req.url,
            useragent: req.headers["user-agent"]
        });
        next();
    });

    // Return json by default
    app.use((req, res, next) => {
        res.set("Content-Type", "application/json");
        next();
    });

    app.get('/', (req, res) => res.send('Hello World!'));

    app.get('/products', async (req, res) => {
       let productList = await Product.findAll();
       const {sort} = req.query;

       productList = productList.sort((a, b) => {
           if(a[sort] < b[sort]) return -1;
           if(a[sort] > b[sort]) return 1;
           return 0;
       });

       res.status(HTTPStatus.OK).send(productList);
    });

    app.get('/products/:id', async (req, res) => {
       const {id} = req.params;
       const product = await Product.findById(id);
       if(!product) return res.status(HTTPStatus.NOT_FOUND).send();
       return res.status(HTTPStatus.OK).send(product.toJSON());
    });

    app.post('/products', async (req, res) => {
        // HTTP request payload validation
        // abortEarly is false in order to retrieve all the errors at once
        const {error} = Joi.validate(req.body, productsSchema, { abortEarly: false });

        if(error) {
            return res.status(HTTPStatus.BAD_REQUEST)
                      .send({
                          data: error.details.map(({message, context}) => (
                              {message, context}
                          ))
                      });
        }

        try {
            const product = await Product.create(req.body);
            res.set('Location', `/products/${product.id}`);
            res.status(HTTPStatus.CREATED).send(product);
        } catch (error) {
            res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(error);
        }
    });

    app.delete('/products', async (req, res) => {
       const productList = await Product.findAll();
       productList.forEach(product => product.destroy());
       res.status(HTTPStatus.NO_CONTENT).send();
    });

    return app;
};
