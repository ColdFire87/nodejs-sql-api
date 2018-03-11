'use strict';

const pkg = require("./../package");

module.exports = {
    appName: pkg.name,
    db: {
        username: "nodejs_beyond",
        password: "nodejs_beyond",
        database: "nodejs_beyond_test",
        sequelize: {
            dialect: "sqlite",
            operatorsAliases: false,
            logging: false,
            storage: "./data.db"
        }
    }
};