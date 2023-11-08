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
  const pageSize = req.query.page_size === undefined ? 10 : Number(req.query.page_size);
  const pageOffset = req.query.page_offset === undefined ? 0 : Number(req.query.page_offset);

  if(isNaN(Number(pageSize))) {
    res.status(400).send('pageSize is not a number');
  }
  if(isNaN(Number(pageOffset))) {
    res.status(400).send('pageOffset is not a number');
  }
  if(pageSize > 100) {
    res.status(400).send('pageSize is over 100');
  }
  const response = await postgres.query(`
    WITH art_comments AS (
        SELECT
            comments.id AS id,
            comments.user_id as user_id,
            art_id,
            content,
            CASE WHEN comments.user_id IS NULL THEN comments.name ELSE users.name END as name
        FROM
            comments
        LEFT JOIN users ON users.id = comments.user_id
    )
    SELECT
        art.id as id,
        title,
        artist,
        year,
        CASE WHEN NOT EXISTS (SELECT 1 FROM art_comments WHERE art_comments.art_id = art.id) THEN jsonb_build_array() ELSE
        jsonb_agg(
            json_build_object(
                'id', art_comments.id,
                'name', art_comments.name,
                'content', art_comments.content,
                'userID', art_comments.user_id
            )
        ) END as comments
    FROM art
    LEFT JOIN art_comments ON art.id = art_comments.art_id
    GROUP BY art.id
    ORDER BY art.id
    LIMIT $1
    OFFSET $2;
  `, [pageSize, pageOffset]);
  res.send(response.rows);
});

app.get('/api/art/:id', async (req, res) => {
  const id = Number(req.params.id);

  if(isNaN(id)) {
    res.status(400).send('ID is not valid');
  }

  const response = await postgres.query(`
    WITH art_comments AS (
      SELECT
          comments.id AS id,
          comments.user_id as user_id,
          art_id,
          content,
          CASE WHEN comments.user_id IS NULL THEN comments.name ELSE users.name END as name
      FROM
          comments
      LEFT JOIN users ON users.id = comments.user_id
      WHERE
          art_id = $1
    )
    SELECT
        art.id as id,
        title,
        artist,
        year,
        CASE WHEN NOT EXISTS (SELECT 1 FROM art_comments) THEN jsonb_build_array() ELSE
        jsonb_agg(
            json_build_object(
                'id', art_comments.id,
                'name', art_comments.name,
                'content', art_comments.content,
                'userID', art_comments.user_id
            )
        ) END as comments
    FROM art
    LEFT JOIN art_comments ON TRUE
    WHERE art.id = $1
    GROUP BY art.id;
  `, [id]);
  const row = response.rows[0];
  if(row) {
    res.send(row);
  } else {
    res.status(404).send('art not found');
  }
});

app.post('/api/art/:id/comments', async (req, res) => {
  const {userID, name, content} = req.query;
  const artID = Number(req.params.id);

  if(!userID && !name) {
    res.status(400).send('must provide userID or name');
  }
  if(!content) {
    res.status(400).send('must provide content');
  }
  if(isNaN(artID)) {
    res.status(400).send('art ID is not valid');
  }

  let response;
  if(userID) {
    try {
      response = await postgres.query(`
        INSERT INTO comments (user_id, art_id, content) VALUES ($1, $2, $3) RETURNING *;
      `, [userID, artID, content]);
    } catch(e) {
      if((e as any).code === '23503') {
        res.status(404).send('userID does not exist');
        return;
      }
    }
  } else {
    response = await postgres.query(`
      WITH anonymous_user_comments AS (
          SELECT id FROM comments WHERE name = $1 AND art_id = $2 LIMIT 1
      )
      INSERT INTO comments (name, art_id, content)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (SELECT 1 FROM anonymous_user_comments)
      RETURNING *
    `, [name, artID, content]);
  }
  
  const insertedRow = response?.rows[0];
  if(insertedRow) {
    res.send(insertedRow);
  } else {
    res.status(404).send('insert unsuccessful');
  }
});

app.post('/api/users', async (req, res) => {
  const  {name, age: rawAge, location} = req.query;
  const age = Number(rawAge);

  if(isNaN(age)) {
    res.status(400).send('age is not valid');
  }

  const response = await postgres.query(`
    INSERT INTO users (name, age, location) VALUES ($1, $2, $3) RETURNING *;
  `, [name, age, location]);

  const insertedRow = response?.rows[0];
  if(insertedRow) {
    res.send(insertedRow);
  } else {
    res.status(404).send('insert unsuccessful');
  }
});

app.get('/api/users', async (req, res) => {
  const pageSize = req.query.page_size === undefined ? 10 : Number(req.query.page_size);
  const pageOffset = req.query.page_offset === undefined ? 0 : Number(req.query.page_offset);

  if(isNaN(Number(pageSize))) {
    res.status(400).send('pageSize is not a number');
  }
  if(isNaN(Number(pageOffset))) {
    res.status(400).send('pageOffset is not a number');
  }
  if(pageSize > 100) {
    res.status(400).send('pageSize is over 100');
  }

  const response = await postgres.query(`
    SELECT id, name, age, location
    FROM users
    LIMIT $1
    OFFSET $2
  `, [pageSize, pageOffset]);
  res.send(response.rows);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})