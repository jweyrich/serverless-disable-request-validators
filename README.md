# serverless-disable-request-validators
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![npm version](https://badge.fury.io/js/serverless-disable-request-validators.svg)](https://badge.fury.io/js/serverless-disable-request-validators) [![Build Status](https://travis-ci.org/jweyrich/serverless-disable-request-validators.svg?branch=master)](https://travis-ci.org/prisma/serverless-plugin-typescript)

Serverless v2 plugin to disable API Gateway request validators.

## What it does

It gives you the [ability to disable the API Gateway Request Validator on v2](https://github.com/serverless/serverless/issues/10229) until the Serverless Framework team introduces an opt-out flag or another mechanism to avoid the automatic creation of Request Validators in API Gateway when your Lambda functions have an schema associated with them.

There are 3 legitimate use cases for these schemas:

1. Apply basic request validation at the API Gateway level (before it reaches the Lambda);
2. Export the API definition in another format - https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-export-api.html
3. Generate a client SDK for some languages - https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-generate-sdk-console.html

If you want cases 2 and 3 but not case 1, this plugin can help you!

## Install

```sh
yarn add --dev serverless-disable-request-validators
# or
npm install -D serverless-disable-request-validators
```

Add the following plugin to your `serverless.yml`:

```yaml
plugins:
  - serverless-disable-request-validators
```

## Configure

There's nothing to configure! ;-)
