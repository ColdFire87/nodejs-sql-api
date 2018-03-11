'use strict';

const pkg = require("./../package");

module.exports = {
    appName: pkg.name,
    db: {
        uri: process.env.DATABASE_URL,
        sequelize: {
            dialect: "postgres",
            operatorsAliases: false,
            logging: false
        }
    }
};