class Plugin {
  readonly pluginName = 'serverless-disable-request-validators';
  readonly serverless: Serverless.Instance;
  readonly options: Serverless.Options;
  readonly commands: { [key: string]: any };
  readonly hooks: { [key: string]: Function };

  constructor(serverless: Serverless.Instance, options: Serverless.Options) {
    this.serverless = serverless;
    this.hooks = {
      'before:package:finalize': () => this.disableRequestValidators(),
    };
  }

  log(message: string) {
    this.serverless.cli.log(`[${this.pluginName}] ${message}`);
  }

  validate() {
    if (!this.serverless.service.provider.compiledCloudFormationTemplate) {
      throw new Error('This plugin needs access to the compiled CloudFormation template');
    }
  }

  disableRequestValidators() {
    this.validate();
    const service = this.serverless.service;
    // console.debug('Custom plugin config: ', service[this.pluginName]['my-plugin-config']);
    const compiledTemplate = service.provider.compiledCloudFormationTemplate;
    const resources = compiledTemplate.Resources;
    const validators = Object.values(resources).filter((value) => {
      return value.Type === 'AWS::ApiGateway::RequestValidator';
    });
    this.log(`Found ${validators.length} request validator(s)`);
    // console.debug('Validators(before): ', validators);
    validators.forEach((v) => this.disableValidator(v));
    // console.debug('Validators(after): ', validators);
  }

  disableValidator(validator: Serverless.CfnResource) {
    const properties = validator.Properties
    properties['ValidateRequestBody'] = false;
    properties['ValidateRequestParameters'] = false;
    // An example of generated validator name is "service-name | Validate request body and querystring parameters"
    const validatorName = properties['Name'].split(' | ')[0];
    this.log(`Disabled request validator named '${validatorName}'`);
  }
}

module.exports = Plugin;
