const axios = require('axios');

const USERS_SERVICE_URL = 'https://users-service-michael.onrender.com';
const COSTS_SERVICE_URL = 'https://costs-service-michael.onrender.com';
const ADMIN_SERVICE_URL = 'https://admin-service-michael.onrender.com';

async function runTests() {
    console.log("Running tests...\n");
    // Check admin service
    try {
        console.log("1. Testing admin service(/api/about)...");
        const res = await axios.get(`${ADMIN_SERVICE_URL}/api/about`);
        if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
            console.log("PASS: Developers list received.");
        } else {
            console.error("FAIL: Unexpected response format.");
        }
    } catch (error) {
        console.error("FAIL: " + error.message);
    }
    //Check creating user
    const testUser = {
        id: 999999, // Temporary ID for testing
        first_name: "Test",
        last_name: "User",
        birthday: "1990-01-01"
    };
    try {
        console.log("\n2. Testing Add User (/api/add)...");
        const res = await axios.post(`${USERS_SERVICE_URL}/api/add`, testUser);
        if (res.status === 201 || res.status === 200) {
            console.log("PASS: User added successfully.");
        } else {
            console.error("FAIL: Failed to add user.");
        }
    } catch (error) {
        console.error("FAIL: " + error.message);
    }

    //Check adding cost
    const testCost = {
        description: "Unit Test Pizza",
        category: "food",
        userid: 999999,
        sum: 50
    };

    try {
        console.log("\n3. Testing Add Cost (/api/add)...");
        const res = await axios.post(`${COSTS_SERVICE_URL}/api/add`, testCost);
        if (res.status === 201 || res.status === 200) {
            console.log("PASS: Cost added successfully.");
        } else {
            console.error("FAIL: Failed to add cost.");
        }
    } catch (error) {
        console.error("FAIL: " + error.message);
    }
    // Check Getting Report
    try {
        console.log("\n4. Testing Get Report (/api/report)...");
        // Using current year/month to ensure data exists from previous step
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const res = await axios.get(`${COSTS_SERVICE_URL}/api/report`, {
            params: { id: 999999, year: year, month: month }
        });

        if (res.status === 200 && res.data.costs) {
            console.log("PASS: Report generated successfully.");
        } else {
            console.error("FAIL: Failed to fetch report.");
        }
    } catch (error) {
        console.error("FAIL: " + error.message);
    }

    console.log("\nTests Completed.");
}

runTests();
