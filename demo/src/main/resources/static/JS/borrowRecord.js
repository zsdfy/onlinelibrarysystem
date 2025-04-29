document.addEventListener('DOMContentLoaded', function () {
  // 全局变量
  let currentPage = 1;
  let pageSize = 10;
  let totalRecords = 0;
  let allRecords = [];
  let filteredRecords = [];
  let currentRecordId = null;

  // API配置
  const API_CONFIG = {
    BASE_URL: '#',
    ENDPOINTS: {
      BORROW_RECORDS: '#',
      RETURN_BOOK: '#',
      DELETE_RECORD: '#'
    }
  };

  // DOM元素
  const domElements = {
    recordsBody: document.getElementById('recordsBody'),
    totalRecords: document.getElementById('totalRecords'),
    pageSize: document.getElementById('pageSize'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageNumbers: document.getElementById('pageNumbers'),
    searchBtn: document.getElementById('searchBtn'),
    statusFilter: document.getElementById('statusFilter'),
    readerSearch: document.getElementById('readerSearch'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    returnModal: document.getElementById('returnModal'),
    closeModal: document.querySelector('.close-modal'),
    confirmReturn: document.getElementById('confirmReturn'),
    cancelReturn: document.getElementById('cancelReturn'),
    returnBookTitle: document.getElementById('returnBookTitle')
  };

  // 初始化
  init();

  // 事件监听
  function setupEventListeners() {
    domElements.pageSize.addEventListener('change', function () {
      pageSize = parseInt(this.value);
      currentPage = 1;
      renderRecords();
    });

    domElements.prevPage.addEventListener('click', goToPrevPage);
    domElements.nextPage.addEventListener('click', goToNextPage);
    domElements.searchBtn.addEventListener('click', applyFilters);
    domElements.statusFilter.addEventListener('change', applyFilters);
    domElements.readerSearch.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') applyFilters();
    });

    domElements.closeModal.addEventListener('click', hideReturnModal);
    domElements.cancelReturn.addEventListener('click', hideReturnModal);
    domElements.confirmReturn.addEventListener('click', handleReturn);

    window.addEventListener('click', function (e) {
      if (e.target === domElements.returnModal) {
        hideReturnModal();
      }
    });
  }

  // 初始化函数
  async function init() {
    setupEventListeners();
    await loadBorrowRecords();
  }

  // API请求函数
  async function fetchData(url, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // 从后端加载借阅记录
  async function loadBorrowRecords() {
    try {
      showLoading('加载借阅记录中...');

      const data = await fetchData(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BORROW_RECORDS}`
      );

      allRecords = data.records.map(record => ({
        id: record.id,
        readerName: record.reader_name,
        bookTitle: record.book_title,
        borrowDate: formatDateTime(record.borrow_date),
        dueDate: formatDate(record.due_date),
        returnDate: record.return_date ? formatDateTime(record.return_date) : '',
        status: getStatus(record.return_date, record.due_date)
      }));

      totalRecords = allRecords.length;
      filteredRecords = [...allRecords];
      renderRecords();
    } catch (error) {
      showError('加载借阅记录失败: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  // 应用筛选条件
  function applyFilters() {
    const startDate = domElements.startDate.value;
    const endDate = domElements.endDate.value;
    const status = domElements.statusFilter.value;
    const searchTerm = domElements.readerSearch.value.toLowerCase();

    filteredRecords = allRecords.filter(record => {
      // 状态筛选
      if (status !== 'all' && record.status !== status) return false;

      // 日期筛选
      const borrowDate = new Date(record.borrowDate.split(' ')[0]);
      if (startDate && new Date(startDate) > borrowDate) return false;
      if (endDate && new Date(endDate) < borrowDate) return false;

      // 搜索条件
      if (searchTerm &&
        !record.readerName.toLowerCase().includes(searchTerm) &&
        !record.bookTitle.toLowerCase().includes(searchTerm)) {
        return false;
      }

      return true;
    });

    totalRecords = filteredRecords.length;
    currentPage = 1;
    renderRecords();
  }

  // 渲染记录表格
  function renderRecords() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const recordsToShow = filteredRecords.slice(startIndex, endIndex);

    domElements.recordsBody.innerHTML = '';

    if (recordsToShow.length === 0) {
      domElements.recordsBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px;">
            没有找到符合条件的借阅记录
          </td>
        </tr>
      `;
      renderPagination();
      return;
    }

    recordsToShow.forEach((record, index) => {
      const row = document.createElement('tr');

      // 状态标签
      const statusInfo = getStatusInfo(record.status);

      // 操作按钮
      const actions = getActionButtons(record);

      row.innerHTML = `
        <td>${startIndex + index + 1}</td>
        <td>${record.readerName}</td>
        <td>${record.bookTitle}</td>
        <td>${record.borrowDate}</td>
        <td>${record.dueDate}</td>
        <td>${record.returnDate || '-'}</td>
        <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
        <td>${actions}</td>
      `;

      domElements.recordsBody.appendChild(row);
    });

    // 添加按钮事件
    addButtonEventListeners();

    // 更新总数和分页
    domElements.totalRecords.textContent = totalRecords;
    renderPagination();
  }

  // 获取状态信息
  function getStatusInfo(status) {
    const statusMap = {
      borrowed: { class: 'status-borrowed', text: '借阅中' },
      returned: { class: 'status-returned', text: '已归还' },
      overdue: { class: 'status-overdue', text: '已逾期' }
    };
    return statusMap[status] || { class: '', text: '未知状态' };
  }

  // 获取操作按钮HTML
  function getActionButtons(record) {
    if (record.status === 'borrowed' || record.status === 'overdue') {
      return `
        <button class="action-btn return-btn" data-id="${record.id}">
          <i class="fas fa-check"></i> 归还
        </button>
        <button class="action-btn delete-btn" data-id="${record.id}">
          <i class="fas fa-trash"></i> 删除
        </button>
      `;
    }
    return `
      <button class="action-btn delete-btn" data-id="${record.id}">
        <i class="fas fa-trash"></i> 删除
      </button>
    `;
  }

  // 添加按钮事件监听
  function addButtonEventListeners() {
    document.querySelectorAll('.return-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const recordId = parseInt(this.getAttribute('data-id'));
        showReturnModal(recordId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const recordId = parseInt(this.getAttribute('data-id'));
        deleteRecord(recordId);
      });
    });
  }

  // 渲染分页
  function renderPagination() {
    const totalPages = Math.ceil(totalRecords / pageSize);

    domElements.pageNumbers.innerHTML = '';

    // 显示最多5个页码
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // 第一页
    if (startPage > 1) {
      addPageButton(1);
      if (startPage > 2) {
        addEllipsis();
      }
    }

    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
      addPageButton(i, i === currentPage);
    }

    // 最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        addEllipsis();
      }
      addPageButton(totalPages);
    }

    // 更新上一页/下一页按钮状态
    domElements.prevPage.disabled = currentPage === 1;
    domElements.nextPage.disabled = currentPage === totalPages || totalPages === 0;
  }

  function addPageButton(page, isActive = false) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = page;
    if (isActive) {
      pageBtn.classList.add('active');
    }
    pageBtn.addEventListener('click', () => {
      currentPage = page;
      renderRecords();
    });
    domElements.pageNumbers.appendChild(pageBtn);
  }

  function addEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    domElements.pageNumbers.appendChild(ellipsis);
  }

  // 上一页
  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderRecords();
    }
  }

  // 下一页
  function goToNextPage() {
    const totalPages = Math.ceil(totalRecords / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderRecords();
    }
  }

  // 显示归还确认模态框
  function showReturnModal(recordId) {
    const record = allRecords.find(r => r.id === recordId);
    if (record) {
      currentRecordId = recordId;
      domElements.returnBookTitle.textContent = record.bookTitle;
      domElements.returnModal.style.display = 'block';

      // 添加ESC键关闭模态框的功能
      document.addEventListener('keydown', handleKeyDown);
    }
  }

  // 隐藏归还确认模态框
  function hideReturnModal() {
    domElements.returnModal.style.display = 'none';
    currentRecordId = null;
    document.removeEventListener('keydown', handleKeyDown);
  }

  // ESC键关闭模态框
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      hideReturnModal();
    }
  }

  // 处理归还操作
  async function handleReturn() {
    if (!currentRecordId) return;

    try {
      showLoading('正在归还书籍...');

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RETURN_BOOK.replace('{id}', currentRecordId)}`;
      const result = await fetchData(url, 'POST');

      // 更新本地数据
      const record = allRecords.find(r => r.id === currentRecordId);
      if (record) {
        record.returnDate = formatDateTime(result.return_date);
        record.status = 'returned';

        applyFilters();
        hideReturnModal();
        showSuccess('书籍归还成功！');
      }
    } catch (error) {
      showError('归还书籍失败: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  // 删除记录
  async function deleteRecord(recordId) {
    if (!confirm('确定要删除这条借阅记录吗？此操作不可撤销！')) return;

    try {
      showLoading('正在删除记录...');

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELETE_RECORD.replace('{id}', recordId)}`;
      await fetchData(url, 'DELETE');

      // 更新本地数据
      allRecords = allRecords.filter(r => r.id !== recordId);
      filteredRecords = filteredRecords.filter(r => r.id !== recordId);
      totalRecords = filteredRecords.length;

      // 如果当前页没有记录且不是第一页，返回上一页
      if (domElements.recordsBody.children.length === 1 && currentPage > 1) {
        currentPage--;
      }

      renderRecords();
      showSuccess('借阅记录删除成功！');
    } catch (error) {
      showError('删除借阅记录失败: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  // 获取认证令牌
  function getAuthToken() {
    // 从localStorage或cookie获取token
    return localStorage.getItem('authToken') || '';
  }

  // 格式化日期
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  }

  // 格式化日期时间
  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  }

  // 确定借阅状态
  function getStatus(returnDate, dueDate) {
    if (returnDate) return 'returned';

    const today = new Date();
    const due = new Date(dueDate);
    return today > due ? 'overdue' : 'borrowed';
  }

  // 显示加载状态
  function showLoading(message) {
    let loadingOverlay = document.getElementById('loading-overlay');

    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loading-overlay';
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.zIndex = '2000';

      const loadingContent = document.createElement('div');
      loadingContent.style.backgroundColor = 'white';
      loadingContent.style.padding = '20px';
      loadingContent.style.borderRadius = '5px';
      loadingContent.style.display = 'flex';
      loadingContent.style.alignItems = 'center';
      loadingContent.style.gap = '10px';

      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.style.border = '4px solid #f3f3f3';
      spinner.style.borderTop = '4px solid #3498db';
      spinner.style.borderRadius = '50%';
      spinner.style.width = '20px';
      spinner.style.height = '20px';
      spinner.style.animation = 'spin 1s linear infinite';

      const text = document.createElement('span');
      text.textContent = message || '处理中...';

      loadingContent.appendChild(spinner);
      loadingContent.appendChild(text);
      loadingOverlay.appendChild(loadingContent);
      document.body.appendChild(loadingOverlay);

      // 添加旋转动画
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 隐藏加载状态
  function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  // 显示成功消息
  function showSuccess(message) {
    showAlert(message, 'success');
  }

  // 显示错误消息
  function showError(message) {
    showAlert(message, 'error');
  }

  // 显示通知消息
  function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert-message ${type}`;
    alert.textContent = message;

    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.padding = '15px 20px';
    alert.style.borderRadius = '4px';
    alert.style.color = 'white';
    alert.style.zIndex = '2000';
    alert.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    alert.style.animation = 'slideIn 0.3s ease-out';

    if (type === 'success') {
      alert.style.backgroundColor = '#4CAF50';
    } else {
      alert.style.backgroundColor = '#F44336';
    }

    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => alert.remove(), 300);
    }, 3000);

    // 添加动画样式
    if (!document.getElementById('alert-animations')) {
      const style = document.createElement('style');
      style.id = 'alert-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .alert-message {
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);
    }
  }
});