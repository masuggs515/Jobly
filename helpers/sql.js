const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  /*
  This function is used to partially update users and companies.
  Function takes json data as any combination of keys and values
  in the specific model, and returns data for easy implementing 
  in sql query string.

  Users example input =>
        ({
          firstName: "user",
          lastName: "test"
        }, )

        returns:
        { setCols: '"first_name"=$1, "last_name=$2"', values: [ 'user', 'test' ] }

  This can then be used in a query string by passing setCols in to the WHERE clause,
  and ...values (as a spread) in to the INPUT clause to pass through each value.
  */
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };