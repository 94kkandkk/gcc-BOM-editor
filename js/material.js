// 材料库管理模块

// 全局变量
let materialLibrary = [];

// 页面加载初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化材料库数据
  initMaterialLibrary();
  // 绑定导航切换事件
  bindNavEvents();
  // 绑定材料库相关按钮事件
  bindMaterialEvents();
  // 渲染材料列表
  renderMaterialList();
});

// 初始化材料库数据
function initMaterialLibrary() {
  const savedLibrary = getLocalStorage('gcc-material-library', []);
  materialLibrary = savedLibrary;
}

// 保存材料库数据
function saveMaterialLibrary() {
  setLocalStorage('gcc-material-library', materialLibrary);
}

// 绑定导航切换事件
function bindNavEvents() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // 移除所有导航项的active类
      navItems.forEach(nav => nav.classList.remove('active'));
      // 添加当前导航项的active类
      this.classList.add('active');
      // 隐藏所有内容区
      const sections = document.querySelectorAll('.content-section');
      sections.forEach(section => section.style.display = 'none');
      // 显示目标内容区
      const target = this.dataset.target;
      document.getElementById(target).style.display = 'block';
    });
  });
}

// 绑定材料库相关按钮事件
function bindMaterialEvents() {
  // 添加材料按钮
  document.getElementById('addMaterialBtn').addEventListener('click', function() {
    showMaterialModal();
  });
  
  // 取消添加材料
  document.getElementById('cancelMaterialBtn').addEventListener('click', function() {
    closeMaterialModal();
  });
  
  // 确认添加材料
  document.getElementById('confirmMaterialBtn').addEventListener('click', function() {
    saveMaterial();
  });
}

// 显示材料编辑弹窗
function showMaterialModal(material = null) {
  const modal = document.getElementById('materialModal');
  const modalTitle = document.getElementById('materialModalTitle');
  
  // 清空表单
  document.getElementById('materialName').value = '';
  document.getElementById('materialGrade').value = '';
  document.getElementById('materialProvince').value = '';
  document.getElementById('materialAddress').value = '';
  document.getElementById('materialContact').value = '';
  document.getElementById('materialPhone').value = '';
  
  // 设置弹窗标题
  if (material) {
    modalTitle.textContent = '编辑材料';
    // 填充表单数据
    document.getElementById('materialName').value = material.name;
    document.getElementById('materialGrade').value = material.grade || '';
    document.getElementById('materialProvince').value = material.supplier?.province || '';
    document.getElementById('materialAddress').value = material.supplier?.address || '';
    document.getElementById('materialContact').value = material.supplier?.contact || '';
    document.getElementById('materialPhone').value = material.supplier?.phone || '';
    // 存储当前编辑的材料ID
    modal.dataset.materialId = material.id;
  } else {
    modalTitle.textContent = '添加材料';
    modal.dataset.materialId = '';
  }
  
  // 显示弹窗
  modal.style.display = 'flex';
}

// 关闭材料编辑弹窗
function closeMaterialModal() {
  const modal = document.getElementById('materialModal');
  modal.style.display = 'none';
  modal.dataset.materialId = '';
}

// 保存材料
function saveMaterial() {
  const modal = document.getElementById('materialModal');
  const materialId = modal.dataset.materialId;
  
  // 获取表单数据
  const name = document.getElementById('materialName').value.trim();
  const grade = document.getElementById('materialGrade').value.trim();
  const province = document.getElementById('materialProvince').value.trim();
  const address = document.getElementById('materialAddress').value.trim();
  const contact = document.getElementById('materialContact').value.trim();
  const phone = document.getElementById('materialPhone').value.trim();
  
  // 验证必填字段
  if (!name) {
    alert('材料名称不能为空！');
    return;
  }
  
  // 构建材料对象
  const materialData = {
    name,
    grade,
    supplier: {
      province,
      address,
      contact,
      phone
    }
  };
  
  if (materialId) {
    // 更新现有材料
    const index = materialLibrary.findIndex(item => item.id === materialId);
    if (index !== -1) {
      materialLibrary[index] = { ...materialLibrary[index], ...materialData };
    }
  } else {
    // 添加新材料
    const newMaterial = {
      id: Date.now().toString(),
      ...materialData
    };
    materialLibrary.push(newMaterial);
  }
  
  // 保存材料库数据
  saveMaterialLibrary();
  // 渲染材料列表
  renderMaterialList();
  // 关闭弹窗
  closeMaterialModal();
}

// 删除材料
function deleteMaterial(materialId) {
  if (confirm('确认删除该材料？')) {
    materialLibrary = materialLibrary.filter(item => item.id !== materialId);
    saveMaterialLibrary();
    renderMaterialList();
  }
}

// 渲染材料列表
function renderMaterialList() {
  const materialListEl = document.getElementById('materialList');
  
  if (materialLibrary.length === 0) {
    materialListEl.innerHTML = '<li class="empty-tip">材料库为空，请点击「添加材料」开始创建</li>';
    return;
  }
  
  materialListEl.innerHTML = '';
  materialLibrary.forEach(material => {
    const li = document.createElement('li');
    li.className = 'material-library-item';
    li.innerHTML = `
      <div class="material-item-content">
        <div class="material-item-header">
          <div class="material-item-name">${material.name}</div>
          <div class="material-item-actions">
            <button class="btn btn-small btn-primary" onclick="editMaterial('${material.id}')">编辑</button>
            <button class="btn btn-small btn-danger" onclick="deleteMaterial('${material.id}')">删除</button>
          </div>
        </div>
        <div class="material-item-details">
          <div class="material-item-detail">
            <div class="material-item-detail-label">牌号</div>
            <div class="material-item-detail-value">${material.grade || '-'}</div>
          </div>
          <div class="material-item-detail">
            <div class="material-item-detail-label">供应商省市</div>
            <div class="material-item-detail-value">${material.supplier?.province || '-'}</div>
          </div>
          <div class="material-item-detail">
            <div class="material-item-detail-label">详细地址</div>
            <div class="material-item-detail-value">${material.supplier?.address || '-'}</div>
          </div>
          <div class="material-item-detail">
            <div class="material-item-detail-label">联系人</div>
            <div class="material-item-detail-value">${material.supplier?.contact || '-'}</div>
          </div>
          <div class="material-item-detail">
            <div class="material-item-detail-label">手机号</div>
            <div class="material-item-detail-value">${material.supplier?.phone || '-'}</div>
          </div>
        </div>
      </div>
    `;
    materialListEl.appendChild(li);
  });
}

// 编辑材料
function editMaterial(materialId) {
  const material = materialLibrary.find(item => item.id === materialId);
  if (material) {
    showMaterialModal(material);
  }
}
