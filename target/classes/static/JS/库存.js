document.addEventListener('DOMContentLoaded', function () {
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalRecords = 0;
  let allRecords = [];
  let selectedRecords = [];

  // DOM元素
  const recordTableBody = document.getElementById('recordTableBody');
  const searchBtn = document.getElementById('searchBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const bookNameSearch = document.getElementById('bookNameSearch');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  // 初始化
  updatePagination();
  fetchRecords();

  // 事件监听
  searchBtn.addEventListener('click', handleSearch);
  deleteBtn.addEventListener('click', handleDelete);
  prevPageBtn.addEventListener('click', goToPrevPage);
  nextPageBtn.addEventListener('click', goToNextPage);
  bookNameSearch.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleSearch();
  });

  // 从API获取库存记录
  function fetchRecords(searchTerm = '') {
    // 显示加载状态
    recordTableBody.innerHTML = '<tr><td colspan="2" class="loading-message"><i class="fas fa-spinner fa-spin"></i> 加载中...</td></tr>';

    fetch(`/api/inventory?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`)
      .then(response => {
        if (!response.ok) throw new Error('获取数据失败');
        return response.json();
      })
      .then(data => {
        allRecords = data.records || [];
        totalRecords = data.total || 0;
        renderRecords();
        updatePagination();
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('获取库存记录失败', 'error');
        renderRecords();
      });
  }

  // 渲染库存记录表格
  function renderRecords() {
    recordTableBody.innerHTML = '';

    if (allRecords.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="2" class="empty-message">没有找到库存记录</td>';
      recordTableBody.appendChild(row);
      return;
    }

    allRecords.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="record-checkbox" data-id="${record.id}">
          ${record.bookName}
        </td>
        <td>
          <button class="operation-btn delete-btn" data-id="${record.id}">
            <i class="fas fa-trash-alt"></i>删除
          </button>
        </td>
      `;
      recordTableBody.appendChild(row);
    });

    // 添加删除按钮事件监听
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recordId = e.currentTarget.getAttribute('data-id');
        deleteRecord(recordId);
      });
    });

    // 添加复选框事件监听
    document.querySelectorAll('.record-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const recordId = e.target.getAttribute('data-id');
        if (e.target.checked) {
          if (!selectedRecords.includes(recordId)) {
            selectedRecords.push(recordId);
          }
        } else {
          selectedRecords = selectedRecords.filter(id => id !== recordId);
        }
        updateDeleteButtonState();
      });
    });
  }

  // 处理搜索
  function handleSearch() {
    const searchTerm = bookNameSearch.value.trim();
    currentPage = 1;
    fetchRecords(searchTerm);
  }

  // 删除单条记录
  function deleteRecord(recordId) {
    if (!confirm('确定要删除这条记录吗？')) return;

    // 显示加载状态
    const deleteButtons = document.querySelectorAll(`.delete-btn[data-id="${recordId}"]`);
    deleteButtons.forEach(btn => {
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 删除中...';

      // 这里应该是实际的API调用
      fetch(`/api/inventory/${recordId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (!response.ok) throw new Error('删除失败');
          showNotification('记录删除成功', 'success');
          fetchRecords(bookNameSearch.value.trim());
        })
        .catch(error => {
          console.error('Error:', error);
          btn.disabled = false;
          btn.innerHTML = originalText;
          showNotification('删除记录失败', 'error');
        });
    });
  }

  // 批量删除记录
  function handleDelete() {
    if (selectedRecords.length === 0) {
      showNotification('请至少选择一条记录', 'error');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedRecords.length} 条记录吗？`)) return;

    // 显示加载状态
    deleteBtn.disabled = true;
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 删除中...';

    fetch('#', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: selectedRecords })
    })
      .then(response => {
        if (!response.ok) throw new Error('批量删除失败');
        selectedRecords = [];
        showNotification('批量删除成功', 'success');
        fetchRecords(bookNameSearch.value.trim());
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('批量删除失败', 'error');
      })
      .finally(() => {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = originalText;
      });
  }

  // 更新删除按钮状态
  function updateDeleteButtonState() {
    deleteBtn.disabled = selectedRecords.length === 0;
  }

  // 上一页
  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
      fetchRecords(bookNameSearch.value.trim());
    }
  }

  // 下一页
  function goToNextPage() {
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      fetchRecords(bookNameSearch.value.trim());
    }
  }

  // 更新分页信息
  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
    pageInfo.textContent = `第${currentPage}页 / 共${totalPages}页`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalRecords === 0;
  }

  // 显示通知
  function showNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      ${message}
      <span class="close-notification">×</span>
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