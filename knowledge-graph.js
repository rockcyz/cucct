// 知识图谱数据和可视化代码
const knowledgeData = {
    nodes: [
        {id: "计算思维概论", level: 0, color: "#6366f1"},
        {id: "第1章 信息的存储与表示", level: 1, color: "#8b5cf6"},
        {id: "第2章 计算设备处理信息", level: 1, color: "#ec4899"},
        {id: "第3章 数据间的逻辑关系", level: 1, color: "#f59e0b"},
        {id: "第4章 用计算思维求解问题", level: 1, color: "#10b981"},
        {id: "第5章 信息如何在互联网上传播", level: 1, color: "#ef4444"},
        {id: "1-0 课程简介", level: 2, color: "#a5b4fc"},
        {id: "1-1 信息存储和表示的基础", level: 2, color: "#a5b4fc"},
        {id: "1-2 数值的表示", level: 2, color: "#a5b4fc"},
        {id: "1-3 文本的表示", level: 2, color: "#a5b4fc"},
        {id: "1-4 音频的表示", level: 2, color: "#a5b4fc"},
        {id: "1-5 图像的表示", level: 2, color: "#a5b4fc"},
        {id: "1-6 视频的表示", level: 2, color: "#a5b4fc"},
        {id: "2-1 编程语言是什么", level: 2, color: "#f9a8d4"},
        {id: "2-2 编程的基本规则", level: 2, color: "#f9a8d4"},
        {id: "2-3 编程语言的结构与交互", level: 2, color: "#f9a8d4"},
        {id: "2-4 编写一段Python程序", level: 2, color: "#f9a8d4"},
        {id: "3-1 认识数据间的逻辑关系", level: 2, color: "#fbbf24"},
        {id: "3-2 线性数据结构", level: 2, color: "#fbbf24"},
        {id: "3-3 非线性数据结构", level: 2, color: "#fbbf24"},
        {id: "4-1 计算机求解复杂问题", level: 2, color: "#34d399"},
        {id: "4-2 查找特定的数据", level: 2, color: "#34d399"},
        {id: "4-3 快速得到有序的数据", level: 2, color: "#34d399"},
        {id: "5-1 互联网的出现与发展", level: 2, color: "#f87171"},
        {id: "5-2 互联网的架构与运行方式", level: 2, color: "#f87171"},
        {id: "5-3 一次完整的计算机数据传输", level: 2, color: "#f87171"},
        {id: "5-4 面对攻击的网络", level: 2, color: "#f87171"}
    ],
    links: [
        {source: "计算思维概论", target: "第1章 信息的存储与表示"},
        {source: "计算思维概论", target: "第2章 计算设备处理信息"},
        {source: "计算思维概论", target: "第3章 数据间的逻辑关系"},
        {source: "计算思维概论", target: "第4章 用计算思维求解问题"},
        {source: "计算思维概论", target: "第5章 信息如何在互联网上传播"},
        {source: "第1章 信息的存储与表示", target: "1-0 课程简介"},
        {source: "第1章 信息的存储与表示", target: "1-1 信息存储和表示的基础"},
        {source: "第1章 信息的存储与表示", target: "1-2 数值的表示"},
        {source: "第1章 信息的存储与表示", target: "1-3 文本的表示"},
        {source: "第1章 信息的存储与表示", target: "1-4 音频的表示"},
        {source: "第1章 信息的存储与表示", target: "1-5 图像的表示"},
        {source: "第1章 信息的存储与表示", target: "1-6 视频的表示"},
        {source: "第2章 计算设备处理信息", target: "2-1 编程语言是什么"},
        {source: "第2章 计算设备处理信息", target: "2-2 编程的基本规则"},
        {source: "第2章 计算设备处理信息", target: "2-3 编程语言的结构与交互"},
        {source: "第2章 计算设备处理信息", target: "2-4 编写一段Python程序"},
        {source: "第3章 数据间的逻辑关系", target: "3-1 认识数据间的逻辑关系"},
        {source: "第3章 数据间的逻辑关系", target: "3-2 线性数据结构"},
        {source: "第3章 数据间的逻辑关系", target: "3-3 非线性数据结构"},
        {source: "第4章 用计算思维求解问题", target: "4-1 计算机求解复杂问题"},
        {source: "第4章 用计算思维求解问题", target: "4-2 查找特定的数据"},
        {source: "第4章 用计算思维求解问题", target: "4-3 快速得到有序的数据"},
        {source: "第5章 信息如何在互联网上传播", target: "5-1 互联网的出现与发展"},
        {source: "第5章 信息如何在互联网上传播", target: "5-2 互联网的架构与运行方式"},
        {source: "第5章 信息如何在互联网上传播", target: "5-3 一次完整的计算机数据传输"},
        {source: "第5章 信息如何在互联网上传播", target: "5-4 面对攻击的网络"}
    ]
};

const width = document.getElementById('graphContainer').clientWidth;
const height = 700;

const svg = d3.select("#graphContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const simulation = d3.forceSimulation(knowledgeData.nodes)
    .force("link", d3.forceLink(knowledgeData.links).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width / 2, height / 2));

const link = svg.append("g").selectAll("line").data(knowledgeData.links).join("line").attr("class", "link").attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", 2);

const node = svg.append("g").selectAll("circle").data(knowledgeData.nodes).join("circle").attr("class", "node").attr("r", d => d.level === 0 ? 20 : d.level === 1 ? 15 : 10).attr("fill", d => d.color).attr("stroke", "#fff").attr("stroke-width", 2).call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)).on("click", (event, d) => alert(`知识点: ${d.id}`));

const label = svg.append("g").selectAll("text").data(knowledgeData.nodes).join("text").attr("class", "node-label").attr("fill", "#fff").attr("font-weight", d => d.level <= 1 ? "bold" : "normal").text(d => d.id);

simulation.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
    label.attr("x", d => d.x).attr("y", d => d.y + (d.level === 0 ? 30 : d.level === 1 ? 25 : 20)).attr("text-anchor", "middle");
});

function dragstarted(event) { if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }
function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
function dragended(event) { if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }

document.getElementById('resetBtn').addEventListener('click', () => { knowledgeData.nodes.forEach(d => { d.fx = null; d.fy = null; }); simulation.alpha(1).restart(); });
document.getElementById('centerBtn').addEventListener('click', () => { const centerX = width / 2, centerY = height / 2; simulation.force("center", d3.forceCenter(centerX, centerY)).restart(); });
