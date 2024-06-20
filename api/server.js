const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

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
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));


// app.use('/api', async function(req, res) {
//     const url = req.query.url;
//     try {
//       const response = await axios.get(url, { maxRedirects: 0 });
//       res.header('Access-Control-Allow-Origin', '*');
//       res.send(response.data);
//     } catch (error) {
//       console.error(`Error: ${error}`);
//       res.status(500).send({ message: 'An error occurred while processing your request.' });
//     }
//   });

app.listen(5000);

