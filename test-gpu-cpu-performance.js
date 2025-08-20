#!/usr/bin/env node

/**
 * GPU vs CPU Performance Test Script for MeDocPro AI Enhancement
 * 
 * This script tests the performance difference between GPU and CPU modes
 * for AI text enhancement using the MeDocPro API.
 * 
 * Usage:
 * node test-gpu-cpu-performance.js
 * 
 * Prerequisites:
 * - MeDocPro backend running on localhost:5000
 * - Valid authentication token
 * - Ollama running with a model (e.g., mistral:latest)
 * - GPU drivers installed for GPU testing (CUDA/ROCm)
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_TEXT = `Patient reports feeling anxious and having difficulty sleeping. Sleep has been disrupted with frequent awakenings. Energy levels are low throughout the day. Mood appears stable but patient expresses concerns about work performance. No suicidal ideation reported. Patient is compliant with current medication regimen. No significant side effects noted.`;

// Test settings
const TEST_SCENARIOS = [
  { compute_mode: 'cpu', model: 'mistral:latest', iterations: 3 },
  { compute_mode: 'gpu', model: 'mistral:latest', iterations: 3 }
];

// You need to get this token by logging into MeDocPro and checking localStorage
const AUTH_TOKEN = process.env.MEDOCPRO_TOKEN || 'YOUR_TOKEN_HERE';

if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ Please set your authentication token:');
  console.log('1. Log into MeDocPro in your browser');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Go to Application > Local Storage > http://localhost:5173');
  console.log('4. Copy the value of the "token" key');
  console.log('5. Run: MEDOCPRO_TOKEN="your_token_here" node test-gpu-cpu-performance.js');
  process.exit(1);
}

// Make API request
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/enhance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test AI enhancement with specific compute mode
async function testEnhancement(computeMode, model, iteration) {
  const requestData = {
    text: TEST_TEXT,
    enhancement_type: 'clinical',
    intensity: 50,
    style: 'professional',
    model: model,
    compute_mode: computeMode,
    include_spell_check: true,
    include_grammar_check: true,
    preserve_structure: true
  };

  console.log(`\n🧪 Test ${iteration + 1} - ${computeMode.toUpperCase()} Mode`);
  console.log(`Model: ${model}`);
  console.log(`Text Length: ${TEST_TEXT.length} characters`);

  const startTime = Date.now();
  
  try {
    const response = await makeRequest(requestData);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    if (response.status === 200 && response.data.enhanced_text) {
      const result = response.data;
      
      console.log(`✅ SUCCESS:`);
      console.log(`   Compute Mode Used: ${result.compute_mode_used?.toUpperCase() || computeMode.toUpperCase()}`);
      console.log(`   Server Processing: ${result.processing_time_ms}ms`);
      console.log(`   Total Request Time: ${totalTime}ms`);
      console.log(`   Model Used: ${result.model_used || model}`);
      console.log(`   Input Length: ${result.original_length} chars`);
      console.log(`   Output Length: ${result.enhanced_length} chars`);
      console.log(`   Enhancement Preview: "${result.enhanced_text.substring(0, 80)}..."`);
      
      return {
        success: true,
        computeMode: result.compute_mode_used || computeMode,
        serverTime: result.processing_time_ms,
        totalTime: totalTime,
        model: result.model_used || model,
        inputLength: result.original_length,
        outputLength: result.enhanced_length
      };
    } else {
      console.log(`❌ FAILED: ${response.data.error || 'Unknown error'}`);
      return {
        success: false,
        error: response.data.error || 'Unknown error',
        totalTime: totalTime
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`❌ ERROR: ${error.message}`);
    return {
      success: false,
      error: error.message,
      totalTime: totalTime
    };
  }
}

// Run performance comparison
async function runPerformanceTest() {
  console.log('🚀 Starting GPU vs CPU Performance Test for MeDocPro AI Enhancement');
  console.log('=' .repeat(80));
  
  const results = {
    cpu: [],
    gpu: []
  };

  // Test each scenario
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📊 Testing ${scenario.compute_mode.toUpperCase()} Mode (${scenario.iterations} iterations)`);
    console.log('-'.repeat(60));
    
    for (let i = 0; i < scenario.iterations; i++) {
      const result = await testEnhancement(scenario.compute_mode, scenario.model, i);
      results[scenario.compute_mode].push(result);
      
      // Wait between requests to avoid overwhelming the server
      if (i < scenario.iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Calculate and display results
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE COMPARISON RESULTS');
  console.log('='.repeat(80));

  ['cpu', 'gpu'].forEach(mode => {
    const modeResults = results[mode].filter(r => r.success);
    
    if (modeResults.length > 0) {
      const avgServerTime = modeResults.reduce((sum, r) => sum + r.serverTime, 0) / modeResults.length;
      const avgTotalTime = modeResults.reduce((sum, r) => sum + r.totalTime, 0) / modeResults.length;
      const minServerTime = Math.min(...modeResults.map(r => r.serverTime));
      const maxServerTime = Math.max(...modeResults.map(r => r.serverTime));
      
      console.log(`\n${mode.toUpperCase()} Mode Results (${modeResults.length} successful tests):`);
      console.log(`   Average Server Time: ${Math.round(avgServerTime)}ms`);
      console.log(`   Average Total Time:  ${Math.round(avgTotalTime)}ms`);
      console.log(`   Min Server Time:     ${minServerTime}ms`);
      console.log(`   Max Server Time:     ${maxServerTime}ms`);
    } else {
      console.log(`\n${mode.toUpperCase()} Mode: ❌ No successful tests`);
    }
  });

  // Performance comparison
  const cpuSuccess = results.cpu.filter(r => r.success);
  const gpuSuccess = results.gpu.filter(r => r.success);

  if (cpuSuccess.length > 0 && gpuSuccess.length > 0) {
    const cpuAvg = cpuSuccess.reduce((sum, r) => sum + r.serverTime, 0) / cpuSuccess.length;
    const gpuAvg = gpuSuccess.reduce((sum, r) => sum + r.serverTime, 0) / gpuSuccess.length;
    
    const speedup = (cpuAvg / gpuAvg).toFixed(2);
    const improvement = ((cpuAvg - gpuAvg) / cpuAvg * 100).toFixed(1);
    
    console.log('\n🏁 FINAL COMPARISON:');
    console.log(`   CPU Average: ${Math.round(cpuAvg)}ms`);
    console.log(`   GPU Average: ${Math.round(gpuAvg)}ms`);
    
    if (gpuAvg < cpuAvg) {
      console.log(`   🚀 GPU is ${speedup}x faster (${improvement}% improvement)`);
    } else if (cpuAvg < gpuAvg) {
      const slowdown = (gpuAvg / cpuAvg).toFixed(2);
      const regression = ((gpuAvg - cpuAvg) / cpuAvg * 100).toFixed(1);
      console.log(`   ⚠️  GPU is ${slowdown}x slower (${regression}% slower) - Check GPU setup`);
    } else {
      console.log(`   ⚖️  No significant difference between CPU and GPU`);
    }
  }

  console.log('\n💡 RECOMMENDATIONS:');
  if (gpuSuccess.length === 0) {
    console.log('   - GPU mode failed. Check if CUDA/ROCm drivers are installed');
    console.log('   - Verify GPU is supported by Ollama');
    console.log('   - Check Ollama logs for GPU-related errors');
  } else if (cpuSuccess.length > 0 && gpuSuccess.length > 0) {
    const cpuAvg = cpuSuccess.reduce((sum, r) => sum + r.serverTime, 0) / cpuSuccess.length;
    const gpuAvg = gpuSuccess.reduce((sum, r) => sum + r.serverTime, 0) / gpuSuccess.length;
    
    if (gpuAvg < cpuAvg * 0.8) {
      console.log('   - Use GPU mode for better performance');
    } else if (gpuAvg > cpuAvg * 1.2) {
      console.log('   - Use CPU mode - GPU overhead may not be worth it for this model size');
    } else {
      console.log('   - Performance is similar - use CPU mode to save GPU resources');
    }
  }

  console.log('\n✅ Test completed!');
}

// Handle errors and run the test
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
runPerformanceTest().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});