const axios = require('axios');

const BASE_URL = 'http://localhost:3001';  // Adjust if your server is running on a different port
const token = 'YOUR_AUTH_TOKEN'; // Replace with a valid token

const taskPayload = {
  Task_app_Acronym: 'TestApp',
  Task_name: 'Concurrent Task',
  Task_description: 'This is a description for a concurrent task.',
  Task_plan: 'P',
  Task_notes: 'Initial note for the task.'
};

const headers = {
  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaXAiOiI6OjEiLCJicm93c2VyIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNS4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiaWF0IjoxNzE5NTU1OTM3LCJleHAiOjE3MTk1NTk1Mzd9.Ml13D8_K_i-3uYheY5LCA4QqDAYpSpii96ymwzpuxsQ`,
  'Content-Type': 'application/json'
};

const createTask = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/tasks/create`, taskPayload, { headers });
    console.log('Task created successfully:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

const runTest = async () => {
  console.log('Starting test for transaction locks...');

  // Start two requests simultaneously
  const request1 = createTask();
  const request2 = createTask();

  // Wait for both requests to complete
  await Promise.all([request1, request2]);

  console.log('Test completed.');
};

runTest();
