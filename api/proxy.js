const https = require('https');
const url = require('url');

// 随机UA池
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

module.exports = (req, res) => {
  // 1. 强制跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, User-Agent');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔴 核心修复：用显式的 path 参数传递B站接口路径，不用通配符
  const targetPath = req.query.path;
  if (!targetPath) {
    return res.status(400).json({ code: -1, message: '缺少 path 参数' });
  }

  // 2. 构建B站请求URL
  // 先把 path 从 query 里删掉，避免重复
  delete req.query.path;
  const queryString = url.format({ query: req.query });
  const fullPath = `/${targetPath}${queryString}`;
  
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  console.log('代理请求：', `https://api.bilibili.com${fullPath}`);

  // 3. 用Node.js原生https模块请求
  const options = {
    hostname: 'api.bilibili.com',
    path: fullPath,
    method: 'GET',
    headers: {
      'User-Agent': randomUA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.bilibili.com/'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode)
         .setHeader('Content-Type', 'application/json')
         .send(data);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('请求失败：', err);
    res.status(500).json({ code: -1, message: err.message });
  });

  proxyReq.end();
};