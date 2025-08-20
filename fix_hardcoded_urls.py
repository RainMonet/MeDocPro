#!/usr/bin/env python3
"""
Script to fix hardcoded URLs in React components
"""

import os
import re
import glob

def fix_hardcoded_urls():
    """Fix hardcoded localhost:5000 URLs in React components"""
    
    # Find all .jsx files in components directory
    jsx_files = glob.glob('/mnt/c/Users/admin/Desktop/MeDocPro/medocpro-dashboard/src/components/**/*.jsx', recursive=True)
    
    fixed_files = []
    
    for file_path in jsx_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Replace hardcoded URLs with template literals using apiService.baseURL
            content = re.sub(
                r"'http://localhost:5000(/[^']*)'",
                r"`${apiService.baseURL}\1`",
                content
            )
            
            # Also handle double quotes
            content = re.sub(
                r'"http://localhost:5000(/[^"]*)"',
                r"`${apiService.baseURL}\\1`",
                content
            )
            
            # Check if we need to add apiService import
            needs_import = False
            if content != original_content:
                if 'import apiService' not in content:
                    needs_import = True
            
            # Add import if needed
            if needs_import:
                # Find the last import statement
                import_pattern = r'(import[^;]+;)(?=\s*\n\s*(?:\/\/|\/\*|\n|[^i]))'
                matches = list(re.finditer(import_pattern, content))
                if matches:
                    last_import = matches[-1]
                    # Insert new import after the last import
                    content = (content[:last_import.end()] + 
                             "\nimport apiService from '../../services/api';" + 
                             content[last_import.end():])
                else:
                    # If no imports found, add at the beginning after any existing imports
                    lines = content.split('\n')
                    insert_line = 0
                    for i, line in enumerate(lines):
                        if line.strip().startswith('import '):
                            insert_line = i + 1
                    
                    if insert_line == 0:
                        # No imports found, add at beginning
                        content = "import apiService from '../../services/api';\n" + content
                    else:
                        # Add after last import
                        lines.insert(insert_line, "import apiService from '../../services/api';")
                        content = '\n'.join(lines)
            
            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixed_files.append(file_path)
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    return fixed_files

if __name__ == '__main__':
    print("Fixing hardcoded URLs in React components...")
    fixed = fix_hardcoded_urls()
    
    if fixed:
        print(f"\nFixed {len(fixed)} files:")
        for file_path in fixed:
            filename = os.path.basename(file_path)
            print(f"  - {filename}")
    else:
        print("No files needed fixing.")
    
    print("\nDone!")