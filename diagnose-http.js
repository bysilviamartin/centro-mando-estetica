const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/settings/equipment/cmmuyv9hc0000h95cukqgt082',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', () => {}); // Consume data
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
