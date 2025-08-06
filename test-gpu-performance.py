#!/usr/bin/env python3
"""
GPU vs CPU Performance Test for Ollama AI Enhancement
Test script to benchmark RTX 4080 GPU performance vs CPU performance

Requirements:
1. Ollama must be running with GPU support enabled
2. A model must be available (e.g., mistral:latest)
3. Backend server must be running (dev-start.py)

Usage: python3 test-gpu-performance.py
"""

import requests
import time
import json
import statistics
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:5000"
MODEL = "mistral:latest"  # Change if using different model
NUM_TESTS = 5  # Number of test runs for each mode

# Test clinical text samples of varying lengths
TEST_SAMPLES = [
    {
        "name": "Short Progress Note",
        "text": "Patient appears stable today. Mood improved from yesterday. No side effects reported. Continue current medication regimen."
    },
    {
        "name": "Medium Assessment",
        "text": "Patient presents with continued depressive symptoms including low mood, anhedonia, and fatigue. Sleep pattern remains disrupted with early morning awakening. Appetite has slightly improved since last visit. Patient reports mild anxiety in social situations but feels medication is helping overall. Vital signs stable. Continue current dosing of antidepressant and schedule follow-up in 2 weeks."
    },
    {
        "name": "Long Clinical Note",
        "text": "This 45-year-old patient with a history of major depressive disorder, recurrent, moderate severity, presents for routine follow-up. Chief complaint: 'I'm feeling better but still have some bad days.' Patient reports that overall mood has improved since starting current medication regimen 6 weeks ago. Describes mood as 'up and down' with good days outnumbering bad days approximately 4:1. Sleep has improved significantly - now sleeping through the night most nights, compared to previous early morning awakening at 3-4 AM. Appetite has returned to baseline. Patient denies suicidal ideation, homicidal ideation, or psychotic symptoms. Reports mild anxiety in crowded situations but states this is manageable. Side effects: mild dry mouth, occasional constipation, both tolerable. Compliance with medications is excellent. Mental status examination reveals cooperative patient with good eye contact, euthymic mood, congruent affect, logical thought process, no perceptual disturbances, intact insight and judgment. Continue current medication regimen with plan to reassess in 4 weeks."
    }
]

def get_auth_token():
    """Get authentication token for API requests"""
    login_data = {
        "username": "demo@medocpro.com",
        "password": "demo123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def check_ollama_status():
    """Check if Ollama is running and has the required model"""
    try:
        # Check if Ollama is accessible
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code != 200:
            print("❌ Ollama is not running or not accessible")
            return False
        
        models = response.json().get('models', [])
        model_names = [model['name'] for model in models]
        
        if MODEL not in model_names:
            print(f"❌ Model '{MODEL}' not found. Available models: {model_names}")
            print(f"Install with: ollama pull {MODEL}")
            return False
        
        print(f"✅ Ollama is running with model '{MODEL}'")
        return True
        
    except Exception as e:
        print(f"❌ Ollama check failed: {e}")
        return False

def test_ai_enhancement(token, text, compute_mode, style="professional"):
    """Test AI enhancement with specified compute mode"""
    
    url = f"{BACKEND_URL}/api/ai/enhance"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": text,
        "style": style,
        "compute_mode": compute_mode,
        "model": MODEL,
        "enhancement_type": "clinical",
        "intensity": 50
    }
    
    start_time = time.time()
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            enhanced_text = result.get('enhanced_text', '')
            if enhanced_text:  # Success if we got enhanced text
                duration = end_time - start_time
                
                return {
                    'success': True,
                    'duration': duration,
                    'original_length': len(text),
                    'enhanced_length': len(enhanced_text),
                    'tokens_per_second': len(enhanced_text.split()) / duration if duration > 0 else 0,
                    'processing_time_ms': result.get('processing_time_ms', 0),
                    'model_used': result.get('model_used', MODEL),
                    'compute_mode_used': result.get('enhancement_applied', {}).get('compute_mode', compute_mode)
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'No enhanced text returned'),
                    'duration': end_time - start_time
                }
        else:
            return {
                'success': False,
                'error': f"HTTP {response.status_code}: {response.text}",
                'duration': end_time - start_time
            }
            
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'Request timeout (120s)',
            'duration': 120
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'duration': time.time() - start_time
        }

def run_performance_test():
    """Run comprehensive performance test comparing CPU vs GPU"""
    
    print("🚀 GPU vs CPU Performance Test for RTX 4080")
    print("=" * 60)
    
    # Check prerequisites
    if not check_ollama_status():
        return
    
    token = get_auth_token()
    if not token:
        print("❌ Failed to get authentication token")
        return
    
    print(f"✅ Authentication successful")
    print()
    
    results = {
        'cpu': {},
        'gpu': {}
    }
    
    # Test each compute mode
    for compute_mode in ['cpu', 'gpu']:
        print(f"🔧 Testing {compute_mode.upper()} Mode")
        print("-" * 30)
        
        mode_results = []
        
        for sample in TEST_SAMPLES:
            print(f"Testing: {sample['name']} ({len(sample['text'])} chars)")
            
            sample_results = []
            sample_times = []
            
            # Run multiple tests for this sample
            for test_num in range(NUM_TESTS):
                print(f"  Run {test_num + 1}/{NUM_TESTS}... ", end="", flush=True)
                
                result = test_ai_enhancement(token, sample['text'], compute_mode)
                
                if result['success']:
                    sample_results.append(result)
                    sample_times.append(result['duration'])
                    print(f"✅ {result['duration']:.2f}s ({result['tokens_per_second']:.1f} tokens/s)")
                else:
                    print(f"❌ {result['error']}")
                
                # Small delay between requests
                time.sleep(1)
            
            if sample_times:
                avg_time = statistics.mean(sample_times)
                min_time = min(sample_times)
                max_time = max(sample_times)
                
                sample_summary = {
                    'name': sample['name'],
                    'text_length': len(sample['text']),
                    'avg_time': avg_time,
                    'min_time': min_time,
                    'max_time': max_time,
                    'successful_runs': len(sample_times),
                    'total_runs': NUM_TESTS
                }
                
                mode_results.append(sample_summary)
                
                print(f"  📊 Average: {avg_time:.2f}s (min: {min_time:.2f}s, max: {max_time:.2f}s)")
            else:
                print(f"  ❌ All tests failed for {sample['name']}")
            
            print()
        
        results[compute_mode] = mode_results
        print()
    
    # Generate performance comparison report
    print("📈 PERFORMANCE COMPARISON REPORT")
    print("=" * 60)
    
    report_data = []
    
    for i, sample in enumerate(TEST_SAMPLES):
        sample_name = sample['name']
        
        cpu_data = results['cpu'][i] if i < len(results['cpu']) else None
        gpu_data = results['gpu'][i] if i < len(results['gpu']) else None
        
        if cpu_data and gpu_data and cpu_data['successful_runs'] > 0 and gpu_data['successful_runs'] > 0:
            cpu_time = cpu_data['avg_time']
            gpu_time = gpu_data['avg_time']
            
            speedup = cpu_time / gpu_time if gpu_time > 0 else 0
            gpu_improvement = ((cpu_time - gpu_time) / cpu_time) * 100 if cpu_time > 0 else 0
            
            report_row = {
                'sample': sample_name,
                'text_length': len(sample['text']),
                'cpu_time': cpu_time,
                'gpu_time': gpu_time,
                'speedup': speedup,
                'improvement_pct': gpu_improvement
            }
            
            report_data.append(report_row)
            
            print(f"{sample_name:20} | CPU: {cpu_time:6.2f}s | GPU: {gpu_time:6.2f}s | Speedup: {speedup:4.1f}x | Improvement: {gpu_improvement:5.1f}%")
    
    if report_data:
        # Calculate overall averages
        avg_cpu_time = statistics.mean([r['cpu_time'] for r in report_data])
        avg_gpu_time = statistics.mean([r['gpu_time'] for r in report_data])
        avg_speedup = statistics.mean([r['speedup'] for r in report_data])
        avg_improvement = statistics.mean([r['improvement_pct'] for r in report_data])
        
        print("-" * 60)
        print(f"{'AVERAGE':20} | CPU: {avg_cpu_time:6.2f}s | GPU: {avg_gpu_time:6.2f}s | Speedup: {avg_speedup:4.1f}x | Improvement: {avg_improvement:5.1f}%")
        print()
        
        # RTX 4080 specific analysis
        print("🎮 RTX 4080 ANALYSIS")
        print("-" * 30)
        if avg_speedup > 3:
            print("🚀 EXCELLENT: Your RTX 4080 is providing significant AI acceleration!")
        elif avg_speedup > 2:
            print("✅ GOOD: Your RTX 4080 is providing solid AI performance improvement.")
        elif avg_speedup > 1.5:
            print("⚠️  MODERATE: GPU acceleration is working but may need optimization.")
        else:
            print("❌ POOR: GPU may not be properly configured or utilized.")
        
        print(f"Average processing time reduced by {avg_improvement:.1f}%")
        print(f"For a typical clinical note, you save ~{(avg_cpu_time - avg_gpu_time):.1f} seconds per enhancement")
        
        # Recommendations
        print()
        print("💡 RECOMMENDATIONS")
        print("-" * 20)
        if avg_speedup < 2:
            print("• Ensure CUDA drivers are up to date")
            print("• Check if Ollama is configured for GPU acceleration")
            print("• Verify model is using GPU memory (nvidia-smi)")
        else:
            print("• GPU acceleration is working well!")
            print("• Consider using GPU mode for faster AI enhancements")
            print("• Your RTX 4080 significantly improves AI performance")
    
    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"gpu_performance_test_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'model': MODEL,
            'num_tests': NUM_TESTS,
            'gpu_model': "RTX 4080",
            'results': results,
            'summary': report_data
        }, f, indent=2)
    
    print(f"\n📁 Detailed results saved to: {filename}")

if __name__ == "__main__":
    run_performance_test()