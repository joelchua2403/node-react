

const updateApplication = async (appAcronym, updateData, delay = 0) => {
  try {
    // Simulate delay
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));

    const response = await axios.put(`http://localhost:3001/applications/${appAcronym}`, updateData, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaXAiOiI6OjEiLCJicm93c2VyIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNS4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiaWF0IjoxNzE5NTQ0Njg3LCJleHAiOjE3MTk1NDgyODd9.TmzE8vayypmyhrMBPCCiksDc3x2ZOtaF-8zPCRcZzJo`
      }
    });

    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
};

const appAcronym = 'TestApp';
const updateData1 = {
  App_Rnumber: 2,
  App_Description: 'Description 1',
  App_startDate: '2024-01-01',
  App_endDate: '2024-12-31',
  App_permit_Create: 'group1',
  App_permit_Open: 'group2',
  App_permit_toDoList: 'group3',
  App_permit_Doing: 'group4',
  App_permit_Done: 'group5'
};

const updateData2 = {
  App_Rnumber: 3,
  App_Description: 'Description 2',
  App_startDate: '2024-01-01',
  App_endDate: '2024-12-31',
  App_permit_Create: 'group1',
  App_permit_Open: 'group2',
  App_permit_toDoList: 'group3',
  App_permit_Doing: 'group4',
  App_permit_Done: 'group5'
};

// Simulate two concurrent requests
updateApplication(appAcronym, updateData1, 0);
updateApplication(appAcronym, updateData2, 1000);
