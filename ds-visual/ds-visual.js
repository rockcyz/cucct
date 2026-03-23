// ==================== 导航功能 ====================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有active类
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

        // 添加active类到当前项
        item.classList.add('active');
        const sectionId = item.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');

        // 移动端自动关闭侧边栏
        if (window.innerWidth <= 1024) {
            closeSidebar();
        }
    });
});

// ==================== 移动端侧边栏 ====================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
}

// ==================== Canvas 自适应 ====================
function resizeCanvases() {
    const treeCanvas = document.getElementById('tree-canvas');
    const graphCanvas = document.getElementById('graph-canvas');

    // 调整树的canvas
    if (treeCanvas) {
        const parent = treeCanvas.parentElement;
        const maxW = parent.clientWidth - 40;
        const w = Math.min(900, Math.max(400, maxW));
        const h = 420;  // 固定高度确保树能完整显示
        if (treeCanvas.width !== w || treeCanvas.height !== h) {
            treeCanvas.width = w;
            treeCanvas.height = h;
        }
    }

    // 调整图的canvas
    if (graphCanvas) {
        const parent = graphCanvas.parentElement;
        const maxW = parent.clientWidth - 40;
        const w = Math.min(1100, Math.max(480, maxW));
        const h = Math.round(w * 0.52);
        if (graphCanvas.width !== w || graphCanvas.height !== h) {
            graphCanvas.width = w;
            graphCanvas.height = h;
            graphModule.calculatePositions(); // 尺寸变化时重新布局节点
        }
    }

    treeModule.drawTree();
    graphModule.drawGraph();
}

window.addEventListener('resize', resizeCanvases);

// ==================== Mermaid 配置 ====================
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: '"JetBrains Mono", monospace',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    }
});

// ==================== 工具函数 ====================
// ==================== Toast 通知系统 ====================
function showToast(message, type = 'info', duration = 4000) {
    // 创建或获取 toast 容器
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // 根据类型设置图标
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // 触发动画
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // 自动关闭
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    return toast;
}

// 保留原有的 showMessage 函数（兼容性），但同时也显示 toast
function showMessage(elementId, message, type = 'info') {
    // 原有逻辑：更新页面内的 message 元素
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message show ${type}`;
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
    
    // 新增：同时显示 toast 通知
    showToast(message, type, 4000);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 通用操作历史记录更新函数
function updateHistory(elementId, steps) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = steps.map((text, i) => `<div class="history-step">${i + 1}. ${text}</div>`).join('');
    el.classList.add('show');
}

function clearHistory(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    el.classList.remove('show');
}

// ==================== 代码区域收起/展开功能 ====================
function toggleCodeSection(demoId) {
    const demo = document.getElementById(demoId);
    if (!demo) return;

    demo.classList.toggle('collapsed');

    // 更新图标
    const icon = demo.querySelector('.toggle-icon');
    if (icon) {
        if (demo.classList.contains('collapsed')) {
            icon.textContent = '+';
            icon.title = '展开代码';
        } else {
            icon.textContent = '−';
            icon.title = '收起代码';
        }
    }

    // 保存状态到本地存储
    const isCollapsed = demo.classList.contains('collapsed');
    localStorage.setItem(`code-demo-${demoId}`, isCollapsed ? 'collapsed' : 'expanded');
}

// 页面加载时恢复代码区域状态
function restoreCodeSectionStates() {
    const codeDemos = document.querySelectorAll('.code-demo[id]');
    codeDemos.forEach(demo => {
        const state = localStorage.getItem(`code-demo-${demo.id}`);
        if (state === 'collapsed') {
            demo.classList.add('collapsed');
            const icon = demo.querySelector('.toggle-icon');
            if (icon) icon.textContent = '+';
        }
    });
}

// ==================== Python代码弹出窗口 ====================
let currentCodePopup = null;

function showPythonCodePopup(moduleName) {
    // 关闭已存在的弹窗
    if (currentCodePopup && !currentCodePopup.closed) {
        currentCodePopup.close();
    }

    // 获取当前操作的代码
    let code = '';
    let title = '';

    switch(moduleName) {
        case 'array':
            title = '数组操作 - Python代码';
            code = arrayModule.getCode(arrayModule._lastOperation || 'insert');
            break;
        case 'stack':
            title = '堆栈操作 - Python代码';
            code = stackModule.getCode(stackModule._lastOperation || 'push');
            break;
        case 'queue':
            title = '队列操作 - Python代码';
            code = queueModule.getCode(queueModule._lastOperation || 'enqueue');
            break;
        case 'linkedlist':
            title = '链表操作 - Python代码';
            code = linkedListModule.getCode(linkedListModule._lastOperation || 'insert_head');
            break;
        case 'tree':
            title = '二叉树操作 - Python代码';
            code = treeModule.getCode(treeModule._lastOperation || 'insert');
            break;
        case 'graph':
            title = '图操作 - Python代码';
            code = graphModule.getCode(graphModule._lastOperation || 'addVertex');
            break;
        default:
            title = 'Python代码';
            code = '# 暂无代码';
    }

    // 创建弹窗内容
    const popupContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'JetBrains Mono', 'Consolas', monospace;
            background: #1e1e2e;
            color: #cdd6f4;
            padding: 20px;
            min-height: 100vh;
        }
        .popup-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #313244;
        }
        .popup-title {
            font-size: 18px;
            font-weight: 600;
            color: #89b4fa;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .popup-title::before {
            content: '.py';
            background: #f9e2af;
            color: #1e1e2e;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .close-btn {
            background: #45475a;
            border: none;
            color: #cdd6f4;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .close-btn:hover {
            background: #585b70;
        }
        .code-container {
            background: #181825;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #313244;
        }
        .code-header {
            background: #313244;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .code-dots {
            display: flex;
            gap: 6px;
        }
        .code-dots span {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .code-dots span:nth-child(1) { background: #f38ba8; }
        .code-dots span:nth-child(2) { background: #f9e2af; }
        .code-dots span:nth-child(3) { background: #a6e3a1; }
        .code-lang {
            margin-left: 10px;
            font-size: 13px;
            color: #6c7086;
        }
        pre {
            margin: 0;
            padding: 20px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.6;
        }
        code {
            font-family: 'JetBrains Mono', 'Consolas', monospace;
        }
    </style>
</head>
<body>
    <div class="popup-header">
        <div class="popup-title">${title}</div>
        <button class="close-btn" onclick="window.close()">关闭窗口</button>
    </div>
    <div class="code-container">
        <div class="code-header">
            <div class="code-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="code-lang">python</span>
        </div>
        <pre><code class="language-python"></code></pre>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-python.min.js"><\/script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const code = ${JSON.stringify(code)};
            document.querySelector('code').textContent = code;
            Prism.highlightAll();
        });
    <\/script>
</body>
</html>`;

    // 打开弹窗
    const width = 700;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    currentCodePopup = window.open('', '_blank', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);

    if (currentCodePopup) {
        currentCodePopup.document.write(popupContent);
        currentCodePopup.document.close();
    } else {
        showToast('弹窗被阻止，请允许弹窗后重试', 'error');
    }
}

// ==================== 代码高亮工具 ====================

// 设置代码内容：添加行号，触发 Prism 高亮
function setCodeContent(codeElementId, codeText) {
    const codeElement = document.getElementById(codeElementId);
    if (!codeElement) return;

    // 将代码按行分割，每行包裹为 span.code-line-row 以便 CSS 显示行号
    const lines = codeText.split('\n');
    const wrapped = lines.map(line => {
        // 对每行内容进行 HTML 转义
        const escaped = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<span class="code-line-row">${escaped}</span>`;
    }).join('\n');

    codeElement.innerHTML = wrapped;

    // 触发 Prism 高亮
    if (window.Prism) {
        Prism.highlightElement(codeElement);
    }
}

// 高亮指定行（用于执行步骤指示）
function highlightCodeLine(codeElementId, lineNumber) {
    const codeBlock = document.getElementById(codeElementId);
    if (!codeBlock) return;

    // 移除之前的高亮
    const prevHighlights = codeBlock.querySelectorAll('.code-line.highlight');
    prevHighlights.forEach(el => el.classList.remove('highlight'));

    // 添加新高亮
    const lines = codeBlock.querySelectorAll('.code-line');
    if (lines[lineNumber]) {
        lines[lineNumber].classList.add('highlight');
        // 滚动到高亮行
        lines[lineNumber].scrollIntoView({behavior: 'smooth', block: 'center'});
    }
}

// ==================== 流程图渲染工具 ====================
async function renderFlowchart(containerId, mermaidCode) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const { svg } = await mermaid.render('flowchart-' + Date.now(), mermaidCode);
        container.innerHTML = svg;
        // 等待DOM更新
        await sleep(100);
        // 调试用：输出节点结构
        debugFlowchart(containerId);
    } catch (error) {
        console.error('Mermaid render error:', error);
        container.innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
    }
}

// 流程图动态高亮工具
function highlightFlowchartNode(containerId, nodeId, isCurrent = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Mermaid 10.x 生成的节点ID格式: "flowchart-xxx-nodeId-..."
    // 尝试多种可能的选择器
    let node = container.querySelector(`[id$="-${nodeId}"]`);

    // 如果没找到，尝试查找包含节点标签的元素
    if (!node) {
        // 查找所有 g.node 元素，检查其文本内容
        const allNodes = container.querySelectorAll('.node');
        for (const n of allNodes) {
            const textEl = n.querySelector('.nodeLabel');
            if (textEl && textEl.textContent.trim() === nodeId) {
                node = n;
                break;
            }
        }
    }

    // 还是没找到，尝试通过id包含nodeId来查找
    if (!node) {
        const allElements = container.querySelectorAll('[id]');
        for (const el of allElements) {
            if (el.id.includes(`-${nodeId}-`) || el.id.endsWith(`-${nodeId}`)) {
                // 找到包含nodeId的元素，向上查找到node容器
                node = el.closest('.node') || el;
                break;
            }
        }
    }

    if (node) {
        if (isCurrent) {
            // 当前节点 - 高亮显示
            node.classList.add('flowchart-node-current');
            
            // 对SVG元素应用样式
            const shape = node.querySelector('rect, circle, ellipse, polygon, path') || node;
            if (shape && shape.style) {
                shape.style.filter = 'drop-shadow(0 0 12px #22c55e)';
                shape.style.stroke = '#22c55e';
                shape.style.strokeWidth = '3px';
                shape.style.transition = 'all 0.3s ease';
            }

            // 对整个节点容器应用效果
            node.style.filter = 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.7))';
            node.style.transform = 'scale(1.08)';
            node.style.transformOrigin = 'center';
            node.style.transition = 'all 0.3s ease';
        } else {
            // 已访问节点 - 淡色显示
            node.classList.add('flowchart-node-visited');
            
            const shape = node.querySelector('rect, circle, ellipse, polygon, path') || node;
            if (shape && shape.style) {
                shape.style.stroke = '#3b82f6';
                shape.style.strokeWidth = '2px';
                shape.style.transition = 'all 0.3s ease';
            }
            node.style.opacity = '0.7';
        }

        // 滚动到可视区域
        node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

// 高亮流程图的边（连线）
function highlightFlowchartEdge(containerId, fromNodeId, toNodeId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Mermaid 边的ID格式通常是: "flowchart-xxx-from-to" 或类似
    // 尝试多种选择器
    const possibleSelectors = [
        `[id*="-${fromNodeId}-"][id*="-${toNodeId}"]`,
        `[id*="${fromNodeId}--${toNodeId}"]`,
        `[id*="${fromNodeId}-${toNodeId}"]`
    ];

    let edge = null;
    for (const selector of possibleSelectors) {
        edge = container.querySelector(selector);
        if (edge) break;
    }

    // 如果没找到，尝试查找所有 edgePath 并匹配
    if (!edge) {
        const allEdges = container.querySelectorAll('.edgePath');
        for (const e of allEdges) {
            const id = e.id || '';
            if ((id.includes(fromNodeId) && id.includes(toNodeId)) ||
                (id.includes(fromNodeId.toLowerCase()) && id.includes(toNodeId.toLowerCase()))) {
                edge = e;
                break;
            }
        }
    }

    // 还是没找到，尝试查找 path 元素
    if (!edge) {
        const allPaths = container.querySelectorAll('path.edge');
        for (const p of allPaths) {
            const id = p.id || p.parentElement?.id || '';
            if ((id.includes(fromNodeId) && id.includes(toNodeId)) ||
                (id.includes(fromNodeId.toLowerCase()) && id.includes(toNodeId.toLowerCase()))) {
                edge = p.closest('.edgePath') || p;
                break;
            }
        }
    }

    if (edge) {
        edge.classList.add('flowchart-edge-highlight');
        
        // 获取 path 元素
        const pathEl = edge.querySelector('path') || edge;
        if (pathEl && pathEl.style) {
            pathEl.style.stroke = '#22c55e';
            pathEl.style.strokeWidth = '3px';
            pathEl.style.filter = 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))';
            pathEl.style.transition = 'all 0.3s ease';
        }

        // 高亮箭头
        const marker = edge.querySelector('marker') || container.querySelector(`marker[id*="${toNodeId}"]`);
        if (marker) {
            marker.style.fill = '#22c55e';
        }
    }
}

// 清除流程图高亮
function clearFlowchartHighlight(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 清除节点高亮
    container.querySelectorAll('.flowchart-node-current, .flowchart-node-visited').forEach(el => {
        el.classList.remove('flowchart-node-current', 'flowchart-node-visited');
        el.style.filter = '';
        el.style.transform = '';
        el.style.opacity = '';
        
        const shape = el.querySelector('rect, circle, ellipse, polygon, path');
        if (shape && shape.style) {
            shape.style.filter = '';
            shape.style.stroke = '';
            shape.style.strokeWidth = '';
        }
    });

    // 清除边高亮
    container.querySelectorAll('.flowchart-edge-highlight').forEach(el => {
        el.classList.remove('flowchart-edge-highlight');
        
        const pathEl = el.querySelector('path') || el;
        if (pathEl && pathEl.style) {
            pathEl.style.stroke = '';
            pathEl.style.strokeWidth = '';
            pathEl.style.filter = '';
        }
    });
}

// 按步骤序列执行流程图高亮（改进版）
async function animateFlowchart(containerId, steps, stepDelay = 800) {
    // 先清除之前的高亮
    clearFlowchartHighlight(containerId);
    
    for (let i = 0; i < steps.length; i++) {
        const currentNodeId = steps[i];
        
        // 高亮当前节点
        highlightFlowchartNode(containerId, currentNodeId, true);
        
        // 将之前的节点标记为已访问
        for (let j = 0; j < i; j++) {
            highlightFlowchartNode(containerId, steps[j], false);
        }
        
        // 高亮从上一个节点到当前节点的边
        if (i > 0) {
            const prevNodeId = steps[i - 1];
            highlightFlowchartEdge(containerId, prevNodeId, currentNodeId);
        }
        
        await sleep(stepDelay);
    }
}

// 清除流程图高亮
function clearFlowchartHighlight(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.flowchart-node-highlight').forEach(el => {
        el.classList.remove('flowchart-node-highlight');
        el.style.filter = '';
        el.style.transform = '';
        const shape = el.querySelector('rect, circle, ellipse, polygon, path');
        if (shape) {
            shape.style.stroke = '';
            shape.style.strokeWidth = '';
        }
    });
}

// 调试函数：显示流程图结构
function debugFlowchart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log('Container not found:', containerId);
        return;
    }
    const nodes = container.querySelectorAll('.node');
    console.log('Flowchart nodes in', containerId, ':');
    nodes.forEach((n, i) => {
        const id = n.id || 'no-id';
        const label = n.querySelector('.nodeLabel')?.textContent || 'no-label';
        console.log(`  ${i}: id=${id}, label=${label}`);
    });
}

// ==================== 数据处理工具 ====================
function parseInputValue(inputStr) {
    // 尝试解析为数字，如果失败则作为字符串处理
    const trimmed = inputStr.trim();
    if (trimmed === '') return null;
    
    const num = Number(trimmed);
    return isNaN(num) ? trimmed : num;
}

function formatValueForDisplay(value) {
    // 用于显示的格式化，字符串加引号
    return typeof value === 'string' ? `"${value}"` : value;
}

// ==================== 数组模块 ====================
const arrayModule = {
    data: [],
    _lastOperation: 'insert',

    // Python 代码模板
    getCode(operation) {
        const codes = {
            insert: `# 创建空数组
arr = []

# 在索引位置插入元素
def insert_element(arr, index, value):
    # 步骤1: 检查索引是否有效
    if index < 0 or index > len(arr):
        raise IndexError("索引超出范围")
    
    # 步骤2: 将插入位置后的所有元素向右移动一位
    arr.append(None)  # 先在末尾添加占位符
    for i in range(len(arr)-1, index, -1):
        arr[i] = arr[i-1]
    
    # 步骤3: 在指定位置放入新元素
    arr[index] = value
    return arr

# 示例使用
insert_element(arr, 0, "A")  # 在索引0处插入"A"`,
            
            delete: `# 删除指定索引的元素
def delete_element(arr, index):
    # 步骤1: 检查索引是否有效
    if index < 0 or index >= len(arr):
        raise IndexError("索引超出范围")
    
    # 步骤2: 保存要删除的元素
    deleted_value = arr[index]
    
    # 步骤3: 将删除位置后的所有元素向左移动一位
    for i in range(index, len(arr)-1):
        arr[i] = arr[i+1]
    
    # 步骤4: 移除最后一个元素
    arr.pop()
    return deleted_value

# 示例使用
deleted = delete_element(arr, 1)  # 删除索引1处的元素`,
            
            search: `# 查找元素的索引（支持按索引直接访问）
def search_element(arr, value, index=None):
    # 步骤1: 如果提供了索引，直接访问该位置（O(1)）
    if index is not None and 0 <= index < len(arr):
        if arr[index] == value:
            return index  # 找到了！
        else:
            return -1     # 该位置不是要找的值
    
    # 步骤2: 没有索引，遍历数组查找（O(n)）
    for i in range(len(arr)):
        if arr[i] == value:
            return i      # 找到了！
    
    # 步骤3: 没找到，返回-1
    return -1

# 示例使用
index = search_element(arr, "B", 2)  # 直接检查索引2
index = search_element(arr, "B")     # 遍历查找"B"`
        };
        return codes[operation] || '# 数组基本操作\narr = []';
    },

    // 流程图模板
    getFlowchart(operation) {
        const flowcharts = {
            insert: `graph TD
    A[开始] --> B{索引位置是否合法}
    B -->|不合法| C["报错：位置超出范围"]
    B -->|合法| D[在数组末尾预留一个空位]
    D --> E[从最后一个元素开始]
    E --> F{还没到插入位置}
    F -->|是| G[把当前元素往后挪一位]
    G --> H[继续看前一个元素]
    H --> F
    F -->|否| I[把新元素放到指定位置]
    I --> J[结束]`,
            
            delete: `graph TD
    A[开始] --> B{索引位置是否合法}
    B -->|不合法| C["报错：位置超出范围"]
    B -->|合法| D[记下要删除的元素]
    D --> E[从删除位置开始]
    E --> F{后面还有元素}
    F -->|是| G[把后面的元素往前挪一位]
    G --> H[继续看下一个位置]
    H --> F
    F -->|否| I[去掉末尾多余的空位]
    I --> J[返回被删除的元素]`,
            
            search: `graph TD
    A[开始] --> B{输入了索引位置吗}
    B -->|是| C{索引位置合法吗}
    B -->|没有输入索引| D[从头遍历数组]
    C -->|合法| E[直接访问该索引位置]
    C -->|不合法| D
    E --> F{是要找的元素吗}
    F -->|是| G[找到了！返回索引]
    F -->|否| H[该位置不是目标元素]
    D --> I{还有元素没看完}
    I -->|是| J{当前元素匹配吗}
    I -->|否| L[全部看完都没找到]
    J -->|是| G
    J -->|否| K[看下一个元素]
    K --> I`
        };
        return flowcharts[operation] || 'graph TD\nA[开始] --> B[结束]';
    },

    render(highlightIndex = -1, foundIndex = -1) {
        const container = document.getElementById('array-container');
        container.innerHTML = '';

        this.data.forEach((value, index) => {
            const item = document.createElement('div');
            item.className = 'array-item';
            if (index === highlightIndex) item.classList.add('highlight');
            if (index === foundIndex) item.classList.add('found');
            item.innerHTML = `
                <span class="value">${formatValueForDisplay(value)}</span>
                <span class="index">[${index}]</span>
            `;
            container.appendChild(item);
        });
    },

    async insert() {
        this._lastOperation = 'insert';
        const valueInput = document.getElementById('array-value');
        const indexInput = document.getElementById('array-index');
        const value = parseInputValue(valueInput.value);
        const index = parseInt(indexInput.value);

        // 隐藏搜索历史
        const historyEl = document.getElementById('array-search-history');
        historyEl.classList.remove('show');

        setCodeContent('array-code', this.getCode('insert'));
        await renderFlowchart('array-flowchart', this.getFlowchart('insert'));

        if (value === null) {
            await animateFlowchart('array-flowchart', ['A'], 500);
            showMessage('array-message', '请输入有效的元素值', 'error');
            return;
        }

        if (isNaN(index) || index < 0 || index > this.data.length) {
            await animateFlowchart('array-flowchart', ['A', 'B', 'C'], 500);
            if (this.data.length === 0) {
                showMessage('array-message', '数组为空，索引只能为 0', 'error');
            } else {
                showMessage('array-message', `索引超出范围，有效索引为 0 ~ ${this.data.length}`, 'error');
            }
            return;
        }

        // 动画演示正常执行路径
        await animateFlowchart('array-flowchart', ['A', 'B', 'D', 'E', 'F', 'I', 'J'], 400);

        // 执行动画
        this.data.splice(index, 0, value);
        this.render(index);
        showMessage('array-message', `在索引 ${index} 处插入元素 ${formatValueForDisplay(value)}`, 'success');
        
        // 显示历史记录
        historyEl.innerHTML = `
            <div class="history-step">1. 检查索引<span class="index">${index}</span>合法性，合法</div>
            <div class="history-step">2. 在索引<span class="index">${index}</span>处插入元素<span class="value">${formatValueForDisplay(value)}</span></div>
            <div class="history-step">3. <span class="found">插入成功</span>，结束！</div>
        `;
        historyEl.classList.add('show');
        
        valueInput.value = '';
        indexInput.value = '';
        
        // 高亮代码
        setTimeout(() => highlightCodeLine('array-code', 7), 300);
    },

    async delete() {
        this._lastOperation = 'delete';
        const indexInput = document.getElementById('array-index');
        const index = parseInt(indexInput.value);

        // 隐藏搜索历史
        const historyEl = document.getElementById('array-search-history');
        historyEl.classList.remove('show');

        setCodeContent('array-code', this.getCode('delete'));
        await renderFlowchart('array-flowchart', this.getFlowchart('delete'));

        if (this.data.length === 0) {
            await animateFlowchart('array-flowchart', ['A'], 500);
            showMessage('array-message', '数组为空，没有元素可删除', 'error');
            return;
        }

        if (isNaN(index) || index < 0 || index >= this.data.length) {
            await animateFlowchart('array-flowchart', ['A', 'B', 'C'], 500);
            showMessage('array-message', `索引超出范围，有效索引为 0 ~ ${this.data.length - 1}`, 'error');
            return;
        }

        // 动画演示正常执行路径
        await animateFlowchart('array-flowchart', ['A', 'B', 'D', 'E', 'F', 'I', 'J'], 400);

        const removed = this.data.splice(index, 1)[0];
        this.render();
        showMessage('array-message', `删除索引 ${index} 处的元素 ${formatValueForDisplay(removed)}`, 'success');
        
        // 显示历史记录
        historyEl.innerHTML = `
            <div class="history-step">1. 检查索引<span class="index">${index}</span>合法性，合法</div>
            <div class="history-step">2. 删除索引<span class="index">${index}</span>处元素<span class="value">${formatValueForDisplay(removed)}</span></div>
            <div class="history-step">3. 后续元素前移，<span class="found">删除成功</span>，结束！</div>
        `;
        historyEl.classList.add('show');
        
        indexInput.value = '';
        
        setTimeout(() => highlightCodeLine('array-code', 2), 300);
    },

    async search() {
        this._lastOperation = 'search';
        const valueInput = document.getElementById('array-value');
        const indexInput = document.getElementById('array-index');
        const value = parseInputValue(valueInput.value);
        const index = parseInt(indexInput.value);
        const historyEl = document.getElementById('array-search-history');

        // 清空历史记录
        historyEl.innerHTML = '';
        historyEl.classList.remove('show');

        setCodeContent('array-code', this.getCode('search'));
        await renderFlowchart('array-flowchart', this.getFlowchart('search'));

        if (value === null) {
            await animateFlowchart('array-flowchart', ['A'], 500);
            showMessage('array-message', '请输入要查找的元素', 'error');
            return;
        }

        // 如果同时输入了索引，直接按索引位置访问（O(1)）
        if (!isNaN(index) && index >= 0 && index < this.data.length) {
            const elementAtPos = this.data[index];
            if (this.data[index] === value) {
                await animateFlowchart('array-flowchart', ['A', 'B', 'C', 'E', 'F', 'G'], 500);
                this.render(-1, index);
                showMessage('array-message', `找到元素 ${formatValueForDisplay(value)}，位于索引 ${index}（直接访问）`, 'success');
                
                // 显示历史记录
                historyEl.innerHTML = `
                    <div class="history-step">1. 直接访问索引<span class="index">${index}</span>，元素为<span class="value">${formatValueForDisplay(elementAtPos)}</span>，<span class="found">匹配成功</span>，结束！</div>
                `;
                historyEl.classList.add('show');
            } else {
                await animateFlowchart('array-flowchart', ['A', 'B', 'C', 'E', 'F', 'H'], 500);
                this.render(index, -1);
                showMessage('array-message', `索引 ${index} 处的元素是 ${formatValueForDisplay(this.data[index])}，不是 ${formatValueForDisplay(value)}`, 'error');
                
                // 显示历史记录
                historyEl.innerHTML = `
                    <div class="history-step">1. 直接访问索引<span class="index">${index}</span>，元素为<span class="value">${formatValueForDisplay(elementAtPos)}</span>，<span class="not-found">不匹配</span></div>
                    <div class="history-step">2. <span class="not-found">查找失败</span>，结束！</div>
                `;
                historyEl.classList.add('show');
            }
            valueInput.value = '';
            indexInput.value = '';
            return;
        }

        // 只有值没有索引，执行线性查找（O(n)）
        let steps = ['A', 'B', 'D', 'I'];
        let historyHtml = '';
        let stepNum = 1;

        for (let i = 0; i < this.data.length; i++) {
            steps.push('J');
            const currentElement = this.data[i];
            
            if (this.data[i] === value) {
                steps.push('G');
                await animateFlowchart('array-flowchart', steps, 400);
                this.render(-1, i);
                showMessage('array-message', `找到元素 ${formatValueForDisplay(value)}，位于索引 ${i}`, 'success');
                
                // 更新历史记录
                historyHtml += `
                    <div class="history-step">${stepNum}. 查找索引<span class="index">${i}</span>，元素为<span class="value">${formatValueForDisplay(currentElement)}</span>，<span class="found">匹配成功</span>，结束！</div>
                `;
                historyEl.innerHTML = historyHtml;
                historyEl.classList.add('show');
                valueInput.value = '';
                return;
            }
            
            steps.push('K');
            steps.push('I');
            
            // 记录本次查找步骤
            historyHtml += `
                <div class="history-step">${stepNum}. 查找索引<span class="index">${i}</span>，元素为<span class="value">${formatValueForDisplay(currentElement)}</span>，<span class="not-found">不匹配</span></div>
            `;
            stepNum++;
        }

        steps.push('L');
        await animateFlowchart('array-flowchart', steps, 400);
        this.render();
        showMessage('array-message', `未找到元素 ${formatValueForDisplay(value)}`, 'error');
        
        // 显示完整历史 + 未找到结果
        historyHtml += `<div class="history-step">${stepNum}. <span class="not-found">遍历完成，未找到目标元素</span>，结束！</div>`;
        historyEl.innerHTML = historyHtml;
        historyEl.classList.add('show');
        valueInput.value = '';
    },

    async randomFill() {
        this._lastOperation = 'insert';
        this.data = [];
        const count = getRandomInt(5, 8);
        const elements = [];
        for (let i = 0; i < count; i++) {
            // 随机生成数字或字母
            if (Math.random() > 0.5) {
                elements.push(getRandomInt(10, 99));
            } else {
                elements.push(String.fromCharCode(65 + getRandomInt(0, 25))); // A-Z
            }
        }
        this.data = elements;
        this.render();
        setCodeContent('array-code', this.getCode('insert'));
        await renderFlowchart('array-flowchart', this.getFlowchart('insert'));
        
        // 显示历史记录
        const historyEl = document.getElementById('array-search-history');
        const elementsStr = elements.map((v, i) => `[${i}]=${formatValueForDisplay(v)}`).join('，');
        historyEl.innerHTML = `
            <div class="history-step">1. 随机生成<span class="index">${count}</span>个元素</div>
            <div class="history-step">2. 数组内容：${elementsStr}</div>
            <div class="history-step">3. <span class="found">填充完成</span>，结束！</div>
        `;
        historyEl.classList.add('show');
        
        showMessage('array-message', `已随机生成 ${count} 个元素`, 'info');
    },

    async clear() {
        this._lastOperation = 'insert';
        const oldLength = this.data.length;
        this.data = [];
        this.render();
        setCodeContent('array-code', '# 清空数组\narr = []');
        document.getElementById('array-flowchart').innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
        
        // 显示历史记录
        const historyEl = document.getElementById('array-search-history');
        if (oldLength > 0) {
            historyEl.innerHTML = `
                <div class="history-step">1. 原数组包含<span class="index">${oldLength}</span>个元素</div>
                <div class="history-step">2. 移除所有元素</div>
                <div class="history-step">3. <span class="not-found">数组已清空</span>，结束！</div>
            `;
        } else {
            historyEl.innerHTML = `
                <div class="history-step">1. 数组为空，无需清空</div>
                <div class="history-step">2. <span class="found">操作完成</span>，结束！</div>
            `;
        }
        historyEl.classList.add('show');
        
        showMessage('array-message', '数组已清空', 'info');
    }
};

// ==================== 堆栈模块 ====================
const stackModule = {
    data: [],
    maxSize: 6,  // 默认容量改为6
    _lastOperation: 'push',

    setCapacity() {
        const capacityInput = document.getElementById('stack-capacity');
        const newCapacity = parseInt(capacityInput.value);
        
        if (isNaN(newCapacity) || newCapacity < 1 || newCapacity > 20) {
            showMessage('stack-message', '请输入1-20之间的有效容量', 'error');
            capacityInput.value = this.maxSize;
            return;
        }

        // 如果当前数据超过新容量，截断数据
        if (this.data.length > newCapacity) {
            const removedCount = this.data.length - newCapacity;
            this.data = this.data.slice(0, newCapacity);
            showMessage('stack-message', `容量已调整为 ${newCapacity}，自动移除了 ${removedCount} 个元素`, 'warning');
        } else {
            showMessage('stack-message', `堆栈容量已设置为 ${newCapacity}`, 'info');
        }

        this.maxSize = newCapacity;
        this.render();
    },

    getCode(operation) {
        const codes = {
            push: `# 创建空栈
stack = []

# 压栈操作
def push(stack, value):
    # 步骤1: 检查栈是否已满
    if len(stack) >= 8:  # 假设最大容量为8
        raise Exception("栈已满")
    
    # 步骤2: 将元素添加到栈顶
    stack.append(value)  # append在列表末尾添加元素
    return stack

# 示例使用
push(stack, "A")  # 将"A"压入栈顶`,
            
            pop: `# 弹栈操作
def pop(stack):
    # 步骤1: 检查栈是否为空
    if len(stack) == 0:
        raise Exception("栈为空")
    
    # 步骤2: 移除并返回栈顶元素
    top_element = stack.pop()  # pop移除并返回最后一个元素
    return top_element

# 示例使用
top = pop(stack)  # 弹出栈顶元素`,
            
            peek: `# 查看栈顶元素
def peek(stack):
    # 步骤1: 检查栈是否为空
    if len(stack) == 0:
        raise Exception("栈为空")
    
    # 步骤2: 返回栈顶元素(不移除)
    return stack[-1]  # -1表示最后一个元素

# 示例使用
top = peek(stack)  # 查看栈顶元素`
        };
        return codes[operation] || '# 栈基本操作\nstack = []';
    },

    getFlowchart(operation) {
        const flowcharts = {
            push: `graph TD
    A[开始] --> B{"堆栈是否已装满"}
    B -->|已满| C["报错：堆栈已满，放不下了"]
    B -->|还有空间| D[把新元素放到栈顶]
    D --> E[结束]`,
            
            pop: `graph TD
    A[开始] --> B{"堆栈里有元素吗"}
    B -->|没有，是空的| C["报错：堆栈为空，没东西可取"]
    B -->|有元素| D[取出最顶部的元素]
    D --> E[返回取出的元素]`,
            
            peek: `graph TD
    A[开始] --> B{"堆栈里有元素吗"}
    B -->|没有，是空的| C["报错：堆栈为空，没东西可看"]
    B -->|有元素| D[查看最顶部的元素，但不取出]`
        };
        return flowcharts[operation] || 'graph TD\nA[开始] --> B[结束]';
    },

    render(highlight = false) {
        const container = document.getElementById('stack-container');
        container.innerHTML = '';

        this.data.forEach((value, index) => {
            const item = document.createElement('div');
            item.className = 'stack-item';
            if (highlight && index === this.data.length - 1) {
                item.classList.add('highlight');
            }
            item.textContent = formatValueForDisplay(value);
            container.appendChild(item);
        });
    },

    async push() {
        this._lastOperation = 'push';
        // 步骤1: 检查栈是否已满
        if (this.data.length >= this.maxSize) {
            setCodeContent('stack-code', this.getCode('push'));
            await renderFlowchart('stack-flowchart', this.getFlowchart('push'));
            await animateFlowchart('stack-flowchart', ['A', 'B', 'C'], 600);
            showMessage('stack-message', '栈已满，无法继续添加', 'error');
            updateHistory('stack-search-history', [
                `当前栈已有<span class="index">${this.data.length}</span>个元素，容量为<span class="index">${this.maxSize}</span>`,
                `<span class="not-found">栈已满，无法压入</span>，结束！`
            ]);
            return;
        }

        const valueInput = document.getElementById('stack-value');
        const value = parseInputValue(valueInput.value);

        if (value === null) {
            showMessage('stack-message', '请输入有效的元素', 'error');
            return;
        }

        setCodeContent('stack-code', this.getCode('push'));
        await renderFlowchart('stack-flowchart', this.getFlowchart('push'));
        await animateFlowchart('stack-flowchart', ['A', 'B', 'D', 'E'], 500);

        this.data.push(value);
        this.render(true);
        showMessage('stack-message', `Push: 将 ${formatValueForDisplay(value)} 压入栈顶`, 'success');
        valueInput.value = '';
        updateHistory('stack-search-history', [
            `检查栈是否已满：当前<span class="index">${this.data.length - 1}</span>/<span class="index">${this.maxSize}</span>，未满`,
            `将元素<span class="value">${formatValueForDisplay(value)}</span>压入栈顶`,
            `<span class="found">压栈成功</span>，当前栈大小：<span class="index">${this.data.length}</span>，结束！`
        ]);

        setTimeout(() => highlightCodeLine('stack-code', 6), 300);
    },

    async pop() {
        this._lastOperation = 'pop';
        setCodeContent('stack-code', this.getCode('pop'));
        await renderFlowchart('stack-flowchart', this.getFlowchart('pop'));

        if (this.data.length === 0) {
            await animateFlowchart('stack-flowchart', ['A', 'B', 'C'], 600);
            showMessage('stack-message', '栈为空，无法弹出', 'error');
            updateHistory('stack-search-history', [
                `检查栈是否为空：<span class="not-found">栈为空</span>`,
                `<span class="not-found">无法弹出</span>，结束！`
            ]);
            return;
        }

        await animateFlowchart('stack-flowchart', ['A', 'B', 'D', 'E'], 500);

        const value = this.data.pop();
        this.render();
        showMessage('stack-message', `Pop: 弹出栈顶元素 ${formatValueForDisplay(value)}`, 'success');
        updateHistory('stack-search-history', [
            `检查栈是否为空：不为空，当前有<span class="index">${this.data.length + 1}</span>个元素`,
            `取出栈顶元素<span class="value">${formatValueForDisplay(value)}</span>`,
            `<span class="found">弹栈成功</span>，当前栈大小：<span class="index">${this.data.length}</span>，结束！`
        ]);

        setTimeout(() => highlightCodeLine('stack-code', 5), 300);
    },

    async peek() {
        this._lastOperation = 'peek';
        setCodeContent('stack-code', this.getCode('peek'));
        await renderFlowchart('stack-flowchart', this.getFlowchart('peek'));

        if (this.data.length === 0) {
            await animateFlowchart('stack-flowchart', ['A', 'B', 'C'], 600);
            showMessage('stack-message', '栈为空', 'error');
            updateHistory('stack-search-history', [
                `检查栈是否为空：<span class="not-found">栈为空</span>`,
                `<span class="not-found">无法查看</span>，结束！`
            ]);
            return;
        }

        await animateFlowchart('stack-flowchart', ['A', 'B', 'D'], 500);

        const value = this.data[this.data.length - 1];
        this.render(true);
        showMessage('stack-message', `Peek: 栈顶元素为 ${formatValueForDisplay(value)}`, 'info');
        updateHistory('stack-search-history', [
            `检查栈是否为空：不为空，当前有<span class="index">${this.data.length}</span>个元素`,
            `查看栈顶元素为<span class="value">${formatValueForDisplay(value)}</span>（不取出）`,
            `<span class="found">查看完成</span>，结束！`
        ]);

        setTimeout(() => highlightCodeLine('stack-code', 5), 300);
    },

    randomFill() {
        this._lastOperation = 'push';
        this.data = [];
        const count = getRandomInt(3, this.maxSize - 2);
        for (let i = 0; i < count; i++) {
            if (Math.random() > 0.5) {
                this.data.push(getRandomInt(10, 99));
            } else {
                this.data.push(String.fromCharCode(65 + getRandomInt(0, 25)));
            }
        }
        this.render();
        setCodeContent('stack-code', this.getCode('push'));
        renderFlowchart('stack-flowchart', this.getFlowchart('push'));
        showMessage('stack-message', `已随机生成 ${count} 个元素`, 'info');
        const elementsStr = this.data.map((v, i) => `[${i}]=${formatValueForDisplay(v)}`).join('，');
        updateHistory('stack-search-history', [
            `随机生成<span class="index">${count}</span>个元素`,
            `栈内容（从底到顶）：${elementsStr}`,
            `<span class="found">填充完成</span>，结束！`
        ]);
    },

    clear() {
        this._lastOperation = 'push';
        const oldLen = this.data.length;
        this.data = [];
        this.render();
        setCodeContent('stack-code', '# 清空栈\nstack = []');
        document.getElementById('stack-flowchart').innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
        showMessage('stack-message', '栈已清空', 'info');
        updateHistory('stack-search-history', oldLen > 0
            ? [`原栈包含<span class="index">${oldLen}</span>个元素`, `移除所有元素`, `<span class="found">栈已清空</span>，结束！`]
            : [`栈为空，无需清空`, `<span class="found">操作完成</span>，结束！`]
        );
    }
};

// ==================== 队列模块 ====================
const queueModule = {
    data: [],
    maxSize: 6,  // 默认容量改为6
    _lastOperation: 'enqueue',

    setCapacity() {
        const capacityInput = document.getElementById('queue-capacity');
        const newCapacity = parseInt(capacityInput.value);
        
        if (isNaN(newCapacity) || newCapacity < 1 || newCapacity > 20) {
            showMessage('queue-message', '请输入1-20之间的有效容量', 'error');
            capacityInput.value = this.maxSize;
            return;
        }

        // 如果当前数据超过新容量，截断数据
        if (this.data.length > newCapacity) {
            const removedCount = this.data.length - newCapacity;
            this.data = this.data.slice(0, newCapacity);
            showMessage('queue-message', `容量已调整为 ${newCapacity}，自动移除了 ${removedCount} 个元素`, 'warning');
        } else {
            showMessage('queue-message', `队列容量已设置为 ${newCapacity}`, 'info');
        }

        this.maxSize = newCapacity;
        this.render();
    },

    getCode(operation) {
        const codes = {
            enqueue: `# 创建空队列
queue = []

# 入队操作
def enqueue(queue, value):
    # 步骤1: 检查队列是否已满
    if len(queue) >= ${this.maxSize}:  # 当前最大容量
        raise Exception("队列已满")
    
    # 步骤2: 将元素添加到队尾
    queue.append(value)  # append在列表末尾添加元素
    return queue

# 示例使用
enqueue(queue, "A")  # 将"A"加入队尾`,
            
            dequeue: `# 出队操作
def dequeue(queue):
    # 步骤1: 检查队列是否为空
    if len(queue) == 0:
        raise Exception("队列为空")
    
    # 步骤2: 移除并返回队首元素
    front_element = queue.pop(0)  # pop(0)移除第一个元素
    return front_element

# 示例使用
front = dequeue(queue)  # 移除队首元素`,
            
            peek: `# 查看队首元素
def peek(queue):
    # 步骤1: 检查队列是否为空
    if len(queue) == 0:
        raise Exception("队列为空")
    
    # 步骤2: 返回队首元素(不移除)
    return queue[0]  # 0表示第一个元素

# 示例使用
front = peek(queue)  # 查看队首元素`
        };
        return codes[operation] || '# 队列基本操作\nqueue = []';
    },

    getFlowchart(operation) {
        const flowcharts = {
            enqueue: `graph TD
    A[开始] --> B{"队列是否已排满"}
    B -->|已满| C["报错：队列已满，排不下了"]
    B -->|还有空位| D[把新元素排到队尾]
    D --> E[结束]`,
            
            dequeue: `graph TD
    A[开始] --> B{"队列里有人在排队吗"}
    B -->|没有，是空的| C["报错：队列为空，没东西可出"]
    B -->|有元素| D[让排在最前面的元素离开]
    D --> E[返回离开的元素]`,
            
            peek: `graph TD
    A[开始] --> B{"队列里有人在排队吗"}
    B -->|没有，是空的| C["报错：队列为空，没东西可看"]
    B -->|有元素| D[查看排在最前面的元素，但不出队]`
        };
        return flowcharts[operation] || 'graph TD\nA[开始] --> B[结束]';
    },

    render(highlight = false) {
        const container = document.getElementById('queue-container');
        container.innerHTML = '';

        this.data.forEach((value, index) => {
            const item = document.createElement('div');
            item.className = 'queue-item';
            if (highlight && index === 0) {
                item.classList.add('highlight');
            }
            item.textContent = formatValueForDisplay(value);
            container.appendChild(item);
        });
    },

    async enqueue() {
        this._lastOperation = 'enqueue';
        if (this.data.length >= this.maxSize) {
            setCodeContent('queue-code', this.getCode('enqueue'));
            await renderFlowchart('queue-flowchart', this.getFlowchart('enqueue'));
            await animateFlowchart('queue-flowchart', ['A', 'B', 'C'], 600);
            showMessage('queue-message', '队列已满，无法继续添加', 'error');
            updateHistory('queue-search-history', [
                `当前队列已有<span class="index">${this.data.length}</span>个元素，容量为<span class="index">${this.maxSize}</span>`,
                `<span class="not-found">队列已满，无法入队</span>，结束！`
            ]);
            return;
        }

        const valueInput = document.getElementById('queue-value');
        const value = parseInputValue(valueInput.value);

        if (value === null) {
            showMessage('queue-message', '请输入有效的元素', 'error');
            return;
        }

        setCodeContent('queue-code', this.getCode('enqueue'));
        await renderFlowchart('queue-flowchart', this.getFlowchart('enqueue'));
        await animateFlowchart('queue-flowchart', ['A', 'B', 'D', 'E'], 500);

        this.data.push(value);
        this.render();
        showMessage('queue-message', `Enqueue: ${formatValueForDisplay(value)} 入队`, 'success');
        valueInput.value = '';
        updateHistory('queue-search-history', [
            `检查队列是否已满：当前<span class="index">${this.data.length - 1}</span>/<span class="index">${this.maxSize}</span>，未满`,
            `将元素<span class="value">${formatValueForDisplay(value)}</span>排到队尾`,
            `<span class="found">入队成功</span>，当前队列大小：<span class="index">${this.data.length}</span>，结束！`
        ]);

        setTimeout(() => highlightCodeLine('queue-code', 6), 300);
    },

    async dequeue() {
        this._lastOperation = 'dequeue';
        setCodeContent('queue-code', this.getCode('dequeue'));
        await renderFlowchart('queue-flowchart', this.getFlowchart('dequeue'));

        if (this.data.length === 0) {
            await animateFlowchart('queue-flowchart', ['A', 'B', 'C'], 600);
            showMessage('queue-message', '队列为空，无法出队', 'error');
            updateHistory('queue-search-history', [
                `检查队列是否为空：<span class="not-found">队列为空</span>`,
                `<span class="not-found">无法出队</span>，结束！`
            ]);
            return;
        }

        await animateFlowchart('queue-flowchart', ['A', 'B', 'D', 'E'], 500);

        const value = this.data.shift();
        this.render();
        showMessage('queue-message', `Dequeue: ${formatValueForDisplay(value)} 出队`, 'success');
        updateHistory('queue-search-history', [
            `检查队列是否为空：不为空，当前有<span class="index">${this.data.length + 1}</span>个元素`,
            `队首元素<span class="value">${formatValueForDisplay(value)}</span>离开队列`,
            `<span class="found">出队成功</span>，当前队列大小：<span class="index">${this.data.length}</span>，结束！`
        ]);
        
        setTimeout(() => highlightCodeLine('queue-code', 5), 300);
    },

    async peek() {
        this._lastOperation = 'peek';
        setCodeContent('queue-code', this.getCode('peek'));
        await renderFlowchart('queue-flowchart', this.getFlowchart('peek'));

        if (this.data.length === 0) {
            await animateFlowchart('queue-flowchart', ['A', 'B', 'C'], 600);
            showMessage('queue-message', '队列为空', 'error');
            updateHistory('queue-search-history', [
                `检查队列是否为空：<span class="not-found">队列为空</span>`,
                `<span class="not-found">无法查看</span>，结束！`
            ]);
            return;
        }

        await animateFlowchart('queue-flowchart', ['A', 'B', 'D'], 500);

        const value = this.data[0];
        this.render(true);
        showMessage('queue-message', `Peek: 队首元素为 ${formatValueForDisplay(value)}`, 'info');
        updateHistory('queue-search-history', [
            `检查队列是否为空：不为空，当前有<span class="index">${this.data.length}</span>个元素`,
            `查看队首元素为<span class="value">${formatValueForDisplay(value)}</span>（不出队）`,
            `<span class="found">查看完成</span>，结束！`
        ]);

        setTimeout(() => highlightCodeLine('queue-code', 5), 300);
    },

    randomFill() {
        this._lastOperation = 'enqueue';
        this.data = [];
        const count = getRandomInt(3, this.maxSize - 3);
        for (let i = 0; i < count; i++) {
            if (Math.random() > 0.5) {
                this.data.push(getRandomInt(10, 99));
            } else {
                this.data.push(String.fromCharCode(65 + getRandomInt(0, 25)));
            }
        }
        this.render();
        setCodeContent('queue-code', this.getCode('enqueue'));
        renderFlowchart('queue-flowchart', this.getFlowchart('enqueue'));
        showMessage('queue-message', `已随机生成 ${count} 个元素`, 'info');
        const elementsStr = this.data.map((v, i) => `[${i}]=${formatValueForDisplay(v)}`).join('，');
        updateHistory('queue-search-history', [
            `随机生成<span class="index">${count}</span>个元素`,
            `队列内容（从队首到队尾）：${elementsStr}`,
            `<span class="found">填充完成</span>，结束！`
        ]);
    },

    clear() {
        this._lastOperation = 'enqueue';
        const oldLen = this.data.length;
        this.data = [];
        this.render();
        setCodeContent('queue-code', '# 清空队列\nqueue = []');
        document.getElementById('queue-flowchart').innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
        showMessage('queue-message', '队列已清空', 'info');
        updateHistory('queue-search-history', oldLen > 0
            ? [`原队列包含<span class="index">${oldLen}</span>个元素`, `移除所有元素`, `<span class="found">队列已清空</span>，结束！`]
            : [`队列为空，无需清空`, `<span class="found">操作完成</span>，结束！`]
        );
    }
};

// ==================== 链表模块 ====================
class ListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

const linkedListModule = {
    head: null,
    size: 0,
    _lastOperation: 'insert_head',

    getCode(operation) {
        const baseCode = `# 定义链表节点类
class ListNode:
    def __init__(self, value):
        self.value = value
        self.next = None  # 指向下一个节点

# 创建空链表
head = None`;

        const ops = {
            insert_head: `\n\n# 头部插入
def insert_at_head(head, value):
    # 步骤1: 创建新节点
    new_node = ListNode(value)
    # 步骤2: 新节点指向原头节点
    new_node.next = head
    # 步骤3: 更新头节点
    return new_node  # 新节点成为新的头节点

# 示例使用
head = insert_at_head(head, "A")`,
            
            insert_tail: `\n\n# 尾部插入
def insert_at_tail(head, value):
    # 步骤1: 创建新节点
    new_node = ListNode(value)
    
    # 步骤2: 如果链表为空
    if head is None:
        return new_node  # 新节点就是头节点
    
    # 步骤3: 找到尾节点
    current = head
    while current.next is not None:
        current = current.next
    
    # 步骤4: 尾节点指向新节点
    current.next = new_node
    return head

# 示例使用
head = insert_at_tail(head, "Z")`,
            
            delete: `\n\n# 删除指定值的节点
def delete_by_value(head, value):
    # 步骤1: 如果头节点就是要删除的
    if head and head.value == value:
        return head.next  # 返回新的头节点
    
    # 步骤2: 遍历寻找要删除的节点
    current = head
    while current and current.next:
        if current.next.value == value:
            # 步骤3: 跳过要删除的节点
            current.next = current.next.next
            break
        current = current.next
    
    return head

# 示例使用
head = delete_by_value(head, "B")`,

            insert_index: `\n\n# 指定位置插入
def insert_at_index(head, index, value):
    # 步骤1: 创建新节点
    new_node = ListNode(value)
    
    # 步骤2: 如果在头部插入
    if index == 0:
        new_node.next = head
        return new_node
    
    # 步骤3: 找到插入位置的前一个节点
    current = head
    for i in range(index - 1):
        if current is None:
            raise IndexError("索引超出范围")
        current = current.next
    
    # 步骤4: 插入新节点
    new_node.next = current.next
    current.next = new_node
    return head

# 示例使用
head = insert_at_index(head, 2, "X")`,

            search: `\n\n# 查找节点
def search_node(head, value):
    # 步骤1: 从头节点开始遍历
    current = head
    index = 0
    
    # 步骤2: 遍历链表
    while current is not None:
        if current.value == value:
            return index  # 找到，返回位置
        current = current.next
        index += 1
    
    # 步骤3: 未找到
    return -1

# 示例使用
pos = search_node(head, "B")`
        };
        
        return baseCode + (ops[operation] || '');
    },

    getFlowchart(operation) {
        const charts = {
            insert_head: `graph TD
    A[开始] --> B[创建一个新节点]
    B --> C[让新节点指向原来的第一个节点]
    C --> D[新节点成为链表的新头部]
    D --> E[结束]`,
            
            insert_tail: `graph TD
    A[开始] --> B{"链表是否为空"}
    B -->|是| C[新节点直接作为第一个节点]
    B -->|否| D[从头部开始往后找]
    D --> E{"到达最后一个节点了吗"}
    E -->|还没到| F[继续往后走一步]
    F --> E
    E -->|到了| G[让最后一个节点指向新节点]
    G --> H[结束]`,
            
            delete: `graph TD
    A[开始] --> B{"第一个节点就是要删的"}
    B -->|是| C[直接跳过它，第二个变成新头部]
    B -->|否| D[从头部开始逐个检查]
    D --> E{"后面还有节点"}
    E -->|是| F{"下一个节点是要删的吗"}
    F -->|是| G[跳过那个节点，让前后直接相连]
    F -->|否| H[继续往后走一步]
    H --> E
    E -->|否| I[没找到要删的节点]`,

            insert_index: `graph TD
    A[开始] --> B[创建一个新节点]
    B --> C{"是插入到第一个位置吗"}
    C -->|是| D[让新节点指向原来的头部]
    D --> E[新节点成为新的头部]
    C -->|否| F[从头部出发]
    F --> G[走到指定位置的前一个节点]
    G --> H[新节点指向后面的节点]
    H --> I[前面的节点指向新节点]
    E --> J[结束]
    I --> J`,

            search: `graph TD
    A[开始] --> B[从第一个节点开始，记录位置为0]
    B --> C{"还有节点没看完"}
    C -->|否| D[全部看完都没找到]
    C -->|是| E{"当前节点是要找的吗"}
    E -->|是| F["找到了！返回所在位置"]
    E -->|否| G[走到下一个节点]
    G --> H[位置编号加1]
    H --> C`
        };
        return charts[operation] || 'graph TD\nA[开始] --> B[结束]';
    },

    render(highlightValue = null) {
        const container = document.getElementById('linkedlist-container');
        container.innerHTML = '';

        if (!this.head) {
            container.innerHTML = '<div class="node-null">空链表</div>';
            return;
        }

        let current = this.head;
        while (current) {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'linkedlist-node';
            if (current.value === highlightValue) {
                nodeDiv.classList.add('highlight');
            }

            nodeDiv.innerHTML = `
                <div class="node-box">
                    <div class="node-data">${formatValueForDisplay(current.value)}</div>
                    <div class="node-pointer">→</div>
                </div>
            `;

            container.appendChild(nodeDiv);

            if (current.next) {
                const arrow = document.createElement('div');
                arrow.className = 'node-arrow';
                container.appendChild(arrow);
            }

            current = current.next;
        }

        const nullDiv = document.createElement('div');
        nullDiv.className = 'node-null';
        nullDiv.textContent = 'NULL';
        container.appendChild(nullDiv);
    },

    async insertAtHead() {
        this._lastOperation = 'insert_head';
        const valueInput = document.getElementById('linkedlist-value');
        const value = parseInputValue(valueInput.value);

        if (value === null) {
            showMessage('linkedlist-message', '请输入有效的元素', 'error');
            return;
        }

        setCodeContent('linkedlist-code', this.getCode('insert_head'));
        await renderFlowchart('linkedlist-flowchart', this.getFlowchart('insert_head'));
        await animateFlowchart('linkedlist-flowchart', ['A', 'B', 'C', 'D', 'E'], 500);

        const newNode = new ListNode(value);
        newNode.next = this.head;
        this.head = newNode;
        this.size++;
        this.render(value);
        showMessage('linkedlist-message', `在头部插入节点 ${formatValueForDisplay(value)}`, 'success');
        valueInput.value = '';
        updateHistory('linkedlist-search-history', [
            `创建新节点<span class="value">${formatValueForDisplay(value)}</span>`,
            `将新节点的 next 指向原头节点`,
            `头指针指向新节点`,
            `<span class="found">头部插入成功</span>，链表长度：<span class="index">${this.size}</span>，结束！`
        ]);
        
        setTimeout(() => highlightCodeLine('linkedlist-code', 10), 300);
    },

    async insertAtTail() {
        this._lastOperation = 'insert_tail';
        const valueInput = document.getElementById('linkedlist-value');
        const value = parseInputValue(valueInput.value);

        if (value === null) {
            showMessage('linkedlist-message', '请输入有效的元素', 'error');
            return;
        }

        setCodeContent('linkedlist-code', this.getCode('insert_tail'));
        await renderFlowchart('linkedlist-flowchart', this.getFlowchart('insert_tail'));
        await animateFlowchart('linkedlist-flowchart', ['A', 'B', 'D', 'E', 'G', 'H'], 500);

        const newNode = new ListNode(value);
        const wasEmpty = !this.head;

        if (!this.head) {
            this.head = newNode;
        } else {
            let current = this.head;
            let traversed = 0;
            while (current.next) {
                current = current.next;
                traversed++;
            }
            current.next = newNode;
        }

        this.size++;
        this.render(value);
        showMessage('linkedlist-message', `在尾部插入节点 ${formatValueForDisplay(value)}`, 'success');
        valueInput.value = '';
        if (wasEmpty) {
            updateHistory('linkedlist-search-history', [
                `创建新节点<span class="value">${formatValueForDisplay(value)}</span>`,
                `链表为空，新节点直接成为头节点`,
                `<span class="found">尾部插入成功</span>，链表长度：<span class="index">${this.size}</span>，结束！`
            ]);
        } else {
            updateHistory('linkedlist-search-history', [
                `创建新节点<span class="value">${formatValueForDisplay(value)}</span>`,
                `从头节点出发，遍历到尾节点`,
                `将尾节点的 next 指向新节点`,
                `<span class="found">尾部插入成功</span>，链表长度：<span class="index">${this.size}</span>，结束！`
            ]);
        }
        
        setTimeout(() => highlightCodeLine('linkedlist-code', 8), 300);
    },

    async insertAtIndex() {
        this._lastOperation = 'insert_index';
        const valueInput = document.getElementById('linkedlist-value');
        const indexInput = document.getElementById('linkedlist-index');
        const value = parseInputValue(valueInput.value);
        const index = parseInt(indexInput.value);

        if (value === null) {
            showMessage('linkedlist-message', '请输入有效的元素', 'error');
            return;
        }

        if (isNaN(index) || index < 0 || index > this.size) {
            showMessage('linkedlist-message', `请输入有效位置 (0-${this.size})`, 'error');
            return;
        }

        setCodeContent('linkedlist-code', this.getCode('insert_index'));
        await renderFlowchart('linkedlist-flowchart', this.getFlowchart('insert_index'));

        const steps = index === 0 ? 
            ['A', 'B', 'C', 'D', 'E', 'J'] : 
            ['A', 'B', 'C', 'F', 'G', 'H', 'I', 'J'];
        await animateFlowchart('linkedlist-flowchart', steps, 500);

        const newNode = new ListNode(value);

        if (index === 0) {
            newNode.next = this.head;
            this.head = newNode;
        } else {
            let current = this.head;
            for (let i = 0; i < index - 1; i++) {
                current = current.next;
            }
            newNode.next = current.next;
            current.next = newNode;
        }

        this.size++;
        this.render(value);
        showMessage('linkedlist-message', `在位置 ${index} 插入节点 ${formatValueForDisplay(value)}`, 'success');
        valueInput.value = '';
        indexInput.value = '';
        updateHistory('linkedlist-search-history', [
            `创建新节点<span class="value">${formatValueForDisplay(value)}</span>`,
            index === 0
                ? `位置为 0，直接在头部插入`
                : `从头节点遍历到位置<span class="index">${index - 1}</span>的节点`,
            `将新节点插入到位置<span class="index">${index}</span>`,
            `<span class="found">插入成功</span>，链表长度：<span class="index">${this.size}</span>，结束！`
        ]);
    },

    async deleteByValue() {
        this._lastOperation = 'delete';
        const valueInput = document.getElementById('linkedlist-value');
        const value = parseInputValue(valueInput.value);

        if (value === null) {
            showMessage('linkedlist-message', '请输入要删除的元素', 'error');
            return;
        }

        if (!this.head) {
            setCodeContent('linkedlist-code', this.getCode('delete'));
            await renderFlowchart('linkedlist-flowchart', this.getFlowchart('delete'));
            await animateFlowchart('linkedlist-flowchart', ['A'], 500);
            showMessage('linkedlist-message', '链表为空', 'error');
            updateHistory('linkedlist-search-history', [
                `<span class="not-found">链表为空，无法删除</span>，结束！`
            ]);
            return;
        }

        setCodeContent('linkedlist-code', this.getCode('delete'));
        await renderFlowchart('linkedlist-flowchart', this.getFlowchart('delete'));

        if (this.head.value === value) {
            await animateFlowchart('linkedlist-flowchart', ['A', 'B', 'C'], 500);
            this.head = this.head.next;
            this.size--;
            this.render();
            showMessage('linkedlist-message', `删除节点 ${formatValueForDisplay(value)}`, 'success');
            valueInput.value = '';
            updateHistory('linkedlist-search-history', [
                `检查头节点：值为<span class="value">${formatValueForDisplay(value)}</span>，<span class="found">匹配</span>`,
                `头指针指向下一个节点`,
                `<span class="found">删除成功</span>，链表长度：<span class="index">${this.size}</span>，结束！`
            ]);
            return;
        }

        let current = this.head;
        let steps = ['A', 'B', 'D'];
        let historySteps = [];
        let pos = 0;
        historySteps.push(`检查位置<span class="index">${pos}</span>节点：值为<span class="value">${formatValueForDisplay(current.value)}</span>，<span class="not-found">不匹配</span>`);
        while (current.next && current.next.value !== value) {
            current = current.next;
            pos++;
            steps.push('E', 'F', 'H');
            historySteps.push(`检查位置<span class="index">${pos}</span>节点：值为<span class="value">${formatValueForDisplay(current.value)}</span>，<span class="not-found">不匹配</span>`);
        }
        steps.push('E');

        if (current.next) {
            steps.push('F', 'G');
            await animateFlowchart('linkedlist-flowchart', steps, 500);
            current.next = current.next.next;
            this.size--;
            this.render();
            showMessage('linkedlist-message', `删除节点 ${formatValueForDisplay(value)}`, 'success');
            historySteps.push(`找到位置<span class="index">${pos + 1}</span>节点：值为<span class="value">${formatValueForDisplay(value)}</span>，<span class="found">匹配</span>`);
            historySteps.push(`<span class="found">删除成功</span>，链表长度：<span class="index">${this.size}</span>，结束！`);
        } else {
            steps.push('I');
            await animateFlowchart('linkedlist-flowchart', steps, 500);
            this.render();
            showMessage('linkedlist-message', `未找到节点 ${formatValueForDisplay(value)}`, 'error');
            historySteps.push(`<span class="not-found">遍历完成，未找到目标节点</span>，结束！`);
        }
        valueInput.value = '';
        updateHistory('linkedlist-search-history', historySteps);
    },
    
    async search() {
        this._lastOperation = 'search';
        const valueInput = document.getElementById('linkedlist-value');
        const value = parseInputValue(valueInput.value);

        if (value === null) {
            showMessage('linkedlist-message', '请输入要查找的元素', 'error');
            return;
        }

        if (!this.head) {
            setCodeContent('linkedlist-code', this.getCode('search'));
            await renderFlowchart('linkedlist-flowchart', this.getFlowchart('search'));
            await animateFlowchart('linkedlist-flowchart', ['A', 'B', 'D'], 500);
            this.render();
            showMessage('linkedlist-message', `未找到节点 ${formatValueForDisplay(value)}`, 'error');
            valueInput.value = '';
            updateHistory('linkedlist-search-history', [
                `<span class="not-found">链表为空，无法查找</span>，结束！`
            ]);
            return;
        }

        setCodeContent('linkedlist-code', this.getCode('search'));
        await renderFlowchart('linkedlist-flowchart', this.getFlowchart('search'));

        let current = this.head;
        let index = 0;
        let steps = ['A', 'B'];
        let historySteps = [];
        
        while (current) {
            steps.push('C', 'E');
            if (current.value === value) {
                steps.push('F');
                await animateFlowchart('linkedlist-flowchart', steps, 500);
                this.render(value);
                showMessage('linkedlist-message', `找到节点 ${formatValueForDisplay(value)}，位置为 ${index}`, 'success');
                valueInput.value = '';
                historySteps.push(`查找位置<span class="index">${index}</span>节点：值为<span class="value">${formatValueForDisplay(current.value)}</span>，<span class="found">匹配成功</span>，结束！`);
                updateHistory('linkedlist-search-history', historySteps);
                return;
            }
            historySteps.push(`查找位置<span class="index">${index}</span>节点：值为<span class="value">${formatValueForDisplay(current.value)}</span>，<span class="not-found">不匹配</span>`);
            current = current.next;
            index++;
            steps.push('G', 'H');
        }

        steps.push('C', 'D');
        await animateFlowchart('linkedlist-flowchart', steps, 500);
        this.render();
        showMessage('linkedlist-message', `未找到节点 ${formatValueForDisplay(value)}`, 'error');
        valueInput.value = '';
        historySteps.push(`<span class="not-found">遍历完成，未找到目标节点</span>，结束！`);
        updateHistory('linkedlist-search-history', historySteps);
    },

    randomFill() {
        this._lastOperation = 'insert_head';
        this.head = null;
        this.size = 0;
        const count = getRandomInt(4, 7);
        const elements = [];
        for (let i = 0; i < count; i++) {
            const val = Math.random() > 0.5 ? 
                getRandomInt(10, 99) : 
                String.fromCharCode(65 + getRandomInt(0, 25));
            elements.push(val);
            const newNode = new ListNode(val);
            if (!this.head) {
                this.head = newNode;
            } else {
                let current = this.head;
                while (current.next) current = current.next;
                current.next = newNode;
            }
            this.size++;
        }
        this.render();
        setCodeContent('linkedlist-code', this.getCode('insert_head'));
        renderFlowchart('linkedlist-flowchart', this.getFlowchart('insert_head'));
        showMessage('linkedlist-message', `已随机生成 ${count} 个节点`, 'info');
        const elementsStr = elements.map(v => formatValueForDisplay(v)).join(' → ');
        updateHistory('linkedlist-search-history', [
            `随机生成<span class="index">${count}</span>个节点`,
            `链表内容：${elementsStr}`,
            `<span class="found">填充完成</span>，结束！`
        ]);
    },

    clear() {
        this._lastOperation = 'insert_head';
        const oldSize = this.size;
        this.head = null;
        this.size = 0;
        this.render();
        setCodeContent('linkedlist-code', '# 清空链表\nhead = None');
        document.getElementById('linkedlist-flowchart').innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
        showMessage('linkedlist-message', '链表已清空', 'info');
        updateHistory('linkedlist-search-history', oldSize > 0
            ? [`原链表包含<span class="index">${oldSize}</span>个节点`, `移除所有节点`, `<span class="found">链表已清空</span>，结束！`]
            : [`链表为空，无需清空`, `<span class="found">操作完成</span>，结束！`]
        );
    }
};

// ==================== 二叉树模块 ====================
class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

const treeModule = {
    root: null,
    _lastOperation: 'insert',

    getCode(operation) {
        const codes = {
            insert: `# 定义二叉树节点类
class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None   # 左子节点
        self.right = None  # 右子节点

# 插入节点到二叉搜索树
def insert_node(root, value):
    # 步骤1: 如果树为空，创建根节点
    if root is None:
        return TreeNode(value)
    
    # 步骤2: 比较值大小，决定插入位置
    if value < root.value:
        # 小于当前节点，插入左子树
        root.left = insert_node(root.left, value)
    else:
        # 大于等于当前节点，插入右子树
        root.right = insert_node(root.right, value)
    
    return root

# 示例使用
root = insert_node(root, 50)`,

            search: `# 在二叉搜索树中搜索节点
def search_node(root, value):
    # 步骤1: 如果节点为空，未找到
    if root is None:
        return False
    
    # 步骤2: 如果找到目标值
    if value == root.value:
        return True
    
    # 步骤3: 根据大小决定搜索方向
    if value < root.value:
        return search_node(root.left, value)   # 搜索左子树
    else:
        return search_node(root.right, value)  # 搜索右子树

# 示例使用
found = search_node(root, 50)`,

            preorder: `# 前序遍历: 根 -> 左 -> 右
def preorder_traversal(root, result):
    if root is not None:
        result.append(root.value)           # 访问根节点
        preorder_traversal(root.left, result)   # 遍历左子树
        preorder_traversal(root.right, result)  # 遍历右子树

# 示例使用
result = []
preorder_traversal(root, result)`,

            inorder: `# 中序遍历: 左 -> 根 -> 右
def inorder_traversal(root, result):
    if root is not None:
        inorder_traversal(root.left, result)    # 遍历左子树
        result.append(root.value)           # 访问根节点
        inorder_traversal(root.right, result)   # 遍历右子树

# 示例使用
result = []
inorder_traversal(root, result)`,

            postorder: `# 后序遍历: 左 -> 右 -> 根
def postorder_traversal(root, result):
    if root is not None:
        postorder_traversal(root.left, result)   # 遍历左子树
        postorder_traversal(root.right, result)  # 遍历右子树
        result.append(root.value)            # 访问根节点

# 示例使用
result = []
postorder_traversal(root, result)`
        };
        return codes[operation] || '# 二叉树基本操作';
    },

    getFlowchart(operation) {
        const flowcharts = {
            insert: `graph TD
    A[开始插入] --> B{"当前节点为空"}
    B -->|是| C[创建新节点]
    C --> D[返回新节点]
    B -->|否| E{"新值小于当前节点值"}
    E -->|是| F[递归：插入左子树]
    F --> B
    E -->|否| G[递归：插入右子树]
    G --> B`,

            search: `graph TD
    A[开始搜索] --> B{"当前节点为空"}
    B -->|是| C[返回：未找到]
    B -->|否| D{"值等于当前节点值"}
    D -->|是| E["返回：找到了！"]
    D -->|否| F{"目标值小于当前节点值"}
    F -->|是| G[递归：搜索左子树]
    G --> B
    F -->|否| H[递归：搜索右子树]
    H --> B`,

            preorder: `graph TD
    A[开始前序遍历] --> B{"当前节点存在"}
    B -->|否| C[返回]
    B -->|存在| D[访问当前节点]
    D --> E[递归：遍历左子树]
    E --> F[递归：遍历右子树]
    F --> G[结束]
    E -.-> B
    F -.-> B`,

            inorder: `graph TD
    A[开始中序遍历] --> B{"当前节点存在"}
    B -->|否| C[返回]
    B -->|存在| D[递归：遍历左子树]
    D --> E[访问当前节点]
    E --> F[递归：遍历右子树]
    F --> G[结束]
    D -.-> B
    F -.-> B`,

            postorder: `graph TD
    A[开始后序遍历] --> B{"当前节点存在"}
    B -->|否| C[返回]
    B -->|存在| D[递归：遍历左子树]
    D --> E[递归：遍历右子树]
    E --> F[访问当前节点]
    F --> G[结束]
    D -.-> B
    E -.-> B`
        };
        return flowcharts[operation] || 'graph TD\nA[开始] --> B[结束]';
    },

    drawTree() {
        const canvas = document.getElementById('tree-canvas');
        const container = canvas.parentElement;
        
        // 自适应容器宽度
        canvas.width = Math.max(600, container.clientWidth - 40);
        canvas.height = 400;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!this.root) {
            ctx.fillStyle = '#5a5f78';
            ctx.font = '15px "Space Grotesk", "Noto Sans SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('树为空，请添加节点', canvas.width / 2, canvas.height / 2);
            return;
        }

        this.drawNode(ctx, this.root, canvas.width / 2, 50, canvas.width / 4, 0);
    },

    drawNode(ctx, node, x, y, offsetX, depth) {
        if (!node) return;

        const radius = 22;
        const ySpacing = 60;

        // 绘制连接线
        if (node.left) {
            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(x - offsetX, y + ySpacing - radius);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            this.drawNode(ctx, node.left, x - offsetX, y + ySpacing, offsetX / 2, depth + 1);
        }

        if (node.right) {
            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(x + offsetX, y + ySpacing - radius);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            this.drawNode(ctx, node.right, x + offsetX, y + ySpacing, offsetX / 2, depth + 1);
        }

        // 绘制节点
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(1, '#16a34a');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制值
        ctx.fillStyle = 'white';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.value, x, y);
    },

    async insert() {
        this._lastOperation = 'insert';
        const valueInput = document.getElementById('tree-value');
        const value = parseInt(valueInput.value);

        setCodeContent('tree-code', this.getCode('insert'));
        await renderFlowchart('tree-flowchart', this.getFlowchart('insert'));

        if (isNaN(value)) {
            await animateFlowchart('tree-flowchart', ['A'], 800);
            showMessage('tree-message', '请输入有效的数值', 'error');
            return;
        }

        const newNode = new TreeNode(value);
        let historySteps = [];

        if (!this.root) {
            await animateFlowchart('tree-flowchart', ['A', 'B', 'C', 'D'], 800);
            this.root = newNode;
            historySteps = [
                `树为空，创建根节点<span class="value">${value}</span>`,
                `<span class="found">插入成功</span>，结束！`
            ];
        } else {
            this._insertHistory = [];
            await this.insertNodeWithAnimation(this.root, newNode);
            historySteps = this._insertHistory;
            historySteps.push(`<span class="found">插入成功</span>，结束！`);
        }

        this.drawTree();
        showMessage('tree-message', `插入节点 ${value}`, 'success');
        valueInput.value = '';
        updateHistory('tree-search-history', historySteps);

        setTimeout(() => highlightCodeLine('tree-code', 8), 300);
    },

    async insertNodeWithAnimation(node, newNode) {
        if (newNode.value < node.value) {
            this._insertHistory.push(`比较<span class="value">${newNode.value}</span> < <span class="value">${node.value}</span>，往左子树走`);
            if (!node.left) {
                await animateFlowchart('tree-flowchart', ['A', 'B', 'E', 'F', 'B', 'C', 'D'], 700);
                node.left = newNode;
                this._insertHistory.push(`左子树为空，插入节点<span class="value">${newNode.value}</span>`);
            } else {
                await animateFlowchart('tree-flowchart', ['A', 'B', 'E', 'F'], 700);
                await this.insertNodeWithAnimation(node.left, newNode);
            }
        } else {
            this._insertHistory.push(`比较<span class="value">${newNode.value}</span> >= <span class="value">${node.value}</span>，往右子树走`);
            if (!node.right) {
                await animateFlowchart('tree-flowchart', ['A', 'B', 'E', 'G', 'B', 'C', 'D'], 700);
                node.right = newNode;
                this._insertHistory.push(`右子树为空，插入节点<span class="value">${newNode.value}</span>`);
            } else {
                await animateFlowchart('tree-flowchart', ['A', 'B', 'E', 'G'], 700);
                await this.insertNodeWithAnimation(node.right, newNode);
            }
        }
    },

    insertNode(node, newNode) {
        if (newNode.value < node.value) {
            if (!node.left) {
                node.left = newNode;
            } else {
                this.insertNode(node.left, newNode);
            }
        } else {
            if (!node.right) {
                node.right = newNode;
            } else {
                this.insertNode(node.right, newNode);
            }
        }
    },

    async search() {
        this._lastOperation = 'search';
        const valueInput = document.getElementById('tree-value');
        const value = parseInt(valueInput.value);

        setCodeContent('tree-code', this.getCode('search'));
        await renderFlowchart('tree-flowchart', this.getFlowchart('search'));

        if (isNaN(value)) {
            await animateFlowchart('tree-flowchart', ['A'], 800);
            showMessage('tree-message', '请输入要搜索的数值', 'error');
            return;
        }

        if (!this.root) {
            await animateFlowchart('tree-flowchart', ['A', 'B', 'C'], 800);
            showMessage('tree-message', `未找到节点 ${value}，树为空`, 'error');
            valueInput.value = '';
            updateHistory('tree-search-history', [
                `<span class="not-found">树为空，无法查找</span>，结束！`
            ]);
            return;
        }

        this._searchHistory = [];
        const found = await this.searchNodeWithAnimation(this.root, value);
        
        if (found) {
            showMessage('tree-message', `找到节点 ${value}`, 'success');
            this._searchHistory.push(`<span class="found">找到目标节点</span>，结束！`);
        } else {
            showMessage('tree-message', `未找到节点 ${value}`, 'error');
            this._searchHistory.push(`<span class="not-found">遍历完成，未找到目标节点</span>，结束！`);
        }
        valueInput.value = '';
        updateHistory('tree-search-history', this._searchHistory);

        setTimeout(() => highlightCodeLine('tree-code', 5), 300);
    },

    async searchNodeWithAnimation(node, value) {
        if (!node) {
            await animateFlowchart('tree-flowchart', ['A', 'B', 'C'], 700);
            this._searchHistory.push(`到达空节点，目标不在此分支`);
            return false;
        }

        if (value === node.value) {
            await animateFlowchart('tree-flowchart', ['A', 'B', 'D', 'E'], 700);
            this._searchHistory.push(`比较<span class="value">${value}</span> == <span class="value">${node.value}</span>，<span class="found">匹配</span>`);
            return true;
        }

        if (value < node.value) {
            await animateFlowchart('tree-flowchart', ['A', 'B', 'D', 'F', 'G'], 700);
            this._searchHistory.push(`比较<span class="value">${value}</span> < <span class="value">${node.value}</span>，往左子树走`);
            return await this.searchNodeWithAnimation(node.left, value);
        } else {
            await animateFlowchart('tree-flowchart', ['A', 'B', 'D', 'F', 'H'], 700);
            this._searchHistory.push(`比较<span class="value">${value}</span> > <span class="value">${node.value}</span>，往右子树走`);
            return await this.searchNodeWithAnimation(node.right, value);
        }
    },

    searchNode(node, value) {
        if (!node) return false;
        if (value === node.value) return true;
        if (value < node.value) return this.searchNode(node.left, value);
        return this.searchNode(node.right, value);
    },

    showTraversal(name, sequence) {
        const resultDiv = document.getElementById('traversal-result');
        const sequenceDiv = resultDiv.querySelector('.traversal-sequence') || document.createElement('div');
        sequenceDiv.className = 'traversal-sequence';
        sequenceDiv.innerHTML = '';

        resultDiv.innerHTML = `<h4>${name}遍历结果：</h4>`;
        resultDiv.appendChild(sequenceDiv);
        resultDiv.classList.add('show');

        sequence.forEach((value, index) => {
            setTimeout(() => {
                const node = document.createElement('span');
                node.className = 'traversal-node';
                node.textContent = value;
                node.style.animationDelay = `${index * 0.1}s`;
                sequenceDiv.appendChild(node);
            }, index * 100);
        });

        showMessage('tree-message', `${name}遍历: ${sequence.join(' → ')}`, 'info');
    },

    async preorder() {
        this._lastOperation = 'preorder';
        if (!this.root) {
            showMessage('tree-message', '树为空', 'error');
            updateHistory('tree-search-history', [`<span class="not-found">树为空</span>，结束！`]);
            return;
        }
        setCodeContent('tree-code', this.getCode('preorder'));
        await renderFlowchart('tree-flowchart', this.getFlowchart('preorder'));
        await animateFlowchart('tree-flowchart', ['A', 'B', 'D', 'E', 'F', 'G'], 800);
        const sequence = [];
        this.preorderTraversal(this.root, sequence);
        this.showTraversal('前序', sequence);
        updateHistory('tree-search-history', [
            `遍历顺序：根 → 左子树 → 右子树`,
            `结果：${sequence.join(' → ')}`,
            `<span class="found">前序遍历完成</span>，共<span class="index">${sequence.length}</span>个节点，结束！`
        ]);
        setTimeout(() => highlightCodeLine('tree-code', 4), 300);
    },

    preorderTraversal(node, sequence) {
        if (node) {
            sequence.push(node.value);
            this.preorderTraversal(node.left, sequence);
            this.preorderTraversal(node.right, sequence);
        }
    },

    async inorder() {
        this._lastOperation = 'inorder';
        if (!this.root) {
            showMessage('tree-message', '树为空', 'error');
            updateHistory('tree-search-history', [`<span class="not-found">树为空</span>，结束！`]);
            return;
        }
        setCodeContent('tree-code', this.getCode('inorder'));
        await renderFlowchart('tree-flowchart', this.getFlowchart('inorder'));
        await animateFlowchart('tree-flowchart', ['A', 'B', 'D', 'E', 'F', 'G'], 800);
        const sequence = [];
        this.inorderTraversal(this.root, sequence);
        this.showTraversal('中序', sequence);
        updateHistory('tree-search-history', [
            `遍历顺序：左子树 → 根 → 右子树`,
            `结果：${sequence.join(' → ')}`,
            `<span class="found">中序遍历完成</span>，共<span class="index">${sequence.length}</span>个节点，结束！`
        ]);
        setTimeout(() => highlightCodeLine('tree-code', 5), 300);
    },

    inorderTraversal(node, sequence) {
        if (node) {
            this.inorderTraversal(node.left, sequence);
            sequence.push(node.value);
            this.inorderTraversal(node.right, sequence);
        }
    },

    async postorder() {
        this._lastOperation = 'postorder';
        if (!this.root) {
            showMessage('tree-message', '树为空', 'error');
            updateHistory('tree-search-history', [`<span class="not-found">树为空</span>，结束！`]);
            return;
        }
        setCodeContent('tree-code', this.getCode('postorder'));
        await renderFlowchart('tree-flowchart', this.getFlowchart('postorder'));
        await animateFlowchart('tree-flowchart', ['A', 'B', 'D', 'E', 'F', 'G'], 800);
        const sequence = [];
        this.postorderTraversal(this.root, sequence);
        this.showTraversal('后序', sequence);
        updateHistory('tree-search-history', [
            `遍历顺序：左子树 → 右子树 → 根`,
            `结果：${sequence.join(' → ')}`,
            `<span class="found">后序遍历完成</span>，共<span class="index">${sequence.length}</span>个节点，结束！`
        ]);
        setTimeout(() => highlightCodeLine('tree-code', 6), 300);
    },

    postorderTraversal(node, sequence) {
        if (node) {
            this.postorderTraversal(node.left, sequence);
            this.postorderTraversal(node.right, sequence);
            sequence.push(node.value);
        }
    },

    async randomFill() {
        this._lastOperation = 'insert';
        this.root = null;
        const count = getRandomInt(7, 12);
        const values = new Set();
        while (values.size < count) {
            values.add(getRandomInt(10, 99));
        }
        values.forEach(value => {
            const newNode = new TreeNode(value);
            if (!this.root) {
                this.root = newNode;
            } else {
                this.insertNode(this.root, newNode);
            }
        });
        this.drawTree();
        setCodeContent('tree-code', this.getCode('insert'));
        await renderFlowchart('tree-flowchart', this.getFlowchart('insert'));
        showMessage('tree-message', `已随机生成 ${count} 个节点`, 'info');
        updateHistory('tree-search-history', [
            `随机生成<span class="index">${count}</span>个节点`,
            `节点值：${[...values].join('，')}`,
            `<span class="found">填充完成</span>，结束！`
        ]);
    },

    async clear() {
        this._lastOperation = 'insert';
        this.root = null;
        this.drawTree();
        setCodeContent('tree-code', '# 清空二叉树\nroot = None');
        document.getElementById('tree-flowchart').innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
        document.getElementById('traversal-result').classList.remove('show');
        showMessage('tree-message', '树已清空', 'info');
        updateHistory('tree-search-history', [
            `移除所有节点`,
            `<span class="found">树已清空</span>，结束！`
        ]);
    }
};

// ==================== 图模块 ====================
const graphModule = {
    vertices: [],
    adjacencyList: {},
    _lastOperation: 'addVertex',
    positions: {},

    getCode(operation) {
        const codes = {
            addVertex: `# 创建图的邻接表表示
graph = {}  # 字典存储邻接表

# 添加顶点
def add_vertex(graph, vertex):
    if vertex not in graph:
        graph[vertex] = []  # 初始化为空列表
    return graph

# 示例使用
add_vertex(graph, "A")`,

            addEdge: `# 添加边（无向图）
def add_edge(graph, v1, v2):
    # 步骤1: 确保两个顶点都存在
    if v1 not in graph or v2 not in graph:
        raise Exception("顶点不存在")
    
    # 步骤2: 添加双向连接（无向图）
    if v2 not in graph[v1]:
        graph[v1].append(v2)
    if v1 not in graph[v2]:
        graph[v2].append(v1)
    
    return graph

# 示例使用
add_edge(graph, "A", "B")`,

            bfs: `# 广度优先搜索 (BFS)
def bfs(graph, start):
    visited = set()      # 记录已访问的顶点
    queue = [start]      # 使用队列存储待访问顶点
    order = []           # 记录遍历顺序
    
    while queue:
        vertex = queue.pop(0)  # 取出队首顶点
        if vertex not in visited:
            visited.add(vertex)
            order.append(vertex)
            # 将未访问的邻居加入队列
            for neighbor in graph[vertex]:
                if neighbor not in visited:
                    queue.append(neighbor)
    
    return order

# 示例使用
result = bfs(graph, "A")`,

            dfs: `# 深度优先搜索 (DFS)
def dfs(graph, start):
    visited = set()      # 记录已访问的顶点
    order = []           # 记录遍历顺序
    
    def dfs_helper(vertex):
        visited.add(vertex)
        order.append(vertex)
        # 递归访问未访问的邻居
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                dfs_helper(neighbor)
    
    dfs_helper(start)
    return order

# 示例使用
result = dfs(graph, "A")`
        };
        return codes[operation] || '# 图的基本操作';
    },

    getFlowchart(operation) {
        const flowcharts = {
            addVertex: `graph TD
    A[开始] --> B{"这个点已经存在了吗"}
    B -->|已存在| C[不需要重复添加]
    B -->|不存在| D[添加新的点，暂时没有连线]
    D --> E[结束]`,

            addEdge: `graph TD
    A[开始] --> B{"两个点都存在吗"}
    B -->|有不存在的| C["报错：点不存在，无法连线"]
    B -->|都存在| D{"这两个点已经连过了吗"}
    D -->|没连过| E[在两个点之间画一条线]
    E --> F[双向都记录这条连线]
    D -->|已连过| G[不需要重复连线]
    F --> H[结束]
    G --> H`,

            bfs: `graph TD
    A[开始] --> B[准备一个排队区和一份已访问名单]
    B --> C{"排队区还有人吗"}
    C -->|没有了| D[全部访问完毕，返回结果]
    C -->|还有| E[让排在最前面的出来]
    E --> F{"这个点访问过了吗"}
    F -->|访问过| C
    F -->|没访问过| G[标记为已访问]
    G --> H[记录这个点的顺序]
    H --> I[查看它的所有邻居]
    I --> J{"邻居访问过了吗"}
    J -->|没有| K[让邻居去排队等候]
    J -->|已访问| I
    K --> I
    I -->|邻居都看完了| C`,

            dfs: `graph TD
    A[开始] --> B[从起点出发]
    B --> C[标记当前点为已访问]
    C --> D[记录这个点的顺序]
    D --> E[查看当前点的所有邻居]
    E --> F{"邻居访问过了吗"}
    F -->|没有| G[立刻深入去访问这个邻居]
    G --> E
    F -->|已访问| E
    E -->|邻居都看完了| H[全部访问完毕，返回结果]`
        };
        return flowcharts[operation] || 'graph TD\nA[开始] --> B[结束]';
    },

    drawGraph(highlightVertex = null, traversalOrder = []) {
        const canvas = document.getElementById('graph-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.vertices.length === 0) {
            ctx.fillStyle = '#5a5f78';
            ctx.font = '15px "Space Grotesk", "Noto Sans SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('图为空，请添加顶点和边', canvas.width / 2, canvas.height / 2);
            return;
        }

        // 绘制边
        this.vertices.forEach(vertex => {
            const neighbors = this.adjacencyList[vertex] || [];
            neighbors.forEach(neighbor => {
                if (this.vertices.indexOf(vertex) < this.vertices.indexOf(neighbor)) {
                    const from = this.positions[vertex];
                    const to = this.positions[neighbor];
                    if (from && to) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(from.x, from.y);
                        ctx.lineTo(to.x, to.y);
                        ctx.strokeStyle = 'rgba(120, 120, 230, 0.75)';
                        ctx.lineWidth = 3;
                        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
                        ctx.shadowBlur = 6;
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            });
        });

        // 绘制顶点
        this.vertices.forEach((vertex, index) => {
            const pos = this.positions[vertex];
            if (!pos) return;

            const radius = 20;
            const orderIndex = traversalOrder.indexOf(vertex);

            // 绘制节点发光背景（光晕）
            ctx.save();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius + 5, 0, Math.PI * 2);
            if (orderIndex !== -1) {
                ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
            } else if (vertex === highlightVertex) {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            } else {
                ctx.fillStyle = 'rgba(255, 87, 34, 0.1)';
            }
            ctx.fill();
            ctx.restore();

            // 绘制节点主体
            ctx.save();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

            let gradient;
            if (orderIndex !== -1) {
                gradient = ctx.createRadialGradient(pos.x - 5, pos.y - 5, 0, pos.x, pos.y, radius);
                gradient.addColorStop(0, '#4ade80');
                gradient.addColorStop(1, '#16a34a');
                ctx.shadowColor = 'rgba(34, 197, 94, 0.7)';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
            } else if (vertex === highlightVertex) {
                gradient = ctx.createRadialGradient(pos.x - 5, pos.y - 5, 0, pos.x, pos.y, radius);
                gradient.addColorStop(0, '#fbbf24');
                gradient.addColorStop(1, '#d97706');
                ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
            } else {
                gradient = ctx.createRadialGradient(pos.x - 5, pos.y - 5, 0, pos.x, pos.y, radius);
                gradient.addColorStop(0, '#ff7043');
                gradient.addColorStop(1, '#c62828');
                ctx.shadowColor = 'rgba(255, 87, 34, 0.4)';
                ctx.shadowBlur = 7;
                ctx.strokeStyle = 'rgba(255, 87, 34, 0.6)';
            }
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // 绘制顶点名称（关闭阴影后再画文字）
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(vertex, pos.x, pos.y);
            ctx.restore();

            // 绘制遍历顺序编号
            if (orderIndex !== -1) {
                ctx.save();
                ctx.fillStyle = '#4ade80';
                ctx.font = 'bold 11px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`(${orderIndex + 1})`, pos.x, pos.y + radius + 12);
                ctx.restore();
            }
        });

        this.updateAdjacencyDisplay();
    },

    updateAdjacencyDisplay() {
        // 更新邻接矩阵
        const matrixDiv = document.getElementById('adjacency-matrix');
        let matrixHTML = '<h4>邻接矩阵</h4><table class="matrix-table"><tr><th></th>';
        this.vertices.forEach(v => matrixHTML += `<th>${v}</th>`);
        matrixHTML += '</tr>';

        this.vertices.forEach(row => {
            matrixHTML += `<tr><th>${row}</th>`;
            this.vertices.forEach(col => {
                const hasEdge = this.adjacencyList[row]?.includes(col) ? 1 : 0;
                matrixHTML += `<td class="${hasEdge ? 'has-edge' : ''}">${hasEdge}</td>`;
            });
            matrixHTML += '</tr>';
        });
        matrixHTML += '</table>';
        matrixDiv.innerHTML = matrixHTML;

        // 更新邻接表
        const listDiv = document.getElementById('adjacency-list');
        let listHTML = '<h4>邻接表</h4>';
        this.vertices.forEach(vertex => {
            const neighbors = this.adjacencyList[vertex] || [];
            listHTML += `
                <div class="adj-list-item">
                    <span class="adj-list-vertex">${vertex}</span>
                    <span class="adj-list-neighbors">→ ${neighbors.length > 0 ? neighbors.join(', ') : '∅'}</span>
                </div>
            `;
        });
        listDiv.innerHTML = listHTML;
    },

    calculatePositions() {
        const canvas = document.getElementById('graph-canvas');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const n = this.vertices.length;
        if (n === 0) return;

        const nodeRadius = 20;
        const margin = nodeRadius + 20;

        // 最大可用半径（不超出画布边缘）
        const maxRadius = Math.min(centerX, centerY) - margin;

        // 最小半径：保证相邻节点间距至少为 nodeRadius * 5（节点间留出更宽松的空间）
        const minRadius = n > 1 ? (n * nodeRadius * 5) / (2 * Math.PI) : 0;

        // 尽量用满可用半径的 92%，同时不低于最小间距要求
        const radius = Math.min(maxRadius, Math.max(minRadius, maxRadius * 0.92));

        this.vertices.forEach((vertex, index) => {
            const angle = (2 * Math.PI * index) / n - Math.PI / 2;
            this.positions[vertex] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
    },

    addVertex() {
        this._lastOperation = 'addVertex';
        const input = document.getElementById('graph-vertex');
        const vertex = input.value.trim().toUpperCase();

        if (!vertex) {
            showMessage('graph-message', '请输入顶点名称', 'error');
            return;
        }

        if (this.vertices.includes(vertex)) {
            showMessage('graph-message', `顶点 ${vertex} 已存在`, 'error');
            updateHistory('graph-search-history', [
                `检查顶点<span class="value">${vertex}</span>是否存在：<span class="not-found">已存在</span>`,
                `<span class="not-found">无需重复添加</span>，结束！`
            ]);
            return;
        }

        setCodeContent('graph-code', this.getCode('addVertex'));
        renderFlowchart('graph-flowchart', this.getFlowchart('addVertex'));

        this.vertices.push(vertex);
        this.adjacencyList[vertex] = [];
        this.calculatePositions();
        this.drawGraph(vertex);
        showMessage('graph-message', `添加顶点 ${vertex}`, 'success');
        input.value = '';
        updateHistory('graph-search-history', [
            `检查顶点<span class="value">${vertex}</span>是否存在：不存在`,
            `创建新顶点，初始化邻接表为空`,
            `<span class="found">添加成功</span>，当前共<span class="index">${this.vertices.length}</span>个顶点，结束！`
        ]);

        setTimeout(() => highlightCodeLine('graph-code', 6), 300);
    },

    addEdge() {
        this._lastOperation = 'addEdge';
        const fromInput = document.getElementById('graph-edge-from');
        const toInput = document.getElementById('graph-edge-to');
        const from = fromInput.value.trim().toUpperCase();
        const to = toInput.value.trim().toUpperCase();

        if (!from || !to) {
            showMessage('graph-message', '请输入起点和终点', 'error');
            return;
        }

        if (!this.vertices.includes(from) || !this.vertices.includes(to)) {
            showMessage('graph-message', '顶点不存在', 'error');
            updateHistory('graph-search-history', [
                `检查顶点<span class="value">${from}</span>和<span class="value">${to}</span>是否存在`,
                `<span class="not-found">顶点不存在，无法添加边</span>，结束！`
            ]);
            return;
        }

        if (this.adjacencyList[from].includes(to)) {
            showMessage('graph-message', '边已存在', 'error');
            updateHistory('graph-search-history', [
                `检查边<span class="value">${from}</span> - <span class="value">${to}</span>是否存在：<span class="not-found">已存在</span>`,
                `<span class="not-found">无需重复添加</span>，结束！`
            ]);
            return;
        }

        setCodeContent('graph-code', this.getCode('addEdge'));
        renderFlowchart('graph-flowchart', this.getFlowchart('addEdge'));

        this.adjacencyList[from].push(to);
        this.adjacencyList[to].push(from);
        this.drawGraph();
        showMessage('graph-message', `添加边 ${from} - ${to}`, 'success');
        fromInput.value = '';
        toInput.value = '';
        updateHistory('graph-search-history', [
            `检查顶点<span class="value">${from}</span>和<span class="value">${to}</span>都存在`,
            `在<span class="value">${from}</span>和<span class="value">${to}</span>之间建立双向连线`,
            `<span class="found">添加边成功</span>，结束！`
        ]);

        setTimeout(() => highlightCodeLine('graph-code', 9), 300);
    },

    bfs() {
        this._lastOperation = 'bfs';
        if (this.vertices.length === 0) {
            showMessage('graph-message', '图为空', 'error');
            updateHistory('graph-search-history', [`<span class="not-found">图为空</span>，结束！`]);
            return;
        }

        setCodeContent('graph-code', this.getCode('bfs'));
        renderFlowchart('graph-flowchart', this.getFlowchart('bfs'));

        const start = this.vertices[0];
        const visited = new Set();
        const queue = [start];
        const order = [];
        const historySteps = [`从顶点<span class="value">${start}</span>开始，加入队列`];

        while (queue.length > 0) {
            const vertex = queue.shift();
            if (!visited.has(vertex)) {
                visited.add(vertex);
                order.push(vertex);
                const neighbors = this.adjacencyList[vertex] || [];
                const unvisited = neighbors.filter(n => !visited.has(n));
                historySteps.push(`访问<span class="value">${vertex}</span>，邻居 [${neighbors.join(', ')}]${unvisited.length > 0 ? '，将 ' + unvisited.join(', ') + ' 加入队列' : ''}`);
                neighbors.forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                });
            }
        }

        this.drawGraph(null, order);
        showMessage('graph-message', `BFS遍历: ${order.join(' → ')}`, 'info');
        historySteps.push(`遍历结果：${order.join(' → ')}`);
        historySteps.push(`<span class="found">BFS遍历完成</span>，共访问<span class="index">${order.length}</span>个顶点，结束！`);
        updateHistory('graph-search-history', historySteps);

        setTimeout(() => highlightCodeLine('graph-code', 8), 300);
    },

    dfs() {
        this._lastOperation = 'dfs';
        if (this.vertices.length === 0) {
            showMessage('graph-message', '图为空', 'error');
            updateHistory('graph-search-history', [`<span class="not-found">图为空</span>，结束！`]);
            return;
        }

        setCodeContent('graph-code', this.getCode('dfs'));
        renderFlowchart('graph-flowchart', this.getFlowchart('dfs'));

        const start = this.vertices[0];
        const visited = new Set();
        const order = [];
        const historySteps = [`从顶点<span class="value">${start}</span>开始深度优先搜索`];

        const dfsHelper = (vertex) => {
            visited.add(vertex);
            order.push(vertex);
            const neighbors = this.adjacencyList[vertex] || [];
            const unvisited = neighbors.filter(n => !visited.has(n));
            historySteps.push(`访问<span class="value">${vertex}</span>，邻居 [${neighbors.join(', ')}]${unvisited.length > 0 ? '，深入 ' + unvisited[0] : '，回溯'}`);
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    dfsHelper(neighbor);
                }
            });
        };

        dfsHelper(start);
        this.drawGraph(null, order);
        showMessage('graph-message', `DFS遍历: ${order.join(' → ')}`, 'info');
        historySteps.push(`遍历结果：${order.join(' → ')}`);
        historySteps.push(`<span class="found">DFS遍历完成</span>，共访问<span class="index">${order.length}</span>个顶点，结束！`);
        updateHistory('graph-search-history', historySteps);

        setTimeout(() => highlightCodeLine('graph-code', 10), 300);
    },

    createSample() {
        this._lastOperation = 'addVertex';
        this.clear();
        this.vertices = ['A', 'B', 'C', 'D', 'E', 'F'];
        this.adjacencyList = {
            'A': ['B', 'C'],
            'B': ['A', 'D', 'E'],
            'C': ['A', 'F'],
            'D': ['B'],
            'E': ['B', 'F'],
            'F': ['C', 'E']
        };
        this.calculatePositions();
        this.drawGraph();
        showMessage('graph-message', '已创建示例图', 'info');
        updateHistory('graph-search-history', [
            `创建含<span class="index">6</span>个顶点的示例图：A, B, C, D, E, F`,
            `建立边：A-B, A-C, B-D, B-E, C-F, E-F`,
            `<span class="found">示例图创建完成</span>，结束！`
        ]);
    },

    clear() {
        this._lastOperation = 'addVertex';
        this.vertices = [];
        this.adjacencyList = {};
        this.positions = {};
        this.drawGraph();
        setCodeContent('graph-code', '# 清空图\ngraph = {}');
        document.getElementById('graph-flowchart').innerHTML = '<div style="text-align:center;color:#5a5f78;padding:20px;">请执行操作查看流程图</div>';
        document.getElementById('adjacency-matrix').innerHTML = '<h4>邻接矩阵</h4>';
        document.getElementById('adjacency-list').innerHTML = '<h4>邻接表</h4>';
        showMessage('graph-message', '图已清空', 'info');
        updateHistory('graph-search-history', [
            `移除所有顶点和边`,
            `<span class="found">图已清空</span>，结束！`
        ]);
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 Mermaid
    await mermaid.init();

    // 恢复代码区域收起状态
    restoreCodeSectionStates();

    // 调整 Canvas 尺寸
    resizeCanvases();

    // 初始化各模块显示
    arrayModule.render();
    stackModule.render();
    queueModule.render();
    linkedListModule.render();
    treeModule.drawTree();
    graphModule.drawGraph();
    
    // 初始化代码显示
    arrayModule._lastOperation = 'insert';
    setCodeContent('array-code', arrayModule.getCode('insert'));
    setCodeContent('stack-code', stackModule.getCode('push'));
    setCodeContent('queue-code', queueModule.getCode('enqueue'));
    setCodeContent('linkedlist-code', linkedListModule.getCode('insert_head'));
    setCodeContent('tree-code', treeModule.getCode('insert'));
    setCodeContent('graph-code', graphModule.getCode('addVertex'));

    // 等待 mermaid 完全初始化后再渲染流程图
    await sleep(100);
    renderFlowchart('array-flowchart', arrayModule.getFlowchart('insert'));
    renderFlowchart('stack-flowchart', stackModule.getFlowchart('push'));
    renderFlowchart('queue-flowchart', queueModule.getFlowchart('enqueue'));
    renderFlowchart('linkedlist-flowchart', linkedListModule.getFlowchart('insert_head'));
    renderFlowchart('tree-flowchart', treeModule.getFlowchart('insert'));
    renderFlowchart('graph-flowchart', graphModule.getFlowchart('addVertex'));
});
