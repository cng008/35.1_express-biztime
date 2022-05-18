/** Tests for companies. */

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
  test('Respond with array of companies', async () => {
    const response = await request(app).get('/companies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      companies: [
        { code: 'apple', name: 'Apple' },
        { code: 'ibm', name: 'IBM' }
      ]
    });
  });
});

describe('GET /apple', () => {
  test('Return company info', async () => {
    const response = await request(app).get('/companies/apple');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      company: {
        code: 'apple',
        name: 'Apple',
        description: 'Maker of OSX.',
        invoices: [1, 2]
      }
    });
  });
});

describe('POST /', () => {
  test('Add new company', async function () {
    const response = await request(app)
      .post('/companies')
      .send({ name: 'Spotify', description: 'Music anywhere, anytime!' });

    expect(response.body).toEqual({
      company: {
        code: 'spotify',
        name: 'Spotify',
        description: 'Music anywhere, anytime!'
      }
    });
  });
  test('Return 500 for conflict', async function () {
    const response = await request(app)
      .post('/companies')
      .send({ name: 'Apple', description: 'COPYRIGHT' });

    expect(response.status).toEqual(500);
  });
});

describe('PUT /', () => {
  test('Update company info', async () => {
    const response = await request(app)
      .put('/companies/apple')
      .send({ name: 'ApplePie', description: 'iPhone Z' });

    expect(response.body).toEqual({
      company: {
        code: 'apple',
        name: 'ApplePie',
        description: 'iPhone Z'
      }
    });
  });

  test('Return 404 for no-such-comp', async () => {
    const response = await request(app)
      .put('/companies/boop')
      .send({ name: 'Boop' });

    expect(response.status).toEqual(404);
  });

  test('Return 500 for missing data', async () => {
    const response = await request(app).put('/companies/apple').send({});

    expect(response.status).toEqual(500);
  });
});

describe('DELETE /', () => {
  test('Delete company', async () => {
    const response = await request(app).delete('/companies/apple');

    expect(response.body).toEqual({ status: 'deleted' });
  });

  test('Return 404 for no-such-comp', async () => {
    const response = await request(app).delete('/companies/boop');

    expect(response.status).toEqual(404);
  });
});
