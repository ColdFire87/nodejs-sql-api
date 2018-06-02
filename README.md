# NodeJS Example API

> Based on [https://github.com/simonrenoult/nodejs-application-architecture](https://github.com/simonrenoult/nodejs-application-architecture)

<a href="https://travis-ci.org/ColdFire87/nodejs-sql-api">
  <img alt="Travis" src="https://img.shields.io/travis/ColdFire87/nodejs-sql-api.svg?style=flat-square">
</a>
<a href="https://codecov.io/gh/ColdFire87/nodejs-sql-api">
  <img alt="Codecov" src="https://img.shields.io/codecov/c/github/ColdFire87/nodejs-sql-api.svg?style=flat-square">
</a>
<a href="https://app.fossa.io/projects/git%2Bgithub.com%2FColdFire87%2Fnodejs-sql-api?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2FColdFire87%2Fnodejs-sql-api.svg?type=shield"/></a>

## Description

- backed by SQL store
  - SQLite3 in dev
  - Postgres in prod (`not tested`) - use env var `DATABASE_URL`
  
- documented using Swagger:
  - Swagger UI available at `/api-docs`
  - Swagger JSON API spec available at `/api-docs.json`

## Instructions

### Start

Server will listen on port `3000` by default (can be overridden with environment variable `PORT`)
```sh
$ yarn start
```


### Test

```sh
$ yarn test
```


### Lint

```sh
$ yarn run lint
```

## License

[MIT License](https://opensource.org/licenses/MIT)

Copyright (c) 2018 Stefan Tertan.


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FColdFire87%2Fnodejs-sql-api.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FColdFire87%2Fnodejs-sql-api?ref=badge_large)