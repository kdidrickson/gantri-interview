const fs = require("fs");
const csvParser = require("csv-parser");
const {Client} = require("pg");

const postgres = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});
postgres.connect();

postgres.query(`
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS art;
CREATE TABLE art (
  id serial PRIMARY KEY,
  accession_number VARCHAR(50) UNIQUE NOT NULL,
  artist VARCHAR(255),
  artistRole VARCHAR(255),
  artistId INT,
  title VARCHAR(1000),
  dateText VARCHAR(1000),
  medium VARCHAR(1000),
  creditLine VARCHAR(1000),
  year INT,
  acquisitionYear INT,
  dimensions VARCHAR(255),
  width INT,
  height INT,
  depth INT,
  units VARCHAR(255),
  inscription VARCHAR(1000),
  thumbnailCopyright VARCHAR(1000),
  thumbnailUrl VARCHAR(1000),
  url VARCHAR(1000)
);
CREATE TABLE users (
  id serial PRIMARY KEY,
  name VARCHAR(255),
  age INT,
  location VARCHAR(255)
);
CREATE TABLE comments (
  id serial PRIMARY KEY,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  art_id INT,
  FOREIGN KEY (art_id) REFERENCES art(id),
  name VARCHAR(255),
  content TEXT
);
`).then(async () => {
  let i = 1;
  fs.createReadStream("/workspaces/gantri-interview/the-tate-collection.csv")
  .pipe(csvParser({
    separator: ';',
  }))
  .on("data", async (data) => {
    const query = formatObjectToPostgresQuery(data);
    try {
      await postgres.query(query);
      process.stdout.write(`${Math.round(i/69200*100)}% imported\r`);
      i++;
    } catch(e) {
      console.log(e, query)
    }
  })
  .on("end", async () => {
    await postgres.query(`
      INSERT INTO users (name, age, location) VALUES ('Allison Johnson', 30, 'New York, NY');
      INSERT INTO users (name, age, location) VALUES ('Ahren', 24, 'San Francisco');
      INSERT INTO users (name, age, location) VALUES ('John', 28, 'San Francisco');
      INSERT INTO comments (name, content, art_id) VALUES ('John', 'This is rad', 10001);
      INSERT INTO comments (content, art_id, user_id) VALUES ('This is super cool', 10001, 1);
    `);
    console.log('import successful!')
    process.exit(0);
  });
});


function formatObjectToPostgresQuery(object) {
  const columns = Object.keys(object).join(', ');
  const values = Object.values(object).map(value => {
    value = isNaN(Number(value)) || Number(value) === Infinity ? value.replace(/'/g, "''") : Number(value);
    return typeof value === 'string' ? `'${value}'` : value
  });

  const query = `INSERT INTO art (${columns}) VALUES (${values.join(', ')}) RETURNING *;`;

  return query;
}