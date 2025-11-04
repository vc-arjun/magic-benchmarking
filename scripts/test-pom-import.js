#!/usr/bin/env node

// Test script to verify POM import works correctly
const path = require('path');

async function testPomImport() {
  console.log('🧪 Testing POM import resolution...');
  
  try {
    // Test the import path that would be used in production
    const pomPath = './dist/pom/magic-checkout';
    console.log(`Attempting to import: ${pomPath}`);
    
    const pomModule = await import(path.resolve(pomPath));
    
    if (pomModule.default) {
      console.log('✅ POM import successful!');
      console.log(`   - Module type: ${typeof pomModule.default}`);
      console.log(`   - Is constructor: ${typeof pomModule.default === 'function'}`);
      
      // Check if it has the expected methods
      const prototype = pomModule.default.prototype;
      if (prototype) {
        const methods = Object.getOwnPropertyNames(prototype).filter(name => name !== 'constructor');
        console.log(`   - Available methods: ${methods.join(', ')}`);
        
        const expectedMethods = ['initialize', 'triggerCheckout'];
        const hasAllMethods = expectedMethods.every(method => methods.includes(method));
        
        if (hasAllMethods) {
          console.log('✅ All expected methods are present');
        } else {
          console.log('⚠️  Some expected methods are missing');
        }
      }
    } else {
      console.log('❌ POM module does not have default export');
    }
    
  } catch (error) {
    console.log('❌ POM import failed:');
    console.log(`   Error: ${error.message}`);
    
    // Try alternative import paths
    console.log('\n🔄 Trying alternative import paths...');
    
    const alternatives = [
      './dist/pom/magic-checkout.js',
      '../dist/pom/magic-checkout',
      '../dist/pom/magic-checkout.js'
    ];
    
    for (const altPath of alternatives) {
      try {
        console.log(`   Trying: ${altPath}`);
        const altModule = await import(path.resolve(altPath));
        if (altModule.default) {
          console.log(`   ✅ Success with: ${altPath}`);
          break;
        }
      } catch (altError) {
        console.log(`   ❌ Failed: ${altError.message}`);
      }
    }
  }
}

// Check if dist directory exists
const fs = require('fs');
const distPath = path.resolve('./dist');

if (!fs.existsSync(distPath)) {
  console.log('❌ dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const pomPath = path.resolve('./dist/pom/magic-checkout.js');
if (!fs.existsSync(pomPath)) {
  console.log('❌ Compiled POM file not found. Please run "npm run build" first.');
  console.log(`   Expected: ${pomPath}`);
  process.exit(1);
}

console.log('✅ Compiled files found, running import test...\n');
testPomImport().catch(console.error);
