import os

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.js'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if '/history' in content or 'history' in content:
                    print(f"Found in {path}")
