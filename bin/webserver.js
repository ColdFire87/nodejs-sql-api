'use strict';

const api = require("./../");
const PORT = parseInt(process.env.PORT, 10) || 3000;

console.log(`API listening at port ${PORT}`);
api().then(app => app.listen(PORT));
