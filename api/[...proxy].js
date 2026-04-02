const axios = require('axios');

// 随机UA池，绕过B站基础风控
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
];

// 核心代理函数
module.exports = async (req, res) => {
  // 1. 强制跨域放行
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, User-Agent');
  
  // 放行OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 强制1秒延迟，避免高频请求触发风控
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. 拼接B站真实接口地址
  const path = req.query.proxy.join('/');
  const targetUrl = `https://api.bilibili.com/${path}`;
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  console.log('代理请求：', targetUrl);

  try {
    // 4. 转发请求到B站，带完整浏览器请求头
    const biliResponse = await axios({
      url: targetUrl,
      method: req.method,
      params: req.query,
      headers: {
        'User-Agent': randomUA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': 'buvid3=00000000-0000-0000-0000-00000000000000000infoc; _uuid=00000000-0000-0000-0000-00000000000000000infoc'
      },
      timeout: 10000
    });

    // 5. 把B站的响应直接返回给前端
    res.status(biliResponse.status).json(biliResponse.data);

  } catch (err) {
    console.error('代理失败：', err.message);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ code: -1, message: err.message });
    }
  }
};