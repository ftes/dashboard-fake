let fs = require('fs');
let jsf = require('json-schema-faker');
let yaml = require('js-yaml');

let api = yaml.safeLoad(fs.readFileSync('./api.yaml'));
let schema = {
	type: 'array',
	items: api.definitions.CreateCustomerRequestDto,
	minItems: 5,
	maxItems: 5,
	uniqueItems: true
};

let fake = jsf(schema);

function buildId(i) {
	return {
		index: {
			'_id': i
		}
	};
}

let i = 0;
for (let item of fake) {
	console.log(JSON.stringify(buildId(i++)));
	console.log(JSON.stringify(item));
}
