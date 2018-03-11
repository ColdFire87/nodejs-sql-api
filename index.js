const path = require("path");
const express = require('express');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || "development";
const conf = require(path.resolve(__dirname, "conf", env));

const sequelize = new Sequelize(
    conf.db.database,
    conf.db.username,
    conf.db.password,
    conf.db.sequelize
);

module.exports = async () => {
    const app = express();
    await sequelize.sync();

    app.get('/', (req, res) => res.send('Hello World!'));

    return app;
};
