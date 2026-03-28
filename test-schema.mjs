import { configureElementalClient } from '@yottagraph-app/elemental-api/config';
import { getSchema } from '@yottagraph-app/elemental-api/client';

const baseUrl = 'https://broadchurch-portal-194773164895.us-central1.run.app/api/qs/org_whBuw1Hin0HmU2Bx';
const apiKey = 'd3a5df4a6b8403ad69ae3173aa4eddce13e9c54ad60919a0a033a001db9ad096';

configureElementalClient({
    baseUrl,
    fetch: async (url, options) => {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
            ...((options?.headers) || {}),
        };
        
        const response = await fetch(url, {
            ...options,
            headers,
        });
        
        const data = response.headers.get('content-type')?.includes('application/json')
            ? await response.json()
            : await response.text();
            
        return { data, status: response.status, headers: response.headers };
    },
});

const schema = await getSchema();
console.log('Schema keys:', Object.keys(schema));
console.log('Has schema.schema?', !!schema.schema);
console.log('Has schema.flavors?', !!schema.flavors);
console.log('Has schema.properties?', !!schema.properties);

const flavors = schema.schema?.flavors ?? schema.flavors ?? [];
console.log('Total flavors:', flavors.length);

const article = flavors.find(f => f.name === 'article');
console.log('Article flavor:', article);
