const axios = require('axios'); // HTTP client for calling your deployed services
require('dotenv').config({ path: '.env.test' }); // Load URLs from .env.test

// Service base URLs (4 processes)
const USERS = process.env.USERS_SERVICE_URL;
const COSTS = process.env.COSTS_SERVICE_URL;
const ADMIN = process.env.ADMIN_SERVICE_URL;
const LOGS = process.env.LOGS_SERVICE_URL;

// Render can be slow; increase Jest timeout
jest.setTimeout(30000);

// The submission requirement says DB must contain this imaginary user
const REQUIRED_USER_ID = 123123;

// Helper: error JSON must include at least id + message (project requirement)
function expectErrorShape(data)
{
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('message');
}

describe('Required endpoints - success cases', () => {

    test('GET /api/about returns developers list (first_name + last_name only)', async () => {
        const res = await axios.get(`${ADMIN}/api/about`);
        expect(res.status).toBe(200);

        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);

        const dev = res.data[0];
        expect(dev).toHaveProperty('first_name');
        expect(dev).toHaveProperty('last_name');

        // Strict check: no extra properties
        const keys = Object.keys(dev).sort();
        expect(keys).toEqual(['first_name', 'last_name']);
    });

    test('GET /api/users returns users list', async () => {
        const res = await axios.get(`${USERS}/api/users`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.data)).toBe(true);
    });

    test(`GET /api/users/${REQUIRED_USER_ID} returns user details + total`, async () => {
        const res = await axios.get(`${USERS}/api/users/${REQUIRED_USER_ID}`);
        expect(res.status).toBe(200);

        expect(res.data).toHaveProperty('first_name');
        expect(res.data).toHaveProperty('last_name');
        expect(res.data).toHaveProperty('id', REQUIRED_USER_ID);
        expect(res.data).toHaveProperty('total');
        expect(typeof res.data.total).toBe('number');
    });

    test('GET /api/report returns monthly report in required structure', async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const res = await axios.get(`${COSTS}/api/report`, {
            params: { id: REQUIRED_USER_ID, year, month }
        });

        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('userid', REQUIRED_USER_ID);
        expect(res.data).toHaveProperty('year', year);
        expect(res.data).toHaveProperty('month', month);
        expect(res.data).toHaveProperty('costs');
        expect(Array.isArray(res.data.costs)).toBe(true);

        // Must include all required categories
        const expectedCategories = ['food', 'health', 'housing', 'sports', 'education'];
        const presentCategories = res.data.costs.map(obj => Object.keys(obj)[0]);

        for (const cat of expectedCategories)
        {
            expect(presentCategories).toContain(cat);
        }
    });

    test('POST /api/add (cost) adds cost item and returns the saved document', async () => {
        const payload = {
            userid: REQUIRED_USER_ID,
            description: 'jest test cost',
            category: 'food',
            sum: 8
        };

        const res = await axios.post(`${COSTS}/api/add`, payload);
        expect(res.status).toBe(201);

        // Response must be the cost item itself (not wrapped)
        expect(res.data).toHaveProperty('userid', REQUIRED_USER_ID);
        expect(res.data).toHaveProperty('description', payload.description);
        expect(res.data).toHaveProperty('category', payload.category);
        expect(res.data).toHaveProperty('sum');
    });

    // Render free-tier can take >30s to wake up. Give this test a longer timeout.
    test('GET /api/logs returns logs list', async () => {
        const res = await axios.get(`${LOGS}/api/logs`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.data)).toBe(true);
    }, 90000);
});

describe('Required error format {id, message}', () => {

    test('GET /api/report missing params returns {id, message}', async () => {
        try
        {
            await axios.get(`${COSTS}/api/report`);
            throw new Error('Expected request to fail, but it succeeded');
        }
        catch (err)
        {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(400);
            expectErrorShape(err.response.data);
        }
    });

    test('POST /api/add (cost) invalid category returns {id, message}', async () => {
        try
        {
            await axios.post(`${COSTS}/api/add`, {
                userid: REQUIRED_USER_ID,
                description: 'bad category',
                category: 'invalid_category',
                sum: 10
            });
            throw new Error('Expected request to fail, but it succeeded');
        }
        catch (err)
        {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(400);
            expectErrorShape(err.response.data);
        }
    });

    test('GET /api/users/:id not found returns {id, message}', async () => {
        const nonExisting = 987654321;

        try
        {
            await axios.get(`${USERS}/api/users/${nonExisting}`);
            throw new Error('Expected request to fail, but it succeeded');
        }
        catch (err)
        {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(404);
            expectErrorShape(err.response.data);
        }
    });
});
