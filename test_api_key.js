// 测试DeepSeek API密钥
import https from 'https';

const API_KEY = 'sk-f74173b798da4cf29fb2e23db86afd9e';
const options = {
  hostname: 'api.deepseek.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const responseData = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ API密钥有效！连接成功。');
        console.log('响应内容:', responseData);
      } else {
        console.log(`❌ API密钥无效。状态码: ${res.statusCode}`);
        console.log('错误响应:', responseData);
      }
    } catch (error) {
      console.log(`❌ 解析响应失败: ${error.message}`);
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.log(`❌ 请求失败: ${error.message}`);
});

const postData = JSON.stringify({
  model: 'deepseek-chat',
  messages: [
    {
      role: 'user',
      content: '验证API密钥'
    }
  ],
  max_tokens: 10
});

req.write(postData);
req.end();