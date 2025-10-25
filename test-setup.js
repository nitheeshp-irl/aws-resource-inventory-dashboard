// Simple test script to verify the setup
const axios = require('axios');

async function testSetup() {
  console.log('🧪 Testing AWS Resource Inventory setup...\n');

  try {
    // Test backend health endpoint
    console.log('1. Testing backend health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/api/health', {
      timeout: 5000
    });
    
    if (healthResponse.data.success) {
      console.log('✅ Backend is running and healthy');
      console.log(`   Status: ${healthResponse.data.data.status}`);
      console.log(`   Version: ${healthResponse.data.data.version}`);
    } else {
      console.log('❌ Backend health check failed');
    }
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure to run "npm run dev" first');
    return;
  }

  try {
    // Test accounts endpoint
    console.log('\n2. Testing accounts endpoint...');
    const accountsResponse = await axios.get('http://localhost:3001/api/accounts', {
      timeout: 5000
    });
    
    if (accountsResponse.data.success) {
      console.log('✅ Accounts endpoint is working');
      console.log(`   Found ${accountsResponse.data.data.length} accounts`);
    } else {
      console.log('❌ Accounts endpoint failed');
    }
  } catch (error) {
    console.log('❌ Accounts endpoint error:', error.message);
  }

  try {
    // Test resources endpoint
    console.log('\n3. Testing resources endpoint...');
    const resourcesResponse = await axios.get('http://localhost:3001/api/resources', {
      timeout: 5000
    });
    
    if (resourcesResponse.data.success) {
      console.log('✅ Resources endpoint is working');
      console.log(`   Found ${resourcesResponse.data.data.resources.length} resources`);
    } else {
      console.log('❌ Resources endpoint failed');
    }
  } catch (error) {
    console.log('❌ Resources endpoint error:', error.message);
  }

  console.log('\n🎉 Setup test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Go to Account Management to add your first AWS account');
  console.log('3. Test the connection and start monitoring resources');
}

// Run the test
testSetup().catch(console.error);
