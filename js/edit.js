var currentNodeId = null;
var bomData = { rootNodes: [], nodeId: 1, bomName: "未命名BOM" };
var treeContainer = null;

document.addEventListener('DOMContentLoaded', function() {
  treeContainer = document.getElementById("treeContainer");
  // 绑定所有按钮（新增材料、简化功能）
  document.querySelector("#addRootBtn").onclick = addRootNode;
  document.querySelector("#addChildBtn").onclick = addChildNode;
  document.querySelector("#addMaterialBtn").onclick = addMaterialNode;
  document.querySelector("#saveBtn").onclick = saveCurrentNode;
  document.querySelector("#deleteBtn").onclick = deleteCurrentNode;
  document.querySelector("#saveBomBtn").onclick = saveWholeBOM;
  document.querySelector("#backHomeBtn").onclick = backToHome;
  renderTree();
});

// 新增根零件
function addRootNode() {
  var newNode = { id: bomData.nodeId++, name: "根零件", type: "part", model: "", spec: "", children: [] };
  bomData.rootNodes.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 新增子零件
function addChildNode() {
  if (!currentNodeId) { alert("请先选中父零件！"); return; }
  var parentNode = findNodeById(currentNodeId, bomData.rootNodes);
  if (!parentNode || parentNode.type === "material") { alert("仅零件可新增子零件！"); return; }
  var newNode = { id: bomData.nodeId++, name: "子零件", type: "part", model: "", spec: "", children: [] };
  parentNode.children.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 新增材料（专属功能，绑定新增材料按钮）
function addMaterialNode() {
  if (!currentNodeId) { alert("请先选中零件/材料！"); return; }
  var parentNode = findNodeById(currentNodeId, bomData.rootNodes);
  var newNode = { id: bomData.nodeId++, name: "原材料", type: "material", model: "", spec: "", children: [] };
  parentNode.children.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 保存当前节点（零件/材料通用）
function saveCurrentNode() {
  if (!currentNodeId) { alert("请先选中节点！"); return; }
  var node = findNodeById(currentNodeId, bomData.rootNodes);
  node.name = document.querySelector("#nodeName").value.trim() || (node.type==="part"?"子零件":"原材料");
  node.model = document.querySelector("#nodeModel").value;
  node.spec = document.querySelector("#nodeSpec").value;
  alert("保存成功！");
  renderTree();
}

// 删除当前节点
function deleteCurrentNode() {
  if (!currentNodeId) { alert("请先选中节点！"); return; }
  if (!confirm("确认删除该节点及子节点？")) return;
  deleteNodeById(currentNodeId, bomData.rootNodes);
  currentNodeId = null;
  resetForm();
  renderTree();
}

// 保存BOM表
function saveWholeBOM() {
  var bomName = prompt("BOM表名称：", bomData.bomName);
  if (bomName === null) return;
  bomData.bomName = bomName.trim() || "未命名BOM";
  localStorage.setItem("currentBOM", JSON.stringify(bomData));
  alert("BOM【" + bomData.bomName + "】保存成功！");
}

// 返回首页
function backToHome() {
  if (confirm("返回首页？未保存信息将临时存储")) {
    localStorage.setItem("tempBOM", JSON.stringify(bomData));
    window.location.href = "index.html";
  }
}

// 选中节点
function selectNode(nodeId) {
  currentNodeId = nodeId;
  var node = findNodeById(nodeId, bomData.rootNodes);
  document.querySelector("#nodeName").value = node.name;
  document.querySelector("#nodeModel").value = node.model;
  document.querySelector("#nodeSpec").value = node.spec;
  document.querySelector("#editTip").style.display = "none";
  document.querySelector("#editForm").style.display = "block";
  renderTree();
}

// 重置表单
function resetForm() {
  document.querySelector("#editTip").style.display = "flex";
  document.querySelector("#editForm").style.display = "none";
  document.querySelectorAll("#editForm input").forEach(i => i.value = "");
}

// 渲染树（区分零件/材料样式）
function renderTree() {
  treeContainer.innerHTML = "";
  if (bomData.rootNodes.length === 0) {
    treeContainer.innerHTML = "<div class='empty-tip'>暂无节点，点击【新增根零件】创建</div>";
    return;
  }
  renderNodes(bomData.rootNodes, treeContainer, 0);
}

function renderNodes(nodes, parentEl, level) {
  nodes.forEach(function(node) {
    var nodeEl = document.createElement("div");
    nodeEl.className = `tree-node ${node.id === currentNodeId ? "active" : ""} ${node.type}`;
    nodeEl.style.paddingLeft = (level * 20) + "px";
    nodeEl.innerHTML = node.type === "part" ? `⚙️ ${node.name}` : `📦 ${node.name}`;
    nodeEl.onclick = function(e) { e.stopPropagation(); selectNode(node.id); };
    parentEl.appendChild(nodeEl);
    if (node.children && node.children.length > 0) {
      renderNodes(node.children, parentEl, level + 1);
    }
  });
}

// 递归查找节点
function findNodeById(id, nodes) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return nodes[i];
    if (nodes[i].children && nodes[i].children.length > 0) {
      var res = findNodeById(id, nodes[i].children);
      if (res) return res;
    }
  }
  return null;
}

// 递归删除节点
function deleteNodeById(id, nodes) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      if (deleteNodeById(id, nodes[i].children)) return true;
    }
  }
  return false;
}
