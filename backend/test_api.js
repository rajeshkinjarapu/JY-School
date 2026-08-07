const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/students',
  method: 'GET',
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(`BODY: ${data}`));
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
