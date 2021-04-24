"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { id, title, salary, equity, company_handle }
     *
     * Returns { title, salary, equity, companyHandle }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ id, title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT id
        FROM jobs
        WHERE id = $1`,
            [id]);

        if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job: ${title}`);

        const result = await db.query(
            `INSERT INTO jobs
        (id, title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                id,
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ title, salary, equity, companyid }, ...]
     * */

    static async findAll(filter = {}) {
        // Create base query string that everything will be added on to

        let queryString = `SELECT title,
                salary,
                equity,
                company_handle AS "companyHandle"
        FROM jobs`;

        // Blank arrays to push data in to if query string is present
        let queryAdders = [];
        let queryValues = [];

        const { title, minSalary, hasEquity } = filter;


        // if title, minSalary, or hasEquity is found, add value in to queryValues array
        // and in queryAdders array, add in the query string for input of value. In place of value 
        // in query string, add length of array AFTER pushing value in to queryValues so that the input number
        // will equal the placement in the queryValues Array. 
        // Input of title: newTitle will end up returning: title =$1, [newTitle]

        if (title) {
            queryValues.push(`%${title}%`);
            queryAdders.push(`title ILIKE $${queryValues.length}`);
        }

        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            queryAdders.push(`salary >= $${queryValues.length}`)
        }


        if (hasEquity === "true") {
            console.log("TRUE")
            queryAdders.push(`equity > 0`)
        }


        // If any query found add queryAdders to queryString with WHERE in front

        if (queryAdders.length > 0) {
            let filterString = queryAdders.join(" AND ");
            queryString += ` WHERE ${filterString}`;
        }

        // If query is found OR not we still want to order by title
        queryString += ' ORDER BY title'

        // ending query. queryString will include basic string and all searched queries.
        // queryValues will now be in correct format (an array) to help with security of SQL tables
        let jobsRes = await db.query(queryString, queryValues);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, companyHandle }
     *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with given `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                title: "title",
                salary: "salary",
                equity: "equity"
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                    SET ${setCols} 
                    WHERE id = ${idVarIdx} 
                    RETURNING id, 
                            title, 
                            salary, 
                            equity, 
                            company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}


module.exports = Job;
