document.addEventListener('DOMContentLoaded', function () {
  // 获取DOM元素
  const registerForm = document.getElementById('registerForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const usernameFeedback = document.getElementById('usernameFeedback');
  const emailFeedback = document.getElementById('emailFeedback');
  const confirmFeedback = document.getElementById('confirmFeedback');
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text');
  const passwordRequirements = document.querySelectorAll('.password-requirements li');
  const togglePasswordIcons = document.querySelectorAll('.toggle-password');

  // 密码显示/隐藏切换
  togglePasswordIcons.forEach(icon => {
    icon.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      const isPassword = targetInput.type === 'password';

      targetInput.type = isPassword ? 'text' : 'password';
      this.textContent = isPassword ? 'visibility_off' : 'visibility';
    });
  });

  // 用户名实时验证
  let usernameCheckTimeout;
  usernameInput.addEventListener('input', function () {
    clearTimeout(usernameCheckTimeout);
    const username = this.value.trim();

    if (!username) {
      usernameFeedback.textContent = '';
      return;
    }

    // 简单的客户端验证
    if (username.length < 4) {
      usernameFeedback.textContent = '用户名至少需要4个字符';
      usernameFeedback.style.color = '#e74c3c';
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      usernameFeedback.textContent = '用户名只能包含字母、数字和下划线';
      usernameFeedback.style.color = '#e74c3c';
      return;
    }

    // 防抖处理，避免频繁请求
    usernameCheckTimeout = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(username);
        if (isAvailable) {
          usernameFeedback.textContent = '用户名可用';
          usernameFeedback.style.color = '#27ae60';
        } else {
          usernameFeedback.textContent = '用户名已被占用';
          usernameFeedback.style.color = '#e74c3c';
        }
      } catch (error) {
        usernameFeedback.textContent = '验证出错，请重试';
        usernameFeedback.style.color = '#e74c3c';
        console.error('用户名验证错误:', error);
      }
    }, 500);
  });

  // 邮箱格式验证
  emailInput.addEventListener('blur', function () {
    const email = this.value.trim();

    if (!email) {
      emailFeedback.textContent = '';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailFeedback.textContent = '请输入有效的电子邮箱地址';
      emailFeedback.style.color = '#e74c3c';
    } else {
      emailFeedback.textContent = '';
    }
  });

  // 密码强度检查
  passwordInput.addEventListener('input', function () {
    const password = this.value;
    updatePasswordStrength(password);
    validatePasswordRequirements(password);
    validateForm();
  });

  // 确认密码验证
  confirmPasswordInput.addEventListener('input', function () {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (!password) {
      confirmFeedback.textContent = '请先输入密码';
      confirmFeedback.style.color = '#e74c3c';
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      confirmFeedback.textContent = '两次输入的密码不一致';
      confirmFeedback.style.color = '#e74c3c';
    } else if (confirmPassword && password === confirmPassword) {
      confirmFeedback.textContent = '密码匹配';
      confirmFeedback.style.color = '#27ae60';
    } else {
      confirmFeedback.textContent = '';
    }

    validateForm();
  });

  // 更新密码强度指示器
  function updatePasswordStrength(password) {
    if (!password) {
      strengthBar.style.setProperty('--width', '0%');
      strengthBar.style.setProperty('--strength-color', '#ecf0f1');
      strengthText.textContent = '';
      return;
    }

    // 计算密码强度
    const strength = calculatePasswordStrength(password);

    // 更新UI
    strengthBar.style.setProperty('--width', `${strength.score * 25}%`);
    strengthBar.style.setProperty('--strength-color', strength.color);
    strengthText.textContent = strength.text;
  }

  // 计算密码强度
  function calculatePasswordStrength(password) {
    let score = 0;

    // 长度检查
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // 复杂性检查
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // 限制最大分数
    score = Math.min(score, 4);

    // 返回结果
    const strengthData = [
      { text: '非常弱', color: '#e74c3c' },
      { text: '弱', color: '#f39c12' },
      { text: '中等', color: '#f1c40f' },
      { text: '强', color: '#2ecc71' },
      { text: '非常强', color: '#27ae60' }
    ];

    return {
      score: score,
      text: strengthData[score].text,
      color: strengthData[score].color
    };
  }

  // 验证密码要求
  function validatePasswordRequirements(password) {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    passwordRequirements.forEach(item => {
      const requirement = item.getAttribute('data-requirement');
      if (requirements[requirement]) {
        item.classList.add('valid');
      } else {
        item.classList.remove('valid');
      }
    });
  }

  // 验证整个表单
  function validateForm() {
    const usernameValid = usernameFeedback.textContent === '用户名可用';
    const emailValid = !emailFeedback.textContent && emailInput.value.trim();
    const passwordValid = passwordInput.value.length >= 8;
    const confirmValid = confirmFeedback.textContent === '密码匹配';

    submitBtn.disabled = !(usernameValid && emailValid && passwordValid && confirmValid);
  }

  // 表单提交处理
  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (submitBtn.disabled) return;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // 显示加载状态
    submitBtn.disabled = true;
    btnText.innerHTML = '<span class="loader"></span> 处理中...';

    try {
      const result = await registerUser(username, email, password);

      if (result.success) {
        alert('注册成功！即将跳转到登录页面');
        // 注册成功后跳转到登录页面
        window.location.href = 'login.html';
      } else {
        alert(`注册失败: ${result.message}`);
        // 根据错误类型显示特定错误信息
        if (result.field === 'username') {
          usernameFeedback.textContent = result.message;
          usernameFeedback.style.color = '#e74c3c';
        } else if (result.field === 'email') {
          emailFeedback.textContent = result.message;
          emailFeedback.style.color = '#e74c3c';
        }
      }
    } catch (error) {
      alert('注册过程中出错，请重试');
      console.error('注册错误:', error);
    } finally {
      // 恢复按钮状态
      submitBtn.disabled = false;
      btnText.textContent = '注册';
    }
  });

  // 检查用户名可用性 - 实际项目中替换为真实的API调用
  async function checkUsernameAvailability(username) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟验证逻辑 - 实际项目中这里应该是API调用
    const takenUsernames = ['admin', 'test', 'user'];
    return !takenUsernames.includes(username);
  }

  // 注册用户 - 实际项目中替换为真实的API调用
  async function registerUser(username, email, password) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟注册逻辑 - 实际项目中这里应该是API调用
    console.log(`模拟注册: ${username}, ${email}, 密码: ${password}`);

    // 模拟成功响应
    return {
      success: true,
      message: '注册成功'
    };

    // 模拟各种失败响应
    /*
    if (username === 'admin') {
      return {
        success: false,
        message: '用户名已被占用',
        field: 'username'
      };
    }
    
    if (email === 'test@example.com') {
      return {
        success: false,
        message: '邮箱已被注册',
        field: 'email'
      };
    }
    
    return {
      success: false,
      message: '注册失败，请稍后重试'
    };
    */
  }
});