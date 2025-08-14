const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>Fintr Frontend (microservices_root)</h1>');
});
server.listen(port, () => console.log(`frontend listening ${port}`));
