// 纯ES5 编辑器核心脚本 - 无任何ES6+语法 绝对兼容所有环境
var currentBomId = "";
var currentNodeId = null;
var bomData = {rootNodes:[], nodeIdGenerator:1};
var bomName = "";

// 页面初始化
window.onload = function() {
    currentBomId = getUrlParam("bomId");
    if (!currentBomId) {
        alert("无效的BOM表！即将返回首页");
        window.location.href = "index.html";
        return;
    }
    loadBomData();
    loadBomName();
    renderBomTree();
    bindAllEvents();
};

// 加载BOM数据 - 纯ES5 无模板字符串
function loadBomData() {
    var storageKey = "gcc-bom-data-" + currentBomId;
    bomData = getLocalStorage(storageKey, {rootNodes:[], nodeIdGenerator:1});
    // 统一节点ID为字符串
    formatAllNodeId(bomData.rootNodes);
}

// 递归格式化节点ID为字符串
function formatAllNodeId(nodes) {
    if (!nodes || nodes.length === 0) return;
    for (var i=0; i<nodes.length; i++) {
        nodes[i].id = nodes[i].id.toString();
        formatAllNodeId(nodes[i].children);
    }
}

// 加载BOM名称
function loadBomName() {
    var bomList = getLocalStorage("gcc-bom-list", []);
    var currentBom = null;
    for (var i=0; i<bomList.length; i++) {
        if (bomList[i].id === currentBomId) {
            currentBom = bomList[i];
            break;
        }
    }
    if (currentBom) {
        bomName = currentBom.name;
        document.getElementById("bomTitle").innerText = "编辑BOM表：" + bomName;
    } else {
        alert("BOM表不存在！即将返回首页");
        window.location.href = "index.html";
    }
}

// 渲染BOM树
function renderBomTree() {
    var treeContainer = document.getElementById("treeContainer");
    if (bomData.rootNodes.length === 0) {
        treeContainer.innerHTML = '<div class="empty-tip">暂无零件<br>👉 点击顶部「新增根零件」开始创建</div>';
        return;
    }
    treeContainer.innerHTML = "";
    // 渲染所有根节点
    for (var i=0; i<bomData.rootNodes.length; i++) {
        var nodeEl = createNodeElement(bomData.rootNodes[i], true);
        treeContainer.appendChild(nodeEl);
    }
}

// 创建单个节点DOM元素 + 绑定事件
function createNodeElement(node, isRoot) {
    var nodeDiv = document.createElement("div");
    var className = "tree-node";
    if (isRoot) className += " tree-root-node";
    if (node.id === currentNodeId) className += " active";
    nodeDiv.className = className;
    nodeDiv.setAttribute("node-id", node.id);

    // 图标
    var iconSpan = document.createElement("span");
    iconSpan.className = "node-icon";
    iconSpan.setAttribute("icon-id", node.id);
    if (node.children && node.children.length > 0) {
        iconSpan.innerText = node.expanded ? "▼" : "▶";
    } else {
        iconSpan.innerText = "●";
    }
    nodeDiv.appendChild(iconSpan);

    // 名称
    var nameSpan = document.createElement("span");
    nameSpan.innerText = node.name || "未命名零件";
    nodeDiv.appendChild(nameSpan);

    // 渲染子节点
    if (node.children && node.children.length > 0 && node.expanded) {
        var childWrap = document.createElement("div");
        for (var i=0; i<node.children.length; i++) {
            childWrap.appendChild(createNodeElement(node.children[i], false));
        }
        nodeDiv.appendChild(childWrap);
    }

    // 绑定节点和图标事件
    bindNodeClick(nodeDiv, node.id);
    bindIconClick(iconSpan, node.id);
    return nodeDiv;
}

// 绑定节点点击事件 - 核心选中逻辑
function bindNodeClick(nodeEl, nodeId) {
    nodeEl.onclick = function(e) {
        e.stopPropagation();
        currentNodeId = nodeId;
        loadEditFormByNodeId(nodeId);
        renderBomTree();
    };
}

// 绑定图标点击事件 - 折叠/展开
function bindIconClick(iconEl, nodeId) {
    iconEl.onclick = function(e) {
        e.stopPropagation();
        var node = findNodeById(nodeId);
        if (node && node.children && node.children.length > 0) {
            node.expanded = !node.expanded;
            saveBomDataToLocal();
            renderBomTree();
        }
    };
}

// 绑定所有按钮/容器事件
function bindAllEvents() {
    // 顶部按钮
    document.getElementById("addRootBtn").onclick = addRootNode;
    document.getElementById("saveBomBtn").onclick = saveWholeBomData;
    document.getElementById("backHomeBtn").onclick = function() {
        window.location.href = "index.html";
    };
    // 右侧编辑区按钮
    document.getElementById("addChildBtn").onclick = addChildNode;
    document.getElementById("deletePartBtn").onclick = deleteCurrentNode;
    document.getElementById("savePartBtn").onclick = saveCurrentNodeData;
    // 树容器空白处提示
    document.getElementById("treeContainer").onclick = function(e) {
        if (e.target === this || e.target.className === "empty-tip") {
            alert("💡 请点击【实际的零件节点名称】进入编辑！");
            document.getElementById("addRootBtn").focus();
        }
    };
    document.getElementById("treeContainer").style.cursor = "default";
    document.getElementById("treeContainer").title = "请点击零件节点名称进入编辑";
}

// 新增根节点 - 点击必生效
function addRootNode() {
    var newNodeId = bomData.nodeIdGenerator++.toString();
    var newNode = {
        id: newNodeId,
        name: "新根零件",
        model: "",
        material: "",
        spec: "",
        remark: "",
        expanded: false,
        children: []
    };
    bomData.rootNodes.push(newNode);
    saveBomDataToLocal();
    currentNodeId = newNodeId;
    loadEditFormByNodeId(newNodeId);
    renderBomTree();
}

// 新增子节点 - 选中父节点后点击必生效
function addChildNode() {
    if (!currentNodeId) {
        alert("💡 请先选择一个零件作为父零件！");
        return;
    }
    var parentNode = findNodeById(currentNodeId);
    if (!parentNode) {
        alert("未找到选中的零件，请刷新重试！");
        return;
    }
    var newNodeId = bomData.nodeIdGenerator++.toString();
    var newNode = {
        id: newNodeId,
        name: "新子零件",
        model: "",
        material: "",
        spec: "",
        remark: "",
        expanded: false,
        children: []
    };
    if (!parentNode.children) parentNode.children = [];
    parentNode.children.push(newNode);
    parentNode.expanded = true;
    saveBomDataToLocal();
    currentNodeId = newNodeId;
    loadEditFormByNodeId(newNodeId);
    renderBomTree();
}

// 删除当前节点 - 选中后点击必生效
function deleteCurrentNode() {
    if (!currentNodeId) {
        alert("💡 请先选择要删除的零件！");
        return;
    }
    if (!confirm("警告！将删除该零件及所有子零件，不可恢复！确认删除？")) return;

    // 删除根节点
    var rootIndex = -1;
    for (var i=0; i<bomData.rootNodes.length; i++) {
        if (bomData.rootNodes[i].id === currentNodeId) {
            rootIndex = i;
            break;
        }
    }
    if (rootIndex > -1) {
        bomData.rootNodes.splice(rootIndex, 1);
    } else {
        // 删除子节点
        deleteChildNodeById(currentNodeId, bomData.rootNodes);
    }

    saveBomDataToLocal();
    currentNodeId = null;
    resetEditForm();
    renderBomTree();
}

// 保存当前节点信息 - 填写表单后点击必生效
function saveCurrentNodeData() {
    if (!currentNodeId) return;
    var node = findNodeById(currentNodeId);
    if (!node) {
        alert("未找到选中的零件，请刷新重试！");
        return;
    }
    var partName = document.getElementById("partName").value.trim();
    var partModel = document.getElementById("partModel").value.trim();
    var partMaterial = document.getElementById("partMaterial").value.trim();
    var partSpec = document.getElementById("partSpec").value.trim();
    var partRemark = document.getElementById("partRemark").value.trim();

    if (!partName) {
        alert("零件名称为必填项！");
        document.getElementById("partName").focus();
        return;
    }

    node.name = partName;
    node.model = partModel;
    node.material = partMaterial;
    node.spec = partSpec;
    node.remark = partRemark;

    saveBomDataToLocal();
    renderBomTree();
    alert("零件信息保存成功！");
}

// 保存整个BOM表
function saveWholeBomData() {
    saveBomDataToLocal();
    var bomList = getLocalStorage("gcc-bom-list", []);
    for (var i=0; i<bomList.length; i++) {
        if (bomList[i].id === currentBomId) {
            bomList[i].updateTime = Date.now();
            break;
        }
    }
    setLocalStorage("gcc-bom-list", bomList);
    alert("BOM表「" + bomName + "」保存成功！");
}

// 加载编辑表单 - 点击节点必加载
function loadEditFormByNodeId(nodeId) {
    var node = findNodeById(nodeId);
    if (!node) return;
    document.getElementById("editTip").style.display = "none";
    document.getElementById("partForm").style.display = "grid";
    document.getElementById("partName").value = node.name || "";
    document.getElementById("partModel").value = node.model || "";
    document.getElementById("partMaterial").value = node.material || "";
    document.getElementById("partSpec").value = node.spec || "";
    document.getElementById("partRemark").value = node.remark || "";
}

// 重置编辑表单
function resetEditForm() {
    document.getElementById("editTip").style.display = "block";
    document.getElementById("partForm").style.display = "none";
    document.getElementById("partName").value = "";
    document.getElementById("partModel").value = "";
    document.getElementById("partMaterial").value = "";
    document.getElementById("partSpec").value = "";
    document.getElementById("partRemark").value = "";
}

// 保存BOM数据到本地 - 纯ES5 无模板字符串
function saveBomDataToLocal() {
    var storageKey = "gcc-bom-data-" + currentBomId;
    setLocalStorage(storageKey, bomData);
}

// 查找节点（循环+递归）
function findNodeById(nodeId) {
    // 先查根节点
    for (var i=0; i<bomData.rootNodes.length; i++) {
        if (bomData.rootNodes[i].id === nodeId) {
            return bomData.rootNodes[i];
        }
    }
    // 递归查子节点
    return findChildNodeById(nodeId, bomData.rootNodes);
}

// 递归查找子节点
function findChildNodeById(nodeId, nodeList) {
    for (var i=0; i<nodeList.length; i++) {
        var node = nodeList[i];
        if (node.children && node.children.length > 0) {
            for (var j=0; j<node.children.length; j++) {
                if (node.children[j].id === nodeId) {
                    return node.children[j];
                }
                var deepNode = findChildNodeById(nodeId, node.children);
                if (deepNode) return deepNode;
            }
        }
    }
    return null;
}

// 递归删除子节点
function deleteChildNodeById(nodeId, nodeList) {
    for (var i=0; i<nodeList.length; i++) {
        var node = nodeList[i];
        if (node.children && node.children.length > 0) {
            var childIndex = -1;
            for (var j=0; j<node.children.length; j++) {
                if (node.children[j].id === nodeId) {
                    childIndex = j;
                    break;
                }
            }
            if (childIndex > -1) {
                node.children.splice(childIndex, 1);
                return true;
            }
            if (deleteChildNodeById(nodeId, node.children)) {
                return true;
            }
        }
    }
    return false;
}

// 本地存储封装（依赖common.js的get/setLocalStorage，保持兼容）
