import expoFetch from './fetch';
global.fetch = expoFetch as unknown as typeof global.fetch;
