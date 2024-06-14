const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors()); // Enable CORS for all routes

app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000', // default target
  changeOrigin: true,
  router: function(req) {
    return req.query.url;
  },
  pathRewrite: {
    '^/api': '', // remove base path
  },
}));

app.listen(5000);