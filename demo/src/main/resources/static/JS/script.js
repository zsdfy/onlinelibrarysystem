const info_btn = document.getElementsByClassName("info-btn");
for(let i=0; i<info_btn.length; i++) {
    info_btn[i].onclick =() =>{
        document.querySelector(".container").classList.toggle("login-in")
    }
}

// 注册按钮点击事件
document.getElementById('registerBtn').addEventListener('click', function() {
    // 获取用户输入
    const username = document.querySelector('input[name="fullname"]').value;
    const password = document.querySelector('input[name="Username"]').value;
    const confirmPassword = document.querySelector('input[name="Password"]').value;

    // 校验密码是否一致
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致！');
        return;
    }

    // 发送POST请求到后端接口
    fetch('/api/toRegister', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('注册成功！');
                // 跳转到登录页面或刷新
                window.location.href = '/login.html';
            } else {
                alert('注册失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('请求错误:', error);
        });
});


// 记住密码功能
document.addEventListener('DOMContentLoaded', function() {
    const rememberMe = document.getElementById('remember');
    const username = document.querySelector('input[name="Username"]');
    const password = document.querySelector('input[name="Password"]');

    // 检查本地存储
    if(localStorage.getItem('remember') === 'true') {
        rememberMe.checked = true;
        username.value = localStorage.getItem('username') || '';
        password.value = localStorage.getItem('password') || '';
    }

    // 登录按钮点击事件
    document.querySelector('.login-in .btn').addEventListener('click', function(e) {
        if(rememberMe.checked) {
            localStorage.setItem('remember', 'true');
            localStorage.setItem('username', username.value);
            localStorage.setItem('password', password.value);
        } else {
            localStorage.removeItem('remember');
            localStorage.removeItem('username');
            localStorage.removeItem('password');
        }
        // 这里可以添加实际的登录逻辑
    });
});

// 忘记密码功能
function showForgotPassword() {
    const email = prompt("请输入您的注册邮箱：");
    if(email) {
        alert("重置密码链接已发送至您的邮箱：" + email);
        // 这里可以添加实际的密码重置逻辑
    }
}


// script.js 新增功能
function toggleUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// 点击外部关闭菜单
document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-menu')) {
        document.querySelector('.user-dropdown').style.display = 'none';
    }
});

// 图标字体定义（可替换为实际图标）
const style = document.createElement('style');
style.textContent = `
@font-face {
    font-family: 'iconfont';
    src: url('iconfont.woff2') format('woff2');
}
.icon-briefcase:before { content: "\\e601"; }
.icon-bookmark:before { content: "\\e602"; }
.icon-edit:before { content: "\\e603"; }
.icon-settings:before { content: "\\e604"; }
.icon-exit:before { content: "\\e605"; }
.icon-search:before { content: "\\e606"; }
.icon-user:before { content: "\\e607"; }
.icon-tag:before { content: "\\e608"; }
.icon-stock:before { content: "\\e609"; }
`;
document.head.appendChild(style);