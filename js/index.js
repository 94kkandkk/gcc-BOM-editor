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
        li.className = 'bom-item';
        li.innerHTML = `
            <div class="bom-info">
                <div class="bom-name">${bom.name}</div>
                <div class="bom-time">最后编辑：${formatTime(bom.updateTime)}</div>
            </div>
            <div class="bom-opt">
                <button class="btn btn-primary" data-id="${bom.id}">编辑</button>
                <button class="btn btn-danger" data-id="${bom.id}">删除</button>
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
    // BOM列表操作（编辑/删除，事件委托）
    document.getElementById('bomList').addEventListener('click', handleBomOpt);
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
