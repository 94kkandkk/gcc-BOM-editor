var currentNodeId = null;
var bomData = { rootNodes: [], nodeId: 1 };
var treeContainer = null;

document.addEventListener('DOMContentLoaded', function() {
  treeContainer = document.getElementById("treeContainer");
  // 绑定所有按钮（含addChildBtn）
  document.querySelector("#addRootBtn").onclick = addRootNode;
  document.querySelector("#addChildBtn").onclick = addChildNode;
  document.querySelector("#savePartBtn").onclick = saveCurrentNode;
  document.querySelector("#deletePartBtn").onclick = deleteCurrentNode;
  renderTree();
});

// 新增根节点
function addRootNode() {
  var newNode = { id: bomData.nodeId++, name: "新根零件", model: "", material: "", spec: "", remark: "", children: [] };
  bomData.rootNodes.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 新增子节点（核心修复）
function addChildNode() {
  if (!currentNodeId) { alert("请先选中父节点！"); return; }
  // 递归查找任意层级父节点
  var parentNode = findNodeById(currentNodeId, bomData.rootNodes);
  if (!parentNode) { alert("父节点不存在！"); return; }
  var newNode = { id: bomData.nodeId++, name: "新子零件", model: "", material: "", spec: "", remark: "", children: [] };
  parentNode.children.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 保存节点
function saveCurrentNode() {
  if (!currentNodeId) { alert("请先选中零件！"); return; }
  var node = findNodeById(currentNodeId, bomData.rootNodes);
  if (!node) return;
  node.name = document.querySelector("#partName").value.trim();
  node.model = document.querySelector("#partModel").value;
  node.material = document.querySelector("#partMaterial").value;
  node.spec = document.querySelector("#partSpec").value;
  node.remark = document.querySelector("#partRemark").value;
  alert("保存成功！");
  renderTree();
}

// 删除节点
function deleteCurrentNode() {
  if (!currentNodeId) { alert("请先选中要删除的零件！"); return; }
  if (!confirm("确认删除？")) return;
  deleteNodeById(currentNodeId, bomData.rootNodes);
  currentNodeId = null;
  document.querySelector("#editTip").style.display = "block";
  document.querySelector("#partForm").style.display = "none";
  document.querySelectorAll("#partForm input").forEach(i => i.value = "");
  renderTree();
}

// 选中节点
function selectNode(nodeId) {
  currentNodeId = nodeId;
  var node = findNodeById(nodeId, bomData.rootNodes);
  if (!node) return;
  document.querySelector("#partName").value = node.name;
  document.querySelector("#partModel").value = node.model;
  document.querySelector("#partMaterial").value = node.material;
  document.querySelector("#partSpec").value = node.spec;
  document.querySelector("#partRemark").value = node.remark;
  document.querySelector("#editTip").style.display = "none";
  document.querySelector("#partForm").style.display = "block";
  renderTree();
}

// 渲染树（支持多层级）
function renderTree() {
  treeContainer.innerHTML = "";
  if (bomData.rootNodes.length === 0) {
    treeContainer.innerHTML = "暂无零件，点击顶部【新增根零件】创建";
    return;
  }
  renderNodes(bomData.rootNodes, treeContainer, 0);
}
function renderNodes(nodes, parentEl, level) {
  nodes.forEach(function(node) {
    var nodeEl = document.createElement("div");
    nodeEl.className = "tree-node " + (node.id === currentNodeId ? "active" : "");
    nodeEl.style.paddingLeft = (level * 20) + "px";
    nodeEl.innerText = node.name;
    nodeEl.onclick = function(e) { e.stopPropagation(); selectNode(node.id); };
    parentEl.appendChild(nodeEl);
    if (node.children && node.children.length > 0) {
      renderNodes(node.children, parentEl, level + 1);
    }
  });
}

// 工具：递归查找任意层级节点
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

// 工具：递归删除任意层级节点
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
