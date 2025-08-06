#!/usr/bin/env python3
"""
Ollama GPU Setup Helper for RTX 4080
This script helps configure and test Ollama for GPU acceleration

Usage: python3 setup-ollama-gpu.py
"""

import requests
import subprocess
import time
import json
import sys

def check_nvidia_gpu():
    """Check if NVIDIA GPU is available and CUDA is working"""
    print("🔍 Checking NVIDIA GPU and CUDA setup...")
    
    try:
        # Check nvidia-smi
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ NVIDIA GPU detected!")
            lines = result.stdout.split('\n')
            for line in lines:
                if 'RTX 4080' in line or 'GeForce RTX' in line:
                    print(f"   GPU: {line.strip()}")
                    break
            return True
        else:
            print("❌ nvidia-smi not found or failed")
            return False
    except FileNotFoundError:
        print("❌ nvidia-smi command not found. Install NVIDIA drivers.")
        return False

def check_ollama_status():
    """Check if Ollama is running"""
    print("\n🔍 Checking Ollama status...")
    
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"✅ Ollama is running with {len(models)} models")
            return True, models
        else:
            print("❌ Ollama is not responding properly")
            return False, []
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return False, []

def install_recommended_model():
    """Install a recommended model for testing"""
    print("\n🚀 Installing recommended model (mistral:7b)...")
    
    try:
        # Pull mistral:7b model
        result = subprocess.run(['ollama', 'pull', 'mistral:7b'], 
                               capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Model installed successfully!")
            return True
        else:
            print(f"❌ Failed to install model: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("⏰ Model installation timed out (this is normal for large models)")
        return False
    except FileNotFoundError:
        print("❌ 'ollama' command not found. Please install Ollama first.")
        return False

def test_gpu_acceleration():
    """Test if GPU acceleration is working"""
    print("\n🧪 Testing GPU acceleration...")
    
    test_prompt = "Explain what a GPU is in one sentence."
    
    # Test CPU mode
    print("Testing CPU mode...")
    cpu_start = time.time()
    cpu_result = test_ollama_generation(test_prompt, use_gpu=False)
    cpu_time = time.time() - cpu_start
    
    # Test GPU mode
    print("Testing GPU mode...")
    gpu_start = time.time()
    gpu_result = test_ollama_generation(test_prompt, use_gpu=True)
    gpu_time = time.time() - gpu_start
    
    if cpu_result and gpu_result:
        speedup = cpu_time / gpu_time if gpu_time > 0 else 0
        print(f"\n📊 Performance Results:")
        print(f"   CPU Mode: {cpu_time:.2f}s")
        print(f"   GPU Mode: {gpu_time:.2f}s")
        print(f"   Speedup: {speedup:.1f}x")
        
        if speedup > 1.5:
            print("🚀 GPU acceleration is working well!")
        elif speedup > 1.0:
            print("✅ GPU acceleration is working but moderate improvement")
        else:
            print("⚠️  GPU may not be properly configured")
            
        return True
    else:
        print("❌ Testing failed")
        return False

def test_ollama_generation(prompt, use_gpu=True):
    """Test Ollama text generation"""
    
    options = {
        "temperature": 0.7,
        "num_predict": 50,
    }
    
    if use_gpu:
        options.update({
            "num_gpu": -1,  # Use all GPUs
            "num_thread": 1,
        })
    else:
        options.update({
            "num_gpu": 0,   # No GPU
            "num_thread": -1,  # Use all CPU threads
        })
    
    payload = {
        "model": "mistral:7b",
        "prompt": prompt,
        "stream": False,
        "options": options
    }
    
    try:
        response = requests.post("http://localhost:11434/api/generate", 
                               json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', '')
        else:
            print(f"   Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"   Error: {e}")
        return None

def show_configuration_tips():
    """Show tips for optimal GPU configuration"""
    print("\n💡 GPU Configuration Tips for RTX 4080:")
    print("=" * 50)
    print("1. Ensure CUDA is installed and working:")
    print("   - Install NVIDIA CUDA Toolkit")
    print("   - Verify with: nvidia-smi")
    print()
    print("2. Ollama GPU Environment Variables:")
    print("   - CUDA_VISIBLE_DEVICES=0  (use first GPU)")
    print("   - OLLAMA_NUM_PARALLEL=1   (limit parallel requests)")
    print()
    print("3. For Windows with WSL2:")
    print("   - Install CUDA in WSL2")
    print("   - Use Windows Docker Desktop with GPU support")
    print()
    print("4. Model Recommendations for RTX 4080:")
    print("   - mistral:7b      (good balance)")
    print("   - llama2:7b       (compatible)")
    print("   - codellama:7b    (for code)")
    print()
    print("5. Performance Optimization:")
    print("   - Close other GPU applications")
    print("   - Monitor GPU memory with nvidia-smi")
    print("   - Use smaller models for faster inference")

def main():
    """Main setup and test routine"""
    print("🎮 Ollama GPU Setup for RTX 4080")
    print("=" * 40)
    
    # Check GPU
    gpu_available = check_nvidia_gpu()
    
    # Check Ollama
    ollama_running, models = check_ollama_status()
    
    if not ollama_running:
        print("\n❌ Please start Ollama first:")
        print("   ollama serve")
        return
    
    # Check if we have a suitable model
    model_names = [m['name'] for m in models]
    has_mistral = any('mistral' in name for name in model_names)
    
    if not has_mistral:
        print("\n📥 No suitable model found for testing.")
        install_choice = input("Install mistral:7b for testing? (y/n): ")
        if install_choice.lower() == 'y':
            if not install_recommended_model():
                print("❌ Model installation failed. Please install manually:")
                print("   ollama pull mistral:7b")
                return
    
    # Test GPU acceleration
    if gpu_available:
        test_gpu_acceleration()
    else:
        print("\n⚠️  GPU not available. Ollama will use CPU mode.")
    
    # Show configuration tips
    show_configuration_tips()
    
    print("\n🔧 Next Steps:")
    print("1. Run the performance test: python3 test-gpu-performance.py")
    print("2. Open MeDocPro and test AI Enhancement settings")
    print("3. Compare CPU vs GPU modes in the AI Enhancement modal")

if __name__ == "__main__":
    main()