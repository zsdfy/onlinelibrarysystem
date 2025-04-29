document.addEventListener('DOMContentLoaded', function () {
  const API = {
    getBooks: '#',
    collectBook: '#',
    borrowBook: '#',
    searchBooks: '#'
  };

  fetchBooks();
  // updatePagination();
  setupEventListeners();

  let currentBooks = [];
  let currentPage = 1;
  const booksPerPage = 8;

  async function fetchBooks() {
    try {
      const response = await fetch(API.getBooks);
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      currentBooks = data.books || [];
      renderBooks(currentBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      showError('无法加载图书，请稍后再试');
    }
  }

  // 格式化日期
  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-CN');
    } catch (e) {
      return '';
    }
  }

  function renderBooks(books) {
    const container = document.getElementById('bookCardsContainer');
    container.innerHTML = '';

    if (books.length === 0) {
      container.innerHTML = '<div class="no-books">暂无图书数据</div>';
      return;
    }

    books.forEach(book => {
      const bookCard = createBookCard(book);
      container.appendChild(bookCard);
    });
  }

  function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';

    // 检查还书时间是否到期
    const currentDate = new Date();
    const returnDate = book.return_date ? new Date(book.return_date) : null;
    const isOverdue = returnDate && returnDate < currentDate;

    card.innerHTML = `
    <img src="${book.cover || 'https://via.placeholder.com/280x180?text=No+Cover'}" alt="${book.title}" class="book-cover">
    <div class="book-info">
      <h3 class="book-title">${book.title || '未知标题'}</h3>
      <p class="book-author">${book.author || '未知作者'}</p>
      <p class="book-source">${book.category || ''}${book.category && book.publisher ? ' - ' : ''}${book.publisher || ''}</p>
      ${book.return_date ? `
        <p class="book-due-date ${isOverdue ? 'overdue' : ''}">
          还书时间: ${isOverdue ? '已到期' : formatDate(book.return_date)}
        </p>
      ` : ''}
    </div>
    <div class="book-actions">
      <button class="book-btn collect ${book.is_collected ? 'collected' : ''}" data-id="${book.id}">
        ${book.is_collected ? '取消收藏' : '收藏'}
      </button>
      <button class="book-btn borrow ${book.is_borrowed ? 'borrowed' : ''}" data-id="${book.id}" ${book.is_borrowed ? 'disabled' : ''}>
        ${book.is_borrowed ? '已借阅' : '借阅'}
      </button>
    </div>
  `;

    return card;
  }

  function setupEventListeners() {
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
        console.error('Error:', error);
        showError('操作失败，请稍后再试');
      }
    });

    const searchBtn = document.querySelector('.img-search-btn');
    const searchInput = document.querySelector('.search-input input');

    searchBtn.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch(searchInput.value);
    });

    const tabs = document.querySelectorAll('.type li');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.textContent.trim();
        if (category === '全部') {
          renderBooks(currentBooks);
        } else {
          filterBooksByCategory(category);
        }

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

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

  async function toggleCollect(bookId, btn) {
    const isCollected = btn.classList.contains('collected');

    try {
      const endpoint = `${API.collectBook}/${bookId}`;
      const method = isCollected ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': '#'
        }
      });

      if (!response.ok) throw new Error('Collection update failed');

      const data = await response.json();
      if (data.success) {
        // 切换按钮状态
        if (isCollected) {
          btn.classList.remove('collected');
          btn.textContent = '收藏';
        } else {
          btn.classList.add('collected');
          btn.textContent = '取消收藏';
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      showError('收藏操作失败，请稍后再试');
    }
  }

  async function toggleBorrow(bookId, btn) {
    const isBorrowed = btn.classList.contains('borrowed');

    try {
      const endpoint = `${API.borrowBook}/${bookId}`;
      const method = isBorrowed ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': '#'
        }
      });

      if (!response.ok) throw new Error('Borrow update failed');

      const data = await response.json();
      if (data.success) {
        if (isBorrowed) {
          btn.classList.remove('borrowed');
          btn.textContent = '借阅';
          btn.disabled = false;
        } else {
          btn.classList.add('borrowed');
          btn.textContent = '已借阅';
          btn.disabled = true;
        }
        // 刷新图书列表
        await fetchBooks();
      }
    } catch (error) {
      console.error('借阅操作失败:', error);
      showError('借阅操作失败，请稍后再试');
    }
  }

  async function performSearch(query) {
    if (!query.trim()) {
      fetchBooks();
      return;
    }

    try {
      const response = await fetch(`${API.searchBooks}?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      currentBooks = data.books || [];
      renderBooks(currentBooks);
    } catch (error) {
      console.error('Search error:', error);
      showError('搜索失败，请稍后再试');
    }
  }

  function filterBooksByCategory(category) {
    const filtered = currentBooks.filter(book =>
      book.category === category
    );
    renderBooks(filtered);
  }

  function updatePagination() {
    const startIdx = (currentPage - 1) * booksPerPage;
    const endIdx = startIdx + booksPerPage;
    const paginatedBooks = currentBooks.slice(startIdx, endIdx);
    renderBooks(paginatedBooks);

    const totalPages = Math.ceil(currentBooks.length / booksPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.textContent = `${currentPage} / ${totalPages}`;
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.getElementById('bookCardsContainer');
    container.innerHTML = '';
    container.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
});