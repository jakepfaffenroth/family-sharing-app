import 'regenerator-runtime/runtime';
const dotenv = require('dotenv');
dotenv.config({ path: './bin/.env.development' });

if ((process.env.NODE_ENV = 'test')) {
  process.env.PG_CON_STRING = process.env.PG_CON_STRING.replace(
    'carousel',
    'test_db'
  );
}
const db = require('../../db').pgPromise;
db.$pool.end();
db.connect();
// const initOptions = {
//   receive(data, result, e) {
//     camelizeColumns(data);
//   },
// };
// // SQL column names are snake_case -- convert to camelCase
// function camelizeColumns(data) {
//   const tmp = data[0];
//   for (const prop in tmp) {
//     const camel = pgp.utils.camelize(prop);
//     if (!(camel in tmp)) {
//       for (let i = 0; i < data.length; i++) {
//         const d = data[i];
//         d[camel] = d[prop];
//         delete d[prop];
//       }
//     }
//   }
// }
// // const pgp = require('pg-promise')(initOptions);
// let db = require('../../db').pgPromise;
// // Preparing the testDb connection details:
// const cn = process.env.PG_TEST_CON_STRING;

// db.none('DROP DATABASE IF EXISTS mock_db');
// const activeUsers = db.any(
//   'SELECT pid, usename, client_addr FROM pg_stat_activity WHERE datname ="carousel"'
// );
// const exists = db.one(
//   "select exists(SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('test_db'))"
// );
// if (!exists) {
//   db.any(
//     "SELECT pg_terminate_backend (pid) FROM pg_stat_activity WHERE datname = 'carousel';"
//   );
//   db.none('CREATE DATABASE test_db WITH TEMPLATE carousel');
//   // const tables = await getDbTables();

//   // db.none('TRUNCATE $1:raw RESTART IDENTITY', tables);
// }
// async function getDbTables() {
//   const tables = await db.many(
//     "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
//   );
//   // console.log('tables:', tables);
//   return tables
//     .map((x) => x.tableName)
//     .toString()
//     .replace(',', ', ');
// }

// const tables = getDbTables();
// console.log('tables:', tables);

beforeEach(async () => {
  // const tables = await getDbTables();

  // db.none('TRUNCATE $1:raw RESTART IDENTITY', tables);
  // db.one('INSERT INTO owners DEFAULT VALUES RETURNING *');
  jest.resetModules();
  jest.resetAllMocks();

  // Creating a new database instance from the connection details:
  // db = pgp(cn);
  // const result = await db.one(
  //   'INSERT INTO owners DEFAULT VALUES ON CONFLICT DO NOTHING RETURNING *'
  // );
  // console.log('result:', result);
});

afterEach(async () => {
  // db.none('DROP DATABASE IF EXISTS test_db');
  // db.none('DELETE FROM album_images WHERE owner_id = "mockOwnerId"');
});

// Misc.
const oldLocation = { ...window.location };
Object.defineProperty(window, 'location', {
  value: {
    ...oldLocation,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    search: jest.fn(),
  },
  writable: true,
});
Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn(),
  },
  writable: true,
});
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});
