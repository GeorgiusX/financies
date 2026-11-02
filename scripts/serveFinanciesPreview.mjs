import {readFile, stat} from 'node:fs/promises';
/** Serve the built preview on loopback, including SPA routes and sample-only network restrictions. */
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.env.PORT || 8082);
const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
};
const previewHeaders = {
    'Content-Security-Policy': "connect-src 'self' blob: data:; img-src 'self' blob: data:; frame-src 'none'; form-action 'none'; base-uri 'self'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
};

createServer(async (request, response) => {
    try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        let file = path.resolve(root, `.${pathname}`);
        if (file !== root && !file.startsWith(root + path.sep)) {
            response.writeHead(403).end();
            return;
        }
        try {
            if (!(await stat(file)).isFile()) {
                file = path.join(root, 'index.html');
            }
        } catch {
            if (path.extname(pathname)) {
                response.writeHead(404).end('Not found');
                return;
            }
            file = path.join(root, 'index.html');
        }
        const body = await readFile(file);
        response.writeHead(200, {...previewHeaders, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
        response.end(body);
    } catch (error) {
        console.error('Preview request failed', error);
        response.writeHead(500).end('Preview request failed');
    }
}).listen(port, '127.0.0.1', () => console.log(`Financies preview: http://localhost:${port}`));
