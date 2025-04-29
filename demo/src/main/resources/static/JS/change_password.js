document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const passwordForm = document.getElementById('passwordForm');
    const usernameInput = document.getElementById('username');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.querySelector('.submit-btn');
    const usernameFeedback = document.getElementById('usernameFeedback');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const confirmFeedback = document.getElementById('confirmFeedback');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    const passwordRequirements = document.querySelectorAll('.password-requirements li');
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    // 启用/禁用新密码字段
    function toggleNewPasswordFields(enabled) {
        newPasswordInput.disabled = !enabled;
        confirmPasswordInput.disabled = !enabled;
        if (!enabled) {
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            updatePasswordStrength('');
            resetPasswordRequirements();
        }
    }

    // 初始化时禁用新密码字段
    toggleNewPasswordFields(false);

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

    // 用户名验证
    usernameInput.addEventListener('blur', async function () {
        const username = this.value.trim();

        if (!username) {
            usernameFeedback.textContent = '请输入用户名';
            usernameFeedback.style.color = '#e74c3c';
            return;
        }

        // 模拟后端验证
        try {
            const isValid = await validateUsername(username);
            if (isValid) {
                usernameFeedback.textContent = '用户名验证通过';
                usernameFeedback.style.color = '#27ae60';
            } else {
                usernameFeedback.textContent = '用户名不存在';
                usernameFeedback.style.color = '#e74c3c';
            }
        } catch (error) {
            usernameFeedback.textContent = '验证出错，请重试';
            usernameFeedback.style.color = '#e74c3c';
            console.error('用户名验证错误:', error);
        }
    });

    // 当前密码验证
    currentPasswordInput.addEventListener('blur', async function () {
        const username = usernameInput.value.trim();
        const password = this.value;

        if (!password) {
            passwordFeedback.textContent = '请输入当前密码';
            passwordFeedback.style.color = '#e74c3c';
            toggleNewPasswordFields(false);
            return;
        }

        if (!username) {
            passwordFeedback.textContent = '请先验证用户名';
            passwordFeedback.style.color = '#e74c3c';
            toggleNewPasswordFields(false);
            return;
        }

        // 模拟后端验证
        try {
            const isValid = await validateCurrentPassword(username, password);
            if (isValid) {
                passwordFeedback.textContent = '密码验证通过';
                passwordFeedback.style.color = '#27ae60';
                toggleNewPasswordFields(true);
            } else {
                passwordFeedback.textContent = '密码不正确';
                passwordFeedback.style.color = '#e74c3c';
                toggleNewPasswordFields(false);
            }
        } catch (error) {
            passwordFeedback.textContent = '验证出错，请重试';
            passwordFeedback.style.color = '#e74c3c';
            toggleNewPasswordFields(false);
            console.error('密码验证错误:', error);
        }
    });

    // 新密码强度检查
    newPasswordInput.addEventListener('input', function () {
        const password = this.value;
        updatePasswordStrength(password);
        validatePasswordRequirements(password);
        validateForm();
    });

    // 确认密码验证
    confirmPasswordInput.addEventListener('input', function () {
        const newPassword = newPasswordInput.value;
        const confirmPassword = this.value;

        if (!newPassword) {
            confirmFeedback.textContent = '请先输入新密码';
            confirmFeedback.style.color = '#e74c3c';
            return;
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            confirmFeedback.textContent = '两次输入的密码不一致';
            confirmFeedback.style.color = '#e74c3c';
        } else if (confirmPassword && newPassword === confirmPassword) {
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

    // 重置密码要求显示
    function resetPasswordRequirements() {
        passwordRequirements.forEach(item => {
            item.classList.remove('valid');
        });
    }

    // 验证整个表单
    function validateForm() {
        const usernameValid = usernameFeedback.textContent === '用户名验证通过';
        const passwordValid = passwordFeedback.textContent === '密码验证通过';
        const newPasswordValid = newPasswordInput.value.length >= 8;
        const confirmValid = confirmFeedback.textContent === '密码匹配';

        submitBtn.disabled = !(usernameValid && passwordValid && newPasswordValid && confirmValid);
    }

    // 表单提交处理
    passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (submitBtn.disabled) return;

        const username = usernameInput.value.trim();
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;

        submitBtn.disabled = true;
        submitBtn.textContent = '处理中...';

        try {
            const result = await changePassword(username, currentPassword, newPassword);

            if (result.success) {
                alert('密码修改成功！');
                // 重置表单
                passwordForm.reset();
                usernameFeedback.textContent = '';
                passwordFeedback.textContent = '';
                confirmFeedback.textContent = '';
                updatePasswordStrength('');
                resetPasswordRequirements();
                toggleNewPasswordFields(false);
            } else {
                alert(`密码修改失败: ${result.message}`);
            }
        } catch (error) {
            alert('密码修改过程中出错，请重试');
            console.error('密码修改错误:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '更新密码';
        }
    });

    // 模拟API函数 - 实际项目中替换为真实的API调用
    async function validateUsername(username) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 模拟验证逻辑 - 实际项目中这里应该是API调用
        const validUsernames = ['user1', 'testuser', 'admin'];
        return validUsernames.includes(username);
    }

    async function validateCurrentPassword(username, password) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 模拟验证逻辑 - 实际项目中这里应该是API调用
        // 注意: 实际项目中密码应该在服务端验证，不要在前端存储或比较密码
        const userCredentials = {
            'user1': 'password1',
            'testuser': 'test123',
            'admin': 'Admin@123'
        };

        return userCredentials[username] === password;
    }

    async function changePassword(username, currentPassword, newPassword) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 模拟密码修改逻辑 - 实际项目中这里应该是API调用
        console.log(`模拟密码修改: ${username}, 新密码: ${newPassword}`);

        // 模拟成功响应
        return {
            success: true,
            message: '密码已更新'
        };

        // 模拟失败响应
        // return {
        //   success: false,
        //   message: '当前密码不正确'
        // };
    }
});