// 全局核心变量（仅3个，够用）
var currentNodeId = null; // 当前选中节点ID
var bomData = { rootNodes: [], nodeId: 1 }; // 节点数据+ID自增
var treeContainer = document.getElementById("treeContainer"); // 树容器

// 页面加载完成后绑定所有事件（核心入口）
window.onload = function() {
  // 绑定新增根节点按钮（直接绑定，无任何中间层）
  document.querySelector("#addRootBtn").onclick = addRootNode;
  // 绑定编辑区保存/删除按钮
  document.querySelector("#savePartBtn").onclick = saveCurrentNode;
  document.querySelector("#deletePartBtn").onclick = deleteCurrentNode;
};

// 核心1：新增根节点（点击#addRootBtn必执行）
function addRootNode() {
  // 1. 创建新节点数据
  var newNode = {
    id: bomData.nodeId++,
    name: "新根零件",
    model: "",
    material: "",
    spec: "",
    remark: ""
  };
  // 2. 加入数据列表
  bomData.rootNodes.push(newNode);
  // 3. 渲染树+选中新节点+加载编辑表单（一步到位）
  renderTree();
  selectNode(newNode.id);
}

// 核心2：渲染节点树（仅渲染根节点，极简逻辑）
function renderTree() {
  treeContainer.innerHTML = ""; // 清空容器
  if (bomData.rootNodes.length === 0) {
    treeContainer.innerHTML = "暂无零件，点击顶部【新增根零件】创建";
    return;
  }
  // 遍历根节点，创建DOM并绑定点击事件
  bomData.rootNodes.forEach(function(node) {
    var nodeEl = document.createElement("div");
    nodeEl.className = "tree-node " + (node.id === currentNodeId ? "active" : "");
    nodeEl.dataset.id = node.id;
    nodeEl.innerText = node.name;
    // 节点点击事件：选中节点（直接绑定）
    nodeEl.onclick = function() { selectNode(node.id); };
    treeContainer.appendChild(nodeEl);
  });
}

// 核心3：选中节点（点击节点必执行，加载编辑表单）
function selectNode(nodeId) {
  currentNodeId = nodeId; // 记录选中ID
  // 找到选中的节点数据
  var node = bomData.rootNodes.find(function(n) { return n.id === nodeId; });
  if (!node) return;
  // 加载数据到右侧编辑表单（直接赋值，无复杂逻辑）
  document.querySelector("#partName").value = node.name;
  document.querySelector("#partModel").value = node.model;
  document.querySelector("#partMaterial").value = node.material;
  document.querySelector("#partSpec").value = node.spec;
  document.querySelector("#partRemark").value = node.remark;
  // 显示表单、隐藏提示
  document.querySelector("#editTip").style.display = "none";
  document.querySelector("#partForm").style.display = "block";
  // 重新渲染树（更新高亮样式）
  renderTree();
}

// 核心4：保存当前选中节点（编辑后点击保存必执行）
function saveCurrentNode() {
  if (!currentNodeId) { alert("请先选中零件！"); return; }
  var node = bomData.rootNodes.find(function(n) { return n.id === currentNodeId; });
  if (!node) return;
  // 从表单获取数据并保存
  node.name = document.querySelector("#partName").value.trim();
  node.model = document.querySelector("#partModel").value;
  node.material = document.querySelector("#partMaterial").value;
  node.spec = document.querySelector("#partSpec").value;
  node.remark = document.querySelector("#partRemark").value;
  alert("保存成功！");
  renderTree(); // 刷新节点名称
}

// 核心5：删除当前选中节点（点击删除必执行）
function deleteCurrentNode() {
  if (!currentNodeId) { alert("请先选中要删除的零件！"); return; }
  if (!confirm("确认删除该零件？")) return;
  // 过滤掉被删除的节点
  bomData.rootNodes = bomData.rootNodes.filter(function(n) { return n.id !== currentNodeId; });
  currentNodeId = null; // 清空选中状态
  // 重置编辑表单
  document.querySelector("#editTip").style.display = "block";
  document.querySelector("#partForm").style.display = "none";
  document.querySelector("#partName").value = "";
  document.querySelector("#partModel").value = "";
  document.querySelector("#partMaterial").value = "";
  document.querySelector("#partSpec").value = "";
  document.querySelector("#partRemark").value = "";
  renderTree(); // 刷新树
}
