#!/usr/bin/env node

/**
 * CLI wrapper for plop that properly handles non-interactive execution.
 *
 * Usage:
 *   node plop-cli.js <generator> [--arg value ...]
 *
 * Examples:
 *   node plop-cli.js unison-web-app --appName MyApp --htmlLib tapegram_html_2_0_0
 *   node plop-cli.js crud-module --entityName Workout --fields "name:Text,reps:Nat" --includeJson true
 */

const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { generator: null, data: {} };

  if (args.length === 0) {
    console.log('Available generators:');
    console.log('  unison-web-app   - Scaffold a new Unison web application');
    console.log('  crud-module      - Generate a complete CRUD module');
    console.log('  ability-handler  - Generate a port (ability) and adapter (handler)');
    console.log('  json-mappers     - Generate JSON encoder/decoder for a type');
    console.log('  page-route       - Generate a page, controller, and route');
    console.log('  api-client       - Generate an HTTP API client with ability');
    console.log('  service-tests    - Generate tests for a service');
    console.log('\nUsage: node plop-cli.js <generator> --arg value ...');
    process.exit(0);
  }

  result.generator = args[0];

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        // Handle boolean strings
        if (value === 'true') result.data[key] = true;
        else if (value === 'false') result.data[key] = false;
        else result.data[key] = value;
        i++;
      } else {
        result.data[key] = true;
      }
    }
  }

  return result;
}

// Parse fields from string format
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

// Parse operations from JSON string
function parseOperations(opsInput) {
  if (!opsInput) return [];
  try {
    return JSON.parse(opsInput);
  } catch (e) {
    console.error('Failed to parse operations JSON:', e.message);
    return [];
  }
}

// Case transformation helpers
const helpers = {
  pascalCase: (text) => text
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase()),

  camelCase: (text) => text
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase()),

  kebabCase: (text) => text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase(),

  lowercase: (text) => text.toLowerCase(),

  pluralize: (text) => {
    // Simple pluralization
    if (text.endsWith('y')) return text.slice(0, -1) + 'ies';
    if (text.endsWith('s') || text.endsWith('x') || text.endsWith('ch') || text.endsWith('sh'))
      return text + 'es';
    return text + 's';
  },
};

// Register Handlebars helpers
Object.entries(helpers).forEach(([name, fn]) => {
  Handlebars.registerHelper(name, fn);
});

// Additional Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('neq', (a, b) => a !== b);
Handlebars.registerHelper('startsWith', (text, prefix) => {
  if (typeof text !== 'string') return false;
  return text.startsWith(prefix);
});

// Generator configurations
const generators = {
  'unison-web-app': {
    defaults: { htmlLib: 'tapegram_html_2_0_0' },
    required: ['appName'],
    outputs: [
      { path: 'app-main.u', template: 'app-main.u.hbs' },
      { path: 'web-utilities.u', template: 'web-utilities.u.hbs' },
    ],
  },
  'crud-module': {
    defaults: { htmlLib: 'tapegram_html_2_0_0', includeJson: true, fields: 'name:Text' },
    required: ['entityName'],
    preProcess: (data) => {
      if (typeof data.fields === 'string') {
        data.fields = parseFields(data.fields);
      }
      return data;
    },
    outputs: (data) => {
      const outputs = [
        { path: `${helpers.kebabCase(data.entityName)}-crud.u`, template: 'crud-module.u.hbs' },
      ];
      if (data.includeJson) {
        outputs.push({
          path: `${helpers.kebabCase(data.entityName)}-crud.u`,
          template: 'json-mappers.u.hbs',
          append: true
        });
      }
      return outputs;
    },
  },
  'ability-handler': {
    defaults: {
      adapterType: 'Custom',
      includeFake: true,
      operations: '[{"name":"doSomething","inputType":"Text","outputType":"()"}]'
    },
    required: ['abilityName'],
    preProcess: (data) => {
      if (typeof data.operations === 'string') {
        data.operations = parseOperations(data.operations);
      }
      return data;
    },
    outputs: (data) => [
      { path: `${helpers.kebabCase(data.abilityName)}-port-adapter.u`, template: 'ability-handler.u.hbs' },
    ],
  },
  'json-mappers': {
    defaults: { fields: 'id:Text,name:Text' },
    required: ['typeName'],
    preProcess: (data) => {
      if (typeof data.fields === 'string') {
        data.fields = parseFields(data.fields);
      }
      return data;
    },
    outputs: (data) => [
      { path: `${helpers.kebabCase(data.typeName)}-json.u`, template: 'json-mappers-standalone.u.hbs' },
    ],
  },
  'page-route': {
    defaults: { httpMethod: 'GET', hasParams: false, htmlLib: 'tapegram_html_2_0_0' },
    required: ['pageName'],
    preProcess: (data) => {
      if (!data.routePath) {
        data.routePath = helpers.lowercase(data.pageName);
      }
      return data;
    },
    outputs: (data) => [
      { path: `${helpers.kebabCase(data.pageName)}-page.u`, template: 'page-route.u.hbs' },
    ],
  },
  'api-client': {
    defaults: {
      baseUrl: 'api.example.com',
      operations: '[{"name":"getData","httpMethod":"GET","endpoint":"/data","responseType":"Json"}]'
    },
    required: ['clientName'],
    preProcess: (data) => {
      if (typeof data.operations === 'string') {
        data.operations = parseOperations(data.operations);
      }
      return data;
    },
    outputs: (data) => [
      { path: `${helpers.kebabCase(data.clientName)}-api-client.u`, template: 'api-client.u.hbs' },
    ],
  },
  'service-tests': {
    defaults: { operations: ['create', 'get', 'listAll', 'update', 'delete'] },
    required: ['serviceName', 'entityName'],
    preProcess: (data) => {
      if (!data.repositoryName) {
        data.repositoryName = data.entityName + 'Repository';
      }
      if (typeof data.operations === 'string') {
        data.operations = data.operations.split(',').map(s => s.trim());
      }
      return data;
    },
    outputs: (data) => [
      { path: `${helpers.kebabCase(data.serviceName)}-tests.u`, template: 'service-tests.u.hbs' },
    ],
  },
};

// Main execution
async function main() {
  const { generator, data } = parseArgs();

  if (!generator) {
    console.error('No generator specified');
    process.exit(1);
  }

  const config = generators[generator];
  if (!config) {
    console.error(`Unknown generator: ${generator}`);
    console.error('Available generators:', Object.keys(generators).join(', '));
    process.exit(1);
  }

  // Apply defaults
  const finalData = { ...config.defaults, ...data };

  // Check required fields
  const missing = config.required.filter(f => !finalData[f]);
  if (missing.length > 0) {
    console.error(`Missing required arguments: ${missing.map(f => '--' + f).join(', ')}`);
    process.exit(1);
  }

  // Pre-process data
  if (config.preProcess) {
    config.preProcess(finalData);
  }

  // Get outputs
  const outputs = typeof config.outputs === 'function'
    ? config.outputs(finalData)
    : config.outputs;

  // Process templates
  const templateDir = path.join(__dirname, 'plop-templates');

  for (const output of outputs) {
    const templatePath = path.join(templateDir, output.template);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);
    const result = template(finalData);

    const outputPath = output.path;

    if (output.append && fs.existsSync(outputPath)) {
      fs.appendFileSync(outputPath, '\n' + result);
      console.log(`✓ Appended to ${outputPath}`);
    } else {
      fs.writeFileSync(outputPath, result);
      console.log(`✓ Created ${outputPath}`);
    }
  }

  console.log('\nDone! Files generated successfully.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
