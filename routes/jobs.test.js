"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        id: 4,
        title: "New",
        salary: 100000,
        equity: 0,
        companyHandle: "c1",
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: 4,
                title: "New",
                salary: 100000,
                equity: "0",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                id: 27,
                salary: 10,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                salary: "Not-a-number",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "J1",
                        salary: 50000,
                        equity: "0.5",
                        companyHandle: "c1"
                    },
                    {
                        title: "J2",
                        salary: 100000,
                        equity: "0",
                        companyHandle: "c1"
                    },
                    {
                        title: "J3",
                        salary: 150000,
                        equity: "0.5",
                        companyHandle: "c3"
                    },
                ],
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "J1",
                salary: 50000,
                equity: "0.5",
                companyHandle: "c1"
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/789`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "J1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "J1-new",
                salary: 50000,
                equity: "0.5",
                companyHandle: "c1"
            },
        });
    });

    test("unauth for non admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "No auth",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "J1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/758`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                id: 7,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: "1" });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/458`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
