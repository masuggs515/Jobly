const { sqlForPartialUpdate } = require("./sql");

describe('sqlForPartialUpdate', ()=>{
    test('Should return sql query layout', ()=>{
        const data = {
            firstName: "user",
            lastName: "test"
            };
        const handler = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
            };
        expect(sqlForPartialUpdate(data, handler))
        .toEqual({ setCols: '"first_name"=$1, "last_name"=$2',
        values: [ 'user', 'test' ] })
    });
});