// 工艺库管理模块

// 全局变量
let processLibrary = [];

// 页面加载初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化工艺库数据
  initProcessLibrary();
  // 绑定工艺库相关按钮事件
  bindProcessEvents();
  // 渲染工艺列表
  renderProcessList();
});

// 初始化工艺库数据
function initProcessLibrary() {
  const savedLibrary = getLocalStorage('gcc-process-library', []);
  processLibrary = savedLibrary;
}

// 保存工艺库数据
function saveProcessLibrary() {
  setLocalStorage('gcc-process-library', processLibrary);
}

// 绑定工艺库相关按钮事件
function bindProcessEvents() {
  // 添加工艺按钮
  const addProcessBtn = document.getElementById('addProcessBtn');
  if (addProcessBtn) {
    addProcessBtn.addEventListener('click', function() {
      showProcessModal();
    });
  }
  
  // 取消添加工艺
  const cancelProcessBtn = document.getElementById('cancelProcessBtn');
  if (cancelProcessBtn) {
    cancelProcessBtn.addEventListener('click', function() {
      closeProcessModal();
    });
  }
  
  // 确认添加工艺
  const confirmProcessBtn = document.getElementById('confirmProcessBtn');
  if (confirmProcessBtn) {
    confirmProcessBtn.addEventListener('click', function() {
      saveProcess();
    });
  }
}

// 显示工艺编辑弹窗
function showProcessModal(process = null) {
  const modal = document.getElementById('processModal');
  const modalTitle = document.getElementById('processModalTitle');
  
  // 清空表单
  document.getElementById('processName').value = '';
  document.getElementById('processEnglishName').value = '';
  
  // 设置弹窗标题
  if (process) {
    modalTitle.textContent = '编辑工艺';
    // 填充表单数据
    document.getElementById('processName').value = process.name;
    document.getElementById('processEnglishName').value = process.englishName || '';
    // 存储当前编辑的工艺ID
    modal.dataset.processId = process.id;
  } else {
    modalTitle.textContent = '添加工艺';
    modal.dataset.processId = '';
  }
  
  // 显示弹窗
  modal.style.display = 'flex';
}

// 关闭工艺编辑弹窗
function closeProcessModal() {
  const modal = document.getElementById('processModal');
  modal.style.display = 'none';
  modal.dataset.processId = '';
}

// 保存工艺
function saveProcess() {
  const modal = document.getElementById('processModal');
  const processId = modal.dataset.processId;
  
  // 获取表单数据
  const name = document.getElementById('processName').value.trim();
  const englishName = document.getElementById('processEnglishName').value.trim();
  
  // 验证必填字段
  if (!name) {
    alert('工艺名称不能为空！');
    return;
  }
  
  if (!englishName) {
    alert('英文名称不能为空！');
    return;
  }
  
  // 构建工艺对象
  const processData = {
    name,
    englishName
  };
  
  if (processId) {
    // 更新现有工艺
    const index = processLibrary.findIndex(item => item.id === processId);
    if (index !== -1) {
      processLibrary[index] = { ...processLibrary[index], ...processData };
    }
  } else {
    // 添加新工艺
    const newProcess = {
      id: Date.now().toString(),
      ...processData
    };
    processLibrary.push(newProcess);
  }
  
  // 保存工艺库数据
  saveProcessLibrary();
  // 渲染工艺列表
  renderProcessList();
  // 关闭弹窗
  closeProcessModal();
}

// 删除工艺
function deleteProcess(processId) {
  if (confirm('确认删除该工艺？')) {
    processLibrary = processLibrary.filter(item => item.id !== processId);
    saveProcessLibrary();
    renderProcessList();
  }
}

// 编辑工艺
function editProcess(processId) {
  const process = processLibrary.find(item => item.id === processId);
  if (process) {
    showProcessModal(process);
  }
}

// 渲染工艺列表
function renderProcessList() {
  const processListEl = document.getElementById('processList');
  
  if (!processListEl) return;
  
  if (processLibrary.length === 0) {
    processListEl.innerHTML = '<li class="empty-tip">工艺库为空，请点击「添加工艺」开始创建</li>';
    return;
  }
  
  processListEl.innerHTML = '';
  processLibrary.forEach(process => {
    const li = document.createElement('li');
    li.className = 'process-library-item';
    li.innerHTML = `
      <div class="process-item-content">
        <div class="process-item-header">
          <div class="process-item-name">${process.name}</div>
          <div class="process-item-actions">
            <button class="btn btn-small btn-primary" onclick="editProcess('${process.id}')">编辑</button>
            <button class="btn btn-small btn-danger" onclick="deleteProcess('${process.id}')">删除</button>
          </div>
        </div>
        <div class="process-item-details">
          <div class="process-item-detail">
            <div class="process-item-detail-label">英文名称</div>
            <div class="process-item-detail-value">${process.englishName || '-'}</div>
          </div>
        </div>
      </div>
    `;
    processListEl.appendChild(li);
  });
}
