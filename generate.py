import os
import json
import re
from pathlib import Path

def format_name(name):
    # Replaces underscores/hyphens with spaces and capitalizes
    return re.sub(r'[_—\-]', ' ', name).strip().title()

def process_html_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    modified = False
    
    # 1. Ensure Meta Charset is the first line
    meta_tag = '<meta charset="UTF-8">'
    if not content.startswith(meta_tag):
        content = meta_tag + "\n" + content
        modified = True

    # 2. Make images auto-resizable via CSS injection
    # We inject a small style block before the closing head tag or at the top
    style_tag = "\n<style>img { max-width: 100%; height: auto; display: block; }</style>\n"
    if style_tag not in content:
        if "</head>" in content:
            content = content.replace("</head>", style_tag + "</head>")
        else:
            content = content + style_tag
        modified = True

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return modified

def build_structure():
    base_path = Path("./resources")
    if not base_path.exists():
        print("Error: ./resources directory not found.")
        return

    category_map = {
        "cervical": "Cervical Spine",
        "full": "Full Spine",
        "lumbar": "Lumbar Spine"
    }
    
    type_map = {
        "xray": "X-Ray",
        "mri": "MRI Scan",
        "ct": "CT Scan"
    }

    image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
    structure = {}
    changed_files_count = 0

    for cat_dir in base_path.iterdir():
        if cat_dir.is_dir() and cat_dir.name in category_map:
            cat_name = category_map[cat_dir.name]
            structure[cat_name] = {}

            for type_dir in cat_dir.iterdir():
                if type_dir.is_dir() and type_dir.name in type_map:
                    type_display_name = type_map[type_dir.name]
                    
                    type_data = {
                        "path": f"resources/{cat_dir.name}/{type_dir.name}/",
                        "content": []
                    }

                    # Iterate through item directories (e.g., Angulation)
                    for item_dir in type_dir.iterdir():
                        if item_dir.is_dir():
                            item_name = format_name(item_dir.name)
                            
                            # Find first .html file
                            html_file = next(item_dir.glob("*.html"), None)
                            # Find first image (recursive)
                            thumbnail_file = None
                            for ext in image_extensions:
                                found = next(item_dir.rglob(f"*{ext}"), None)
                                if found:
                                    thumbnail_file = found
                                    break

                            if html_file:
                                # Path relative to the "type" directory
                                rel_index = html_file.relative_to(type_dir).as_posix()
                                rel_thumb = thumbnail_file.relative_to(type_dir).as_posix() if thumbnail_file else ""
                                
                                # Process the HTML content
                                if process_html_file(html_file):
                                    changed_files_count += 1

                                type_data["content"].append({
                                    "name": item_name,
                                    "index": rel_index,
                                    "thumbnail": rel_thumb
                                })

                    structure[cat_name][type_display_name] = type_data

    # Write JSON output
    with open("structure.json", "w", encoding="utf-8") as jf:
        json.dump(structure, jf, indent=2)

    return changed_files_count

if __name__ == "__main__":
    modified_count = build_structure()
    
    print("\n--- Project Update Summary ---")
    print(f"* Generated 'structure.json' with categorized spine data.")
    print(f"* Processed {modified_count} HTML files to include UTF-8 charset.")
    print(f"* Injected CSS into HTML files to ensure images are auto-resizable.")
    print(f"* Mapped directory slugs (e.g., 'cervical') to display names (e.g., 'Cervical Spine').")
    print(f"* Linked thumbnails and index paths relative to their respective type directories.")
    print("------------------------------\n")
    
    confirm = input("Would you like to commit and push these changes to the repository? (y/n): ")
    if confirm.lower() == 'y':
        print("Pushing changes... (Simulated)")
        # os.system('git add . && git commit -m "Update spine structure and format HTML files" && git push')
    else:
        print("Changes saved locally. Commit aborted.")
