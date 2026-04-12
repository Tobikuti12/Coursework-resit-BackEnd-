// server.js — minimal, robust for Render
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());

// simple logger
app.use((req, res, next) => {
  const time = new Date().toISOString();
  const query = Object.keys(req.query).length ? ` | query: ${JSON.stringify(req.query)}` : '';
  console.log(`[${time}] ${req.method} ${req.url}${query}`);
  next();
});

// static (optional)
app.use(express.static(path.join(__dirname, 'static')));

// CORS (keeps permissive for test)
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Credentials','true');
  res.setHeader('Access-Control-Allow-Methods','GET,HEAD,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers','Origin,Accept,X-Requested-With,Content-Type');
  next();
});

// MONGO (connect but DO NOT block listening)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://tobi1:Tmgolf159@cluster0.k6z8gsk.mongodb.net/Webstore?retryWrites=true&w=majority';
let db;
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db('Webstore');
    console.log('Mongo connected');
  })
  .catch(err => {
    console.error('Mongo connection error (will not stop server):', err.message);
  });

// example endpoint
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/search', async (req,res) => {
  const q = (req.query.q || req.query.query || '').trim();
  console.log(`[SEARCH] query="${q || '(all)'}"`);
  try {
    const filter = q ? { title: { $regex: q, $options: 'i' } } : {};
    const results = db ? await db.collection('products').find(filter).toArray() : [];
    console.log(`[SEARCH] found ${results.length} result(s) for "${q || '(all)'}"`);
    res.json(results);
  } catch(e){
    console.error('search error', e);
    res.status(500).json({ error: e.message });
  }
});

// IMPORTANT: listen on process.env.PORT and 0.0.0.0
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
