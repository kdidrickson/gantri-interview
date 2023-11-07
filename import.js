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
DROP TABLE IF EXISTS art;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS users;
CREATE TABLE art (
  id serial PRIMARY KEY,
  accession_number VARCHAR(50) UNIQUE NOT NULL,
  artist VARCHAR(255),
  artistRole VARCHAR(255),
  artistId INT,
  title VARCHAR(255),
  dateText VARCHAR(255),
  medium VARCHAR(255),
  creditLine VARCHAR(255),
  year INT,
  acquisitionYear INT,
  dimensions VARCHAR(255),
  width INT,
  height INT,
  depth INT,
  units VARCHAR(255),
  inscription VARCHAR(255),
  thumbnailCopyright VARCHAR(255),
  thumbnailUrl VARCHAR(255),
  url VARCHAR(255)
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
  name VARCHAR(255),
  content TEXT
);
`).then(() => {
  fs.createReadStream("/workspaces/gantri-interview/the-tate-collection.csv")
  .pipe(csvParser({
    separator: ';',
  }))
  .on("data", async (data) => {
    const query = formatObjectToPostgresQuery(data);
    // console.log(query)
    try {
      await postgres.query(query);
    } catch(e) {
      console.log(e, query)
    }
  });
});


function formatObjectToPostgresQuery(object) {
  const columns = Object.keys(object).join(', ');
  const values = Object.values(object).map(value => {
    value = isNaN(Number(value)) ? value.replace(/'/g, "''") : Number(value);
    return typeof value === 'string' ? `'${value}'` : value
  });

  const query = `INSERT INTO art (${columns}) VALUES (${values.join(', ')}) RETURNING *;`;

  return query;
}



// const csvStream = fastcsv
//   .parse()
//   .on('data', function (data) {
//     csvData.push(data);
//   })
//   .on('end', function () {
//     // Remove the header row (if present)
//     const header = csvData.shift();
//     const query = {
//     text: `INSERT INTO art (${header.join(', ')}) VALUES ($1, $2, $3, ...);`,
//     values: [],
//     };

//     csvData.forEach(row => {
//         console.log(row)
//     query.values = row;
//     pool.query(query, (err, res) => {
//         if (err) {
//             throw err;
//         }
//         console.log(`Row inserted: ${res.rowCount}`);
//     });
//     });
//   });

// stream.pipe(csvStream);