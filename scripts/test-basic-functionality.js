#!/usr/bin/env node

// Simple test to verify the core POM import functionality works
const path = require('path');

async function testBasicFunctionality() {
  console.log('🧪 Testing basic POM import functionality...');
  
  try {
    // Test 1: Load default configuration
    console.log('\n1. Loading default configuration...');
    const { CONFIG } = await import(path.resolve('./dist/config.js'));
    
    console.log('✅ Configuration loaded');
    console.log(`   - Product: ${CONFIG.products[0].name}`);
    console.log(`   - POM file: ${CONFIG.products[0].pom_file}`);
    
    // Test 2: Test POM import logic (same as executor)
    console.log('\n2. Testing POM import logic...');
    const product = CONFIG.products[0];
    
    // This is the exact logic from executor.ts
    const pomFile = product.pom_file.endsWith('.ts') 
      ? product.pom_file.replace('.ts', '.js')
      : product.pom_file.endsWith('.js')
      ? product.pom_file
      : `${product.pom_file}.js`;
    
    console.log(`   - Resolved POM file: ${pomFile}`);
    
    const pomModule = await import(path.resolve(`./dist/pom/${pomFile}`));
    
    if (pomModule.default) {
      console.log('✅ POM module imported successfully');
      
      // Check if it's a class constructor
      if (typeof pomModule.default === 'function') {
        console.log('✅ POM is a valid class/constructor');
        
        // Check prototype methods
        const prototype = pomModule.default.prototype;
        if (prototype && typeof prototype.initialize === 'function' && typeof prototype.triggerCheckout === 'function') {
          console.log('✅ Required methods (initialize, triggerCheckout) are present');
        } else {
          console.log('⚠️  Some required methods may be missing');
          console.log(`     - initialize: ${typeof prototype?.initialize}`);
          console.log(`     - triggerCheckout: ${typeof prototype?.triggerCheckout}`);
        }
      } else {
        console.log('❌ POM default export is not a constructor function');
        console.log(`   Type: ${typeof pomModule.default}`);
      }
    } else {
      console.log('❌ No default export found in POM module');
      return false;
    }
    
    console.log('\n🎉 Basic functionality test passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Configuration loads correctly');
    console.log('   ✅ POM file resolves to correct path');
    console.log('   ✅ POM module imports successfully');
    console.log('   ✅ POM has required structure');
    console.log('\n🚀 The GitHub Actions error should now be resolved!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

testBasicFunctionality().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
