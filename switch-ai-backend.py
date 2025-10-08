#!/usr/bin/env python3
"""
AI Backend Switcher for MeDocPro
Allows switching between Ollama and llama-server configurations
"""

import os
import sys
import shutil
from pathlib import Path
import argparse

class AIBackendSwitcher:
    def __init__(self):
        # Detect if running in WSL or native Windows
        if 'WSL_DISTRO_NAME' in os.environ or '/mnt/c/' in str(Path.cwd()):
            # WSL environment
            self.base_dir = Path("/mnt/c/Users/admin/Desktop/MeDocPro")
        else:
            # Native Windows environment
            self.base_dir = Path("C:/Users/admin/Desktop/MeDocPro")
            # Also try current working directory if the above doesn't work
            if not self.base_dir.exists():
                self.base_dir = Path.cwd()
        self.env_file = self.base_dir / ".env"
        self.config_file = self.base_dir / "config.py"
        self.ai_enhancement_file = self.base_dir / "app" / "routes" / "ai_enhancement.py"
        
        # Backup directories
        self.backup_dir = self.base_dir / "migration_backups"
        self.backup_dir.mkdir(exist_ok=True)
    
    def backup_current_config(self, backend_name):
        """Backup current configuration"""
        print(f"💾 Backing up current {backend_name} configuration...")
        
        backup_subdir = self.backup_dir / f"{backend_name}_config"
        backup_subdir.mkdir(exist_ok=True)
        
        # Backup key files
        files_to_backup = [
            (".env", self.env_file),
            ("config.py", self.config_file),
            ("ai_enhancement.py", self.ai_enhancement_file)
        ]
        
        for backup_name, source_file in files_to_backup:
            if source_file.exists():
                backup_path = backup_subdir / backup_name
                shutil.copy2(source_file, backup_path)
                print(f"   ✅ Backed up {backup_name}")
            else:
                print(f"   ⚠️  {backup_name} not found, skipping")
    
    def switch_to_ollama(self):
        """Switch configuration to use Ollama"""
        print("🔄 Switching to Ollama configuration...")
        
        # Backup current state
        self.backup_current_config("llama_server")
        
        # Update .env file
        self.update_env_for_ollama()
        
        # Update ai_enhancement.py
        self.update_code_for_ollama()
        
        print("✅ Switched to Ollama configuration")
        print("📋 To use Ollama:")
        print("   1. Start Ollama: ollama serve")
        print("   2. Pull model: ollama pull mistral")
        print("   3. Start MeDocPro: dev-start.bat")
    
    def switch_to_llama_server(self):
        """Switch configuration to use llama-server"""
        print("🔄 Switching to llama-server configuration...")
        
        # Backup current state
        self.backup_current_config("ollama")
        
        # Update .env file
        self.update_env_for_llama_server()
        
        # Update ai_enhancement.py
        self.update_code_for_llama_server()
        
        print("✅ Switched to llama-server configuration")
        print("📋 To use llama-server:")
        print("   1. Download model: python scripts/download-models.py recommended")
        print("   2. Start MeDocPro: dev-start-llama.bat")
    
    def update_env_for_ollama(self):
        """Update .env file for Ollama"""
        print("⚙️ Updating .env for Ollama...")
        
        if not self.env_file.exists():
            print("   ❌ .env file not found")
            return
        
        content = self.env_file.read_text()
        
        # Comment out llama-server configs
        content = content.replace("LLAMA_SERVER_URL=", "# LLAMA_SERVER_URL=")
        content = content.replace("LLAMA_MODEL_PATH=", "# LLAMA_MODEL_PATH=")
        content = content.replace("LLAMA_THREADS=", "# LLAMA_THREADS=")
        content = content.replace("LLAMA_CONTEXT_SIZE=", "# LLAMA_CONTEXT_SIZE=")
        
        # Ensure Ollama configs are active
        ollama_configs = [
            "OLLAMA_URL=http://localhost:11434",
            "OLLAMA_MODEL=mistral:latest"
        ]
        
        # Add Ollama configs if not present
        if "OLLAMA_URL=" not in content:
            content += "\n# Ollama Configuration (Active)\n"
            for config in ollama_configs:
                content += f"{config}\n"
        else:
            # Uncomment existing Ollama configs
            content = content.replace("# OLLAMA_URL=", "OLLAMA_URL=")
            content = content.replace("# OLLAMA_MODEL=", "OLLAMA_MODEL=")
        
        self.env_file.write_text(content)
        print("   ✅ .env updated for Ollama")
    
    def update_env_for_llama_server(self):
        """Update .env file for llama-server"""
        print("⚙️ Updating .env for llama-server...")
        
        if not self.env_file.exists():
            print("   ❌ .env file not found")
            return
        
        content = self.env_file.read_text()
        
        # Comment out Ollama configs
        content = content.replace("OLLAMA_URL=", "# OLLAMA_URL=")
        content = content.replace("OLLAMA_MODEL=", "# OLLAMA_MODEL=")
        
        # Ensure llama-server configs are active
        # Use appropriate path format based on environment
        if 'WSL_DISTRO_NAME' in os.environ or '/mnt/c/' in str(Path.cwd()):
            model_path = "/mnt/c/Users/admin/Desktop/MeDocPro/models/mistral-7b-instruct-v0.3.Q4_K_M.gguf"
        else:
            model_path = "C:/Users/admin/Desktop/MeDocPro/models/mistral-7b-instruct-v0.3.Q4_K_M.gguf"
        
        llama_configs = [
            "LLAMA_SERVER_URL=http://localhost:8080",
            f"LLAMA_MODEL_PATH={model_path}",
            "LLAMA_THREADS=4",
            "LLAMA_CONTEXT_SIZE=4096"
        ]
        
        # Add llama-server configs if not present
        if "LLAMA_SERVER_URL=" not in content:
            content += "\n# llama.cpp Configuration (Active)\n"
            for config in llama_configs:
                content += f"{config}\n"
        else:
            # Uncomment existing llama-server configs
            content = content.replace("# LLAMA_SERVER_URL=", "LLAMA_SERVER_URL=")
            content = content.replace("# LLAMA_MODEL_PATH=", "LLAMA_MODEL_PATH=")
            content = content.replace("# LLAMA_THREADS=", "LLAMA_THREADS=")
            content = content.replace("# LLAMA_CONTEXT_SIZE=", "LLAMA_CONTEXT_SIZE=")
        
        self.env_file.write_text(content)
        print("   ✅ .env updated for llama-server")
    
    def update_code_for_ollama(self):
        """Update ai_enhancement.py to use Ollama"""
        print("🔧 Updating code for Ollama...")
        
        if not self.ai_enhancement_file.exists():
            print("   ❌ ai_enhancement.py not found")
            return
        
        content = self.ai_enhancement_file.read_text()
        
        # Switch main enhancement function to use Ollama
        content = content.replace(
            "call_llama_server_api(",
            "call_ollama_api("
        )
        
        # Update status checking URL reference
        content = content.replace(
            "llama_server_url = current_app.config.get('LLAMA_SERVER_URL'",
            "ollama_url = current_app.config.get('OLLAMA_BASE_URL'"
        )
        
        self.ai_enhancement_file.write_text(content)
        print("   ✅ Code updated for Ollama")
    
    def update_code_for_llama_server(self):
        """Update ai_enhancement.py to use llama-server"""
        print("🔧 Updating code for llama-server...")
        
        if not self.ai_enhancement_file.exists():
            print("   ❌ ai_enhancement.py not found")
            return
        
        content = self.ai_enhancement_file.read_text()
        
        # Switch main enhancement function to use llama-server
        content = content.replace(
            "call_ollama_api(",
            "call_llama_server_api("
        )
        
        # Update status checking URL reference  
        content = content.replace(
            "ollama_url = current_app.config.get('OLLAMA_BASE_URL'",
            "llama_server_url = current_app.config.get('LLAMA_SERVER_URL'"
        )
        
        self.ai_enhancement_file.write_text(content)
        print("   ✅ Code updated for llama-server")
    
    def show_current_status(self):
        """Show current backend configuration"""
        print("📊 Current AI Backend Configuration:")
        print("=" * 50)
        
        if not self.env_file.exists():
            print("❌ .env file not found")
            return
        
        content = self.env_file.read_text()
        
        # Check for active configurations
        ollama_active = (
            "OLLAMA_URL=http://localhost:11434" in content and 
            not content.count("# OLLAMA_URL=http://localhost:11434")
        )
        
        llama_active = (
            "LLAMA_SERVER_URL=http://localhost:8080" in content and 
            not content.count("# LLAMA_SERVER_URL=http://localhost:8080")
        )
        
        print(f"🤖 Ollama: {'✅ ACTIVE' if ollama_active else '❌ Inactive'}")
        print(f"🦙 llama-server: {'✅ ACTIVE' if llama_active else '❌ Inactive'}")
        
        if ollama_active and llama_active:
            print("⚠️  WARNING: Both backends are active - this may cause conflicts")
        elif not ollama_active and not llama_active:
            print("⚠️  WARNING: No AI backend is active")
        
        # Show backup status
        print(f"\n💾 Backups available:")
        if (self.backup_dir / "ollama_config").exists():
            print("   ✅ Ollama configuration backup")
        if (self.backup_dir / "llama_server_config").exists():
            print("   ✅ llama-server configuration backup")
    
    def restore_backup(self, backend_name):
        """Restore from backup"""
        backup_subdir = self.backup_dir / f"{backend_name}_config"
        
        if not backup_subdir.exists():
            print(f"❌ No backup found for {backend_name}")
            return False
        
        print(f"🔄 Restoring {backend_name} configuration from backup...")
        
        # Restore files
        files_to_restore = [
            (".env", self.env_file),
            ("config.py", self.config_file),
            ("ai_enhancement.py", self.ai_enhancement_file)
        ]
        
        for backup_name, target_file in files_to_restore:
            backup_path = backup_subdir / backup_name
            if backup_path.exists():
                shutil.copy2(backup_path, target_file)
                print(f"   ✅ Restored {backup_name}")
            else:
                print(f"   ⚠️  {backup_name} backup not found")
        
        print(f"✅ {backend_name} configuration restored")
        return True

def main():
    parser = argparse.ArgumentParser(description="Switch between Ollama and llama-server backends")
    parser.add_argument("action", choices=["ollama", "llama-server", "status", "restore"], 
                       help="Action to perform")
    parser.add_argument("--backend", choices=["ollama", "llama_server"], 
                       help="Backend to restore (for restore action)")
    
    if len(sys.argv) == 1:
        print("🔄 MeDocPro AI Backend Switcher")
        print("=" * 40)
        print("Usage:")
        print("  python switch-ai-backend.py ollama        # Switch to Ollama")
        print("  python switch-ai-backend.py llama-server  # Switch to llama-server")
        print("  python switch-ai-backend.py status        # Show current status")
        print("  python switch-ai-backend.py restore --backend=ollama    # Restore backup")
        sys.exit(1)
    
    args = parser.parse_args()
    switcher = AIBackendSwitcher()
    
    if args.action == "ollama":
        switcher.switch_to_ollama()
    elif args.action == "llama-server":
        switcher.switch_to_llama_server()
    elif args.action == "status":
        switcher.show_current_status()
    elif args.action == "restore":
        if not args.backend:
            print("❌ --backend required for restore action")
            sys.exit(1)
        switcher.restore_backup(args.backend)

if __name__ == "__main__":
    main()