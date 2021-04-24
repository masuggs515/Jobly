"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    if (res.locals.user.isAdmin === false) throw new UnauthorizedError("Only admin can reach this route");


    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: none
 **/

router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {

    const users = await User.findAll();
    if (res.locals.user.isAdmin === false) throw new UnauthorizedError("Only admin can reach this route");

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: admin or logged in same user
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    
    const user = await User.get(req.params.username);
    if (res.locals.user.isAdmin === false && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("Only admin or this user can reach this route");
    }
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or logged in same user
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    if (res.locals.user.isAdmin === false && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("Only admin or this user can reach this route");
    }
    
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or logged in same user
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    
    await User.remove(req.params.username);
    if (res.locals.user.isAdmin === false && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("Only admin or this user can reach this route");
    }
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

/* POST /[username]/jobs/[id] => {applied: jobId}

Authorization required: admin or logged in same user
*/
router.post('/:username/jobs/:id', async (req, res, next)=>{
  try {
    await User.applied(req.params.username, req.params.id)
    if (res.locals.user.isAdmin === false && res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError("Only admin or this user can reach this route");
    }
    return res.status(201).json({applied: req.params.id})
  } catch (err) {
    return next(err)
  }
})


module.exports = router;
