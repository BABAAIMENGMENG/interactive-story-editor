/**
 * 阿里云函数计算 HTTP 函数入口
 */

const http = require('http');
const { parse } = require('url');

let server = null;
let initError = null;

async function initNext() {
  if (server) return;
  if (initError) throw initError;
  
  try {
    const next = require('next');
    const app = next({ dev: false, hostname: '127.0.0.1', port: 0 });
    await app.prepare();
    
    const handle = app.getRequestHandler();
    
    server = http.createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    });
    
    await new Promise((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        console.log('Next.js on port', server.address().port);
        resolve();
      });
      server.on('error', reject);
    });
    
  } catch (err) {
    initError = err;
    throw err;
  }
}

exports.handler = async (fcReq, fcResp, context) => {
  try {
    await initNext();
    
    const port = server.address().port;
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: fcReq.path || fcReq.url || '/',
        method: fcReq.method || 'GET',
        headers: fcReq.headers || {},
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          fcResp.setStatusCode(res.statusCode);
          Object.entries(res.headers).forEach(([k, v]) => {
            if (!['content-length', 'transfer-encoding', 'connection'].includes(k.toLowerCase())) {
              try { fcResp.setHeader(k, v); } catch {}
            }
          });
          // 强制设置 Content-Disposition 为 inline
          fcResp.setHeader('Content-Disposition', 'inline');
          fcResp.send(Buffer.concat(chunks));
          resolve();
        });
      });
      
      req.on('error', err => {
        fcResp.setStatusCode(500);
        fcResp.send('Proxy Error: ' + err.message);
        reject(err);
      });
      
      if (fcReq.body && Object.keys(fcReq.body).length > 0) {
        req.write(JSON.stringify(fcReq.body));
      }
      req.end();
    });
    
  } catch (err) {
    fcResp.setStatusCode(500);
    fcResp.setHeader('Content-Type', 'text/plain');
    fcResp.send('Error: ' + err.message + '\n\nStack: ' + err.stack);
  }
};
