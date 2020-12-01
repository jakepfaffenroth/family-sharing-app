const initOptions = {
  receive(data, result, e) {
    camelizeColumns(data);
  },
};
const pgp = require('pg-promise')(initOptions);

if ((process.env.NODE_ENV = 'test')) {
  process.env.PG_CON_STRING = process.env.PG_CON_STRING.replace(
    'carousel',
    'test_db'
  );
}
const cn = process.env.PG_CON_STRING;

// SQL column names are snake_case -- convert to camelCase
function camelizeColumns(data) {
  const tmp = data[0];
  for (const prop in tmp) {
    const camel = pgp.utils.camelize(prop);
    if (!(camel in tmp)) {
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        d[camel] = d[prop];
        delete d[prop];
      }
    }
  }
}

module.exports = pgp(cn);
