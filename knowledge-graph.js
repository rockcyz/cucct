// Knowledge Graph Visualization with D3.js
const knowledgeData = {
    nodes: [
        {id: "计算思维概论", level: 0, color: "#6366f1", size: 25}
    ],
    links: []
};

const width = document.getElementById('graphContainer').clientWidth;
const height = 700;

const svg = d3.select("#graphContainer").append("svg").attr("width", width).attr("height", height);

const simulation = d3.forceSimulation(knowledgeData.nodes)
    .force("link", d3.forceLink(knowledgeData.links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width / 2, height / 2));

const link = svg.append("g").selectAll("line").data(knowledgeData.links).join("line").attr("class", "link");

const node = svg.append("g").selectAll("circle").data(knowledgeData.nodes).join("circle").attr("class", "node").attr("r", d => d.size).attr("fill", d => d.color).call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

const label = svg.append("g").selectAll("text").data(knowledgeData.nodes).join("text").attr("class", "node-label").text(d => d.id);

simulation.on("tick", () => {link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y); node.attr("cx", d => d.x).attr("cy", d => d.y); label.attr("x", d => d.x).attr("y", d => d.y + 30);});

function dragstarted(event) {if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;}
function dragged(event) {event.subject.fx = event.x; event.subject.fy = event.y;}
function dragended(event) {if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null;}
