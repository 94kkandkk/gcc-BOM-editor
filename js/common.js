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
