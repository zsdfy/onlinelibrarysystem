// 全局变量（保持原有名称不变）
let currentPage = 1;
const booksPerPage = 8;
let allBooks = [];
let bookshelves = [];
let categories = [];
let isSubmitting = false;

// API配置（新增）
const API_CONFIG = {
  BASE_URL: '#', 
  TIMEOUT: 10000 
};

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
    loadBookshelves(),
    loadCategories(),
    loadBooks()
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

// 从后台加载书架数据
async function loadBookshelves() {
  try {
    showLoading('加载书架数据中...');
    const data = await apiRequest('/api/bookshelves');

    bookshelves = data;

    const select = document.getElementById('bookshelf');
    select.innerHTML = '<option value="">-- 请选择书架 --</option>';
    bookshelves.forEach(shelf => {
      const option = document.createElement('option');
      option.value = shelf.id;
      option.textContent = `${shelf.name} (${shelf.location})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('加载书架数据错误:', error);
    showError('加载书架数据失败: ' + error.message);
  } finally {
    hideLoading();
  }
}

// 从后台加载类别数据
async function loadCategories() {
  try {
    showLoading('加载类别数据中...');
    const data = await apiRequest('/api/categories');

    categories = data;

    const select = document.getElementById('category');
    select.innerHTML = '<option value="">-- 请选择类别 --</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
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
async function loadBooks() {
  try {
    showLoading('加载书籍数据中...');
    const data = await apiRequest('/api/books');

    allBooks = data;
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
  const booksToShow = allBooks.slice(startIndex, endIndex);

  if (booksToShow.length === 0) {
    container.innerHTML = '<div class="no-books">没有找到符合条件的书籍</div>';
    renderPagination();
    return;
  }

  booksToShow.forEach(book => {
    const shelf = bookshelves.find(s => s.id === book.bookshelfId) || {};
    const category = categories.find(c => c.id === book.categoryId) || {};

    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <img src="${book.coverUrl || 'https://via.placeholder.com/200x300?text=无封面'}" alt="${book.title}" class="book-cover">
      <div class="book-info">
        <h3 class="book-title" title="${book.title}">${book.title}</h3>
        <p class="book-meta"><i class="fas fa-user"></i> ${book.author}</p>
        <p class="book-meta"><i class="fas fa-bookmark"></i> ${category.name || '未分类'}</p>
        <p class="book-meta"><i class="fas fa-map-marker-alt"></i> ${shelf.name || '未知'} (${shelf.location || '未知位置'})</p>
        <p class="book-meta"><i class="fas fa-copy"></i> 库存: ${book.quantity}本</p>
        <div class="book-actions">
          <button class="book-btn edit" data-id="${book.id}">
            <i class="fas fa-edit"></i>编辑
          </button>
          <button class="book-btn delete" data-id="${book.id}">
            <i class="fas fa-trash-alt"></i>删除
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);

    // 添加编辑和删除事件
    card.querySelector('.edit').addEventListener('click', () => openEditModal(book.id));
    card.querySelector('.delete').addEventListener('click', () => deleteBook(book.id));
  });

  renderPagination();
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
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  pageInfo.textContent = `第${currentPage}页 / 共${totalPages}页`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalRecords === 0;
}

documaddEventListener('DOMContentLoaded', async function () {
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
    loadBookshelves(),
    loadCategories(),
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
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookName').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('publisher').value = book.publisher;
    document.getElementById('isbn').value = book.isbn;
    document.getElementById('quantity').value = book.quantity;
    document.getElementById('bookshelf').value = book.bookshelfId;
    document.getElementById('category').value = book.categoryId;
    document.getElementById('description').value = book.description;

    // 显示封面预览
    const coverPreview = document.getElementById('coverPreview');
    coverPreview.innerHTML = '';
    if (book.coverUrl) {
      const img = document.createElement('img');
      img.src = book.coverUrl;
      coverPreview.appendChild(img);
    }

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

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '保存中...';

  try {

    const bookId = document.getElementById('bookId').value;
    const isEdit = !!bookId;

    // 使用FormData处理文件上传
    const formData = new FormData();
    formData.append('title', document.getElementById('bookName').value);
    formData.append('author', document.getElementById('author').value);
    formData.append('publisher', document.getElementById('publisher').value);
    formData.append('isbn', document.getElementById('isbn').value);
    formData.append('quantity', document.getElementById('quantity').value);
    formData.append('bookshelfId', document.getElementById('bookshelf').value);
    formData.append('categoryId', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);

    const coverFile = document.getElementById('cover').files[0];
    if (coverFile) formData.append('cover', coverFile);

    showLoading(isEdit ? '更新书籍中...' : '添加书籍中...');

    // 特殊处理FormData请求
    const endpoint = isEdit ? `/api/books/${bookId}` : '/api/books';
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: isEdit ? 'PUT' : 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || (isEdit ? '更新书籍失败' : '添加书籍失败'));
    }

    const result = await response.json();
    showSuccess(isEdit ? '书籍更新成功！' : '书籍添加成功！');

    // 重新加载数据
    await Promise.all([
      loadBookshelves(),
      loadCategories(),
      loadBooks()
    ]);

    closeModal();
  } catch (error) {
    console.error('表单提交错误:', error);
    showError(`操作失败: ${error.message}`);
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    hideLoading();
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
