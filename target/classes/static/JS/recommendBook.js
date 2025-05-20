document.addEventListener('DOMContentLoaded', function () {
  // API端点配置 (根据实际后端API修改)
  const API = {
    getRecommendedBooks: '#',
    collectBook: '#',
    borrowBook: '#'
  };

  // 当前状态
  let currentBooks = [];
  let currentPage = 1;
  const booksPerPage = 8;

  // 初始化
  init();

  async function init() {
    await fetchRecommendedBooks();
    setupEventListeners();
  }

  // 从后端获取推荐图书
  async function fetchRecommendedBooks() {
    try {
      showLoading();
      const response = await fetch(API.getRecommendedBooks);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      currentBooks = data.books || [];
      renderBooks(currentBooks);
    } catch (error) {
      console.error('获取推荐图书失败:', error);
      showError('获取推荐图书失败，请稍后再试');
    } finally {
      hideLoading();
    }
  }

  // 渲染图书列表
  function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';

    card.innerHTML = `
    <img src="${book.cover || 'https://via.placeholder.com/280x180?text=No+Cover'}" 
         alt="${book.title}" class="book-cover">
    <div class="book-info">
      <h3 class="book-title">${book.title || '未知标题'}</h3>
      <p class="book-author">${book.author || '未知作者'}</p>
      <p class="book-source">${book.category || ''}${book.category && book.publisher ? ' - ' : ''}${book.publisher || ''}</p>
      <p class="book-description">${book.description || ''}</p>
    </div>
    <div class="book-actions">
      <button class="book-btn collect ${book.is_collected ? 'collected' : ''}" 
              data-id="${book.id}">
        ${book.is_collected ? '取消收藏' : '收藏'}
      </button>
      <button class="book-btn borrow" 
              data-id="${book.id}"
              ${book.is_borrowed ? 'disabled' : ''}>
        ${book.is_borrowed ? '已借阅' : '借阅'}
      </button>
    </div>
  `;

    // 为已借阅的按钮添加样式
    const borrowBtn = card.querySelector('.borrow');
    if (book.is_borrowed) {
      borrowBtn.classList.add('borrowed');
    }

    return card;
  }

  // 设置事件监听
  function setupEventListeners() {
    // 收藏/借阅按钮点击事件
    document.getElementById('bookCardsContainer').addEventListener('click', async function (e) {
      const btn = e.target.closest('.book-btn');
      if (!btn) return;

      const bookId = btn.dataset.id;

      try {
        if (btn.classList.contains('collect')) {
          await toggleCollect(bookId, btn);
        } else if (btn.classList.contains('borrow')) {
          await toggleBorrow(bookId, btn);
        }
      } catch (error) {
        console.error('操作失败:', error);
        showError('操作失败，请稍后再试');
      }
    });

    // 分页按钮
    document.getElementById('prevPage').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
      }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      if (currentPage * booksPerPage < currentBooks.length) {
        currentPage++;
        updatePagination();
      }
    });
  }

  // 切换收藏状态
  async function toggleCollect(bookId, btn) {
    try {
      const isCurrentlyCollected = btn.classList.contains('collected');
      const endpoint = `${API.collectBook}/${bookId}`;

      // 根据当前状态决定是收藏还是取消收藏
      const method = isCurrentlyCollected ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('收藏操作失败');

      const data = await response.json();
      if (data.success) {
        // 切换收藏状态
        if (isCurrentlyCollected) {
          btn.textContent = '收藏';
          btn.classList.remove('collected');
        } else {
          btn.textContent = '取消收藏';
          btn.classList.add('collected');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    }
  }

  // 切换借阅状态
  async function toggleBorrow(bookId, btn) {
    try {
      const endpoint = `${API.borrowBook}/${bookId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('借阅操作失败');

      const data = await response.json();
      if (data.success) {
        btn.textContent = '已借阅';
        btn.classList.add('borrowed');
        btn.disabled = true;
      }
    } catch (error) {
      console.error('借阅失败:', error);
      throw error;
    }
  }

  // 更新分页
  function updatePagination() {
    const startIdx = (currentPage - 1) * booksPerPage;
    const endIdx = startIdx + booksPerPage;
    const paginatedBooks = currentBooks.slice(startIdx, endIdx);
    renderBooks(paginatedBooks);

    // 更新页码显示
    const totalPages = Math.ceil(currentBooks.length / booksPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.textContent = `${currentPage} / ${totalPages}`;

    // 更新分页按钮状态
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }

  // 显示错误信息
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.getElementById('bookCardsContainer');
    container.innerHTML = '';
    container.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
      fetchRecommendedBooks(); // 尝试重新加载
    }, 3000);
  }

  // 显示加载状态
  function showLoading() {
    const container = document.getElementById('bookCardsContainer');
    container.innerHTML = '<div class="no-books">加载中...</div>';
  }
});