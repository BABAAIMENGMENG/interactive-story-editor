/**
 * 阿里云函数计算 HTTP 函数入口
 * 使用本地 HTTP 服务器处理请求
 * 
 * 部署说明：
 * 1. 构建项目：pnpm build
 * 2. 进入 standalone 目录：cd .next/standalone/workspace/projects
 * 3. 安装生产依赖：npm install next@16.1.1 react@19.2.3 react-dom@19.2.3 --no-package-lock --omit=dev --ignore-scripts
 * 4. 复制静态文件：cp -r ../../../.next/static ./.next/ && cp -r ../../../public ./
 * 5. 复制此文件到 standalone 目录：cp ../../../fc-index.js ./index.js
 * 6. 打包：zip -r /tmp/code.zip .
 * 7. 部署：s deploy -t s.yaml --use-local
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
        port: 0, // 自动分配端口
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
    
    // 将请求代理到本地 Next.js 服务器
    const parsedUrl = parse(fcReq.url, true);
    const path = parsedUrl.path;
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: fcReq.method,
        headers: fcReq.headers,
      };
      
      const req = http.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          
          fcResp.setStatusCode(res.statusCode);
          Object.entries(res.headers).forEach(([key, value]) => {
            fcResp.setHeader(key, value);
          });
          fcResp.send(body);
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.error('Proxy error:', err);
        fcResp.setStatusCode(500);
        fcResp.send('Proxy Error: ' + err.message);
        reject(err);
      });
      
      // 转发请求体（如果有）
      if (fcReq.body) {
        req.write(fcReq.body);
      }
      req.end();
    });
  } catch (err) {
    console.error('Handler error:', err);
    fcResp.setStatusCode(500);
    fcResp.send('Internal Server Error: ' + err.message);
  }
};
