import os
import json

def update_spine_structure(json_filename='structure.json'):
    # 1. Load the existing JSON data
    if not os.path.exists(json_filename):
        print(f"Error: {json_filename} not found.")
        return

    with open(json_filename, 'r') as f:
        data = json.load(f)

    # 2. Recursively walk through the current directory
    for root, dirs, files in os.walk('.'):
        if 'index.html' in files:
            # Get the name of the folder containing index.html (e.g., "example")
            folder_name = os.path.basename(root)
            
            # Get the path of the parent directory (e.g., "./resources/cervical/ct")
            parent_path = os.path.dirname(root)
            
            # Normalize the parent path to match the JSON format ("/resources/...")
            # Remove the leading '.', replace backslashes for Windows, and ensure trailing slash
            norm_path = parent_path.replace('\\', '/').lstrip('.')
            if not norm_path.endswith('/'):
                norm_path += '/'
            if not norm_path.startswith('/'):
                norm_path = '/' + norm_path

            # 3. Search for the matching path in the JSON structure
            found_match = False
            for region, scans in data.items():
                for scan_type, details in scans.items():
                    if details.get('path') == norm_path:
                        # Add the folder name to "content" if it's not already there
                        if folder_name not in details['content']:
                            details['content'].append(folder_name)
                            found_match = True
                    details['content'].sort()

            if found_match:
                print(f"Added '{folder_name}' to path: {norm_path}")

    # 4. Save the updated structure back to the file
    with open(json_filename, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nUpdate complete. Changes saved to {json_filename}.")

if __name__ == "__main__":
    update_spine_structure()
