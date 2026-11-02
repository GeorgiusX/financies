/** Package the same sample-data build for Vercel's static Build Output API. */
import {cp, mkdir, rm, writeFile} from 'node:fs/promises';

const output = new URL('../.vercel/output/', import.meta.url);
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
await cp(new URL('../dist/', import.meta.url), new URL('static/', output), {recursive: true, filter: (source) => !source.endsWith('.map')});
await writeFile(
    new URL('config.json', output),
    JSON.stringify(
        {
            version: 3,
            routes: [
                {
                    src: '/(.*)',
                    headers: {
                        'Content-Security-Policy':
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; connect-src 'self' blob: data:; img-src 'self' blob: data:; frame-src 'none'; form-action 'none'; base-uri 'self'",
                        'Referrer-Policy': 'no-referrer',
                        'X-Content-Type-Options': 'nosniff',
                    },
                    continue: true,
                },
                {handle: 'filesystem'},
                {src: '/.*', dest: '/index.html'},
            ],
        },
        null,
        2,
    ),
);
console.log('Prepared .vercel/output from dist');
