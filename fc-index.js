/**
 * 阿里云函数计算 HTTP 函数入口
 */

const { createServer } = require('http');
const { parse } = require('url');

let serverPromise;

async function getServer() {
  if (!serverPromise) {
    serverPromise = new Promise((resolve, reject) => {
      const next = require('next');
      const app = next({
        dev: false,
        hostname: '127.0.0.1',
        port: 0,
      });
      
      const handle = app.getRequestHandler();
      
      app.prepare().then(() => {
        const server = createServer(async (req, res) => {
          try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
          } catch (err) {
            console.error('Error:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
          }
        });
        
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          console.log(`Next.js server listening on port ${addr.port}`);
          resolve({ server, port: addr.port, handle });
        });
      }).catch(reject);
    });
  }
  return serverPromise;
}

const http = require('http');

exports.handler = async (fcReq, fcResp, context) => {
  try {
    const { port } = await getServer();
    const parsedUrl = parse(fcReq.url, true);
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: port,
        path: parsedUrl.path,
        method: fcReq.method,
        headers: fcReq.headers,
      };
      
      const req = http.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          
          // 先设置状态码
          fcResp.setStatusCode(res.statusCode);
          
          // 收集所有要设置的 headers
          const headers = {};
          Object.entries(res.headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (!['content-length', 'transfer-encoding', 'connection'].includes(lowerKey)) {
              headers[key] = value;
            }
          });
          
          // 确保正确的 Content-Type
          const contentType = res.headers['content-type'] || 'text/html; charset=utf-8';
          headers['Content-Type'] = contentType;
          
          // 关键：强制设置 Content-Disposition 为 inline
          headers['Content-Disposition'] = 'inline';
          
          // 设置所有 headers
          for (const [key, value] of Object.entries(headers)) {
            try {
              fcResp.setHeader(key, value);
            } catch (e) {}
          }
          
          // 发送响应
          fcResp.send(body);
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.error('Proxy error:', err);
        fcResp.setStatusCode(500);
        fcResp.setHeader('Content-Type', 'text/plain');
        fcResp.setHeader('Content-Disposition', 'inline');
        fcResp.send('Proxy Error: ' + err.message);
        reject(err);
      });
      
      if (fcReq.body) {
        req.write(typeof fcReq.body === 'string' ? fcReq.body : JSON.stringify(fcReq.body));
      }
      req.end();
    });
  } catch (err) {
    console.error('Handler error:', err);
    fcResp.setStatusCode(500);
    fcResp.send('Internal Server Error: ' + err.message);
  }
};
