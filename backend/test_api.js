const http = require('http');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/students?limit=10',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('test_students.json', JSON.stringify({
      statusCode: res.statusCode,
      data: data
    }));
  });
});

req.on('error', (e) => {
  fs.writeFileSync('test_students.json', JSON.stringify({ error: e.message }));
});

req.end();
