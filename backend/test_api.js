const http = require('http');

async function testFetch() {
  const req = http.request('http://localhost:19998/api/students/788060fb-b6fb-46ea-be47-0839122c8a20', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body length:', data.length);
      try {
        const json = JSON.parse(data);
        console.log('Success:', json.success);
        console.log('Marks length:', json.data?.marks?.length);
      } catch (e) {
        console.error('Error parsing JSON:', e.message);
      }
    });
  });

  req.on('error', (e) => console.error('Request error:', e.message));
  req.end();
}

testFetch();
