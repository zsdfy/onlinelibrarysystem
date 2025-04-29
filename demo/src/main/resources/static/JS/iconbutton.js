// 切换功能
document.getElementById('toggle').addEventListener('click', function() {
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('expanded');
});

// 为每个导航项添加点击事件
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function() {
        // 这里可以添加导航项的点击处理逻辑
        console.log('导航项被点击:', this.querySelector('.link-text').textContent);
    });
});