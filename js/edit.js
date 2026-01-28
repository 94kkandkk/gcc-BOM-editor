// 全局核心变量（保持不变）
var currentNodeId = null;
var bomData = { rootNodes: [], nodeId: 1 };
var treeContainer = null;

// 核心：DOM完全加载后再执行所有操作（100%绑定成功）
document.addEventListener('DOMContentLoaded', function() {
  // 初始化DOM元素（此时元素已存在，能找到）
  treeContainer = document.getElementById("treeContainer");
  
  // 绑定所有按钮事件（核心修复：此时绑定，必生效）
  document.querySelector("#addRootBtn").onclick = addRootNode;
  document.querySelector("#savePartBtn").onclick = saveCurrentNode;
  document.querySelector("#deletePartBtn").onclick = deleteCurrentNode;
  document.querySelector("#addChildBtn").onclick = function() {
    alert("先选中根节点，再新增子零件（极简版可扩展）");
  };

  // 初始化渲染树
  renderTree();
});

// 1. 新增根节点（点击必执行）
function addRootNode() {
  var newNode = {
    id: bomData.nodeId++,
    name: "新根零件",
    model: "",
    material: "",
    spec: "",
    remark: ""
  };
  bomData.rootNodes.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 2. 渲染节点树（极简逻辑）
function renderTree() {
  treeContainer.innerHTML = "";
  if (bomData.rootNodes.length === 0) {
    treeContainer.innerHTML = "暂无零件，点击顶部【新增根零件】创建";
    return;
  }
  bomData.rootNodes.forEach(function(node) {
    var nodeEl = document.createElement("div");
    nodeEl.className = "tree-node " + (node.id === currentNodeId ? "active" : "");
    nodeEl.dataset.id = node.id;
    nodeEl.innerText = node.name;
    nodeEl.onclick = function() { selectNode(node.id); };
    treeContainer.appendChild(nodeEl);
  });
}

// 3. 选中节点（点击必执行，加载表单）
function selectNode(nodeId) {
  currentNodeId = nodeId;
  var node = bomData.rootNodes.find(function(n) { return n.id === nodeId; });
  if (!node) return;
  // 加载表单数据
  document.querySelector("#partName").value = node.name;
  document.querySelector("#partModel").value = node.model;
  document.querySelector("#partMaterial").value = node.material;
  document.querySelector("#partSpec").value = node.spec;
  document.querySelector("#partRemark").value = node.remark;
  // 显示表单、隐藏提示
  document.querySelector("#editTip").style.display = "none";
  document.querySelector("#partForm").style.display = "block";
  renderTree();
}

// 4. 保存当前节点（点击必执行）
function saveCurrentNode() {
  if (!currentNodeId) { alert("请先选中零件！"); return; }
  var node = bomData.rootNodes.find(function(n) { return n.id === currentNodeId; });
  if (!node) return;
  node.name = document.querySelector("#partName").value.trim();
  node.model = document.querySelector("#partModel").value;
  node.material = document.querySelector("#partMaterial").value;
  node.spec = document.querySelector("#partSpec").value;
  node.remark = document.querySelector("#partRemark").value;
  alert("保存成功！");
  renderTree();
}

// 5. 删除当前节点（点击必执行）
function deleteCurrentNode() {
  if (!currentNodeId) { alert("请先选中要删除的零件！"); return; }
  if (!confirm("确认删除该零件？")) return;
  bomData.rootNodes = bomData.rootNodes.filter(function(n) { return n.id !== currentNodeId; });
  currentNodeId = null;
  // 重置表单
  document.querySelector("#editTip").style.display = "block";
  document.querySelector("#partForm").style.display = "none";
  document.querySelectorAll("#partForm input").forEach(function(input) {
    input.value = "";
  });
  renderTree();
}
