// 主入口函数
document.addEventListener('DOMContentLoaded', function () {
    // 初始化UI交互
    initUI();

    // 初始化登录功能
    initLogin();

    // 初始化注册功能
    initRegister();

    // 检查记住密码状态
    checkRememberMe();
});

// 初始化UI交互
function initUI() {
    // 切换登录/注册表单
    const infoBtns = document.querySelectorAll(".info-btn");
    infoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector(".container").classList.toggle("login-in");
        });
    });

    // 密码显示/隐藏切换
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const toggle = document.createElement('span');
        toggle.className = 'toggle-password';
        toggle.innerHTML = '👁️';
        toggle.style.cursor = 'pointer';
        toggle.style.position = 'absolute';
        toggle.style.right = '10px';
        toggle.style.top = '50%';
        toggle.style.transform = 'translateY(-50%)';

        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(toggle);

        toggle.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggle.innerHTML = '👁️‍🗨️';
            } else {
                input.type = 'password';
                toggle.innerHTML = '👁️';
            }
        });
    });
}

// 初始化登录功能
function initLogin() {
    const loginBtn = document.querySelector('.login-in .btn');
    const usernameInput = document.querySelector('.login-in input[name="Username"]');
    const passwordInput = document.querySelector('.login-in input[name="Password"]');
    const rememberMe = document.getElementById('remember');

    loginBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // 客户端验证
        if (!username || !password) {
            showAlert('请输入用户名和密码', 'error');
            return;
        }

        // 显示加载状态
        const originalText = this.textContent;
        this.textContent = '登录中...';
        this.disabled = true;

        try {
            // 调用登录API
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const result = await response.json();

            if (response.ok) {
                // 登录成功处理
                showAlert('登录成功', 'success');

                // 存储token和用户信息
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userInfo', JSON.stringify(result.user));

                // 记住密码功能
                if (rememberMe.checked) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('savedUsername', username);
                    localStorage.setItem('savedPassword', password);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('savedUsername');
                    localStorage.removeItem('savedPassword');
                }

                // 跳转到首页
                setTimeout(() => {
                    // window.location.href = '/图书管理.html';
                    window.location.href = result.redirect; // 使用后端返回的跳转地址
                }, 1000);
            } else {
                // 登录失败处理
                showAlert(result.message || '登录失败，请检查用户名和密码', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            showAlert('登录过程中出错，请重试', 'error');
        } finally {
            // 恢复按钮状态
            this.textContent = originalText;
            this.disabled = false;
        }
    });
}

// 初始化注册功能
function initRegister() {
    const registerBtn = document.querySelector('.sign-up .btn');
    const usernameInput = document.querySelector('.sign-up input[name="fullname"]');
    const passwordInput = document.querySelector('.sign-up input[name="Username"]');
    const confirmPasswordInput = document.querySelector('.sign-up input[name="Password"]');

    registerBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // 客户端验证
        if (!username || !password || !confirmPassword) {
            showAlert('请填写所有字段', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('两次输入的密码不一致', 'error');
            return;
        }

        if (password.length < 8) {
            showAlert('密码长度至少为8个字符', 'error');
            return;
        }

        // 显示加载状态
        const originalText = this.textContent;
        this.textContent = '注册中...';
        this.disabled = true;

        try {
            // 调用注册API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const result = await response.json();

            if (response.ok) {
                // 注册成功处理
                showAlert('注册成功！请登录', 'success');

                // 自动切换到登录表单
                document.querySelector(".container").classList.remove("login-in");

                // 清空注册表单
                usernameInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
            } else {
                // 注册失败处理
                showAlert(result.message || '注册失败，请重试', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            showAlert('注册过程中出错，请重试', 'error');
        } finally {
            // 恢复按钮状态
            this.textContent = originalText;
            this.disabled = false;
        }
    });
}

// 检查记住密码状态
function checkRememberMe() {
    const rememberMe = document.getElementById('remember');
    const usernameInput = document.querySelector('.login-in input[name="Username"]');
    const passwordInput = document.querySelector('.login-in input[name="Password"]');

    if (localStorage.getItem('rememberMe') === 'true') {
        rememberMe.checked = true;
        usernameInput.value = localStorage.getItem('savedUsername') || '';
        passwordInput.value = localStorage.getItem('savedPassword') || '';
    }
}

// 忘记密码功能
function showForgotPassword() {
    const email = prompt("请输入您的注册邮箱：");
    if (email) {
        resetPassword(email);
    }
}

// 密码重置功能
async function resetPassword(email) {
    if (!email) return;

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message || '重置密码链接已发送至您的邮箱', 'success');
        } else {
            showAlert(result.message || '密码重置失败，请重试', 'error');
        }
    } catch (error) {
        console.error('密码重置错误:', error);
        showAlert('密码重置过程中出错，请重试', 'error');
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    // 移除旧的提示
    const oldAlert = document.querySelector('.custom-alert');
    if (oldAlert) oldAlert.remove();

    // 创建提示元素
    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    alert.textContent = message;

    // 样式
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.left = '50%';
    alert.style.transform = 'translateX(-50%)';
    alert.style.padding = '10px 20px';
    alert.style.borderRadius = '4px';
    alert.style.color = 'white';
    alert.style.zIndex = '1000';
    alert.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    // 根据类型设置背景色
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        info: '#2196F3',
        warning: '#FF9800'
    };
    alert.style.backgroundColor = colors[type] || colors.info;

    // 添加到页面
    document.body.appendChild(alert);

    // 3秒后自动消失
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s';
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

// 用户菜单功能
function toggleUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// 点击外部关闭菜单
document.addEventListener('click', function (e) {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});