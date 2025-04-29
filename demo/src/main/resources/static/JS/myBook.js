document.addEventListener('DOMContentLoaded', function () {
  // API端点配置
  const API = {
    getAllBooks: '#',
    getBorrowedBooks: '#',
    getHistoryBooks: '#',
    getCollectedBooks: '#',
    returnBook: '#',
    deleteHistory: '#',
    cancelCollect: '#',
    borrowBook: '#',
    searchBooks: '#'
  };

  // 当前状态
  let currentType = 'all';
  let currentPage = 1;
  const booksPerPage = 8;
  let allBooks = [];
  let borrowedBooks = [];
  let historyBooks = [];
  let collectedBooks = [];

  // 初始化
  init();

  async function init() {
    setupEventListeners();
    await loadAllData();
    showContent(currentType);
  }

  // 设置事件监听
  function setupEventListeners() {
    // 分类标签点击事件
    document.querySelectorAll('#categoryTabs li').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelector('#categoryTabs li.active').classList.remove('active');
        tab.classList.add('active');
        currentType = tab.dataset.type;
        showContent(currentType);
        currentPage = 1;
        updatePagination();
      });
    });

    // 格式化日期
    function formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('zh-CN');
      } catch (e) {
        return '-';
      }
    }

    // 搜索按钮事件
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // 分页按钮
    document.getElementById('prevPage').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
      }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      if (currentPage * booksPerPage < getCurrentBooks().length) {
        currentPage++;
        updatePagination();
      }
    });
  }

  // 加载所有数据
  async function loadAllData() {
    try {
      showLoading();

      const [allRes, borrowedRes, historyRes, collectedRes] = await Promise.all([
        fetch(API.getAllBooks),
        fetch(API.getBorrowedBooks),
        fetch(API.getHistoryBooks),
        fetch(API.getCollectedBooks)
      ]);

      if (!allRes.ok || !borrowedRes.ok || !historyRes.ok || !collectedRes.ok) {
        throw new Error('Failed to fetch data');
      }

      allBooks = (await allRes.json()).books || [];
      borrowedBooks = (await borrowedRes.json()).books || [];
      historyBooks = (await historyRes.json()).books || [];
      collectedBooks = (await collectedRes.json()).books || [];

    } catch (error) {
      console.error('加载数据失败:', error);
      showError('加载数据失败，请稍后再试');
    } finally {
      hideLoading();
      updatePagination();
    }
  }

  // 显示对应类型的内容
  function showContent(type) {
    // 隐藏所有容器
    document.querySelectorAll('.category-table-container, .book-cards-container').forEach(container => {
      container.style.display = 'none';
    });

    // 显示当前选中的容器
    switch (type) {
      case 'all':
        document.getElementById('allBooksContainer').style.display = 'grid';
        renderBookCards(allBooks, 'allBooksContainer');
        break;
      case 'borrowed':
        document.getElementById('borrowedTableContainer').style.display = 'block';
        renderBorrowedTable(borrowedBooks);
        break;
      case 'history':
        document.getElementById('historyTableContainer').style.display = 'block';
        renderHistoryTable(historyBooks);
        break;
      case 'collected':
        document.getElementById('collectedBooksContainer').style.display = 'grid';
        renderBookCards(collectedBooks, 'collectedBooksContainer');
        break;
    }
  }

  // 借阅图书表格
  function renderBorrowedTable(books) {
    const tbody = document.getElementById('borrowedTableBody');
    tbody.innerHTML = '';

    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">暂无借阅图书</td></tr>';
      return;
    }

    const paginatedBooks = paginate(books);
    const currentDate = new Date();

    paginatedBooks.forEach(book => {
      const row = document.createElement('tr');
      const returnDate = new Date(book.return_date);
      const isOverdue = returnDate < currentDate;

      row.innerHTML = `
      <td>${book.title}</td>
      <td>${formatDate(book.borrow_date)}</td>
      <td class="${isOverdue ? 'overdue' : ''}">
        ${isOverdue ? '已到还书时间' : formatDate(book.return_date)}
      </td>
      <td>
        <button class="action-btn return-btn" data-id="${book.id}">
          还书
        </button>
      </td>
    `;
      tbody.appendChild(row);
    });

    // 添加还书按钮事件
    tbody.querySelectorAll('.return-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const bookId = btn.dataset.id;
          await returnBook(bookId);
          await loadAllData();
          showContent(currentType);
        } catch (error) {
          console.error('还书失败:', error);
          showError('还书失败，请稍后再试');
        }
      });
    });
  }

  // 历史记录表格
  function renderHistoryTable(books) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">暂无借阅历史</td></tr>';
      return;
    }

    const paginatedBooks = paginate(books);
    const currentDate = new Date();

    paginatedBooks.forEach(book => {
      const row = document.createElement('tr');
      const returnDate = new Date(book.return_date);
      const isOverdue = returnDate < currentDate && !book.actual_return_date;

      row.innerHTML = `
      <td>${book.title}</td>
      <td>${formatDate(book.borrow_date)}</td>
      <td class="${isOverdue ? 'overdue' : ''}">
        ${isOverdue ? '已到还书时间' : formatDate(book.return_date)}
      </td>
      <td>
        <button class="action-btn delete-btn" data-id="${book.id}">
          删除记录
        </button>
      </td>
    `;
      tbody.appendChild(row);
    });

    // 添加删除按钮事件
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const bookId = btn.dataset.id;
          await deleteHistoryRecord(bookId);
          await loadAllData();
          showContent(currentType);
        } catch (error) {
          console.error('删除失败:', error);
          showError('删除失败，请稍后再试');
        }
      });
    });
  }

  // 书籍卡片
  function renderBookCards(books, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (books.length === 0) {
      container.innerHTML = '<div class="no-books">暂无图书数据</div>';
      return;
    }

    const paginatedBooks = paginate(books);

    paginatedBooks.forEach(book => {
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
          <button class="book-btn collect" 
                  data-id="${book.id}"
                  ${containerId === 'collectedBooksContainer' ? '' : 'disabled'}>
            ${containerId === 'collectedBooksContainer' ? '取消收藏' : '已收藏'}
          </button>
          <button class="book-btn borrow" 
                  data-id="${book.id}"
                  ${book.is_borrowed ? 'disabled' : ''}>
            ${book.is_borrowed ? '已借阅' : '借阅'}
          </button>
        </div>
      `;

      // 设置按钮样式
      const collectBtn = card.querySelector('.collect');
      const borrowBtn = card.querySelector('.borrow');

      if (containerId === 'collectedBooksContainer') {
        collectBtn.classList.add('collected');
      }

      if (book.is_borrowed) {
        borrowBtn.classList.add('borrowed');
      }

      // 添加事件监听
      if (containerId === 'collectedBooksContainer') {
        collectBtn.addEventListener('click', async () => {
          try {
            await cancelCollectBook(book.id);
            await loadAllData();
            showContent(currentType);
          } catch (error) {
            console.error('取消收藏失败:', error);
            showError('取消收藏失败，请稍后再试');
          }
        });
      }

      borrowBtn.addEventListener('click', async () => {
        try {
          await borrowBook(book.id);
          await loadAllData();
          showContent(currentType);
        } catch (error) {
          console.error('借阅失败:', error);
          showError('借阅失败，请稍后再试');
        }
      });

      container.appendChild(card);
    });
  }

  // 分页数据
  function paginate(books) {
    const startIdx = (currentPage - 1) * booksPerPage;
    const endIdx = startIdx + booksPerPage;
    return books.slice(startIdx, endIdx);
  }

  // 获取当前类型的图书
  function getCurrentBooks() {
    switch (currentType) {
      case 'all': return allBooks;
      case 'borrowed': return borrowedBooks;
      case 'history': return historyBooks;
      case 'collected': return collectedBooks;
      default: return [];
    }
  }

  // 更新分页信息
  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
    pageInfo.textContent = `第${currentPage}页 / 共${totalPages}页`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalRecords === 0;
  }

  // 搜索功能
  async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
      await loadAllData();
      return;
    }

    try {
      showLoading();
      const response = await fetch(`${API.searchBooks}?q=${encodeURIComponent(query)}`);

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      allBooks = data.books || [];
      borrowedBooks = data.borrowed || [];
      historyBooks = data.history || [];
      collectedBooks = data.collected || [];

      currentPage = 1;
      updatePagination();
    } catch (error) {
      console.error('搜索失败:', error);
      showError('搜索失败，请稍后再试');
    } finally {
      hideLoading();
    }
  }

  // API操作函数
  async function returnBook(bookId) {
    const response = await fetch(`${API.returnBook}/${bookId}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Return failed');
    return response.json();
  }

  async function deleteHistoryRecord(recordId) {
    const response = await fetch(`${API.deleteHistory}/${recordId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Delete failed');
    return response.json();
  }

  async function cancelCollectBook(bookId) {
    const response = await fetch(`${API.cancelCollect}/${bookId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Cancel collect failed');
    return response.json();
  }

  async function borrowBook(bookId) {
    const response = await fetch(`${API.borrowBook}/${bookId}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Borrow failed');
    return response.json();
  }

  // 辅助函数
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  }

  function showLoading() {
    const containers = [
      'allBooksContainer',
      'borrowedTableContainer',
      'historyTableContainer',
      'collectedBooksContainer'
    ];

    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = '<div class="no-books">加载中...</div>';
      }
    });
  }

  function hideLoading() {
    // 加载状态会在render函数中被替换
  }

  function showError(message) {
    const container = document.querySelector('.active-container') || document.getElementById('allBooksContainer');
    container.innerHTML = `<div class="error-message">${message}</div>`;

    setTimeout(() => {
      container.innerHTML = '';
      showContent(currentType);
    }, 3000);
  }
});