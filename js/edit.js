var currentNodeId = null;
var bomData = { rootNodes: [], nodeId: 1, bomName: "未命名BOM" };
var treeContainer = null;

document.addEventListener('DOMContentLoaded', function() {
  treeContainer = document.getElementById("treeContainer");
  // 绑定所有按钮（含保存BOM、返回首页）
  document.querySelector("#addRootBtn").onclick = addRootNode;
  document.querySelector("#addChildBtn").onclick = addChildNode;
  document.querySelector("#savePartBtn").onclick = saveCurrentNode;
  document.querySelector("#deletePartBtn").onclick = deleteCurrentNode;
  document.querySelector("#saveBomBtn").onclick = saveWholeBOM;
  document.querySelector("#backHomeBtn").onclick = backToHome;
  renderTree();
});

// 新增根节点
function addRootNode() {
  var newNode = { id: bomData.nodeId++, name: "新根零件", model: "", material: "", spec: "", remark: "", children: [] };
  bomData.rootNodes.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 新增子节点（修复选中后仍提示问题）
function addChildNode() {
  if (!currentNodeId) { alert("请先选中父节点！"); return; }
  var parentNode = findNodeById(currentNodeId, bomData.rootNodes);
  if (!parentNode) { alert("父节点不存在！"); return; }
  var newNode = { id: bomData.nodeId++, name: "新子零件", model: "", material: "", spec: "", remark: "", children: [] };
  parentNode.children.push(newNode);
  renderTree();
  selectNode(newNode.id);
}

// 保存当前节点
function saveCurrentNode() {
  if (!currentNodeId) { alert("请先选中零件！"); return; }
  var node = findNodeById(currentNodeId, bomData.rootNodes);
  if (!node) return;
  node.name = document.querySelector("#partName").value.trim();
  node.model = document.querySelector("#partModel").value;
  node.material = document.querySelector("#partMaterial").value;
  node.spec = document.querySelector("#partSpec").value;
  node.remark = document.querySelector("#partRemark").value;
  alert("零件信息保存成功！");
  renderTree();
}

// 删除当前节点
function deleteCurrentNode() {
  if (!currentNodeId) { alert("请先选中要删除的零件！"); return; }
  if (!confirm("确认删除该零件及所有子零件？")) return;
  deleteNodeById(currentNodeId, bomData.rootNodes);
  currentNodeId = null;
  document.querySelector("#editTip").style.display = "block";
  document.querySelector("#partForm").style.display = "none";
  document.querySelectorAll("#partForm input, #partForm textarea").forEach(i => i.value = "");
  renderTree();
}

// 保存整个BOM表（新增功能，绑定#saveBomBtn）
function saveWholeBOM() {
  var bomName = prompt("请输入BOM表名称：", bomData.bomName);
  if (bomName === null) return;
  bomData.bomName = bomName.trim() || "未命名BOM";
  // 模拟本地存储保存，可根据实际需求修改
  localStorage.setItem("currentBOM", JSON.stringify(bomData));
  alert("BOM表【" + bomData.bomName + "】保存成功！");
}

// 返回首页（绑定#backHomeBtn，跳转index.html）
function backToHome() {
  if (confirm("是否返回首页？未保存的BOM信息将临时存储")) {
    localStorage.setItem("tempBOM", JSON.stringify(bomData));
    window.location.href = "index.html"; // 替换为实际首页地址
  }
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
  document.querySelector("#partForm").style.display = "flex";
  renderTree();
}

// 渲染树（支持多层级）
function renderTree() {
  treeContainer.innerHTML = "";
  if (bomData.rootNodes.length === 0) {
    treeContainer.innerHTML = "<div style='padding:20px;color:#666;text-align:center;'>暂无零件，点击顶部【新增根零件】创建</div>";
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
