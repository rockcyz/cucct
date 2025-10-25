import json
import codecs

# Read Q&A data
with open('qa_data.json', 'r', encoding='utf-8') as f:
    qa_data = json.load(f)

# Generate HTML
html_template = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>常见问题 Q&A | 计算思维概论</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        html { scroll-behavior: smooth; }
        .faq-item { transition: all 0.3s ease; }
        .faq-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .faq-item.active .faq-content { max-height: 2000px; }
        .faq-item.active .faq-icon { transform: rotate(180deg); }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
    <header class="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4">
            <nav class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <a href="index.html" class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
                        <i class="fas fa-home text-white"></i>
                    </a>
                    <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">常见问题 Q&A</h1>
                </div>
                <div class="hidden md:flex space-x-6">
                    <a href="index.html" class="text-gray-600 hover:text-blue-600 transition-colors">返回首页</a>
                    <a href="course-introduction.html" class="text-gray-600 hover:text-blue-600 transition-colors">课程介绍</a>
                </div>
            </nav>
        </div>
    </header>
    <section class="py-16 px-6">
        <div class="container mx-auto text-center">
            <div class="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <i class="fas fa-question-circle mr-2"></i>课程常见问题
            </div>
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">常见问题解答</h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">这里收集了课程中最常见的问题与解答，帮助您更好地理解计算思维概论课程</p>
        </div>
    </section>
    <section class="px-6 mb-12">
        <div class="container mx-auto max-w-4xl">
            <div class="relative">
                <input type="text" id="searchInput" placeholder="搜索问题..." class="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg shadow-lg">
                <i class="fas fa-search absolute left-4 top-5 text-gray-400"></i>
            </div>
        </div>
    </section>
    <section class="px-6 pb-20">
        <div class="container mx-auto max-w-4xl">
            <div id="faqContainer" class="space-y-4"></div>
        </div>
    </section>
    <footer class="bg-gray-900 text-white py-12 px-6">
        <div class="container mx-auto text-center">
            <p class="text-lg"><i class="fas fa-code"></i> 计算思维概论课程网站</p>
            <p class="text-gray-400 mt-2">用心打造计算思维教育平台</p>
            <p class="text-gray-500 text-sm mt-4">© 2025 中国传媒大学 | 计算机与网络空间安全学院</p>
        </div>
    </footer>
    <script>
        const qaData = {json_data};
        
        function displayFAQs() {{
            const container = document.getElementById('faqContainer');
            container.innerHTML = qaData.map((item, index) => `
                <div class="faq-item bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all" data-index="${{index}}">
                    <button class="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors" onclick="toggleFAQ(${{index}})">
                        <div class="flex items-center flex-1">
                            <span class="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold px-3 py-1 rounded-lg mr-4 shrink-0">Q${{index + 1}}</span>
                            <span class="text-lg font-semibold text-gray-900 qa-question">${{item.question}}</span>
                        </div>
                        <i class="fas fa-chevron-down faq-icon text-blue-500 ml-4 transition-transform"></i>
                    </button>
                    <div class="faq-content px-6">
                        <div class="pb-6 text-gray-700 leading-relaxed qa-answer">${{item.answer}}</div>
                    </div>
                </div>
            `).join('');
        }}
        
        function toggleFAQ(index) {{
            const item = document.querySelector(`.faq-item[data-index="${{index}}"]`);
            if (item) {{
                document.querySelectorAll('.faq-item').forEach(i => {{
                    if (i !== item && i.classList.contains('active')) {{
                        i.classList.remove('active');
                    }}
                }});
                item.classList.toggle('active');
            }}
        }}
        
        function setupSearch() {{
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', (e) => {{
                const searchTerm = e.target.value.toLowerCase().trim();
                if (searchTerm === '') {{
                    document.querySelectorAll('.faq-item').forEach(item => {{
                        item.style.display = '';
                    }});
                    return;
                }}
                document.querySelectorAll('.faq-item').forEach((item, index) => {{
                    const question = qaData[index].question.toLowerCase();
                    const answer = qaData[index].answer.toLowerCase();
                    const matches = question.includes(searchTerm) || answer.includes(searchTerm);
                    if (matches) {{
                        item.style.display = '';
                        if (!item.classList.contains('active')) {{
                            item.classList.add('active');
                        }}
                    }} else {{
                        item.style.display = 'none';
                    }}
                }});
            }});
        }}
        
        displayFAQs();
        setupSearch();
        
        document.addEventListener('keydown', (e) => {{
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {{
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }}
        }});
    </script>
</body>
</html>
'''

# Insert Q&A data into HTML
json_str = json.dumps(qa_data, ensure_ascii=False, indent=2)
html = html_template.replace('{json_data}', json_str)

# Write to file
with open('faq.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Successfully created faq.html')
