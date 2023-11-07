import express from 'express';
import {Client} from 'pg';

const app = express();
const PORT = 3000;
const postgres = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});
postgres.connect();

app.get('/api/art', async (req, res) => {
  const response = await postgres.query('SELECT NOW() as now');
  res.send(response)
});

app.get('/api/art/:id', (req, res) => {
  res.send(`get art id ${req.params.id}`)
});

app.get('/api/art/:id/comments', (req, res) => {
  res.send(`get art id comments ${req.params.id}`)
});

app.post('/api/users', (req, res) => {
  res.send(`create new user`)
});

app.get('/api/users', (req, res) => {
  res.send(`get all users`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})