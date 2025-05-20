document.addEventListener('DOMContentLoaded', function () {
  const API = {
    getReaders: '#',
    updateStatus: '#',
    updateReader: '#',
    deleteReader: '#',
    addReader: '#'
  };

  const readerTableBody = document.getElementById('readerTableBody');
  const statusModal = document.getElementById('statusModal');
  const editModal = document.querySelector('.editModal');
  const addUserModal = document.getElementById('addUserModal');
  const searchInput = document.querySelector('.search-input input');
  const searchBtn = document.querySelector('.img-search-btn');
  const statusFilter = document.getElementById('statusFilter');
  const muteFilter = document.getElementById('muteFilter');
  const dateInputs = document.querySelectorAll('.date-picker input');
  const addUserBtn = document.getElementById('addUserBtn');

  let readers = [];

  fetchReaders();

  async function fetchReaders() {
    try {
      const response = await fetch(API.getReaders);
      if (!response.ok) throw new Error('Failed to fetch readers');

      const data = await response.json();
      readers = data.readers || [];
      renderReaderTable(readers);
    } catch (error) {
      console.error('Error fetching readers:', error);
      showError('获取读者数据失败，请稍后再试');
    }
  }

  function renderReaderTable(readersToRender) {
    readerTableBody.innerHTML = '';

    if (readersToRender.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="9" style="text-align: center;">没有找到匹配的读者</td>`;
      readerTableBody.appendChild(row);
      return;
    }

    readersToRender.forEach(reader => {
      const row = document.createElement('tr');

      const banStatusBadge = reader.banStatus === 'normal' ?
        '<span class="status-badge status-normal">正常</span>' :
        '<span class="status-badge status-banned">封号</span>';

      const muteStatusBadge = reader.muteStatus === 'normal' ?
        '<span class="status-badge status-normal">正常</span>' :
        '<span class="status-badge status-muted">禁言</span>';

      row.innerHTML = `
        <td><img src="../image/${reader.avatar}" alt="头像" width="40" height="40" style="border-radius:50%"></td>
        <td>${reader.name}</td>
        <td>${reader.account}</td>
        <td>${reader.email}</td>
        <td>${reader.role === 'admin' ? '管理员' : '用户'}</td>
        <td>${banStatusBadge}</td>
        <td>${muteStatusBadge}</td>
        <td>${reader.registerTime}</td>
        <td>
          <div class="action-buttons">
            <button class="status-btn" data-id="${reader.id}">
              <i class="fas fa-cog"></i> 状态
            </button>
            <button class="edit-btn" data-id="${reader.id}">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="delete-btn" data-id="${reader.id}">
              <i class="fas fa-trash-alt"></i> 删除
            </button>
          </div>
        </td>
      `;

      readerTableBody.appendChild(row);
    });

    bindRowEvents();
  }

  function showStatusModal(readerId) {
    const reader = readers.find(r => r.id === parseInt(readerId));
    if (reader) {
      document.getElementById('statusUserId').value = reader.id;
      document.querySelector(`input[name="banStatus"][value="${reader.banStatus}"]`).checked = true;
      document.querySelector(`input[name="muteStatus"][value="${reader.muteStatus}"]`).checked = true;
      statusModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  function showEditModal(readerId) {
    const reader = readers.find(r => r.id === parseInt(readerId));
    if (reader) {
      document.getElementById('editUserId').value = reader.id;
      document.getElementById('editName').value = reader.name;
      document.getElementById('editAccount').value = reader.account;
      document.getElementById('editEmail').value = reader.email;
      editModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  // 删除读者
  async function deleteReader(readerId) {
    const reader = readers.find(r => r.id === parseInt(readerId));
    if (reader && confirm(`确定要删除读者 ${reader.name} 吗？`)) {
      try {
        const response = await fetch(`${API.deleteReader}/${readerId}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Delete failed');

        const result = await response.json();
        if (result.success) {
          await fetchReaders(); // Refresh data
          showToast('读者删除成功！');
        }
      } catch (error) {
        console.error('Error deleting reader:', error);
        showError('删除读者失败，请稍后再试');
      }
    }
  }

  // 绑定事件
  function bindRowEvents() {
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showStatusModal(btn.dataset.id);
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => showEditModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteReader(btn.dataset.id));
    });
  }

  function filterReaders() {
    const statusValue = statusFilter.value === "all" ? "" : statusFilter.value;
    const muteValue = muteFilter.value === "all" ? "" : muteFilter.value;
    const startDate = dateInputs[0].value;
    const endDate = dateInputs[1].value;
    const searchValue = searchInput.value.trim().toLowerCase();

    const filtered = readers.filter(reader => {
      if (statusValue && reader.banStatus !== statusValue) return false;

      if (muteValue && reader.muteStatus !== muteValue) return false;

      const registerDate = reader.registerTime.split(' ')[0];
      if (startDate && registerDate < startDate) return false;
      if (endDate && registerDate > endDate) return false;

      // Search filter
      if (searchValue &&
        !reader.name.toLowerCase().includes(searchValue) &&
        !reader.account.toLowerCase().includes(searchValue) &&
        !reader.email.toLowerCase().includes(searchValue)) {
        return false;
      }

      return true;
    });

    renderReaderTable(filtered);
  }

  searchBtn.addEventListener('click', filterReaders);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterReaders();
  });
  statusFilter.addEventListener('change', filterReaders);
  muteFilter.addEventListener('change', filterReaders);
  dateInputs.forEach(input => input.addEventListener('change', filterReaders));

  addUserBtn.addEventListener('click', () => {
    addUserModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });

  function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      closeModal(modal);
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target);
    }
  });

  // 修改状态
  document.getElementById('statusForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const readerId = parseInt(document.getElementById('statusUserId').value);
    const banStatus = document.querySelector('input[name="banStatus"]:checked').value;
    const muteStatus = document.querySelector('input[name="muteStatus"]:checked').value;

    try {
      const response = await fetch(API.updateStatus, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: readerId,
          banStatus,
          muteStatus
        })
      });

      if (!response.ok) throw new Error('Update failed');

      const result = await response.json();
      if (result.success) {
        await fetchReaders(); 
        closeModal(statusModal);
        showToast('状态修改成功！');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('状态修改失败，请稍后再试');
    }
  });

  //编辑读者信息
  document.getElementById('editForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const readerId = parseInt(document.getElementById('editUserId').value);
    const name = document.getElementById('editName').value;
    const account = document.getElementById('editAccount').value;
    const email = document.getElementById('editEmail').value;

    try {
      const response = await fetch(API.updateReader, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: readerId,
          name,
          account,
          email
        })
      });

      if (!response.ok) throw new Error('Update failed');

      const result = await response.json();
      if (result.success) {
        await fetchReaders();
        closeModal(editModal);
        showToast('读者信息修改成功！');
      }
    } catch (error) {
      console.error('Error updating reader:', error);
      showError('修改读者信息失败，请稍后再试');
    }
  });

  // 添加新用户
  document.getElementById('addUserForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const newReader = {
      name: document.getElementById('addName').value,
      account: document.getElementById('addAccount').value,
      email: document.getElementById('addEmail').value,
      password: document.getElementById('addPassword').value,
      role: 'user'
    };

    try {
      const response = await fetch(API.addReader, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReader)
      });

      if (!response.ok) throw new Error('Add failed');

      const result = await response.json();
      if (result.success) {
        this.reset();
        await fetchReaders(); // Refresh data
        closeModal(addUserModal);
        showToast('新增读者成功！');
      }
    } catch (error) {
      console.error('Error adding reader:', error);
      showError('新增读者失败，请稍后再试');
    }
  });

  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastContent = toast.querySelector('.toast-content');

    toastContent.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // 错误信息
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.main-content');
    container.insertBefore(errorDiv, container.firstChild);

    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  // 取消按钮
  document.getElementById('cancelStatus').addEventListener('click', () => closeModal(statusModal));
  document.getElementById('cancelEdit').addEventListener('click', () => closeModal(editModal));
  document.getElementById('cancelAdd').addEventListener('click', () => {
    document.getElementById('addUserForm').reset();
    closeModal(addUserModal);
  });
});