// 全局变量
let currentNodeId = null;
let bomData = { rootNodes: [], nodeIdGenerator: 1, bomName: "未命名BOM" };
let bomId = '';
let treeContainer = null;
let materialLibrary = []; // 材料库数据
let processLibrary = []; // 工艺库数据
let isContentChanged = false; // 跟踪内容是否已更改
let isDragging = false; // 跟踪鼠标是否正在拖动（用于复制操作）

// 页面加载初始化
document.addEventListener('DOMContentLoaded', function() {
  treeContainer = document.getElementById("treeContainer");
  // 获取bomId
  bomId = getUrlParam('bomId');
  // 初始化BOM数据
  initBomData();
  // 初始化材料库
  initMaterialLibrary();
  // 初始化工艺库
  initProcessLibrary();
  // 绑定所有按钮
  document.querySelector("#addRootBtn").onclick = addRootNode;
  document.querySelector("#addChildBtn").onclick = addChildNode;
  document.querySelector("#addMaterialBtn").onclick = addMaterialNode;
  document.querySelector("#saveBtn").onclick = saveCurrentNode;
  document.querySelector("#deleteBtn").onclick = deleteCurrentNode;
  document.querySelector("#backHomeBtn").onclick = backToHome;
  
  // 为所有表单输入元素添加回车保存功能
  const formElements = document.querySelectorAll('input, select, textarea');
  formElements.forEach(element => {
    element.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        saveCurrentNode();
      }
    });
  });
  
  // MOB开关事件监听器
  document.getElementById('mobMake').addEventListener('click', function() {
    this.className = 'btn btn-success';
    document.getElementById('mobBuy').className = 'btn btn-default';
  });
  
  document.getElementById('mobBuy').addEventListener('click', function() {
    this.className = 'btn btn-danger';
    document.getElementById('mobMake').className = 'btn btn-default';
  });
  
  // 利用率变化时自动计算毛面积和毛重
  document.getElementById('partUtilization').addEventListener('input', function() {
    const utilizationValue = this.value;
    const utilization = utilizationValue ? parseFloat(utilizationValue) : null;
    const area = parseFloat(document.getElementById('partArea').value) || 0;
    const weight = parseFloat(document.getElementById('partWeight').value) || 0;
    
    if (area > 0 && utilization) {
      document.getElementById('partGrossArea').value = (area / (utilization / 100)).toFixed(2);
    }
    
    if (weight > 0 && utilization) {
      document.getElementById('partGrossWeight').value = (weight / (utilization / 100)).toFixed(2);
    }
  });
  
  // 面积变化时自动计算毛面积
  document.getElementById('partArea').addEventListener('input', function() {
    const area = parseFloat(this.value) || 0;
    const utilizationValue = document.getElementById('partUtilization').value;
    const utilization = utilizationValue ? parseFloat(utilizationValue) : null;
    
    if (area > 0 && utilization) {
      document.getElementById('partGrossArea').value = (area / (utilization / 100)).toFixed(2);
    }
  });
  
  // 重量变化时自动计算毛重
  document.getElementById('partWeight').addEventListener('input', function() {
    const weight = parseFloat(this.value) || 0;
    const utilizationValue = document.getElementById('partUtilization').value;
    const utilization = utilizationValue ? parseFloat(utilizationValue) : null;
    
    if (weight > 0 && utilization) {
      document.getElementById('partGrossWeight').value = (weight / (utilization / 100)).toFixed(2);
    }
  });
  
  // 点击空白区域取消选中
  // 监听鼠标按下事件，开始拖动
  document.addEventListener('mousedown', function() {
    isDragging = false;
  });
  
  // 监听鼠标移动事件，标记为拖动
  document.addEventListener('mousemove', function() {
    isDragging = true;
  });
  
  // 监听鼠标松开事件，结束拖动
  document.addEventListener('mouseup', function() {
    // 拖动结束后，重置拖动状态
    // 注意：这里不需要做任何操作，因为isDragging会在下次mousedown时重置
  });
  
  document.addEventListener('click', function(e) {
    // 如果是拖动操作，不触发取消选中
    if (isDragging) {
      return;
    }
    
    // 检查点击目标是否在树容器内
    const isInTree = treeContainer.contains(e.target);
    // 检查点击目标是否是节点
    const isTreeNode = e.target.closest('.tree-node');
    // 检查点击目标是否是功能按钮
    const isButton = e.target.closest('button');
    // 检查点击目标是否是模态框
    const isModal = e.target.closest('.modal');
    // 检查点击目标是否是表单元素
    const isFormElement = e.target.closest('input, select, textarea, .form-item');
    // 检查点击目标是否在右侧属性面板内
    const isInPropertiesPanel = document.getElementById('partProperties')?.contains(e.target);
    
    // 如果点击的是空白区域（不在树容器内，不是节点，不是按钮，不是模态框，不是表单元素，不是在属性面板内），则取消选中
    if (!isInTree && !isTreeNode && !isButton && !isModal && !isFormElement && !isInPropertiesPanel) {
      if (currentNodeId) {
        currentNodeId = null;
        resetForm();
        renderTree();
      }
    }
  });
  
  // 渲染树
  renderTree();
});

// 初始化BOM数据
function initBomData() {
  if (bomId) {
    // 从本地存储加载指定BOM数据
    const savedData = getLocalStorage(`gcc-bom-data-${bomId}`);
    if (savedData) {
      bomData = savedData;
    }
  } else {
    // 检查是否有临时数据
    const tempData = getLocalStorage('tempBOM');
    if (tempData) {
      bomData = tempData;
      removeLocalStorage('tempBOM');
    }
  }
}

// 初始化材料库
function initMaterialLibrary() {
  const savedLibrary = getLocalStorage('gcc-material-library', []);
  materialLibrary = savedLibrary;
}

// 初始化工艺库
function initProcessLibrary() {
  const savedLibrary = getLocalStorage('gcc-process-library', []);
  processLibrary = savedLibrary;
  // 渲染工艺下拉框
  renderProcessDropdown();
}

// 渲染工艺下拉框
function renderProcessDropdown() {
  const processSelect = document.getElementById('partProcess');
  if (!processSelect) return;
  
  // 清空现有选项（保留第一个"请选择工艺"选项）
  while (processSelect.options.length > 1) {
    processSelect.remove(1);
  }
  
  // 添加工艺库中的工艺选项
  processLibrary.forEach(process => {
    const option = document.createElement('option');
    option.value = process.englishName; // 存储英文名称
    option.textContent = process.name; // 显示中文名称
    processSelect.appendChild(option);
  });
}



// 新增根零件
function addRootNode() {
  const newNode = { id: bomData.nodeIdGenerator++, name: "根零件", type: "part", model: "", spec: "", children: [] };
  bomData.rootNodes.push(newNode);
  isContentChanged = true;
  renderTree();
  selectNode(newNode.id);
}

// 新增子零件
function addChildNode() {
  if (!currentNodeId) {
    showModal('提示', '请先选中父零件！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  const parentNode = findNodeById(currentNodeId, bomData.rootNodes);
  if (!parentNode || parentNode.type === "material") {
    showModal('提示', '仅零件可新增子零件！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  // 检查是否已添加材料，如有材料则不能添加子零件
  const hasMaterial = parentNode.children.some(child => child.type === "material");
  if (hasMaterial) {
    showModal('提示', '该零件已添加材料，无法再细分，请检查！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  const newNode = { id: bomData.nodeIdGenerator++, name: "子零件", type: "part", model: "", spec: "", children: [] };
  parentNode.children.push(newNode);
  renderTree();
  selectNode(newNode.id);
  // Save to local storage
  setLocalStorage('bomData', bomData);
  isContentChanged = false;
  // Show success message
  showMessage('添加成功', 'success');
}

// 新增材料
function addMaterialNode() {
  if (!currentNodeId) {
    showModal('提示', '请先选中零件/材料！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  const parentNode = findNodeById(currentNodeId, bomData.rootNodes);
  
  // 检查是否已添加材料，确保一个零件只能添加材料，不能同时有子零件
  if (parentNode.children.some(child => child.type === "part")) {
    showModal('提示', '该零件已有子零件，不能添加材料！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  
  // 显示材料选择弹窗
  showMaterialSelectionModal(parentNode);
}

// 显示材料选择弹窗
function showMaterialSelectionModal(parentNode) {
  // 生成材料库列表HTML
  let materialListHTML = '';
  if (materialLibrary.length === 0) {
    materialListHTML = '<div class="empty-tip">材料库为空，请先在首页添加材料</div>';
  } else {
    materialListHTML = '<ul class="material-library-list">';
    materialLibrary.forEach(material => {
      // 构建材料详情HTML
      let detailsHTML = `
        <div class="material-detail-item">
          <span class="material-detail-label">牌号:</span>
          <span class="material-detail-value">${material.grade || '无'}</span>
        </div>
      `;
      
      // 添加供应商信息
      if (material.supplier) {
        if (material.supplier.province) {
          detailsHTML += `
            <div class="material-detail-item">
              <span class="material-detail-label">省市:</span>
              <span class="material-detail-value">${material.supplier.province}</span>
            </div>
          `;
        }
        if (material.supplier.address) {
          detailsHTML += `
            <div class="material-detail-item">
              <span class="material-detail-label">地址:</span>
              <span class="material-detail-value">${material.supplier.address}</span>
            </div>
          `;
        }
        if (material.supplier.contact) {
          detailsHTML += `
            <div class="material-detail-item">
              <span class="material-detail-label">联系人:</span>
              <span class="material-detail-value">${material.supplier.contact}</span>
            </div>
          `;
        }
        if (material.supplier.phone) {
          detailsHTML += `
            <div class="material-detail-item">
              <span class="material-detail-label">手机号:</span>
              <span class="material-detail-value">${material.supplier.phone}</span>
            </div>
          `;
        }
      } else {
        detailsHTML += `
          <div class="material-detail-item">
            <span class="material-detail-value">无供应商信息</span>
          </div>
        `;
      }
      
      materialListHTML += `
        <li class="material-library-item" data-id="${material.id}">
          <div class="material-name">${material.name}</div>
          <div class="material-details">
            ${detailsHTML}
          </div>
        </li>
      `;
    });
    materialListHTML += '</ul>';
  }
  
  // 显示弹窗
  showModal('选择材料', `
    <div class="material-selection-container">
      <div class="material-library-section">
        <h4>从材料库选择</h4>
        ${materialListHTML}
      </div>
      <div class="material-selection-actions">
        <button class="btn btn-primary" id="createNewMaterialBtn">新建材料</button>
      </div>
    </div>
  `, [
    {
      text: '取消',
      className: 'btn btn-default',
      onClick: closeModal
    }
  ]);
  
  // 绑定材料库列表项点击事件
  setTimeout(() => {
    const materialItems = document.querySelectorAll('.material-library-item');
    materialItems.forEach(item => {
      item.addEventListener('click', function() {
        const materialId = this.dataset.id;
        const selectedMaterial = materialLibrary.find(m => m.id === materialId);
        if (selectedMaterial) {
          // 从材料库创建新的材料节点
          const newNode = {
            id: bomData.nodeIdGenerator++,
            name: selectedMaterial.name,
            type: "material",
            grade: selectedMaterial.grade,
            supplier: selectedMaterial.supplier,
            children: []
          };
          parentNode.children.push(newNode);
          // 更新父零件的材料名称字段
          parentNode.material = selectedMaterial.name;
          renderTree();
          selectNode(newNode.id);
          // 设置内容已更改状态
          isContentChanged = true;
          // Show success message
          showMessage('添加材料成功', 'success');
          closeModal();
        }
      });
    });
    
    // 绑定新建材料按钮点击事件
    document.getElementById('createNewMaterialBtn').addEventListener('click', function() {
      closeModal();
      showCreateMaterialModal(parentNode);
    });
  }, 100);
}

// 显示创建材料弹窗
function showCreateMaterialModal(parentNode) {
  showModal('新建材料', `
    <div class="form-item">
      <label class="form-label">材料名称</label>
      <input type="text" class="form-input" id="newMaterialName" placeholder="请输入材料名称">
    </div>
    <div class="form-item">
      <label class="form-label">牌号</label>
      <input type="text" class="form-input" id="newMaterialGrade" placeholder="请输入材料牌号">
    </div>
    <div class="form-item">
      <label class="form-label">供应商省市</label>
      <input type="text" class="form-input" id="newMaterialProvince" placeholder="如：广东省深圳市">
    </div>
    <div class="form-item">
      <label class="form-label">详细地址</label>
      <input type="text" class="form-input" id="newMaterialAddress" placeholder="请输入详细地址">
    </div>
    <div class="form-item">
      <label class="form-label">联系人</label>
      <input type="text" class="form-input" id="newMaterialContact" placeholder="请输入联系人姓名">
    </div>
    <div class="form-item">
      <label class="form-label">手机号</label>
      <input type="text" class="form-input" id="newMaterialPhone" placeholder="请输入手机号">
    </div>
  `, [
    {
      text: '取消',
      className: 'btn btn-default',
      onClick: closeModal
    },
    {
      text: '确认',
      className: 'btn btn-primary',
      onClick: function() {
        const name = document.getElementById('newMaterialName').value.trim() || "新材料";
        const grade = document.getElementById('newMaterialGrade').value.trim();
        const province = document.getElementById('newMaterialProvince').value.trim();
        const address = document.getElementById('newMaterialAddress').value.trim();
        const contact = document.getElementById('newMaterialContact').value.trim();
        const phone = document.getElementById('newMaterialPhone').value.trim();
        
        // 检查材料名称是否已存在
        if (materialLibrary.some(m => m.name === name)) {
          showModal('提示', '材料名称已存在，请重新输入！', [
            { text: '确定', className: 'btn btn-primary', onClick: closeModal }
          ]);
          return;
        }
        
        // 创建新材料并保存到材料库
        const newMaterial = {
          id: Date.now().toString(),
          name: name,
          grade: grade,
          supplier: {
            province,
            address,
            contact,
            phone
          }
        };
        
        // 添加到材料库
        materialLibrary.push(newMaterial);
        // 保存到本地存储
        setLocalStorage('gcc-material-library', materialLibrary);
        
        // 创建新的材料节点
        const newNode = {
          id: bomData.nodeIdGenerator++,
          name: name,
          type: "material",
          grade: grade,
          supplier: {
            province,
            address,
            contact,
            phone
          },
          children: []
        };
        parentNode.children.push(newNode);
        // 更新父零件的材料名称字段
        parentNode.material = name;
        
        renderTree();
        selectNode(newNode.id);
        
        // 设置内容已更改状态
        isContentChanged = true;
        
        // Show success message
        showMessage('添加材料成功并已保存到材料库！', 'success');
        closeModal();
      }
    }
  ]);
}

// 显示材料库管理弹窗（重定向到首页）
function showMaterialLibraryModal() {
  showModal('提示', '材料库管理功能已移至首页，请返回首页进行操作。', [
    {
      text: '确定',
      className: 'btn btn-primary',
      onClick: function() {
        closeModal();
        window.location.href = 'index.html';
      }
    }
  ]);
}

// 保存当前节点
function saveCurrentNode() {
  if (!currentNodeId) {
    showModal('提示', '请先选中节点！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  const node = findNodeById(currentNodeId, bomData.rootNodes);
  
  if (node.type === "material") {
    // 材料节点
    node.name = document.getElementById('materialName').value.trim() || "新材料";
    node.grade = document.getElementById('materialGrade').value;
    // 供应商信息保持不变，因为是从材料库选择的
  } else {
    // 零件节点
    node.name = document.getElementById('partName').value.trim() || "子零件";
    node.process = document.getElementById('partProcess').value;
    node.quantity = parseInt(document.getElementById('partQuantity').value) || 1;
    node.partNumber = document.getElementById('partNumber').value;
    node.config = document.getElementById('partConfig').value;
    node.size = document.getElementById('partSize').value;
    node.thickness = document.getElementById('partThickness').value;
    node.area = parseFloat(document.getElementById('partArea').value) || 0;
    node.wireLength = parseFloat(document.getElementById('partWireLength').value) || 0;
    node.weight = parseFloat(document.getElementById('partWeight').value) || 0;
    const utilizationValue = document.getElementById('partUtilization').value;
    node.utilization = utilizationValue ? parseFloat(utilizationValue) : "";
    node.surface = document.getElementById('partSurface').value;
    node.moldTonnage = parseInt(document.getElementById('partMoldTonnage').value) || 0;
    node.equipment = document.getElementById('partEquipment').value;
    node.equipmentQuantity = parseInt(document.getElementById('partEquipmentQuantity').value) || "";
    node.gateCount = parseInt(document.getElementById('partGateCount').value) || "";
    node.cTime = document.getElementById('partCTime').value;
    node.mob = document.querySelector('#mobMake').classList.contains('btn-success') ? 'Make' : 'Buy';
    node.remark = document.getElementById('partRemark').value;
    node.manufacturer = document.getElementById('partManufacturer').value;
    node.manufacturerAddress = document.getElementById('partManufacturerAddress').value;
    
    // 自动计算毛面积和毛重
    if (node.area > 0 && node.utilization) {
      node.grossArea = node.area / (node.utilization / 100);
    }
    if (node.weight > 0 && node.utilization) {
      node.grossWeight = node.weight / (node.utilization / 100);
    }
  }
  
  // 自动保存BOM表
  if (bomId) {
    // 更新现有BOM
    setLocalStorage(`gcc-bom-data-${bomId}`, bomData);
    // 更新BOM列表中的时间
    const bomList = getLocalStorage('gcc-bom-list', []);
    const bomIndex = bomList.findIndex(item => item.id === bomId);
    if (bomIndex !== -1) {
      bomList[bomIndex].updateTime = Date.now();
      setLocalStorage('gcc-bom-list', bomList);
    }
  } else {
    // 创建新BOM
    bomId = Date.now().toString();
    setLocalStorage(`gcc-bom-data-${bomId}`, bomData);
    // 添加到BOM列表
    const bomList = getLocalStorage('gcc-bom-list', []);
    bomList.unshift({
      id: bomId,
      name: bomData.bomName || "未命名BOM",
      createTime: Date.now(),
      updateTime: Date.now()
    });
    setLocalStorage('gcc-bom-list', bomList);
  }
  
  // 不显示保存成功的弹窗，避免在返回首页时出现不必要的提示
  showMessage('保存成功！', 'success');
  isContentChanged = false;
  renderTree();
}

// 删除当前节点
function deleteCurrentNode() {
  if (!currentNodeId) {
    showModal('提示', '请先选中节点！', [
      { text: '确定', className: 'btn btn-primary', onClick: closeModal }
    ]);
    return;
  }
  showModal('确认删除', '确认删除该节点及子节点？', [
    {
      text: '取消',
      className: 'btn btn-default',
      onClick: closeModal
    },
    {
        text: '确认删除',
        className: 'btn btn-danger',
        onClick: function() {
          deleteChildNode(currentNodeId, bomData.rootNodes);
          currentNodeId = null;
          resetForm();
          renderTree();
          // Save to local storage
          setLocalStorage('bomData', bomData);
          isContentChanged = false;
          // Show success message
          showMessage('删除成功', 'success');
          closeModal();
        }
      }
  ]);
}



// 返回首页
function backToHome() {
  if (!isContentChanged) {
    // 内容未更改，直接返回首页
    window.location.href = "index.html";
    return;
  }
  
  showModal('确认返回', '返回首页？未保存信息将丢失', [
    {
      text: '取消',
      className: 'btn btn-default',
      onClick: closeModal
    },
    {
      text: '保存并返回',
      className: 'btn btn-success',
      onClick: function() {
        // 保存当前节点
        if (currentNodeId) {
          saveCurrentNode();
        }
        // 保存BOM数据
        if (bomId) {
          // 更新现有BOM
          setLocalStorage(`gcc-bom-data-${bomId}`, bomData);
          // 更新BOM列表中的时间
          const bomList = getLocalStorage('gcc-bom-list', []);
          const bomIndex = bomList.findIndex(item => item.id === bomId);
          if (bomIndex !== -1) {
            bomList[bomIndex].updateTime = Date.now();
            setLocalStorage('gcc-bom-list', bomList);
          }
        }
        // 返回首页
        window.location.href = "index.html";
      }
    },
    {
      text: '直接返回',
      className: 'btn btn-primary',
      onClick: function() {
        // 直接返回首页，不保存临时数据
        window.location.href = "index.html";
      }
    }
  ]);
}

// 导出Excel
function exportToExcel() {
  // 显示导出选项对话框
  showModal('导出Excel', '请选择导出选项', [
    {
      text: '包含材料层级',
      className: 'btn btn-primary',
      onClick: function() {
        exportExcelFile(true);
        closeModal();
      }
    },
    {
      text: '不包含材料层级',
      className: 'btn btn-default',
      onClick: function() {
        exportExcelFile(false);
        closeModal();
      }
    }
  ]);
}

// 导出Excel文件
function exportExcelFile(includeMaterials) {
  // 定义表头
  const headers = [
    '零件名称', '工艺', '数量', '零件编号', '配置', '尺寸', '厚度', 
    '面积', '线长', '重量', '利用率', '表面处理', '模具吨位', 
    '装备', '装备数量', '浇口数', 'CTime', 'MOB', '备注', 
    '制造公司', '公司地址'
  ];
  
  // 收集数据
  const data = [];
  data.push(headers); // 添加表头
  
  // 递归收集节点数据
  function collectNodes(nodes) {
    nodes.forEach(node => {
      if (node.type === 'part') {
        // 零件节点
        const row = [
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
          collectNodes(node.children);
        }
      } else if (node.type === 'material' && includeMaterials) {
        // 材料节点（仅当用户选择包含材料层级时）
        const row = [
          node.name,
          '材料',
          node.quantity || 1,
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        data.push(row);
      }
    });
  }
  
  // 开始收集数据
  collectNodes(bomData.rootNodes);
  
  // 创建Excel工作簿和工作表
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // 设置工作表名称
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM表');
  
  // 生成文件名
  const fileName = `${bomData.bomName || 'BOM表'}_${formatTime(Date.now())}.xlsx`;
  
  // 导出文件
  XLSX.writeFile(workbook, fileName);
  
  // 显示成功消息
  showMessage('导出成功！', 'success');
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

// 选中节点
function selectNode(nodeId, skipRenderTree = false) {
  // 切换节点前，保存当前节点的编辑信息
  if (currentNodeId) {
    saveCurrentNode();
  }
  
  currentNodeId = nodeId;
  const node = findNodeById(nodeId, bomData.rootNodes);
  
  // 隐藏所有属性编辑区域
  document.getElementById('partProperties').style.display = 'none';
  document.getElementById('materialProperties').style.display = 'none';
  
  if (node.type === "material") {
    // 材料节点
    document.getElementById('materialProperties').style.display = 'block';
    
    document.getElementById('materialName').value = node.name;
    document.getElementById('materialGrade').value = node.grade || "";
    
    // 构建供应商信息字符串
    const supplierInfo = [];
    if (node.supplier) {
      if (node.supplier.province) supplierInfo.push(`省市: ${node.supplier.province}`);
      if (node.supplier.address) supplierInfo.push(`地址: ${node.supplier.address}`);
      if (node.supplier.contact) supplierInfo.push(`联系人: ${node.supplier.contact}`);
      if (node.supplier.phone) supplierInfo.push(`手机号: ${node.supplier.phone}`);
    }
    document.getElementById('materialSupplier').value = supplierInfo.join("，") || "";
  } else {
    // 零件节点
    document.getElementById('partProperties').style.display = 'block';
    
    document.getElementById('partName').value = node.name;
    document.getElementById('partProcess').value = node.process || "";
    document.getElementById('partQuantity').value = node.quantity || 1;
    document.getElementById('partNumber').value = node.partNumber || "";
    document.getElementById('partConfig').value = node.config || "";
    document.getElementById('partSize').value = node.size || "";
    document.getElementById('partThickness').value = node.thickness || "";
    document.getElementById('partArea').value = node.area || "";
    document.getElementById('partGrossArea').value = node.grossArea || "";
    document.getElementById('partWireLength').value = node.wireLength || "";
    document.getElementById('partWeight').value = node.weight || "";
    document.getElementById('partGrossWeight').value = node.grossWeight || "";
    document.getElementById('partUtilization').value = node.utilization || "";
    document.getElementById('partMaterial').value = node.material || "";
    document.getElementById('partSurface').value = node.surface || "";
    document.getElementById('partMoldTonnage').value = node.moldTonnage || "";
    document.getElementById('partEquipment').value = node.equipment || "";
    document.getElementById('partEquipmentQuantity').value = node.equipmentQuantity || "";
    document.getElementById('partGateCount').value = node.gateCount || "";
    document.getElementById('partCTime').value = node.cTime || "";
    document.getElementById('partRemark').value = node.remark || "";
    document.getElementById('partManufacturer').value = node.manufacturer || "";
    document.getElementById('partManufacturerAddress').value = node.manufacturerAddress || "";
    
    // 设置MOB开关
    const mobMake = document.getElementById('mobMake');
    const mobBuy = document.getElementById('mobBuy');
    
    // 重置按钮状态
    mobMake.className = 'btn btn-success';
    mobBuy.className = 'btn btn-default';
    
    // 根据节点的mob值设置按钮状态
    if (node.mob === 'Buy') {
      mobMake.className = 'btn btn-default';
      mobBuy.className = 'btn btn-danger';
    }
  }
  
  document.querySelector("#editTip").style.display = "none";
  document.querySelector("#editForm").style.display = "flex";
  
  // 可选参数，控制是否调用renderTree
  if (!skipRenderTree) {
    renderTree();
  }
}

// 重置表单
function resetForm() {
  document.querySelector("#editTip").style.display = "flex";
  document.querySelector("#editForm").style.display = "none";
  document.querySelectorAll("#editForm input").forEach(i => i.value = "");
}

// 渲染树
function renderTree() {
  treeContainer.innerHTML = "";
  if (bomData.rootNodes.length === 0) {
    treeContainer.innerHTML = "<div class='empty-tip'>暂无节点，点击【新增根零件】创建</div>";
    return;
  }
  renderNodes(bomData.rootNodes, treeContainer, 0);
}

// 递归渲染节点
function renderNodes(nodes, parentEl, level) {
  nodes.forEach(function(node, index) {
    const nodeEl = document.createElement("div");
    nodeEl.className = `tree-node ${node.id === currentNodeId ? "active" : ""} ${node.type}`;
    nodeEl.style.paddingLeft = (level * 20) + "px";
    nodeEl.dataset.nodeId = node.id;
    
    // 添加上下移动按钮
    const moveButtons = `
      <div class="move-buttons">
        <button class="move-btn move-up" onclick="moveNodeUp('${node.id}')" ${index === 0 ? 'disabled' : ''} title="上移">↑</button>
        <button class="move-btn move-down" onclick="moveNodeDown('${node.id}')" ${index === nodes.length - 1 ? 'disabled' : ''} title="下移">↓</button>
      </div>
    `;
    
    nodeEl.innerHTML = `
      <div class="node-content">
        ${node.type === "part" ? `⚙️ ${node.name}` : `📦 ${node.name}`}
        ${moveButtons}
      </div>
    `;
    
    // 为整个节点添加点击事件
    nodeEl.onclick = function(e) { 
      // 如果点击的是移动按钮，不触发选择事件
      if (!e.target.closest('.move-buttons')) {
        selectNode(node.id); 
      }
    };
    
    parentEl.appendChild(nodeEl);
    if (node.children && node.children.length > 0) {
      renderNodes(node.children, parentEl, level + 1);
    }
  });
}

// 递归查找节点
function findNodeById(id, nodes) {
  for (const node of nodes) {
    if (node.id == id) return node;
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

// 递归删除子节点
function deleteChildNode(id, nodes) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id == id) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children) {
      const deleted = deleteChildNode(id, nodes[i].children);
      if (deleted) return true;
    }
  }
  return false;
}

// 查找节点所在的父节点和索引
function findNodeParentAndIndex(id, nodes) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id == id) {
      return { parent: null, nodes: nodes, index: i };
    }
    if (nodes[i].children) {
      const result = findNodeParentAndIndex(id, nodes[i].children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

// 上移节点
function moveNodeUp(nodeId) {
  const result = findNodeParentAndIndex(nodeId, bomData.rootNodes);
  if (result && result.index > 0) {
    // 交换节点位置
    const temp = result.nodes[result.index];
    result.nodes[result.index] = result.nodes[result.index - 1];
    result.nodes[result.index - 1] = temp;
    isContentChanged = true;
    renderTree();
    // 保持当前节点选中状态，跳过重复的renderTree调用
    selectNode(nodeId, true);
  }
}

// 下移节点
function moveNodeDown(nodeId) {
  const result = findNodeParentAndIndex(nodeId, bomData.rootNodes);
  if (result && result.index < result.nodes.length - 1) {
    // 交换节点位置
    const temp = result.nodes[result.index];
    result.nodes[result.index] = result.nodes[result.index + 1];
    result.nodes[result.index + 1] = temp;
    isContentChanged = true;
    renderTree();
    // 保持当前节点选中状态，跳过重复的renderTree调用
    selectNode(nodeId, true);
  }
}
