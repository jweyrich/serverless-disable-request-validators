interface CfnResourcePair {
  name: string;
  resource: Serverless.CfnResource;
}

enum PluginAction {
  // Disable the `body` and `parameters` validations directly in the validator resources.
  DISABLE = 'disable',

  // Delete references from AWS::ApiGateway::Method to the AWS::ApiGateway::RequestValidator resources.
  DISASSOCIATE = 'disassociate',

  // Delete the AWS::ApiGateway::RequestValidator resources and all their references.
  DELETE = 'delete',
}

class Plugin {
  readonly pluginName = 'serverless-disable-request-validators';
  readonly serverless: Serverless.Instance;
  readonly options: Serverless.Options;
  readonly commands: { [key: string]: any };
  readonly hooks: { [key: string]: Function };

  constructor(serverless: Serverless.Instance, options: Serverless.Options) {
    this.serverless = serverless;
    this.hooks = {
      'before:package:finalize': () => this.execute(),
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

  // Original code from https://stackoverflow.com/a/69456116/298054
  stringToEnumValue<T extends Record<string, string>, K extends keyof T>(
    enumObj: T,
    value: string,
  ): T[keyof T] | undefined {
    return enumObj[
      Object.keys(enumObj).filter(
        (k) => enumObj[k as K].toString() === value,
      )[0] as keyof typeof enumObj
    ];
  }

  filterResourcesByType(resources: Serverless.CfnResourceList, type: Serverless.CfnResourceType): CfnResourcePair[] {
    const filtered = Object.entries(resources).filter((obj: [string, Serverless.CfnResource]) => {
      const value = obj[1];
      return value.Type === type;
    });
    return filtered.map((obj) => {
      return {
        name: obj[0],
        resource: obj[1],
      };
    });
  }

  execute() {
    this.validate();
    const service = this.serverless.service;

    const pluginConfig = service.custom[this.pluginName];
    const actionStr: string = pluginConfig ? pluginConfig['action'] : 'disable';
    const action = this.stringToEnumValue(PluginAction, actionStr);
    this.log(`Plugin configuration: action=${action}`);

    const compiledTemplate = service.provider.compiledCloudFormationTemplate;
    const resources = compiledTemplate.Resources;

    const validators = this.filterResourcesByType(resources, 'AWS::ApiGateway::RequestValidator');
    this.log(`Found ${validators.length} request validator(s)`);

    if (validators.length === 0) {
      return;
    }

    switch (action) {
      default:
        throw new Error(`Invalid action provided in custom.${this.pluginName}.action`);
      case PluginAction.DISABLE:
        {
          validators.forEach((v) => this.disableValidator(v));
          break;
        }
      case PluginAction.DISASSOCIATE:
        {
          validators.forEach((v) => this.disassociateValidator(v.name, resources));
          break;
        }
      case PluginAction.DELETE:
        {
          validators.forEach((v) => this.deleteValidator(v.name, resources));
          break;
        }
    }
  }

  disassociateValidator(validatorRef: string, resources: Serverless.CfnResourceList) {
    const methods = this.filterResourcesByType(resources, 'AWS::ApiGateway::Method');
    this.log(`Found ${methods.length} method(s)`);
    methods.forEach((m) => this.deleteValidatorRefFromMethod(validatorRef, m));
  }

  deleteValidator(validatorRef: string, resources: Serverless.CfnResourceList) {
    this.disassociateValidator(validatorRef, resources);

    const validator = resources[validatorRef];
    if (!validator) {
      return;
    }
    delete resources[validatorRef];
    this.log(`Deleted request validator '${validatorRef}' from template`);
  }

  deleteValidatorRefFromMethod(validatorRef: string, method: CfnResourcePair) {
    const properties = method.resource.Properties;
    const validatorId = properties['RequestValidatorId'];
    if (!validatorId || validatorRef !== validatorId['Ref']) {
      return;
    }
    delete properties['RequestValidatorId'];
    this.log(`Deleted reference to request validator from method '${method.name}'`);
  }

  disableValidator(validator: CfnResourcePair) {
    const properties = validator.resource.Properties;
    properties['ValidateRequestBody'] = false;
    properties['ValidateRequestParameters'] = false;
    const validatorName = validator.name;
    this.log(`Disabled validations from request validator '${validatorName}'`);
  }
}

module.exports = Plugin;
