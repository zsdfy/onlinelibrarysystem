document.addEventListener('DOMContentLoaded', function () {
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalCategories = 0;
  let allCategories = [];
  let selectedCategories = [];

  // DOM元素
  const categoryTableBody = document.getElementById('categoryTableBody');
  const searchBtn = document.getElementById('searchBtn');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const batchDeleteBtn = document.getElementById('batchDeleteBtn');
  const resetBtn = document.getElementById('resetBtn');
  const categorySearch = document.getElementById('categorySearch');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const categoryModal = document.getElementById('categoryModal');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');
  const categoryForm = document.getElementById('categoryForm');
  const modalTitle = document.getElementById('modalTitle');
  const categoryIdInput = document.getElementById('categoryId');
  const categoryNameInput = document.getElementById('categoryName');

  // 初始化
  updatePagination();
  fetchCategories();

  // 事件监听
  searchBtn.addEventListener('click', handleSearch);
  addCategoryBtn.addEventListener('click', showAddModal);
  batchDeleteBtn.addEventListener('click', handleBatchDelete);
  resetBtn.addEventListener('click', resetSearch);
  prevPageBtn.addEventListener('click', goToPrevPage);
  nextPageBtn.addEventListener('click', goToNextPage);
  closeModal.addEventListener('click', hideModal);
  cancelModal.addEventListener('click', hideModal);
  categoryForm.addEventListener('submit', handleFormSubmit);
  categorySearch.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleSearch();
  });

  // 从API获取类别数据
  function fetchCategories(searchTerm = '') {
    // 显示加载状态
    categoryTableBody.innerHTML = '<tr><td colspan="2" class="loading-message"><i class="fas fa-spinner fa-spin"></i> 加载中...</td></tr>';

    // 保持分页信息显示
    const totalPages = Math.max(1, Math.ceil(totalCategories / itemsPerPage));
    pageInfo.textContent = `第${currentPage}页 / 共${totalPages}页`;

    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟空数据响应
      allCategories = [];
      totalCategories = 0;
      renderCategories();
      updatePagination(); // 确保数据加载后再次更新
    }, 500);
  }

  // 渲染类别表格
  function renderCategories() {
    categoryTableBody.innerHTML = '';

    if (allCategories.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="2" class="empty-message">没有找到类别数据</td>';
      categoryTableBody.appendChild(row);
      return;
    }

    allCategories.forEach(category => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="category-checkbox" data-id="${category.id}">
          ${category.name}
        </td>
        <td>
          <button class="operation-btn edit-btn" data-id="${category.id}">
            <i class="fas fa-edit"></i>编辑
          </button>
          <button class="operation-btn delete-btn" data-id="${category.id}">
            <i class="fas fa-trash-alt"></i>删除
          </button>
        </td>
      `;
      categoryTableBody.appendChild(row);
    });

    // 添加按钮事件监听
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.getAttribute('data-id');
        showEditModal(categoryId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.getAttribute('data-id');
        deleteCategory(categoryId);
      });
    });

    // 添加复选框事件监听
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const categoryId = parseInt(e.target.getAttribute('data-id'));
        if (e.target.checked) {
          if (!selectedCategories.includes(categoryId)) {
            selectedCategories.push(categoryId);
          }
        } else {
          selectedCategories = selectedCategories.filter(id => id !== categoryId);
        }
        updateBatchDeleteButtonState();
      });
    });
  }

  // 处理搜索
  function handleSearch() {
    const searchTerm = categorySearch.value.trim();
    currentPage = 1;
    fetchCategories(searchTerm);
    showNotification('正在搜索...', 'success');
  }

  // 重置搜索
  function resetSearch() {
    categorySearch.value = '';
    currentPage = 1;
    selectedCategories = [];
    fetchCategories();
    showNotification('已重置搜索条件', 'success');
  }

  // 显示添加模态框
  function showAddModal() {
    modalTitle.textContent = '添加新类别';
    categoryIdInput.value = '';
    categoryNameInput.value = '';
    categoryNameInput.focus();
    showModal();
  }

  // 显示编辑模态框
  function showEditModal(categoryId) {
    modalTitle.textContent = '编辑类别';
    const category = allCategories.find(cat => cat.id === parseInt(categoryId));

    if (category) {
      categoryIdInput.value = category.id;
      categoryNameInput.value = category.name;
      showModal();
    }
  }

  // 显示模态框
  function showModal() {
    categoryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  // 隐藏模态框
  function hideModal() {
    categoryModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // 处理表单提交
  function handleFormSubmit(e) {
    e.preventDefault();

    const categoryData = {
      id: categoryIdInput.value ? parseInt(categoryIdInput.value) : null,
      name: categoryNameInput.value.trim()
    };

    if (!categoryData.name) {
      showNotification('类别名称不能为空', 'error');
      return;
    }

    // 显示加载状态
    const submitBtn = categoryForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

    // API调用延迟(模拟)
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      hideModal();
      showNotification(categoryData.id ? '类别更新成功' : '类别添加成功', 'success');
      fetchCategories(categorySearch.value.trim());
    }, 800);
  }

  // 删除类别
  function deleteCategory(categoryId) {
    if (!confirm('确定要删除这个类别吗？')) return;

    // 显示加载状态
    const deleteButtons = document.querySelectorAll(`.delete-btn[data-id="${categoryId}"]`);
    deleteButtons.forEach(btn => {
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 删除中...';

      // API调用延迟（模拟)
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        showNotification('类别删除成功', 'success');
        fetchCategories(categorySearch.value.trim());
      }, 800);
    });
  }

  // 批量删除
  function handleBatchDelete() {
    if (selectedCategories.length === 0) {
      showNotification('请至少选择一个类别', 'error');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedCategories.length} 个类别吗？`)) return;

    // 显示加载状态
    batchDeleteBtn.disabled = true;
    const originalText = batchDeleteBtn.innerHTML;
    batchDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 批量删除中...';

    // API调用延迟(模拟)
    setTimeout(() => {
      batchDeleteBtn.disabled = false;
      batchDeleteBtn.innerHTML = originalText;
      selectedCategories = [];
      showNotification('批量删除成功', 'success');
      fetchCategories(categorySearch.value.trim());
    }, 800);
  }

  // 更新批量删除按钮状态
  function updateBatchDeleteButtonState() {
    batchDeleteBtn.disabled = selectedCategories.length === 0;
    batchDeleteBtn.style.color = selectedCategories.length > 0 ? '#ff4d4f' : '#a6a5ac';
  }

  // 上一页
  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
      fetchCategories(categorySearch.value.trim());
    }
  }

  // 下一页
  function goToNextPage() {
    const totalPages = Math.ceil(totalCategories / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      fetchCategories(categorySearch.value.trim());
    }
  }

  // 更新分页信息
  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(totalCategories / itemsPerPage));
    pageInfo.textContent = `第${currentPage}页 / 共${totalPages}页`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalCategories === 0;
  }

  // 显示通知
  function showNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
    ${message}
    <span class="close-notification" style="margin-left: 15px; cursor: pointer;">×</span>
  `;

    container.appendChild(notification);

    // 显示通知
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // 点击关闭按钮
    notification.querySelector('.close-notification').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });

    // 自动关闭
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

});