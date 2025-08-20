from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
import platform
import subprocess
import psutil

ai_system_info_bp = Blueprint('ai_system_info', __name__)

@ai_system_info_bp.route('/ai-system-info', methods=['GET'])
@jwt_required()
def get_ai_system_info():
    """
    Get AI system information including GPU availability and compute type.
    Detects if the system is running CPU-only or has GPU acceleration.
    """
    try:
        system_info = {
            'platform': platform.system(),
            'architecture': platform.machine(),
            'processor': platform.processor(),
            'cpu_count': psutil.cpu_count(),
            'memory_gb': round(psutil.virtual_memory().total / (1024**3), 1),
            'gpu_available': False,
            'device_type': 'cpu',
            'compute_type': 'cpu',
            'gpu_info': []
        }
        
        # Try to detect GPU availability
        gpu_detected = False
        gpu_info = []
        
        # Method 1: Check NVIDIA GPU using nvidia-smi
        try:
            result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader,nounits'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0 and result.stdout.strip():
                gpu_lines = result.stdout.strip().split('\n')
                for line in gpu_lines:
                    if line.strip():
                        parts = line.split(',')
                        if len(parts) >= 2:
                            gpu_info.append({
                                'name': parts[0].strip(),
                                'memory_mb': parts[1].strip(),
                                'type': 'NVIDIA'
                            })
                gpu_detected = True
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
            pass
        
        # Method 2: Check for AMD GPU (basic detection)
        if not gpu_detected:
            try:
                # Try lspci on Linux
                if platform.system() == 'Linux':
                    result = subprocess.run(['lspci'], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        lspci_output = result.stdout.lower()
                        if 'amd' in lspci_output and ('radeon' in lspci_output or 'vega' in lspci_output):
                            gpu_info.append({
                                'name': 'AMD GPU (detected via lspci)',
                                'memory_mb': 'Unknown',
                                'type': 'AMD'
                            })
                            gpu_detected = True
            except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
                pass
        
        # Method 3: Check for integrated graphics or other indicators
        if not gpu_detected:
            try:
                # Check if we're in a container or VM (likely CPU-only)
                if platform.system() == 'Linux':
                    # Check for common virtualization indicators
                    with open('/proc/cpuinfo', 'r') as f:
                        cpuinfo = f.read().lower()
                        if 'hypervisor' in cpuinfo or 'vmware' in cpuinfo or 'virtualbox' in cpuinfo:
                            system_info['virtualized'] = True
            except Exception:
                pass
        
        # Update system info based on detection
        if gpu_detected:
            system_info['gpu_available'] = True
            system_info['device_type'] = 'gpu'
            system_info['compute_type'] = 'gpu'
            system_info['gpu_info'] = gpu_info
        
        # Additional detection: Check if running in Docker or limited environment
        try:
            # Check for Docker environment
            with open('/proc/1/cgroup', 'r') as f:
                cgroup_content = f.read()
                if 'docker' in cgroup_content or 'container' in cgroup_content:
                    system_info['containerized'] = True
                    # In containers, even if GPU is detected, it might not be accessible
                    if not gpu_info:
                        system_info['likely_cpu_only'] = True
        except FileNotFoundError:
            # Not in a typical Linux container
            pass
        except Exception:
            pass
        
        # Final determination: If no clear GPU detected, assume CPU-only
        if not gpu_detected:
            system_info['device_type'] = 'cpu'
            system_info['compute_type'] = 'cpu'
            system_info['gpu_available'] = False
        
        return jsonify({
            'success': True,
            **system_info
        })
        
    except Exception as e:
        # On any error, default to CPU-only assumption
        return jsonify({
            'success': True,
            'platform': platform.system(),
            'gpu_available': False,
            'device_type': 'cpu',
            'compute_type': 'cpu',
            'gpu_info': [],
            'error': str(e),
            'detection_failed': True
        })