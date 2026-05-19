const http = require('http');
const { URL } = require('url');

setTimeout(async () => {
  try {
    const url = new URL('http://localhost:3001/admin/dashboard');
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('=== HTTP Status ===');
        console.log('Status Code:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('');
        console.log('=== Page Content Analysis ===');
        
        if (data.includes('<!DOCTYPE') || data.includes('<html')) {
          console.log('Valid HTML document detected');
        }
        
        if (data.includes('dashboard')) console.log('Contains dashboard text');
        if (data.includes('nav')) console.log('Contains navigation elements');
        if (data.includes('admin')) console.log('Contains admin text');
        if (data.includes('user')) console.log('Contains user-related content');
        
        if (data.includes('Error') || data.includes('error')) console.log('Contains error text');
        if (data.includes('404')) console.log('Contains 404 reference');
        
        console.log('');
        console.log('=== First 2000 characters of response ===');
        console.log(data.substring(0, 2000));
        console.log('');
        console.log('=== Total response size ===');
        console.log('Bytes:', data.length);
      });
    });
    
    req.on('error', (err) => {
      console.log('Error connecting to server:', err.message);
    });
  } catch (err) {
    console.log('Error:', err.message);
  }
}, 5000);
