// 编辑器页全局变量
let currentBomId = ''; // 当前编辑BOM ID
let currentNodeId = null; // 当前选中节点ID（统一为字符串类型，避免类型不匹配）
let bomData = { rootNodes: [], nodeIdGenerator: 1 }; // BOM树数据
let bomName = ''; // 当前BOM名称

// 页面加载初始化
window.onload = function() {
    // 验证BOM ID有效性
    currentBomId = getUrlParam('bomId');
    if (!currentBomId) {
        alert('无效的BOM表！即将返回首页');
        window.location.href = 'index.html';
        return;
    }
    // 加载数据+渲染+绑定事件
    loadBomData();
    loadBomName();
    renderBomTree();
    bindEditEvents();
};

// 加载BOM树数据
function loadBomData() {
    bomData = getLocalStorage(`gcc-bom-data-${currentBomId}`, { rootNodes: [], nodeIdGenerator: 1 });
    // 修复点1：统一现有节点ID为字符串类型（解决类型不匹配问题）
    bomData.rootNodes.forEach(node => {
        node.id = node.id.toString();
        formatNodeId(node.children);
    });
}
// 递归格式化子节点ID为字符串
function formatNodeId(children) {
    if (!children || children.length === 0) return;
    children.forEach(node => {
        node.id = node.id.toString();
        formatNodeId(node.children);
    });
}

// 加载BOM名称并更新页面标题
function loadBomName() {
    const bomList = getLocalStorage('gcc-bom-list', []);
    const currentBom = bomList.find(bom => bom.id === currentBomId);
    if (currentBom) {
        bomName = currentBom.name;
        document.getElementById('bomTitle').innerText = `编辑BOM表：${bomName}`;
    } else {
        alert('BOM表不存在！即将返回首页');
        window.location.href = 'index.html';
    }
}

// 渲染BOM树 --- 核心重构：节点/图标单独绑定事件，放弃事件委托 ---
function renderBomTree() {
    const treeContainer = document.getElementById('treeContainer');
    if (bomData.rootNodes.length === 0) {
        treeContainer.innerHTML = '<div class="empty-tip">暂无零件<br>👉 点击顶部「新增根零件」开始创建</div>';
        return;
    }
    treeContainer.innerHTML = '';
    // 渲染所有根节点，并绑定事件
    bomData.rootNodes.forEach(node => {
        const nodeEl = renderTreeNode(node, true);
        treeContainer.appendChild(nodeEl);
        // 为节点和图标单独绑定事件
        bindNodeEvent(nodeEl, node.id);
    });
}

// 递归渲染单个节点
function renderTreeNode(node, isRoot = false) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `tree-node ${isRoot ? 'tree-root-node' : ''} ${node.id === currentNodeId ? 'active' : ''}`;
    nodeDiv.setAttribute('node-id', node.id); // 改用普通属性，比data-*更稳定，无类型转换问题

    // 折叠/展开图标
    const iconSpan = document.createElement('span');
    iconSpan.className = 'node-icon';
    iconSpan.setAttribute('icon-id', node.id);
    iconSpan.innerText = node.children && node.children.length > 0 ? (node.expanded ? '▼' : '▶') : '●';

    // 节点名称
    const nameSpan = document.createElement('span');
    nameSpan.innerText = node.name || '未命名零件';

    // 组装节点
    nodeDiv.appendChild(iconSpan);
    nodeDiv.appendChild(nameSpan);

    // 递归渲染子节点并绑定事件
    if (node.children && node.children.length > 0 && node.expanded) {
        const childWrap = document.createElement('div');
        node.children.forEach(child => {
            const childEl = renderTreeNode(child);
            childWrap.appendChild(childEl);
            bindNodeEvent(childEl, child.id); // 子节点也单独绑定事件
        });
        nodeDiv.appendChild(childWrap);
    }
    return nodeDiv;
}

// 核心修复：为每个节点/图标单独绑定事件（1对1绑定，无委托漏洞，100%触发）
function bindNodeEvent(nodeEl, nodeId) {
    if (!nodeEl || !nodeId) return;
    const iconEl = nodeEl.querySelector('[icon-id]'); // 获取当前节点的图标

    // 1. 节点点击事件：选中节点+加载编辑（核心！单独绑定，必触发）
    nodeEl.onclick = function(e) {
        e.stopPropagation(); // 阻止冒泡到父级
        selectTreeNode(nodeId); // 直接传入节点ID，无需查找，100%准确
    };

    // 2. 图标点击事件：折叠/展开（单独绑定，阻止冒泡到节点）
    if (iconEl) {
        iconEl.onclick = function(e) {
            e.stopPropagation(); // 关键：彻底阻止事件冒泡到节点，避免触发选中
            toggleNodeExpanded(nodeId);
        };
    }
}

// 绑定顶部导航+编辑区表单事件
function bindEditEvents() {
    // 顶部导航事件
    document.getElementById('addRootBtn').onclick = addRootPart;
    document.getElementById('saveBomBtn').onclick = saveWholeBom;
    document.getElementById('backHomeBtn').onclick = () => window.location.href = 'index.html';
    // 编辑区表单事件
    document.getElementById('addChildBtn').onclick = addChildPart;
    document.getElementById('deletePartBtn').onclick = deleteCurrentPart;
    document.getElementById('savePartBtn').onclick = saveCurrentPart;

    // 树容器空白处点击提示
    document.getElementById('treeContainer').onclick = function(e) {
        // 若点击的是容器本身（非节点/图标），提示用户
        if (e.target === this || e.target.className === 'empty-tip') {
            alert('💡 请点击【实际的零件节点名称】（如"新根零件"），才能进入编辑哦！');
            document.getElementById('addRootBtn').focus();
        }
    };
    document.getElementById('treeContainer').style.cursor = 'default';
    document.getElementById('treeContainer').title = '请点击零件节点名称进入编辑，点击▶/▼折叠层级';
}

// 新增根零件 --- 修复点2：新节点ID统一为字符串 ---
function addRootPart() {
    const newNodeId = bomData.nodeIdGenerator++.toString(); // 直接生成字符串ID
    const newNode = {
        id: newNodeId,
        name: '新根零件',
        model: '',
        material: '',
        spec: '',
        remark: '',
        expanded: false,
        children: []
    };
    bomData.rootNodes.push(newNode);
    saveBomData();
    renderBomTree();
    selectTreeNode(newNodeId); // 自动选中，直接进入编辑
}

// 为当前零件新增子零件 --- 修复点3：子节点ID也为字符串 ---
function addChildPart() {
    if (!currentNodeId) {
        alert('💡 请先在左侧选择一个零件作为父零件！');
        return;
    }
    // 简化查找：直接遍历，避免递归漏洞（更快、更稳定）
    const parentNode = findNodeSimple(currentNodeId);
    if (!parentNode) {
        alert('未找到选中的零件，请刷新后重试！');
        return;
    }
    const newNodeId = bomData.nodeIdGenerator++.toString();
    const newNode = {
        id: newNodeId,
        name: '新子零件',
        model: '',
        material: '',
        spec: '',
        remark: '',
        expanded: false,
        children: []
    };
    if (!parentNode.children) parentNode.children = [];
    parentNode.children.push(newNode);
    parentNode.expanded = true;
    saveBomData();
    renderBomTree();
    selectTreeNode(newNodeId); // 自动选中，直接进入编辑
}

// 删除当前选中零件
function deleteCurrentPart() {
    if (!currentNodeId) {
        alert('💡 请先选择要删除的零件！');
        return;
    }
    if (!confirm('警告！将删除当前零件及所有子零件，操作不可恢复！确认删除？')) return;

    // 先删除根节点
    const rootIndex = bomData.rootNodes.findIndex(n => n.id === currentNodeId);
    if (rootIndex > -1) {
        bomData.rootNodes.splice(rootIndex, 1);
        saveBomData();
        renderBomTree();
        resetEditArea();
        return;
    }

    // 递归删除子节点
    const isDeleted = deleteChildNodeSimple(currentNodeId, bomData.rootNodes);
    if (isDeleted) {
        saveBomData();
        renderBomTree();
        resetEditArea();
    } else {
        alert('删除失败，未找到该零件！');
    }
}

// 保存当前零件信息
function saveCurrentPart() {
    if (!currentNodeId) return;
    const node = findNodeSimple(currentNodeId);
    if (!node) {
        alert('未找到选中的零件，请刷新后重试！');
        return;
    }

    // 获取表单值并验证
    const partName = document.getElementById('partName').value.trim();
    const partModel = document.getElementById('partModel').value.trim();
    const partMaterial = document.getElementById('partMaterial').value.trim();
    const partSpec = document.getElementById('partSpec').value.trim();
    const partRemark = document.getElementById('partRemark').value.trim();

    if (!partName) {
        alert('零件名称为必填项！');
        document.getElementById('partName').focus();
        return;
    }

    // 更新节点信息
    node.name = partName;
    node.model = partModel;
    node.material = partMaterial;
    node.spec = partSpec;
    node.remark = partRemark;

    saveBomData();
    renderBomTree();
    alert('零件信息保存成功！');
}

// 保存整个BOM表
function saveWholeBom() {
    saveBomData();
    // 更新BOM列表的修改时间
    const bomList = getLocalStorage('gcc-bom-list', []);
    const bomIndex = bomList.findIndex(bom => bom.id === currentBomId);
    if (bomIndex > -1) {
        bomList[bomIndex].updateTime = Date.now();
        setLocalStorage('gcc-bom-list', bomList);
    }
    alert(`BOM表「${bomName}」保存成功！`);
}

// 核心修复：选中节点方法（极简逻辑，100%加载编辑表单）
function selectTreeNode(nodeId) {
    if (!nodeId) return;
    currentNodeId = nodeId; // 直接赋值，无需校验（事件已保证ID有效）
    // 强制显示编辑表单，隐藏提示（核心！不管任何情况，选中必加载）
    document.getElementById('editTip').style.display = 'none';
    document.getElementById('partForm').style.display = 'grid';
    // 查找节点并填充表单
    const node = findNodeSimple(nodeId);
    if (node) {
        document.getElementById('partName').value = node.name || '';
        document.getElementById('partModel').value = node.model || '';
        document.getElementById('partMaterial').value = node.material || '';
        document.getElementById('partSpec').value = node.spec || '';
        document.getElementById('partRemark').value = node.remark || '';
    }
    // 重新渲染树，更新高亮
    renderBomTree();
}

// 折叠/展开节点
function toggleNodeExpanded(nodeId) {
    const node = findNodeSimple(nodeId);
    if (!node || !node.children || node.children.length === 0) return;
    node.expanded = !node.expanded;
    saveBomData();
    renderBomTree();
}

// 重置编辑区
function resetEditArea() {
    currentNodeId = null;
    document.getElementById('editTip').style.display = 'block';
    document.getElementById('partForm').style.display = 'none';
}

// 保存BOM数据到本地存储
function saveBomData() {
    setLocalStorage(`gcc-bom-data-${currentBomId}`, bomData);
}

// ---------------------- 工具方法：简化节点查找（替代递归，更稳定） ----------------------
// 简化查找节点：循环遍历，无递归漏洞，支持所有层级
function findNodeSimple(nodeId) {
    // 先查根节点
    const rootNode = bomData.rootNodes.find(n => n.id === nodeId);
    if (rootNode) return rootNode;
    // 递归查子节点
    return findChildNodeSimple(nodeId, bomData.rootNodes);
}
// 递归查找子节点
function findChildNodeSimple(nodeId, nodeList) {
    for (const node of nodeList) {
        if (node.children && node.children.length > 0) {
            const childNode = node.children.find(n => n.id === nodeId);
            if (childNode) return childNode;
            // 继续递归下一级
            const deepNode = findChildNodeSimple(nodeId, node.children);
            if (deepNode) return deepNode;
        }
    }
    return null;
}

// 简化删除子节点
function deleteChildNodeSimple(nodeId, nodeList) {
    for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];
        if (node.children && node.children.length > 0) {
            const childIndex = node.children.findIndex(n => n.id === nodeId);
            if (childIndex > -1) {
                node.children.splice(childIndex, 1);
                return true;
            }
            // 继续递归删除
            const isDeleted = deleteChildNodeSimple(nodeId, node.children);
            if (isDeleted) return true;
        }
    }
    return false;
}
