// 全局变量（保持原有名称不变）
let currentPage = 1;
const booksPerPage = 8;
let allBooks = [];
let types = [];
// let bookshelves = [];
// let categories = [];
let isSubmitting = false;

// API配置（新增）
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  TIMEOUT: 10000
};

//分页导航函数
function  goToPrevPage() {
  if(currentPage > 1) {
    currentPage--;
    loadBooks(currentPage);
    // renderBooks();
    // updatePagination();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(allBooks.length/booksPerPage);
  if(currentPage < totalPages) {
    currentPage++;
    loadBooks(currentPage);
    // renderBooks();
    // updatePagination();
  }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async function () {
  // 绑定事件
  document.getElementById('openAddModal').addEventListener('click', openAddModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('prevPage').addEventListener('click', goToPrevPage);
  document.getElementById('nextPage').addEventListener('click', goToNextPage);
  document.getElementById('cover').addEventListener('change', previewCover);
  document.getElementById('bookForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('searchBtn').addEventListener('click', searchBooks);

  // 加载初始数据
  await Promise.all([
    // loadBookshelves(),
    // loadCategories(),
    loadTypes(),
    loadBooks(1)
  ]);
});

updatePagination();

// API请求
async function apiRequest(endpoint, method = 'GET', body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API请求错误 [${method} ${endpoint}]:`, error);
    throw new Error(error.name === 'AbortError' ? '请求超时' : error.message || '网络请求失败');
  }
}


// 从后台加载类别数据
async function loadTypes() {
  try {
    showLoading('加载类别数据中...');
    const response = await apiRequest('/api/types');

    types = response.data || [];

    console.log('Loaded Types:', types); // 调试日志


    const select = document.getElementById('type');
    select.innerHTML = '<option value="">-- 请选择类别 --</option>';
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.type;
      option.textContent = type.type;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('加载类别数据错误:', error);
    showError('加载类别数据失败: ' + error.message);
  } finally {
    hideLoading();
  }
}


// 从后台加载书籍数据
async function loadBooks(pageNum = 1, pageSize = booksPerPage) {
  try {
    showLoading('加载书籍数据中...');
    // const data = await apiRequest('/api/books');
    const response = await apiRequest(`/api/books?pageNum=${pageNum}&pageSize=${pageSize}`);

    // 从响应结果中获取数据
    // const { data } = response;
    // allBooks = data;
    allBooks = (response.data || []).map(book => ({
      ...book,
      typeName: (types || []).find(t => t.type === book.type) ?.type || '未分类'
    }));

    console.log('Loaded Books:', allBooks); // 调试日志
    renderBooks();
  } catch (error) {
    console.error('加载书籍数据错误:', error);
    showError('加载书籍数据失败: ' + error.message);
  } finally {
    hideLoading();
  }
}

// 搜索书籍
async function searchBooks() {
  const keyword = document.getElementById('searchInput').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  try {
    showLoading('搜索书籍中...');
    let url = '/api/books?';
    if (keyword) url += `q=${encodeURIComponent(keyword)}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}`;

    const data = await apiRequest(url);
    allBooks = data;
    currentPage = 1;
    renderBooks();
  } catch (error) {
    console.error('搜索书籍错误:', error);
    showError('搜索书籍失败: ' + error.message);
  } finally {
    hideLoading();
  }
}

// 渲染书籍卡片
function renderBooks() {
  const container = document.getElementById('bookCardsContainer');
  container.innerHTML = '';

  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const booksToShow = allBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);
  // const booksToShow = allBooks.slice(startIndex, endIndex);

  if (booksToShow.length === 0) {
    container.innerHTML = '<div class="no-books">没有找到符合条件的书籍</div>';
    renderPagination();
    return;
  }

  booksToShow.forEach(book => {
    const card = `
      <div class="book-card">
        <div>
            <img src="${book.bimage || 'https://placehold.co/90x100?text=无封面'}" 
                alt="${book.bname}" class="book-cover">
        </div>
        
        <div class="book-info">
          <h3 class="book-title">${book.bname}</h3>
          <p class="book-meta"><i class="fas fa-user"></i> ${book.author}</p>
          <p class="book-meta"><i class="fas fa-bookmark"></i> ${book.typeName}</p>
          <p class="book-meta"><i class="fas fa-copy"></i> 库存: ${book.stock}本</p>
          <p class="book-meta"><i class="fas fa-globe"></i> ${book.language || '未知语言'}</p>
          <div class="book-actions">
            <button class="book-btn edit" data-id="${book.id}">
              <i class="fas fa-edit"></i>编辑
            </button>
            <button class="book-btn delete" data-id="${book.id}">
              <i class="fas fa-trash-alt"></i>删除
            </button>
          </div>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', card);
  });

  container.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  container.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', () => deleteBook(btn.dataset.id));
  });


  renderPagination();
  updatePagination();
}

// 打开新增书籍模态框
function openAddModal() {
  console.log("openAddModal函数被调用"); // 调试
  try {
    document.getElementById('modalTitle').textContent = '新增书籍';
    document.getElementById('bookId').value = '';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('bookModal').style.display = 'block';

    // 重置表单验证状态
    const form = document.getElementById('bookForm');
    form.querySelectorAll('input, select, textarea').forEach(element => {
      element.classList.remove('is-invalid');
    });

    console.log("模态框已成功打开"); // 调试
  } catch (error) {
    console.error("打开新增模态框时出错:", error);
  }
}

function updatePagination() {
  const totalRecords = allBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / booksPerPage));

  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');

  document.getElementById('pageInfo').textContent =
      `第${pageInfo.pageNum}页 / 共${pageInfo.pages}页`;
  // pageInfo.textContent = `第${currentPage}页 / 共${totalPages}页`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalRecords === 0;
}

document.addEventListener('DOMContentLoaded', async function () {
  console.log("DOM已加载"); // 调试

  // 确保按钮存在并正确绑定事件
  const addButton = document.getElementById('openAddModal');
  if (addButton) {
    console.log("找到新增图书按钮"); // 调试
    addButton.addEventListener('click', openAddModal);
  } else {
    console.error("未找到ID为'openAddModal'的按钮");
  }

  await Promise.all([
    // loadBookshelves(),
    loadTypes(),
    loadBooks()
  ]);
});

// 确保模态框关闭函数正确定义
function closeModal() {
  document.getElementById('bookModal').style.display = 'none';
}

// 确保表单提交处理函数正确绑定
document.getElementById('bookForm').addEventListener('submit', function (event) {
  event.preventDefault();
  handleFormSubmit(event).catch(error => {
    console.error("表单提交处理出错:", error);
  });
});

// 打开编辑书籍模态框
async function openEditModal(bookId) {
  try {
    showLoading('加载书籍详情中...');
    const book = await apiRequest(`/api/books/${bookId}`);

    // 填充表单
    document.getElementById('modalTitle').textContent = '编辑书籍';
    document.getElementById('bookName').value = book.bname;
    document.getElementById('author').value = book.author;
    document.getElementById('quantity').value = book.stock;
    document.getElementById('type').value = book.type;
    document.getElementById('language').value = book.language;
    document.getElementById('description').value = book.description;

    // 显示封面预览
    const coverPreview = document.getElementById('coverPreview');
    coverPreview.innerHTML = book.bimage
        ? `<img src="${book.bimage}" style="max-width: 200px">`
        : '';

    document.getElementById('bookModal').style.display = 'block';

  } catch (error) {
    console.error('加载书籍详情错误:', error);
    showError('获取书籍详情失败: ' + error.message);
    closeModal();
  } finally {
    hideLoading();
  }
}

// 处理表单提交
async function handleFormSubmit(event) {
  event.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;

  const formData = new FormData(event.target);
  const bookId = document.getElementById('bookId').value;

  try {
    // 处理文件上传
    // let coverUrl = '';
    const coverFile = formData.get('cover');
    if (coverFile.size > 0) {
      const uploadForm = new FormData();
      uploadForm.append('file', coverFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm

      });
      const { url } = await uploadRes.json();
      formData.set('bimage', url);
      // coverUrl = url;
    }

    // 构建请求数据
  const bookData = {
    bname: formData.get('bookName'),
    author: formData.get('author'),
    type: formData.get('type'),
    stock: parseInt(formData.get('quantity')),
    type: formData.get('type'),
    language: formData.get('language'),
    bimage: formData.get('bimage') || ''
  };
  // const submitBtn = event.target.querySelector('button[type="submit"]');
  // const originalBtnText = submitBtn.textContent;
  // submitBtn.disabled = true;
  // submitBtn.textContent = '保存中...';

    // 确定请求方法
    const endpoint = bookId ? `/books/${bookId}` : '/books';
    // const endpoint = bookId ? `/api/books/${bookId}` : '/api/books';
    const method = bookId ? 'PUT' : 'POST';

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookData)
    });

    if (!response.ok) throw new Error('请求失败');

    showSuccess(bookId ? '更新成功！' : '添加成功！');
    await loadBooks();
    closeModal();
  } catch (error) {
    showError('操作失败: ' + error.message);
  } finally {
    isSubmitting = false;
  }

}

// 删除书籍
async function deleteBook(bookId) {
  if (!confirm('确定要删除这本书吗？此操作不可恢复！')) return;

  try {
    showLoading('删除书籍中...');
    await apiRequest(`/api/books/${bookId}`, 'DELETE');
    showSuccess('书籍删除成功！');
    await loadBooks();
  } catch (error) {
    console.error('删除书籍错误:', error);
    showError('删除书籍失败: ' + error.message);
  } finally {
    hideLoading();
  }
}



//加载状态管理函数
function showLoading(message = '加载中...') {
  const loadingEl = document.createElement('div');
  loadingEl.id = 'loadingOverlay';
  loadingEl.innerHTML = `
    <div class="loading-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loadingEl);
}

function hideLoading() {
  const loadingEl = document.getElementById('loadingOverlay');
  if(loadingEl) loadingEl.remove();
}

//封面预览
function previewCover(event) {
  const input = event.target;
  const preview = document.getElementById('coverPreview');
  preview.innerHTML = '';

  if(input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '200px';
      preview.appendChild(img);
    }
    reader.readAsDataURL(input.files[0]);
  }
}

function showError(message) {
  alert('错误: ' + message);
}

function showSuccess(message) {
  alert('成功: ' + message);
}

// 渲染分页
function renderPagination() {
  const pageNumbersContainer = document.getElementById('pageNumbers');
  if (!pageNumbersContainer) return;

  pageNumbersContainer.innerHTML = '';

  const totalPages = Math.ceil(allBooks.length / booksPerPage);
  if (totalPages <= 1) return;

  // 显示页码按钮
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.classList.add('page-number');
    if (i === currentPage) {
      pageBtn.classList.add('active');
    }
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      renderBooks();
      updatePagination();
    });
    pageNumbersContainer.appendChild(pageBtn);
  }
}