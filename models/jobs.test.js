"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    id: 4,
    title: "New",
    salary: 100000,
    equity: 0,
    companyHandle: "c1",
};

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
        id: 4,
        title: "New",
        salary: 100000,
        equity: "0",
        companyHandle: "c1", 
  });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = '4'`);
    expect(result.rows).toEqual([
      {
            id: 4,
            title: "New",
            salary: 100000,
            equity: "0",
            companyHandle: "c1", 
      },
    ]);
  });

  test("bad request with duplicate", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
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
        companyHandle: "c2"
      },
      {
        title: "J3",
        salary: 150000,
        equity: "0.5",
        companyHandle: "c3"
      },
    ]);
  });
  test("filters and finds any Job that includes given title", async ()=>{
    const job = await Job.findAll({"title": "1"});
    expect(job).toEqual([{
        title: "J1",
        salary: 50000,
        equity: "0.5",
        companyHandle: "c1"
      }])
  });

  test("filters and finds all jobs with higher salary than given salary", async ()=>{
    const job = await Job.findAll({"minSalary": 125000});
    expect(job).toEqual([{
        title: "J3",
        salary: 150000,
        equity: "0.5",
        companyHandle: "c3"
      }])
  })

  test("filters and finds all jobs with any equity available", async ()=>{
    const job = await Job.findAll({"hasEquity": "true"});
    expect(job).toEqual([{
        title: "J1",
        salary: 50000,
        equity: "0.5",
        companyHandle: "c1"
      },
      {
        title: "J3",
        salary: 150000,
        equity: "0.5",
        companyHandle: "c3"
      }])
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
        id: 1,
        title: "J1",
        salary: 50000,
        equity: "0.5",
        companyHandle: "c1"
      });
  });

  test("not found if no such Job", async function () {
    try {
      await Job.get(758);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "J1-new",
    salary: 75000
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      ...updateData,
      "equity": "0.5",
      "companyHandle": "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([{
        id: 1,
        title: "J1-new",
        salary: 75000,
        equity: "0.5",
        companyHandle: "c1"
      }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
        title: "J1",
        salary: null,
        equity: null
      };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      ...updateDataSetNulls,
        "companyHandle": "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = '1'`);
    expect(result.rows).toEqual([{ 
        id: 1, 
        title: "J1", 
        salary: null, 
        equity: null, 
        companyHandle: "c1" 
      }]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update(758, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove(758);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
