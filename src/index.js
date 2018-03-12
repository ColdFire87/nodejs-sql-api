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

// Swagger documentation
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
// https://swagger.io/specification/
const swaggerDefinition = {
  schemes: ['http'], // "http", "https", "ws", "wss"
  consumes: ['application/json'],
  produces: ['application/json'],
  info: { // API information (required)
    title: 'My Awesome API', // Title (required)
    version: '1.0.0', // Version (required)
    description: 'Products API\n\n```javascript\nconst awesome = true\n```', // Description (optional)
    termsOfService: '/terms',
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    },
    contact: {
      name: 'Stefan Tertan',
      url: 'http://stefantertan.co.uk',
      email: 'a@a.com'
    }
  },
  // host: `localhost:${parseInt(process.env.PORT, 10) || 3000}`, // Host (optional)
  basePath: '/api/v1', // Base path (optional)
  externalDocs: {
    description: "Find more info here",
    url: "http://stefantertan.co.uk"
  },
  securityDefinitions: {
    basic: {
      type: "basic"
    },
    api_key: {
      type: "apiKey",
      name: "api_key",
      in: "header"    // or `query`
    },
    products_auth: {
      type: "oauth2",
      authorizationUrl: "http://example.org/oauth/dialog", // for "implicit" or "accessCode"
      flow: "implicit",   // or "password", "application", "accessCode"
      scopes: {
        "write:products": "modify products in your account",
        "read:products": "read your products"
      }
    }
  },
  definitions: {
    Product: {
      type: "object",
      properties: {
        name: {type: "string", example: "t-shirt"},
        price: {type: "number", format: "float", example: 25},
        weight: {type: "number", format: "float", example: 0.2}
      }
    }
  },
  responses: {
    ProductResponse: {
      type: "object",
      allOf: [
        // Sandwitch Product in between `id` and `timestamps`
        {properties: {id: {type: "integer", format: "int64", example: 1}}},
        {"$ref": "#/definitions/Product"},
        {
          properties: {
            createdAt: {type: "date", format: "date-time", example: "2018-03-12T00:08:37.386Z"},
            updatedAt: {type: "date", format: "date-time", example: "2018-03-12T00:08:37.386Z"}
          }
        }
      ]
    },
    ProductArrayResponse: {
      type: "array",
      items: {
        "$ref": "#/responses/ProductResponse"
      }
    }
  }
};

// Options for the swagger docs
const options = {
  // Import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // Path to the API docs
  apis: ['src/*.js'],
};
const swaggerSpec = swaggerJSDoc(options);

// Choose env & configuration
const env = process.env.NODE_ENV || 'development';
const conf = require(path.resolve(__dirname, '../conf', env));

// Logger
const logLevel = process.env.LOG_LEVEL || 'debug';
const logger = bunyan.createLogger({name: conf.appName, level: logLevel});

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

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: false
  }));

  // Swagger JSON spec
  app.get('/api-docs.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

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
  app.use(/\/api\/v1\/+/, (req, res, next) => {
    res.set("Content-Type", "application/json");
    next();
  });

  app.get('/api/v1/', (req, res) => res.send('Hello World!'));

  /**
   * @swagger
   * /products:
   *   get:
   *     tags:
   *       - Products
   *     description: Returns all product
   *     responses:
   *       200:
   *         description: An array of products
   *         schema:
   *           $ref: "#/responses/ProductArrayResponse"
   */
  app.get('/api/v1/products', async (req, res) => {
    let productList = await Product.findAll();
    const {sort} = req.query;

    productList = productList.sort((a, b) => {
      if (a[sort] < b[sort]) return -1;
      if (a[sort] > b[sort]) return 1;
      return 0;
    });

    res.status(HTTPStatus.OK).send(productList);
  });

  /**
   * @swagger
   * /products/:id:
   *   get:
   *     tags:
   *       - Products
   *     description: Get a single product
   *     responses:
   *       200:
   *         description: A single product
   *         schema:
   *           $ref: "#/responses/ProductResponse"
   */
  app.get('/api/v1/products/:id', async (req, res) => {
    const {id} = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(HTTPStatus.NOT_FOUND).send();
    return res.status(HTTPStatus.OK).send(product.toJSON());
  });

  /**
   * @swagger
   * /products:
   *   post:
   *     tags:
   *       - Products
   *     summary: Create a product
   *     description: Create a product dude!
   *     parameters:
   *       - name: body
   *         description: Product to add.
   *         in: body
   *         required: true
   *         schema:
   *           $ref: "#/definitions/Product"
   *     responses:
   *       400:
   *         description: Invalid input
   *       201:
   *         description: Nothing
   *     security:
   *         - products_auth:
   *            - "write:pets"
   *            - "read:pets"
   */
  app.post('/api/v1/products', async (req, res) => {
    // HTTP request payload validation
    // abortEarly is false -> retrieve all the errors at once
    const {error} = Joi.validate(req.body, productsSchema, {abortEarly: true});

    if (error) {
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

  /**
   * @swagger
   * /products:
   *   delete:
   *     tags:
   *       - Products
   *     description: Delete all products
   *     responses:
   *       204:
   *         description: Nothing
   */
  app.delete('/api/v1/products', async (req, res) => {
    const productList = await Product.findAll();
    productList.forEach(product => product.destroy());
    res.status(HTTPStatus.NO_CONTENT).send();
  });

  return app;
};
