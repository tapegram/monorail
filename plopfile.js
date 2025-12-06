const pluralize = require('pluralize');

module.exports = function (plop) {
  // =============================================================================
  // HANDLEBARS HELPERS
  // =============================================================================

  // Case transformations
  plop.setHelper('pascalCase', (text) => {
    return text
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toUpperCase());
  });

  plop.setHelper('camelCase', (text) => {
    return text
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toLowerCase());
  });

  plop.setHelper('snakeCase', (text) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase();
  });

  plop.setHelper('kebabCase', (text) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();
  });

  plop.setHelper('pluralize', (text) => pluralize(text));
  plop.setHelper('singularize', (text) => pluralize.singular(text));
  plop.setHelper('lowercase', (text) => text.toLowerCase());
  plop.setHelper('uppercase', (text) => text.toUpperCase());

  // Helper to output literal curly braces (needed for Unison ability syntax)
  plop.setHelper('openBrace', () => '{');
  plop.setHelper('closeBrace', () => '}');

  // Comparison helpers
  plop.setHelper('eq', (a, b) => a === b);
  plop.setHelper('neq', (a, b) => a !== b);

  // String helpers
  plop.setHelper('startsWith', (text, prefix) => {
    if (typeof text !== 'string') return false;
    return text.startsWith(prefix);
  });

  plop.setHelper('substring', (text, start, end) => {
    if (typeof text !== 'string') return '';
    return end ? text.substring(start, end) : text.substring(start);
  });

  plop.setHelper('split', (text, separator) => {
    if (typeof text !== 'string') return [];
    return text.split(separator).filter(s => s);
  });

  plop.setHelper('join', (array, separator) => {
    if (!Array.isArray(array)) return '';
    return array.join(separator);
  });

  // Field type helpers for JSON mappers
  plop.setHelper('encoderField', (field) => {
    const { name, type } = field;
    if (type.startsWith('Optional ')) {
      const innerType = type.replace('Optional ', '');
      const addFn = getAddFn(innerType);
      return `|> (match value.${name} with\n      Some v -> object.${addFn} "${name}" v\n      None -> identity)`;
    }
    if (type.startsWith('[')) {
      return `|> object.addArray "${name}" (List.map ${getEncoderForType(type.slice(1, -1))} value.${name})`;
    }
    const addFn = getAddFn(type);
    return `|> object.${addFn} "${name}" value.${name}`;
  });

  plop.setHelper('decoderField', (field) => {
    const { name, type } = field;
    if (type.startsWith('Optional ')) {
      const innerType = type.replace('Optional ', '');
      return `${name} = atOptional "${name}" ${getDecoderForType(innerType)}`;
    }
    if (type.startsWith('[')) {
      const innerType = type.slice(1, -1);
      return `${name} = at! "${name}" (Decoder.array ${getDecoderForType(innerType)})`;
    }
    return `${name} = at! "${name}" ${getDecoderForType(type)}`;
  });

  plop.setHelper('fieldList', (fields) => fields.map(f => f.name).join(', '));
  plop.setHelper('typeFields', (fields) => fields.map(f => `  , ${f.name} : ${f.type}`).join('\n'));
  plop.setHelper('isLast', (index, array) => index === array.length - 1);

  // =============================================================================
  // FIELD PARSING UTILITIES
  // =============================================================================

  /**
   * Parse fields from various formats:
   * - JSON array: '[{"name":"title","type":"Text"},{"name":"count","type":"Nat"}]'
   * - Simple format: 'name:Text,count:Nat,active:Boolean'
   */
  function parseFields(fieldsInput) {
    if (!fieldsInput) return [];

    // Try JSON first
    if (fieldsInput.startsWith('[')) {
      try {
        return JSON.parse(fieldsInput);
      } catch (e) {
        console.error('Failed to parse fields JSON:', e.message);
        return [];
      }
    }

    // Simple format: name:Type,name:Type
    return fieldsInput.split(',').map(f => {
      const [name, type] = f.trim().split(':');
      return { name: name.trim(), type: type ? type.trim() : 'Text' };
    }).filter(f => f.name);
  }

  /**
   * Parse operations from JSON format:
   * '[{"name":"get","inputType":"Text","outputType":"Optional User"}]'
   */
  function parseOperations(opsInput) {
    if (!opsInput) return [];
    try {
      return JSON.parse(opsInput);
    } catch (e) {
      console.error('Failed to parse operations JSON:', e.message);
      return [];
    }
  }

  // =============================================================================
  // GENERATORS
  // =============================================================================

  // ---------------------------------------------------------------------------
  // CRUD Module Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('crud-module', {
    description: 'Generate a complete CRUD module (domain, repository, service, routes, pages)',
    prompts: [
      {
        type: 'input',
        name: 'entityName',
        message: 'Entity name (e.g., Workout, Post, User):',
        validate: (input) => input ? true : 'Entity name is required',
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Fields (format: name:Type,name:Type or JSON array):',
        default: 'name:Text',
        filter: (input) => parseFields(input),
      },
      {
        type: 'confirm',
        name: 'includeJson',
        message: 'Include JSON mappers?',
        default: true,
      },
      {
        type: 'input',
        name: 'htmlLib',
        message: 'HTML library version:',
        default: 'tapegram_html_2_0_0',
      },
      {
        type: 'input',
        name: 'customOperations',
        message: 'Custom repository operations (JSON: [{"name":"op","inputType":"Text","outputType":"()"}], leave empty for none):',
        default: '',
        filter: (input) => input ? parseOperations(input) : [],
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || '{{kebabCase entityName}}-crud.u';
      const actionType = data.appendTo ? 'append' : 'add';

      const actions = [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/crud-module.u.hbs',
        },
      ];

      if (data.includeJson) {
        actions.push({
          type: 'append',
          path: targetPath,
          templateFile: 'plop-templates/json-mappers.u.hbs',
        });
      }

      return actions;
    },
  });

  // ---------------------------------------------------------------------------
  // Ability and Handler Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('ability-handler', {
    description: 'Generate a port (ability) and adapter (handler)',
    prompts: [
      {
        type: 'input',
        name: 'abilityName',
        message: 'Ability name (e.g., EmailClient, WeatherApi):',
        validate: (input) => input ? true : 'Ability name is required',
      },
      {
        type: 'input',
        name: 'operations',
        message: 'Operations (JSON array: [{"name":"op","inputType":"Text","outputType":"()"}]):',
        default: '[{"name":"doSomething","inputType":"Text","outputType":"()"}]',
        filter: (input) => parseOperations(input),
      },
      {
        type: 'list',
        name: 'adapterType',
        message: 'Adapter type:',
        choices: ['Database (OrderedTable)', 'HTTP API', 'Custom'],
      },
      {
        type: 'confirm',
        name: 'includeFake',
        message: 'Include fake adapter for testing?',
        default: true,
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || '{{kebabCase abilityName}}-port-adapter.u';
      const actionType = data.appendTo ? 'append' : 'add';
      return [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/ability-handler.u.hbs',
        },
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // JSON Mappers Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('json-mappers', {
    description: 'Generate JSON encoder/decoder for a type',
    prompts: [
      {
        type: 'input',
        name: 'typeName',
        message: 'Type name (e.g., Workout, User):',
        validate: (input) => input ? true : 'Type name is required',
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Fields (format: name:Type,name:Type or JSON array):',
        default: 'id:Text,name:Text',
        filter: (input) => parseFields(input),
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || '{{kebabCase typeName}}-json.u';
      const actionType = data.appendTo ? 'append' : 'add';
      return [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/json-mappers-standalone.u.hbs',
        },
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // Page and Route Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('page-route', {
    description: 'Generate a page, controller, and route',
    prompts: [
      {
        type: 'input',
        name: 'pageName',
        message: 'Page name (e.g., About, Dashboard, UserProfile):',
        validate: (input) => input ? true : 'Page name is required',
      },
      {
        type: 'input',
        name: 'routePath',
        message: 'Route path (e.g., about, dashboard, users/:id):',
      },
      {
        type: 'list',
        name: 'httpMethod',
        message: 'HTTP method:',
        choices: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
      },
      {
        type: 'confirm',
        name: 'hasParams',
        message: 'Does this route have URL parameters (e.g., :id)?',
        default: false,
      },
      {
        type: 'input',
        name: 'htmlLib',
        message: 'HTML library version:',
        default: 'tapegram_html_2_0_0',
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || '{{kebabCase pageName}}-page.u';
      const actionType = data.appendTo ? 'append' : 'add';
      return [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/page-route.u.hbs',
        },
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // API Client Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('api-client', {
    description: 'Generate an HTTP API client with ability',
    prompts: [
      {
        type: 'input',
        name: 'clientName',
        message: 'API client name (e.g., GitHub, Weather, Stripe):',
        validate: (input) => input ? true : 'Client name is required',
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Base URL (e.g., api.github.com):',
        default: 'api.example.com',
      },
      {
        type: 'input',
        name: 'operations',
        message: 'Operations (JSON: [{"name":"op","httpMethod":"GET","endpoint":"/path","responseType":"Json"}]):',
        default: '[{"name":"getData","httpMethod":"GET","endpoint":"/data","responseType":"Json"}]',
        filter: (input) => parseOperations(input),
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || '{{kebabCase clientName}}-api-client.u';
      const actionType = data.appendTo ? 'append' : 'add';
      return [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/api-client.u.hbs',
        },
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // Service Tests Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('service-tests', {
    description: 'Generate tests for a service',
    prompts: [
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service name (e.g., WorkoutService, UserService):',
        validate: (input) => input ? true : 'Service name is required',
      },
      {
        type: 'input',
        name: 'entityName',
        message: 'Entity name this service manages:',
      },
      {
        type: 'input',
        name: 'repositoryName',
        message: 'Repository ability name:',
      },
      {
        type: 'checkbox',
        name: 'operations',
        message: 'Select operations to test:',
        choices: ['create', 'get', 'listAll', 'update', 'delete'],
        default: ['create', 'get', 'listAll', 'update', 'delete'],
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || '{{kebabCase serviceName}}-tests.u';
      const actionType = data.appendTo ? 'append' : 'add';
      return [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/service-tests.u.hbs',
        },
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // Auth Module Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('auth-module', {
    description: 'Generate authentication module (login, signup, sessions)',
    prompts: [
      {
        type: 'input',
        name: 'htmlLib',
        message: 'HTML library version:',
        default: 'tapegram_html_2_0_0',
      },
      {
        type: 'input',
        name: 'cookieName',
        message: 'Session cookie name:',
        default: 'session',
      },
      {
        type: 'input',
        name: 'sessionDays',
        message: 'Session duration (days):',
        default: '30',
      },
      {
        type: 'input',
        name: 'minPasswordLength',
        message: 'Minimum password length:',
        default: '8',
      },
      {
        type: 'input',
        name: 'saltPrefix',
        message: 'Salt prefix (for password hashing):',
        default: 'monorail',
      },
      {
        type: 'input',
        name: 'appendTo',
        message: 'Append to existing file (leave empty to create new file):',
        default: '',
      },
    ],
    actions: (data) => {
      const targetPath = data.appendTo || 'auth.u';
      const actionType = data.appendTo ? 'append' : 'add';
      return [
        {
          type: actionType,
          path: targetPath,
          templateFile: 'plop-templates/auth-module.u.hbs',
        },
      ];
    },
  });

  // ---------------------------------------------------------------------------
  // Web App Scaffold Generator
  // ---------------------------------------------------------------------------
  plop.setGenerator('unison-web-app', {
    description: 'Scaffold a new Unison web application (single file)',
    prompts: [
      {
        type: 'input',
        name: 'appName',
        message: 'Application name:',
        validate: (input) => input ? true : 'App name is required',
      },
      {
        type: 'input',
        name: 'htmlLib',
        message: 'HTML library version:',
        default: 'tapegram_html_2_0_0',
      },
    ],
    actions: [
      // Generate single combined file with all app code
      {
        type: 'add',
        path: 'app.u',
        templateFile: 'plop-templates/app-combined.u.hbs',
      },
    ],
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getAddFn(type) {
  switch (type) {
    case 'Text': return 'addText';
    case 'Nat': return 'addNat';
    case 'Int': return 'addInt';
    case 'Float': return 'addFloat';
    case 'Boolean': return 'addBoolean';
    default: return 'addJson';
  }
}

function getDecoderForType(type) {
  switch (type) {
    case 'Text': return 'Decoder.text';
    case 'Nat': return 'Decoder.nat';
    case 'Int': return 'Decoder.int';
    case 'Float': return 'Decoder.float';
    case 'Boolean': return 'Decoder.boolean';
    default: return `${type}.decoder`;
  }
}

function getEncoderForType(type) {
  switch (type) {
    case 'Text': return 'Json.String';
    case 'Nat': return 'Json.Number';
    case 'Int': return 'Json.Number';
    case 'Float': return 'Json.Number';
    case 'Boolean': return 'Json.Boolean';
    default: return `${type}.encoder`;
  }
}
