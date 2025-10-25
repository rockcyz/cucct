# 计算思维概论课程网站

> 中国传媒大学计算机与网络空间安全学院 - 计算思维概论课程官方网站

## 📚 网站功能

### 🎓 课程介绍
- 课程目标与内容介绍
- 计算思维的本质与核心要素
- 教学内容大纲
- 学习方法与考核方式

### 📖 在线教材
- 交互式在线教材
- 理论讲解与案例分析
- 互动练习与实践操作

### 📊 电子课件
- 按章节分类的PDF课件
- 幻灯片式翻页浏览
- 支持在线查看和下载

### 🧪 实验工具
- **图像编码工具**：RGB像素分析、十六进制图像生成
- **字符编码工具**：Unicode、UTF-8/16、GBK编码查看
- **数值转换工具**：进制转换、算术运算、逻辑运算

### 🤖 AI助教
- 智能问答助手
- 24小时在线解答
- 个性化学习建议与题目辅导

## 🚀 快速开始

### 本地运行

1. 克隆仓库
```bash
git clone https://github.com/rockcyz/cucct.git
cd cucct
```

2. 启动本地服务器

**方式一：使用 Python**
```bash
# 安装依赖（如果需要）
pip install flask

# 启动带CORS的服务器
python cors_server.py
```

**方式二：使用启动脚本**
```bash
# Windows
./start_server.bat
```

3. 访问网站
打开浏览器访问：`http://localhost:8000`

## 📁 项目结构

```
cucct/
├── index.html              # 首页（重定向到home.html）
├── home.html               # 主页面
├── course-introduction.html # 课程介绍页
├── e-courseware.html       # 电子课件页
├── OnlineTextbook/         # 在线教材
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── E-courseware/           # PDF课件
│   └── *.pdf
├── image/                  # 实验工具图片资源
├── resource/               # 课程资源
└── cors_server.py          # CORS服务器脚本
```

## 🌐 在线访问

网站已部署在 GitHub Pages：
[https://rockcyz.github.io/cucct/](https://rockcyz.github.io/cucct/)

## 🛠️ 技术栈

- **前端框架**：纯HTML + Tailwind CSS
- **PDF查看**：PDF.js
- **图标库**：Font Awesome
- **AI助手**：Dify Chatbot

## 📄 许可证

本项目仅供教学使用

---

**中国传媒大学 | 计算机与网络空间安全学院**

© 2025 CUC Introduction to Computational Thinking Course Website
