// 首页全局变量
let bomList = []; // BOM表列表数据

// 页面加载初始化
window.onload = function() {
    initBomList(); // 初始化BOM列表
    bindIndexEvents(); // 绑定首页事件
};

// 初始化BOM列表：从本地存储加载
function initBomList() {
    bomList = getLocalStorage('gcc-bom-list', []);
    renderBomList(); // 渲染列表
}

// 渲染BOM列表
function renderBomList() {
    const bomListEl = document.getElementById('bomList');
    if (bomList.length === 0) {
        bomListEl.innerHTML = '<li class="empty-tip">暂无已保存的BOM表，点击「新建BOM表」开始创建</li>';
        return;
    }
    bomListEl.innerHTML = '';
    bomList.forEach(bom => {
        const li = document.createElement('li');
        li.className = 'bom-list-item';
        li.innerHTML = `
            <div class="bom-list-item-content">
                <div class="bom-checkbox" style="display: none;">
                    <input type="checkbox" class="bom-check" data-id="${bom.id}">
                </div>
                <div class="bom-info">
                    <div class="bom-name">${bom.name}</div>
                    <div class="bom-time">最后编辑：${formatTime(bom.updateTime)}</div>
                </div>
                <div class="bom-actions">
                    <button class="btn btn-primary" data-id="${bom.id}">编辑</button>
                    <button class="btn btn-danger" data-id="${bom.id}">删除</button>
                </div>
            </div>
        `;
        bomListEl.appendChild(li);
    });
}

// 绑定首页所有事件
function bindIndexEvents() {
    // 新建BOM表按钮
    document.getElementById('newBomBtn').addEventListener('click', () => {
        document.getElementById('newBomModal').style.display = 'flex';
        document.getElementById('bomName').focus();
    });
    // 取消新建
    document.getElementById('cancelNewBtn').addEventListener('click', () => {
        document.getElementById('newBomModal').style.display = 'none';
        document.getElementById('bomName').value = '';
    });
    // 确认新建BOM表
    document.getElementById('confirmNewBtn').addEventListener('click', createNewBom);
    // 导出按钮
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    
    // 确认导出按钮
    document.getElementById('confirmExportBtn').addEventListener('click', confirmExport);
    
    // 取消导出按钮
    document.getElementById('cancelExportBtn').addEventListener('click', cancelExport);
    
    // BOM列表操作（编辑/删除，事件委托）
    document.getElementById('bomList').addEventListener('click', handleBomOpt);
}

// 导出Excel
function exportToExcel() {
    if (bomList.length === 0) {
        alert('暂无BOM表可导出！');
        return;
    }
    
    // 显示导出选项和BOM表勾选框
    document.querySelector('.export-options').style.display = 'flex';
    document.getElementById('exportBtn').style.display = 'none';
    document.querySelectorAll('.bom-checkbox').forEach(checkbox => {
        checkbox.style.display = 'block';
    });
}

// 确认导出
function confirmExport() {
    // 获取用户勾选的BOM表
    const checkedBoms = [];
    document.querySelectorAll('.bom-check:checked').forEach(checkbox => {
        const bomId = checkbox.dataset.id;
        const bom = bomList.find(b => b.id === bomId);
        if (bom) {
            checkedBoms.push(bom);
        }
    });
    
    if (checkedBoms.length === 0) {
        alert('请先选择要导出的BOM表！');
        return;
    }
    
    // 获取用户是否选择包含材料
    const includeMaterials = document.getElementById('includeMaterialsCheckbox').checked;
    
    // 导出每个选中的BOM表
    checkedBoms.forEach(bom => {
        exportBomToExcel(bom.id, bom.name, includeMaterials);
    });
    
    // 隐藏导出选项和BOM表勾选框
    cancelExport();
    
    // 显示成功消息
    alert(`成功导出 ${checkedBoms.length} 个BOM表！`);
}

// 取消导出
function cancelExport() {
    // 隐藏导出选项和BOM表勾选框
    document.querySelector('.export-options').style.display = 'none';
    document.getElementById('exportBtn').style.display = 'block';
    document.querySelectorAll('.bom-checkbox').forEach(checkbox => {
        checkbox.style.display = 'none';
    });
    
    // 取消所有勾选
    document.getElementById('includeMaterialsCheckbox').checked = false;
    document.querySelectorAll('.bom-check').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// 导出指定BOM表为Excel
function exportBomToExcel(bomId, bomName, includeMaterials) {
    // 从本地存储加载BOM数据
    const bomData = getLocalStorage(`gcc-bom-data-${bomId}`, { rootNodes: [], nodeIdGenerator: 1 });
    
    // 定义表头（添加层级列）
    const headers = [
        '层级', '零件名称', '工艺', '数量', '零件编号', '配置', '尺寸', '厚度', 
        '面积', '线长', '重量', '利用率', '表面处理', '模具吨位', 
        '装备', '装备数量', '浇口数', 'CTime', 'MOB', '备注', 
        '制造公司', '公司地址'
    ];
    
    // 收集数据
    const data = [];
    data.push(headers); // 添加表头
    
    // 递归收集节点数据（带层级）
    function collectNodes(nodes, level) {
        nodes.forEach(node => {
            if (node.type === 'part') {
                // 零件节点
                const row = [
                    level,
                    node.name,
                    node.process || '',
                    node.quantity || 1,
                    node.partNumber || '',
                    node.config || '',
                    node.size || '',
                    node.thickness || '',
                    node.area || 0,
                    node.wireLength || 0,
                    node.weight || 0,
                    node.utilization || '',
                    node.surface || '',
                    node.moldTonnage || 0,
                    node.equipment || '',
                    node.equipmentQuantity || '',
                    node.gateCount || '',
                    node.cTime || '',
                    node.mob || 'Make',
                    node.remark || '',
                    node.manufacturer || '',
                    node.manufacturerAddress || ''
                ];
                data.push(row);
                
                // 递归处理子节点
                if (node.children && node.children.length > 0) {
                    collectNodes(node.children, level + 1);
                }
            } else if (node.type === 'material' && includeMaterials) {
                // 材料节点（仅当用户选择包含材料时）
                const row = [
                    level,
                    node.name,
                    '材料',
                    node.quantity || 1,
                    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
                ];
                data.push(row);
            }
        });
    }
    
    // 开始收集数据（根节点层级为1）
    collectNodes(bomData.rootNodes, 1);
    
    // 创建Excel工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 设置工作表名称
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM表');
    
    // 生成文件名
    const fileName = `${bomName}_${formatTime(Date.now())}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(workbook, fileName);
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// 创建新BOM表
function createNewBom() {
    const bomName = document.getElementById('bomName').value.trim();
    if (!bomName) {
        alert('BOM表名称不能为空！');
        document.getElementById('bomName').focus();
        return;
    }
    // 生成唯一BOM ID
    const bomId = Date.now().toString();
    // 初始化BOM树数据
    const initBomData = { rootNodes: [], nodeIdGenerator: 1 };
    // 新BOM信息
    const newBom = {
        id: bomId,
        name: bomName,
        createTime: Date.now(),
        updateTime: Date.now()
    };
    // 保存到本地
    bomList.unshift(newBom);
    setLocalStorage('gcc-bom-list', bomList);
    setLocalStorage(`gcc-bom-data-${bomId}`, initBomData);
    // 重置并跳转
    document.getElementById('newBomModal').style.display = 'none';
    document.getElementById('bomName').value = '';
    renderBomList();
    window.location.href = `edit.html?bomId=${bomId}`;
}

// 处理BOM列表操作（编辑/删除）
function handleBomOpt(e) {
    const target = e.target;
    const bomId = target.dataset.id;
    if (!bomId) return;
    // 编辑BOM
    if (target.classList.contains('btn-primary')) {
        window.location.href = `edit.html?bomId=${bomId}`;
    }
    // 删除BOM
    if (target.classList.contains('btn-danger')) {
        if (confirm('确认删除该BOM表吗？删除后数据无法恢复！')) {
            deleteBom(bomId);
        }
    }
}

// 删除BOM表
function deleteBom(bomId) {
    // 过滤删除列表项
    bomList = bomList.filter(bom => bom.id !== bomId);
    setLocalStorage('gcc-bom-list', bomList);
    // 删除对应BOM树数据
    removeLocalStorage(`gcc-bom-data-${bomId}`);
    // 重新渲染
    renderBomList();
}
