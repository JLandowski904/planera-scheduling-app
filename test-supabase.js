// Simple test script to verify Supabase connection
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure you have:')
  console.error('- REACT_APP_SUPABASE_URL')
  console.error('- REACT_APP_SUPABASE_ANON_KEY')
  console.error('in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('📊 Database is accessible')
    
    // Test auth
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔐 Auth system is ready')
    
    return true
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Your Supabase setup is ready!')
    console.log('You can now run: npm start')
  } else {
    console.log('\n💡 Make sure you have:')
    console.log('1. Created a Supabase project')
    console.log('2. Run the schema from supabase-schema.sql')
    console.log('3. Set the correct environment variables')
  }
})



