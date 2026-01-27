// 编辑器页全局变量
let currentBomId = ''; // 当前编辑BOM ID
let currentNodeId = null; // 当前选中节点ID
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

// 渲染BOM树（原有逻辑，正常无需修改）
function renderBomTree() {
    const treeContainer = document.getElementById('treeContainer');
    if (bomData.rootNodes.length === 0) {
        treeContainer.innerHTML = '<div class="empty-tip">暂无零件<br>👉 点击顶部「新增根零件」开始创建</div>';
        return;
    }
    treeContainer.innerHTML = '';
    bomData.rootNodes.forEach(node => {
        treeContainer.appendChild(renderTreeNode(node, true));
    });
}

// 递归渲染单个节点（原有逻辑，正常无需修改）
function renderTreeNode(node, isRoot = false) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `tree-node ${isRoot ? 'tree-root-node' : ''} ${node.id === currentNodeId ? 'active' : ''}`;
    nodeDiv.dataset.nodeId = node.id; // 节点专属标识

    // 折叠/展开图标（独立DOM）
    const iconSpan = document.createElement('span');
    iconSpan.className = 'node-icon';
    iconSpan.dataset.iconId = node.id; // 图标专属标识
    iconSpan.innerText = node.children && node.children.length > 0 ? (node.expanded ? '▼' : '▶') : '●';

    // 节点名称
    const nameSpan = document.createElement('span');
    nameSpan.innerText = node.name || '未命名零件';

    // 组装节点
    nodeDiv.appendChild(iconSpan);
    nodeDiv.appendChild(nameSpan);

    // 递归渲染子节点（仅展开时显示）
    if (node.children && node.children.length > 0 && node.expanded) {
        const childWrap = document.createElement('div');
        node.children.forEach(child => {
            childWrap.appendChild(renderTreeNode(child));
        });
        nodeDiv.appendChild(childWrap);
    }
    return nodeDiv;
}

// 绑定编辑器页所有事件 --- 核心修改区域 START ---
function bindEditEvents() {
    // 顶部导航事件
    document.getElementById('addRootBtn').onclick = addRootPart;
    document.getElementById('saveBomBtn').onclick = saveWholeBom;
    document.getElementById('backHomeBtn').onclick = () => window.location.href = 'index.html';
    // 编辑区表单事件
    document.getElementById('addChildBtn').onclick = addChildPart;
    document.getElementById('deletePartBtn').onclick = deleteCurrentPart;
    document.getElementById('savePartBtn').onclick = saveCurrentPart;

    // 核心修改1：事件委托仅绑定到【实际零件节点.tree-node】，排除父级容器
    // 方案：通过事件目标的classList精准判断，仅处理零件节点/图标点击
    document.getElementById('treeContainer').addEventListener('click', function(e) {
        const target = e.target;
        const targetNode = target.closest('.tree-node'); // 仅获取零件节点DOM
        const targetIcon = target.closest('.node-icon'); // 仅获取图标DOM

        // 1. 点击图标：折叠/展开（独立操作，阻止冒泡）
        if (targetIcon) {
            e.stopPropagation();
            const nodeId = targetIcon.dataset.iconId;
            if (nodeId) toggleNodeExpanded(nodeId);
            return;
        }

        // 2. 点击零件节点（含名称）：触发选中编辑（必须是实际节点，排除空白/容器）
        if (targetNode) {
            const nodeId = targetNode.dataset.nodeId;
            if (nodeId) selectTreeNode(nodeId);
            return;
        }

        // 3. 点击树容器空白处/非节点区域：友好提示（核心！解决用户误点问题）
        if (!targetNode && !targetIcon) {
            alert('💡 请点击【实际的零件节点名称】（如"新根零件"），才能进入编辑哦！');
            // 可选：自动聚焦到顶部新增按钮，引导用户操作
            document.getElementById('addRootBtn').focus();
        }
    });

    // 核心修改2：给树容器添加【防误触提示】，鼠标悬停空白处显示提示文字
    const treeContainer = document.getElementById('treeContainer');
    treeContainer.style.cursor = 'default';
    treeContainer.title = '请点击零件节点名称进入编辑，点击▶/▼折叠层级';
}
// 核心修改区域 END ---

// 新增根零件（支持多个独立根零件）
function addRootPart() {
    const newNode = createNewNode('新根零件');
    bomData.rootNodes.push(newNode);
    saveBomData();
    renderBomTree();
    selectTreeNode(newNode.id); // 自动选中新节点，直接进入编辑（优化体验）
}

// 为当前零件新增子零件
function addChildPart() {
    if (!currentNodeId) {
        alert('💡 请先在左侧选择一个零件作为父零件！');
        return;
    }
    const parentNode = findNodeById(currentNodeId, bomData.rootNodes);
    if (!parentNode) return;
    const newNode = createNewNode('新子零件');
    if (!parentNode.children) parentNode.children = [];
    parentNode.children.push(newNode);
    parentNode.expanded = true; // 自动展开父节点
    saveBomData();
    renderBomTree();
    selectTreeNode(newNode.id); // 自动选中新子节点，直接进入编辑
}

// 删除当前选中零件（含子零件）
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
        saveBomData();
        renderBomTree();
        resetEditArea();
        return;
    }
    // 递归删除子节点
    deleteChildNode(currentNodeId, bomData.rootNodes);
    saveBomData();
    renderBomTree();
    resetEditArea();
}

// 保存当前零件信息
function saveCurrentPart() {
    if (!currentNodeId) return;
    const node = findNodeById(currentNodeId, bomData.rootNodes);
    if (!node) return;

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

    // 保存并刷新
    saveBomData();
    renderBomTree();
    alert('零件信息保存成功！');
}

// 保存整个BOM表（更新最后编辑时间）
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

// 选中节点并加载编辑信息（原有逻辑，正常无需修改）
function selectTreeNode(nodeId) {
    const node = findNodeById(nodeId, bomData.rootNodes);
    if (!node) return;
    currentNodeId = nodeId;
    // 显示表单，隐藏提示
    document.getElementById('editTip').style.display = 'none';
    document.getElementById('partForm').style.display = 'grid';
    // 填充表单数据
    document.getElementById('partName').value = node.name || '';
    document.getElementById('partModel').value = node.model || '';
    document.getElementById('partMaterial').value = node.material || '';
    document.getElementById('partSpec').value = node.spec || '';
    document.getElementById('partRemark').value = node.remark || '';
    // 重新渲染树，更新高亮
    renderBomTree();
}

// 折叠/展开节点（原有逻辑，正常无需修改）
function toggleNodeExpanded(nodeId) {
    const node = findNodeById(nodeId, bomData.rootNodes);
    if (!node || !node.children || node.children.length === 0) return;
    node.expanded = !node.expanded;
    saveBomData();
    renderBomTree();
}

// 重置编辑区（无选中节点时）
function resetEditArea() {
    currentNodeId = null;
    document.getElementById('editTip').style.display = 'block';
    document.getElementById('partForm').style.display = 'none';
}

// 工具方法：创建新节点（统一格式）
function createNewNode(name) {
    return {
        id: bomData.nodeIdGenerator++,
        name: name,
        model: '',
        material: '',
        spec: '',
        remark: '',
        expanded: false,
        children: []
    };
}

// 保存BOM数据到本地存储
function saveBomData() {
    setLocalStorage(`gcc-bom-data-${currentBomId}`, bomData);
}
