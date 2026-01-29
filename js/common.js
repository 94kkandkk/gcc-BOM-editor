// 通用工具：从URL获取指定参数
function getUrlParam(name) {
    const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
    const r = window.location.search.substr(1).match(reg);
    return r ? decodeURIComponent(r[2]) : '';
}

// 通用工具：时间戳格式化（YYYY-MM-DD HH:mm）
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const padZero = num => num < 10 ? `0${num}` : num;
    return `${date.getFullYear()}-${padZero(date.getMonth()+1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 通用本地存储：保存数据（JSON格式化）
function setLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// 通用本地存储：获取数据（JSON解析，默认返回空值）
function getLocalStorage(key, defaultValue = null) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

// 通用本地存储：删除指定键数据
function removeLocalStorage(key) {
    localStorage.removeItem(key);
}

// 通用工具：递归查找节点（BOM树通用，编辑器页/后续扩展复用）
function findNodeById(nodeId, nodeList = []) {
    for (const node of nodeList) {
        if (node.id === nodeId) return node;
        if (node.children && node.children.length > 0) {
            const res = findNodeById(nodeId, node.children);
            if (res) return res;
        }
    }
    return null;
}

// 通用工具：递归删除节点（BOM树通用）
function deleteChildNode(nodeId, nodeList = []) {
    for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].id === nodeId) {
            nodeList.splice(i, 1);
            return true;
        }
        if (nodeList[i].children && nodeList[i].children.length > 0) {
            const res = deleteChildNode(nodeId, nodeList[i].children);
            if (res) return true;
        }
    }
    return false;
}

// 通用自定义弹窗函数
function showModal(title, body, buttons = []) {
  // 确保弹窗HTML存在
  ensureModalHTML();
  
  const modal = document.getElementById('customModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalBtnGroup = document.getElementById('modalBtnGroup');
  
  // 设置标题和内容
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  
  // 设置按钮
  modalBtnGroup.innerHTML = '';
  buttons.forEach(button => {
    const btn = document.createElement('button');
    btn.className = `btn ${button.className}`;
    btn.textContent = button.text;
    btn.onclick = button.onClick;
    modalBtnGroup.appendChild(btn);
  });
  
  // 显示弹窗
  modal.classList.add('show');
}

// 通用关闭弹窗函数
function closeModal() {
  const modal = document.getElementById('customModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// 显示消息提示
function showMessage(message, type = 'info') {
  // 确保消息容器存在
  let messageContainer = document.getElementById('messageContainer');
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'messageContainer';
    messageContainer.className = 'message-container';
    document.body.appendChild(messageContainer);
  }
  
  // 创建消息元素
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.textContent = message;
  
  // 添加到消息容器
  messageContainer.appendChild(messageElement);
  
  // 显示消息
  setTimeout(() => {
    messageElement.classList.add('show');
  }, 10);
  
  // 3秒后自动消失
  setTimeout(() => {
    messageElement.classList.remove('show');
    setTimeout(() => {
      messageContainer.removeChild(messageElement);
      // 如果消息容器为空，移除容器
      if (messageContainer.children.length === 0) {
        document.body.removeChild(messageContainer);
      }
    }, 300);
  }, 3000);
}

// 确保弹窗HTML结构存在
function ensureModalHTML() {
  if (!document.getElementById('customModal')) {
    const modalHTML = `
      <div class="modal" id="customModal">
        <div class="modal-content">
          <div class="modal-title" id="modalTitle"></div>
          <div class="modal-body" id="modalBody"></div>
          <div class="modal-btn-group" id="modalBtnGroup"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}
