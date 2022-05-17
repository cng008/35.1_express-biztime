/** Routes for companies. */

const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

const router = express.Router();

/** Get companies:
 * Returns list of companies, like {companies: [{code, name}, ...]}
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * 
        FROM companies`
    );
    return res.json({ companies: result.rows });
  } catch (e) {
    return next(e);
  }
});

/** Get company:
 * Return obj of company: {company: {code, name, description}}
 * If company cannot be found, return a 404 status response
 */
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query('SELECT * FROM companies WHERE code = $1', [
      code
    ]);
    if (result.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

/** Post companies: Adds a company
 * Returns obj of new company: {company: {code, name, description}}
 * Needs to be given JSON like: {code, name, description}
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

/** Put company: Edit existing company.
 * Returns update company object: {company: {code, name, description}}
 * Needs to be given JSON like: {name, description}
 * Should return 404 if company cannot be found.
 */
router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't update company with code ${code}`, 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

/** Delete company:
 * Returns {status: "deleted"}
 * Should return 404 if company cannot be found.
 */
router.delete('/:code', async (req, res, next) => {
  try {
    const result = db.query('DELETE FROM companies WHERE code = $1', [
      req.params.code
    ]);
    if (result.rows.length == 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    } else {
      return res.json({ status: 'deleted' });
    }
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
