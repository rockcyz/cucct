import csv
import json

# 读取CSV文件
with open('resource/计算思维概论-课程概述-问答对.csv', 'r', encoding='gb18030') as f:
    reader = csv.DictReader(f)
    qa_data = []
    for row in reader:
        if 'Q' in row and 'A' in row and row['Q'].strip() and row['A'].strip():
            qa_data.append({'question': row['Q'].strip(), 'answer': row['A'].strip()})

# 保存为JSON
with open('qa_data.json', 'w', encoding='utf-8') as f:
    json.dump(qa_data, f, ensure_ascii=False, indent=2)

print(f'成功读取 {len(qa_data)} 条问答对')
