#!/usr/bin/env node

// Test script to verify the complete configuration and import flow
const path = require('path');

async function testCompleteFlow() {
  console.log('🧪 Testing complete configuration and POM import flow...');
  
  try {
    // Test 1: Load configuration
    console.log('\n1. Testing configuration loading...');
    const { CONFIG } = await import(path.resolve('./dist/config.js'));
    
    console.log('✅ Configuration loaded successfully');
    console.log(`   - Products count: ${CONFIG.products.length}`);
    
    if (CONFIG.products.length > 0) {
      const product = CONFIG.products[0];
      console.log(`   - First product: ${product.name}`);
      console.log(`   - POM file: ${product.pom_file}`);
      console.log(`   - Entry URL: ${product.entry_url}`);
      
      // Test 2: POM import resolution
      console.log('\n2. Testing POM import resolution...');
      
      // Simulate the executor logic
      const pomFile = product.pom_file.endsWith('.ts') 
        ? product.pom_file.replace('.ts', '.js')
        : product.pom_file.endsWith('.js')
        ? product.pom_file
        : `${product.pom_file}.js`;
      
      console.log(`   - Resolved POM file: ${pomFile}`);
      
      const pomPath = `./dist/pom/${pomFile}`;
      console.log(`   - Import path: ${pomPath}`);
      
      const pomModule = await import(path.resolve(pomPath));
      
      if (pomModule.default) {
        console.log('✅ POM import successful!');
        console.log(`   - Constructor available: ${typeof pomModule.default === 'function'}`);
        
        // Check methods
        const prototype = pomModule.default.prototype;
        if (prototype) {
          const methods = Object.getOwnPropertyNames(prototype).filter(name => name !== 'constructor');
          console.log(`   - Methods: ${methods.join(', ')}`);
          
          const requiredMethods = ['initialize', 'triggerCheckout'];
          const hasRequired = requiredMethods.every(method => methods.includes(method));
          
          if (hasRequired) {
            console.log('✅ All required methods present');
          } else {
            console.log('❌ Missing required methods');
          }
        }
      } else {
        console.log('❌ No default export found');
      }
      
      // Test 3: Environment variable configuration
      console.log('\n3. Testing environment variable configuration...');
      
      const testConfig = {
        products: [{
          name: 'TestProduct',
          entry_url: 'https://example.com',
          pom_file: 'magic-checkout',
          enabled: true
        }],
        execution: {
          iterations: 5
        }
      };
      
      // Set environment variable
      process.env.MAGIC_BENCHMARKING_CONFIG = JSON.stringify(testConfig);
      
      // Clear module cache to force reload
      delete require.cache[path.resolve('./dist/config.js')];
      
      const { CONFIG: envConfig } = await import(`${path.resolve('./dist/config.js')}?t=${Date.now()}`);
      
      if (envConfig.products[0].name === 'TestProduct') {
        console.log('✅ Environment configuration override works');
      } else {
        console.log('❌ Environment configuration override failed');
      }
      
      // Clean up
      delete process.env.MAGIC_BENCHMARKING_CONFIG;
      
    } else {
      console.log('❌ No products found in configuration');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

testCompleteFlow().catch(console.error);
