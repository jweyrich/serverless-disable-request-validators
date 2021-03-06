# serverless-disable-request-validators

[![serverless](http://public.serverless.com/badges/v2.svg)](http://www.serverless.com) [![npm version](https://badge.fury.io/js/serverless-disable-request-validators.svg)](https://badge.fury.io/js/serverless-disable-request-validators) [![Build Status](https://travis-ci.org/jweyrich/serverless-disable-request-validators.svg?branch=master)](https://travis-ci.org/jweyrich/serverless-disable-request-validators)

Serverless v2 plugin to disable API Gateway request validators.

## What it does

It gives you the [ability to disable or remove the API Gateway Request Validator on Serverless v2](https://github.com/serverless/serverless/issues/10229) until the Serverless Framework team introduces an opt-out flag or another mechanism to avoid the [automatic creation of Request Validators in API Gateway](https://www.serverless.com/framework/docs/providers/aws/events/apigateway/#request-schema-validators) when your Lambda functions have an schema associated with them.

If you have all request validations implemented in your Lambda, you probably don't to use the API Gateway Request Validator.

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

## Enable the plugin

Add the following plugin to your `serverless.yml`:

```yaml
plugins:
  - serverless-disable-request-validators
```

## Configure

You can configure the plugin behavior using the `custom` section in your `serverless.yml` file.

1. Only disable the `body` and `parameters` validations directly in all validator resources (`AWS::ApiGateway::RequestValidator`):

```yaml
custom:
  serverless-disable-request-validators:
    action: disable
```

2. Only disassociate all the validator resources (`AWS::ApiGateway::RequestValidator`) from API resources (`AWS::ApiGateway::Method`), effectively deleting the references to the validator resources:

```yaml
custom:
  serverless-disable-request-validators:
    action: disassociate
```

3. To delete all validator (`AWS::ApiGateway::RequestValidator`) resources:

```yaml
custom:
  serverless-disable-request-validators:
    action: delete
```

If no custom configuration is provided, the default `action` is `disable`.

## Caveats

If during the same deploy you try to disassociate your APIs resources from a validator and also delete the referenced validator resource, it **will fail** with the following error message:

![Error message in a picture](resources/screenshot1.png)

The reason seems to be that your deployed APIs still reference the validator resources and CloudFormation doesn't handle the dependency between them correctly. The **solution** is to deploy twice, as follows:

1. **Deploy 1**: _disassociate_ the validator using `action: disassociate`.
2. **Deploy 2**: _delete_ the validator using `action: delete`.
