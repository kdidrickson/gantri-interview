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
  console.log(req.query)
  if(isNaN(Number(req.query.page_size))) {
    res.status(400).send('pageSize is not a number');
  }
  if(isNaN(Number(req.query.page_offset))) {
    res.status(400).send('pageOffset is not a number');
  }

  const pageSize = Number(req.query.page_size)
  const pageOffset = Number(req.query.page_offset)

  if(pageSize > 100) {
    res.status(400).send('pageSize is over 100');
  }
  const response = await postgres.query(`
    SELECT * FROM art
    ORDER BY id
    LIMIT $1
    OFFSET $2;
  `, [pageSize, pageOffset]);
  res.send(response.rows);
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