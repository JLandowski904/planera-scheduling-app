// Test Supabase Connection and Setup
// Run with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please add these to your .env file:');
  console.error('- REACT_APP_SUPABASE_URL');
  console.error('- REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');

    // Test database schema
    console.log('\n🔍 Testing database schema...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
      return false;
    }

    console.log('✅ Profiles table accessible');

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      console.error('❌ Projects table error:', projectsError.message);
      return false;
    }

    console.log('✅ Projects table accessible');

    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('*')
      .limit(1);

    if (membersError) {
      console.error('❌ Project members table error:', membersError.message);
      return false;
    }

    console.log('✅ Project members table accessible');

    // Test authentication
    console.log('\n🔍 Testing authentication...');
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`📊 Current session: ${session ? 'Active' : 'None'}`);

    console.log('\n✅ All tests passed! Supabase is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm start');
    console.log('2. Test user registration and login');
    console.log('3. Create a new project');
    console.log('4. Verify data is saved to Supabase');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase setup is complete!');
    process.exit(0);
  } else {
    console.log('\n💥 Supabase setup failed. Please check your configuration.');
    process.exit(1);
  }
});

