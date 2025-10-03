class MoneyTracker {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.currentType = 'expense';
        this.isRegistering = false;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
        this.setDefaultDate();
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('money-tracker-current-user');
        if (savedUser) {
            this.currentUser = savedUser;
            this.showMainApp();
        } else {
            this.showAuthForm();
        }
    }

    showAuthForm() {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('main-container').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
        document.getElementById('current-user').textContent = this.currentUser;
        this.transactions = this.loadTransactions();
        this.updateDisplay();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('transaction-date');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    bindEvents() {
        // 认证表单提交
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        // 切换登录/注册
        document.getElementById('auth-switch-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });

        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // 交易表单提交
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTransaction();
            });
        }

        // 类型切换按钮
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchType(e.target.dataset.type);
            });
        });
    }

    toggleAuthMode() {
        this.isRegistering = !this.isRegistering;
        const title = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const confirmGroup = document.getElementById('confirm-password-group');
        const switchText = document.getElementById('auth-switch-text');
        const switchLink = document.getElementById('auth-switch-link');

        if (this.isRegistering) {
            title.textContent = '注册';
            submitBtn.textContent = '注册';
            confirmGroup.style.display = 'block';
            switchText.textContent = '已有账号？';
            switchLink.textContent = '立即登录';
        } else {
            title.textContent = '登录';
            submitBtn.textContent = '登录';
            confirmGroup.style.display = 'none';
            switchText.textContent = '还没有账号？';
            switchLink.textContent = '立即注册';
        }
    }

    handleAuth() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!email || !password) {
            alert('请填写完整信息');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('请输入有效的邮箱地址');
            return;
        }

        if (this.isRegistering) {
            if (password !== confirmPassword) {
                alert('两次输入的密码不一致');
                return;
            }
            this.register(email, password);
        } else {
            this.login(email, password);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    register(email, password) {
        const users = this.loadUsers();
        if (users[email]) {
            alert('该邮箱已被注册');
            return;
        }

        users[email] = {
            password: password,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('money-tracker-users', JSON.stringify(users));
        alert('注册成功！请登录');
        this.toggleAuthMode();
        this.clearAuthForm();
    }

    login(email, password) {
        const users = this.loadUsers();
        if (!users[email] || users[email].password !== password) {
            alert('邮箱或密码错误');
            return;
        }

        this.currentUser = email;
        localStorage.setItem('money-tracker-current-user', email);
        this.showMainApp();
        this.clearAuthForm();
    }

    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.currentUser = null;
            localStorage.removeItem('money-tracker-current-user');
            this.showAuthForm();
            this.clearAuthForm();
        }
    }

    clearAuthForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('confirm-password').value = '';
    }

    loadUsers() {
        const stored = localStorage.getItem('money-tracker-users');
        return stored ? JSON.parse(stored) : {};
    }

    switchType(type) {
        this.currentType = type;
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
    }

    addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const transactionDate = document.getElementById('transaction-date').value;

        if (!description || !amount || !category || !transactionDate) {
            alert('请填写完整信息');
            return;
        }

        if (amount <= 0) {
            alert('金额必须大于0');
            return;
        }

        const selectedDate = new Date(transactionDate);
        const transaction = {
            id: Date.now().toString(),
            description,
            amount: this.currentType === 'expense' ? -amount : amount,
            category,
            type: this.currentType,
            date: selectedDate.toISOString(),
            displayDate: selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            displayTime: selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'short'
            })
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDisplay();
        this.clearForm();
    }

    deleteTransaction(id) {
        if (confirm('确定要删除这条记录吗？')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateDisplay();
        }
    }

    clearForm() {
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
        this.setDefaultDate();
    }

    updateDisplay() {
        this.updateBalance();
        this.updateStatistics();
        this.updateTransactionList();
    }

    updateBalance() {
        const balance = this.transactions.reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('balance').textContent = this.formatCurrency(balance);
    }

    updateStatistics() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpense = Math.abs(monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0));

        document.getElementById('monthly-income').textContent = this.formatCurrency(monthlyIncome);
        document.getElementById('monthly-expense').textContent = this.formatCurrency(monthlyExpense);
    }

    updateTransactionList() {
        const listContainer = document.getElementById('transaction-list');
        
        if (this.transactions.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">暂无交易记录</div>';
            return;
        }

        const transactionHTML = this.transactions.map(transaction => {
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            const displayAmount = Math.abs(transaction.amount);

            return `
                <div class="transaction-item ${transaction.type}">
                    <div class="transaction-info">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-meta">${transaction.category} • ${transaction.displayTime || transaction.displayDate}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountPrefix}${this.formatCurrency(displayAmount)}
                    </div>
                    <button class="delete-btn" onclick="app.deleteTransaction('${transaction.id}')">
                        删除
                    </button>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = transactionHTML;
    }

    formatCurrency(amount) {
        return `¥${amount.toFixed(2)}`;
    }

    loadTransactions() {
        if (!this.currentUser) return [];
        const stored = localStorage.getItem(`money-tracker-transactions-${this.currentUser}`);
        return stored ? JSON.parse(stored) : [];
    }

    saveTransactions() {
        if (!this.currentUser) return;
        localStorage.setItem(`money-tracker-transactions-${this.currentUser}`, JSON.stringify(this.transactions));
    }

    // 导出数据功能
    exportData() {
        const dataStr = JSON.stringify(this.transactions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `记账数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // 导入数据功能
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
                        this.transactions = importedData;
                        this.saveTransactions();
                        this.updateDisplay();
                        alert('数据导入成功！');
                    }
                } else {
                    alert('数据格式不正确');
                }
            } catch (error) {
                alert('文件格式错误');
            }
        };
        reader.readAsText(file);
    }

    // 清空所有数据
    clearAllData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            this.transactions = [];
            this.saveTransactions();
            this.updateDisplay();
            alert('数据已清空');
        }
    }
}

// 初始化应用
const app = new MoneyTracker();

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter 快速添加记录
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('transaction-form').dispatchEvent(new Event('submit'));
    }
    
    // Ctrl/Cmd + E 导出数据
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        app.exportData();
    }
});

// 添加导入导出按钮到页面（可选功能）
window.addEventListener('load', () => {
    // 可以在这里添加更多的初始化逻辑
    console.log('简约记账工具已加载完成');
    console.log('快捷键提示：');
    console.log('- Ctrl/Cmd + Enter: 快速添加记录');
    console.log('- Ctrl/Cmd + E: 导出数据');
});