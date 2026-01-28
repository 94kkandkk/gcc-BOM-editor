// 编辑器页全局变量 - 持久化保存，全程不随意重置
let currentBomId = '';
let currentNodeId = null; // 核心：全局选中ID，仅手动重置/赋值，渲染不影响
let bomData = { rootNodes: [], nodeIdGenerator: 1 };
let bomName = '';

// 页面加载初始化
window.onload = function() {
    currentBomId = getUrlParam('bomId');
    if (!currentBomId) {
        alert('无效的BOM表！即将返回首页');
        window.location.href = 'index.html';
        return;
    }
    loadBomData();
    loadBomName();
    renderBomTree();
    bindEditEvents();
};

// 加载BOM数据 + 统一ID为字符串（兼容新老数据）
function loadBomData() {
    bomData = getLocalStorage(`gcc-bom-data-${currentBomId}`, { rootNodes: [], nodeIdGenerator: 1 });
    // 递归格式化所有节点ID为字符串，避免类型不匹配
    const formatAllNodeId = (nodes) => {
        if (!nodes) return;
        nodes.forEach(node => {
            node.id = node.id.toString();
            formatAllNodeId(node.children);
        });
    };
    formatAllNodeId(bomData.rootNodes);
}

// 加载BOM名称
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

// 渲染BOM树 - 核心：渲染时强制匹配currentNodeId，保证高亮正确
function renderBomTree() {
    const treeContainer = document.getElementById('treeContainer');
    if (bomData.rootNodes.length === 0) {
        treeContainer.innerHTML = '<div class="empty-tip">暂无零件<br>👉 点击顶部「新增根零件」开始创建</div>';
        return;
    }
    treeContainer.innerHTML = '';

    // 递归渲染节点 + 渲染时判断是否为当前选中节点
    const renderNode = (node, isRoot = false) => {
        const nodeDiv = document.createElement('div');
        // 核心：强制匹配全局currentNodeId，设置高亮样式
        nodeDiv.className = `tree-node ${isRoot ? 'tree-root-node' : ''} ${node.id === currentNodeId ? 'active' : ''}`;
        nodeDiv.setAttribute('node-id', node.id);

        // 折叠/展开图标
        const iconSpan = document.createElement('span');
        iconSpan.className = 'node-icon';
        iconSpan.setAttribute('icon-id', node.id);
        iconSpan.innerText = node.children && node.children.length > 0 ? (node.expanded ? '▼' : '▶') : '●';

        // 节点名称
        const nameSpan = document.createElement('span');
        nameSpan.innerText = node.name || '未命名零件';

        nodeDiv.appendChild(iconSpan);
        nodeDiv.appendChild(nameSpan);

        // 递归渲染子节点
        if (node.children && node.children.length > 0 && node.expanded) {
            const childWrap = document.createElement('div');
            node.children.forEach(child => childWrap.appendChild(renderNode(child)));
            nodeDiv.appendChild(childWrap);
        }

        // 为当前节点绑定事件（1对1，无委托，必触发）
        bindSingleNodeEvent(nodeDiv, node.id);
        return nodeDiv;
    };

    // 渲染所有根节点
    bomData.rootNodes.forEach(node => treeContainer.appendChild(renderNode(node, true)));
}

// 为单个节点/图标绑定事件 - 修复?.语法错误，兼容所有环境
function bindSingleNodeEvent(nodeEl, nodeId) {
    if (!nodeEl || !nodeId) return;
    const iconEl = nodeEl.querySelector('[icon-id]');

    // 节点点击：核心！赋值后先加载表单，再渲染（避免渲染覆盖ID）
    nodeEl.onclick = function(e) {
        e.stopPropagation();
        currentNodeId = nodeId; // 1. 先持久化赋值全局选中ID（关键！）
        loadEditForm(nodeId);   // 2. 立即加载右侧表单（不依赖渲染）
        renderBomTree();        // 3. 最后渲染树，保证高亮
    };

    // 图标点击：折叠/展开，阻止冒泡（已修复?.语法错误）
    if (iconEl) {
        iconEl.onclick = function(e) {
            e.stopPropagation();
            const node = findNodeSimple(nodeId);
            // 修复：删除可选链?.，改用传统判空，兼容所有浏览器
            if (node && node.children && node.children.length > 0) {
                node.expanded = !node.expanded;
                saveBomData();
                renderBomTree();
            }
        };
    }
}

// 绑定顶部/编辑区事件 - 无修改
function bindEditEvents() {
    // 顶部导航
    document.getElementById('addRootBtn').onclick = addRootPart;
    document.getElementById('saveBomBtn').onclick = saveWholeBom;
    document.getElementById('backHomeBtn').onclick = () => window.location.href = 'index.html';
    // 编辑区表单
    document.getElementById('addChildBtn').onclick = addChildPart;
    document.getElementById('deletePartBtn').onclick = deleteCurrentPart;
    document.getElementById('savePartBtn').onclick = saveCurrentPart;
    // 树容器空白处提示
    document.getElementById('treeContainer').onclick = function(e) {
        if (e.target === this || e.target.className === 'empty-tip') {
            alert('💡 请点击【实际的零件节点名称】（如"新根零件"），才能进入编辑哦！');
            document.getElementById('addRootBtn').focus();
        }
    };
    document.getElementById('treeContainer').style.cursor = 'default';
    document.getElementById('treeContainer').title = '请点击零件节点名称进入编辑，点击▶/▼折叠层级';
}

// 新增根零件 - 保留稳定逻辑，新增后直接选中
function addRootPart() {
    const newNodeId = bomData.nodeIdGenerator++.toString();
    const newNode = {
        id: newNodeId, name: '新根零件', model: '', material: '',
        spec: '', remark: '', expanded: false, children: []
    };
    bomData.rootNodes.push(newNode);
    saveBomData();
    currentNodeId = newNodeId; // 持久化选中新节点
    loadEditForm(newNodeId);   // 直接加载表单
    renderBomTree();
}

// 新增子零件 - 保留稳定逻辑
function addChildPart() {
    if (!currentNodeId) {
        alert('💡 请先在左侧选择一个零件作为父零件！');
        return;
    }
    const parentNode = findNodeSimple(currentNodeId);
    if (!parentNode) {
        alert('未找到选中的零件，请刷新后重试！');
        return;
    }
    const newNodeId = bomData.nodeIdGenerator++.toString();
    const newNode = {
        id: newNodeId, name: '新子零件', model: '', material: '',
        spec: '', remark: '', expanded: false, children: []
    };
    if (!parentNode.children) parentNode.children = [];
    parentNode.children.push(newNode);
    parentNode.expanded = true;
    saveBomData();
    currentNodeId = newNodeId; // 持久化选中新节点
    loadEditForm(newNodeId);   // 直接加载表单
    renderBomTree();
}

// 删除当前零件 - 核心优化：删除后重置currentNodeId，避免空值异常
function deleteCurrentPart() {
    if (!currentNodeId) {
        alert('💡 请先选择要删除的零件！');
        return;
    }
    if (!confirm('警告！将删除当前零件及所有子零件，操作不可恢复！确认删除？')) return;

    // 删除根节点
    const rootIndex = bomData.rootNodes.findIndex(n => n.id === currentNodeId);
    if (rootIndex > -1) {
        bomData.rootNodes.splice(rootIndex, 1);
    } else {
        // 删除子节点
        deleteChildNodeSimple(currentNodeId, bomData.rootNodes);
    }

    saveBomData();
    currentNodeId = null; // 核心：删除后手动重置全局选中ID（避免残留）
    resetEditArea();      // 重置编辑区
    renderBomTree();      // 重新渲染
}

// 保存当前零件信息 - 无修改
function saveCurrentPart() {
    if (!currentNodeId) return;
    const node = findNodeSimple(currentNodeId);
    if (!node) {
        alert('未找到选中的零件，请刷新后重试！');
        return;
    }
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
    node.name = partName;
    node.model = partModel;
    node.material = partMaterial;
    node.spec = partSpec;
    node.remark = partRemark;
    saveBomData();
    renderBomTree();
    alert('零件信息保存成功！');
}

// 保存整个BOM表 - 无修改
function saveWholeBom() {
    saveBomData();
    const bomList = getLocalStorage('gcc-bom-list', []);
    const bomIndex = bomList.findIndex(bom => bom.id === currentBomId);
    if (bomIndex > -1) {
        bomList[bomIndex].updateTime = Date.now();
        setLocalStorage('gcc-bom-list', bomList);
    }
    alert(`BOM表「${bomName}」保存成功！`);
}

// 核心新增：独立加载编辑表单 - 不依赖渲染，直接控制DOM（根治表单加载失败）
function loadEditForm(nodeId) {
    const node = findNodeSimple(nodeId);
    if (!node) return;
    // 强制显示表单，隐藏提示（不受任何逻辑影响）
    document.getElementById('editTip').style.display = 'none';
    document.getElementById('partForm').style.display = 'grid';
    // 填充表单数据
    document.getElementById('partName').value = node.name || '';
    document.getElementById('partModel').value = node.model || '';
    document.getElementById('partMaterial').value = node.material || '';
    document.getElementById('partSpec').value = node.spec || '';
    document.getElementById('partRemark').value = node.remark || '';
}

// 重置编辑区 - 无修改
function resetEditArea() {
    document.getElementById('editTip').style.display = 'block';
    document.getElementById('partForm').style.display = 'none';
    // 清空表单数据，避免残留
    document.getElementById('partName').value = '';
    document.getElementById('partModel').value = '';
    document.getElementById('partMaterial').value = '';
    document.getElementById('partSpec').value = '';
    document.getElementById('partRemark').value = '';
}

// 保存BOM数据 - 无修改
function saveBomData() {
    setLocalStorage(`gcc-bom-data-${currentBomId}`, bomData);
}

// 工具方法：节点查找/删除 - 保留稳定逻辑
function findNodeSimple(nodeId) {
    // 先查根节点
    const rootNode = bomData.rootNodes.find(n => n.id === nodeId);
    if (rootNode) return rootNode;
    // 递归查子节点
    const findChild = (nodes) => {
        for (const node of nodes) {
            if (node.children) {
                const child = node.children.find(n => n.id === nodeId);
                if (child) return child;
                const deepChild = findChild(node.children);
                if (deepChild) return deepChild;
            }
        }
        return null;
    };
    return findChild(bomData.rootNodes);
}
function deleteChildNodeSimple(nodeId, nodeList) {
    for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];
        if (node.children) {
            const childIndex = node.children.findIndex(n => n.id === nodeId);
            if (childIndex > -1) {
                node.children.splice(childIndex, 1);
                return true;
            }
            if (deleteChildNodeSimple(nodeId, node.children)) return true;
        }
    }
    return false;
}
