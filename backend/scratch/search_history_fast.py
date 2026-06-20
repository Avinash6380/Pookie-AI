import os

search_dirs = ['./backend', './frontend/src']

for s_dir in search_dirs:
    if not os.path.exists(s_dir):
        continue
    for root, dirs, files in os.walk(s_dir):
        if 'node_modules' in root or '.git' in root or 'dist' in root:
            continue
        for file in files:
            if file.endswith(('.js', '.jsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if '/history' in content or 'history/' in content or 'GET /api/chat' in content or 'getChatHistory' in content:
                        print(f"Found in {path}")
