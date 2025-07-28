import json
import zipfile
import os
from pathlib import Path

def create_extension_zip():
    # Read version from manifest.json
    try:
        with open('manifest.json', 'r') as f:
            manifest = json.load(f)
            version = manifest.get('version')
    except FileNotFoundError:
        print("Error: manifest.json not found!")
        return
    except json.JSONDecodeError:
        print("Error: Invalid JSON in manifest.json!")
        return
    
    # Create zip filename in parent directory
    zip_filename = os.path.join('..', f"SRM Margin Check v{version}.zip")
    
    # Files and folders to include
    files_to_include = [
        'content.js',
        'manifest.json', 
        'popup.html'
    ]
    
    folders_to_include = [
        'assets'
    ]
    
    try:
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add individual files
            for file in files_to_include:
                if os.path.exists(file):
                    zipf.write(file)
                    print(f"Added: {file}")
                else:
                    print(f"Warning: {file} not found!")
            
            # Add folders and their contents
            for folder in folders_to_include:
                if os.path.exists(folder):
                    for root, dirs, files in os.walk(folder):
                        # Skip the screenshots subfolder
                        if 'screenshots' in dirs:
                            dirs.remove('screenshots')
                        
                        for file in files:
                            file_path = os.path.join(root, file)
                            # Use forward slashes in zip file paths
                            arc_name = file_path.replace('\\', '/')
                            zipf.write(file_path, arc_name)
                            print(f"Added: {arc_name}")
                else:
                    print(f"Warning: {folder} folder not found!")
        
        print(f"\nSuccessfully created: {os.path.abspath(zip_filename)}")
        print(f"Extension version: {version}")
        
    except Exception as e:
        print(f"Error creating zip file: {e}")

if __name__ == "__main__":
    create_extension_zip()