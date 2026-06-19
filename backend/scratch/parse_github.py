import re

with open(r'C:\Users\AVI\.gemini\antigravity\brain\a76d9bc3-af32-4b1b-a432-8f6f84a524c4\.system_generated\steps\1881\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

# Look for titles or links pointing to files/folders
# e.g., href="/Avinash6380/Pookie-AI/tree/main/..." or href="/Avinash6380/Pookie-AI/blob/main/..."
matches = re.findall(r'href="/Avinash6380/Pookie-AI/(tree|blob)/main/([^"]+)"', html)
names = set(m[1] for m in matches)
for name in sorted(names):
    print(name)
