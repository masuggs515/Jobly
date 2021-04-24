"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filter = {}) {
    // Create base query string that everything will be added to

    let queryString = `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies`;

    // Blank arrays to push data in to if query string is present
    let queryAdders = [];
    let queryValues = [];

    const { name, minEmployees, maxEmployees } = filter;

    if (minEmployees > maxEmployees) throw new BadRequestError("minimum input can not be higher than maximum input");

      // if name, minEmployees, or maxEmployees is found, add value in to queryValues array
      // and in queryAdders array, add in the query string for input of value. In place of value 
      // in query string, add length of array AFTER pushing value in to queryValues so that the input number
      // will equal the placement in the queryValues Array. 
      // Will end up being name =$1

    if (name) {
      queryValues.push(`%${name}%`);
      queryAdders.push(`name ILIKE $${queryValues.length}`);
    }

    if (minEmployees !== undefined) {
      queryValues.push(minEmployees);
      queryAdders.push(`num_employees >= $${queryValues.length}`)
    }

    if (maxEmployees !== undefined) {
      queryValues.push(maxEmployees);
      queryAdders.push(`num_employees <= $${queryValues.length}`)
    }

    // If any query found add queryAdders to queryString with WHERE in front

    if (queryAdders.length > 0) {
      let filterString = queryAdders.join(" AND ");
      queryString += ` WHERE ${filterString}`;
    }

    // If query is found OR not we still want to order by name
    queryString += ' ORDER BY name'

    // ending query. queryString will include basic string and all searched queries.
    // queryValues will now be in correct format (an array) to help with security of SQL tables
    let companiesRes = await db.query(queryString, queryValues);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
