/** Tests for invoices. */

const request = require('supertest');

const app = require('../app');
const { createData } = require('../_test-common');
const db = require('../db');

// before each test, clean out data
beforeEach(createData);

afterAll(async () => {
  await db.end();
});

describe('GET /', () => {
  test('Respond with array of invoices', async () => {
    const response = await request(app).get('/invoices');
    expect(response.body).toEqual({
      invoices: [
        { id: 1, comp_code: 'apple' },
        { id: 2, comp_code: 'apple' },
        { id: 3, comp_code: 'ibm' }
      ]
    });
  });
});

describe('GET /1', () => {
  test('Return invoice info', async () => {
    const response = await request(app).get('/invoices/1');
    expect(response.body).toEqual({
      invoice: {
        id: 1,
        amt: 100,
        add_date: '2018-01-01T08:00:00.000Z',
        paid: false,
        paid_date: null,
        company: {
          code: 'apple',
          name: 'Apple',
          description: 'Maker of OSX.'
        }
      }
    });
  });

  test('Return 404 for no-such-invoice', async () => {
    const response = await request(app).get('/invoices/999');
    expect(response.status).toEqual(404);
  });
});

describe('POST /', () => {
  test('Add new invoice', async () => {
    const response = await request(app)
      .post('/invoices')
      .send({ amt: 400000, comp_code: 'ibm' });

    expect(response.body).toEqual({
      invoice: {
        id: 4,
        comp_code: 'ibm',
        amt: 400000,
        add_date: expect.any(String),
        paid: false,
        paid_date: null
      }
    });
  });
});

describe('PUT /', () => {
  test('Update an invoice', async () => {
    const response = await request(app)
      .put('/invoices/1')
      .send({ amt: 1000000, paid: false });

    expect(response.body).toEqual({
      invoice: {
        id: 1,
        comp_code: 'apple',
        paid: false,
        amt: 1000000,
        add_date: expect.any(String),
        paid_date: null
      }
    });
  });

  test('Return 404 for no-such-invoice', async () => {
    const response = await request(app)
      .put('/invoices/9999')
      .send({ amt: 1000000 });

    expect(response.status).toEqual(404);
  });

  test('Return 500 for missing data', async () => {
    const response = await request(app).put('/invoices/1').send({});

    expect(response.status).toEqual(500);
  });
});

describe('DELETE /', () => {
  test('Delete invoice', async () => {
    const response = await request(app).delete('/invoices/1');

    expect(response.body).toEqual({ status: 'deleted' });
  });

  test('Return 404 for no-such-invoices', async () => {
    const response = await request(app).delete('/invoices/9909');

    expect(response.status).toEqual(404);
  });
});
