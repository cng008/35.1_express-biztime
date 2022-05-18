/** Routes for invoices. */

const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

const router = express.Router();

/** Get invoices:
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * 
        FROM invoices`
    );
    return res.json({ invoices: result.rows });
  } catch (e) {
    return next(e);
  }
});

/** Get invoice:
 * Returns obj {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
 * If invoice cannot be found, returns 404.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT *
        FROM invoices
        WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }
    const data = result.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date
    };

    return res.json({ invoice: invoice });
  } catch (e) {
    return next(e);
  }
});

/** Post invoices: Adds a invoice
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * Needs to be passed in JSON body of: {comp_code, amt}
 */
router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
        VALUES ($1, $2) 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

/** Put invoice: Edit existing invoice.
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * Needs to be passed in a JSON body of {amt}
 * If invoice cannot be found, returns a 404.
 * If paying unpaid invoice, set paid_date; if marking as unpaid, clear paid_date.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    const { id } = req.params;
    let paidDate = null;

    const currResult = await db.query(
      `SELECT paid
         FROM invoices
         WHERE id = $1`,
      [id]
    );
    if (currResult.rows.length === 0) {
      throw new ExpressError(`Can't update invoice with id ${id}`, 404);
    }

    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const result = await db.query(
      `UPDATE invoices
         SET amt=$1, paid=$2, paid_date=$3
         WHERE id=$4
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

/** Delete invoice:
 * Returns {status: "deleted"}
 * If invoice cannot be found, returns a 404.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM invoices
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    if (result.rows.length == 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    } else {
      return res.json({ status: 'deleted' });
    }
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
