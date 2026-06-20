with open('./backend/routes/chat.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if '/history' in line or 'history' in line or 'get(' in line or 'post(' in line:
        if 'router.' in line or 'app.' in line or '/history' in line:
            print(f"Line {idx+1}: {line.strip()}")
