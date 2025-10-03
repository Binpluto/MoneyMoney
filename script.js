class MoneyTracker {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.currentType = 'expense';
        this.isRegistering = false;
        this.accounts = []; // 用户的所有账单
        this.currentAccount = null; // 当前选中的账单
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
        this.loadUserAccounts();
        this.showAccountSelection();
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

        // 备份数据
        document.getElementById('backup-btn').addEventListener('click', () => {
            this.backupData();
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

    // 加载用户的所有账单
    loadUserAccounts() {
        const accountsKey = `money-tracker-accounts-${this.currentUser}`;
        this.accounts = JSON.parse(localStorage.getItem(accountsKey) || '[]');
        
        // 如果没有账单，创建默认个人账单
        if (this.accounts.length === 0) {
            const defaultAccount = {
                id: this.generateId(),
                name: '个人账单',
                type: 'personal',
                owner: this.currentUser,
                members: [this.currentUser],
                createdAt: new Date().toISOString()
            };
            this.accounts.push(defaultAccount);
            this.saveUserAccounts();
        }
    }

    // 保存用户账单
    saveUserAccounts() {
        const accountsKey = `money-tracker-accounts-${this.currentUser}`;
        localStorage.setItem(accountsKey, JSON.stringify(this.accounts));
    }

    // 显示账单选择界面
    showAccountSelection() {
        document.getElementById('account-selection').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
        this.renderAccountList();
        
        // 添加创建账单按钮事件监听器
        document.getElementById('create-personal-btn').addEventListener('click', () => {
            this.createAccount('personal');
        });
        
        document.getElementById('create-family-btn').addEventListener('click', () => {
            this.createAccount('family');
        });
        
        document.getElementById('create-friend-btn').addEventListener('click', () => {
            this.createAccount('friend');
        });
        
        // 添加加入账单按钮事件监听器
        document.getElementById('join-account-btn').addEventListener('click', () => {
            this.showInviteSection();
        });
        
        // 添加邀请码相关事件监听器
        document.getElementById('join-btn').addEventListener('click', () => {
            this.joinAccountByInviteCode();
        });
        
        document.getElementById('cancel-join-btn').addEventListener('click', () => {
            this.hideInviteSection();
        });
        
        // 添加返回账单按钮事件监听器
        const backBtn = document.getElementById('back-to-accounts');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showAccountSelection();
            });
        }
    }

    // 显示主应用界面
    showMainAppContent() {
        // 显示主应用内容
        document.getElementById('account-selection').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        // 更新当前账单名称显示
        const accountNameEl = document.getElementById('current-account-name');
        if (accountNameEl && this.currentAccount) {
            accountNameEl.textContent = this.currentAccount.name;
        }
        
        // 显示成员信息（仅对家庭和好友账单）
        this.updateMembersDisplay();
        
        // 添加成员管理事件监听器
        const addMemberBtn = document.getElementById('add-member-btn');
        if (addMemberBtn) {
            addMemberBtn.addEventListener('click', () => {
                this.addMember();
            });
        }
        
        this.transactions = this.loadTransactions();
        this.updateDisplay();
    }

    // 渲染账单列表
    renderAccountList() {
        const accountListEl = document.getElementById('account-list');
        if (!accountListEl) return;
        
        if (this.accounts.length === 0) {
            accountListEl.innerHTML = '<p style="text-align: center; color: #718096; font-size: 1.1rem; margin: 40px 0;">暂无账单，请创建一个新账单开始记账</p>';
            return;
        }
        
        accountListEl.innerHTML = this.accounts.map(account => `
            <div class="account-item">
                <div class="account-info">
                    <h3>${account.name}</h3>
                    <p class="account-type">${this.getAccountTypeText(account.type)}</p>
                    <p class="account-members">成员: ${account.members.join(', ')}</p>
                    ${account.type === 'friend' ? `
                        <div class="invite-code-display">
                            <span class="invite-label">邀请码:</span>
                            <code class="invite-code">${account.inviteCode || account.id.substr(-6)}</code>
                            <button class="copy-invite-btn" onclick="moneyTracker.copyInviteCode('${account.inviteCode || account.id.substr(-6)}')">复制</button>
                        </div>
                    ` : ''}
                </div>
                <div class="account-actions">
                    <button class="select-account-btn" onclick="moneyTracker.selectAccount('${account.id}')">选择</button>
                </div>
            </div>
        `).join('');
    }

    // 获取账单类型文本
    getAccountTypeText(type) {
        const typeMap = {
            'personal': '个人账单',
            'family': '家庭账单',
            'friend': '好友账单'
        };
        return typeMap[type] || '未知类型';
    }

    // 选择账单
    selectAccount(accountId) {
        this.currentAccount = this.accounts.find(account => account.id === accountId);
        if (this.currentAccount) {
            document.getElementById('current-account-name').textContent = this.currentAccount.name;
            this.showMainAppContent();
        }
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    createAccount(type) {
        let accountName = '';
        let members = [this.currentUser];
        
        switch(type) {
            case 'personal':
                accountName = prompt('请输入个人账单名称:', '我的账单');
                break;
            case 'family':
                accountName = prompt('请输入家庭账单名称:', '家庭账单');
                // 家庭账单可以添加更多成员
                const familyMembers = prompt('请输入家庭成员（用逗号分隔）:', this.currentUser);
                if (familyMembers) {
                    members = familyMembers.split(',').map(m => m.trim()).filter(m => m);
                }
                break;
            case 'friend':
                accountName = prompt('请输入好友账单名称:', '好友账单');
                // 好友账单可以添加更多成员
                const friendMembers = prompt('请输入好友成员（用逗号分隔）:', this.currentUser);
                if (friendMembers) {
                    members = friendMembers.split(',').map(m => m.trim()).filter(m => m);
                }
                break;
        }
        
        if (!accountName) return;
        
        const newAccount = {
            id: this.generateId(),
            name: accountName,
            type: type,
            members: members,
            createdBy: this.currentUser,
            createdAt: new Date().toISOString(),
            inviteCode: type === 'friend' ? this.generateInviteCode() : null
        };
        
        this.accounts.push(newAccount);
        this.saveUserAccounts();
        this.renderAccountList();
        
        // 自动选择新创建的账单
        this.selectAccount(newAccount.id);
        
        // 如果是好友账单，显示邀请码
        if (type === 'friend') {
            alert(`好友账单创建成功！\n邀请码: ${newAccount.inviteCode}\n请将此邀请码分享给好友，他们可以使用此邀请码加入账单。`);
        }
    }
    
    generateInviteCode() {
        // 生成6位随机邀请码
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    copyInviteCode(inviteCode) {
        // 复制邀请码到剪贴板
        if (navigator.clipboard) {
            navigator.clipboard.writeText(inviteCode).then(() => {
                alert('邀请码已复制到剪贴板！');
            }).catch(() => {
                this.fallbackCopyTextToClipboard(inviteCode);
            });
        } else {
            this.fallbackCopyTextToClipboard(inviteCode);
        }
    }
    
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('邀请码已复制到剪贴板！');
        } catch (err) {
            alert('复制失败，请手动复制邀请码: ' + text);
        }
        document.body.removeChild(textArea);
    }
    
    showInviteSection() {
        document.getElementById('invite-section').style.display = 'block';
        document.getElementById('invite-code-input').focus();
    }
    
    hideInviteSection() {
        document.getElementById('invite-section').style.display = 'none';
        document.getElementById('invite-code-input').value = '';
    }
    
    joinAccountByInviteCode() {
        const inviteCode = document.getElementById('invite-code-input').value.trim().toUpperCase();
        
        if (!inviteCode) {
            alert('请输入邀请码');
            return;
        }
        
        // 查找匹配的账单
        const targetAccount = this.accounts.find(account => 
            account.inviteCode === inviteCode || account.id.substr(-6).toUpperCase() === inviteCode
        );
        
        if (!targetAccount) {
            alert('邀请码无效，请检查后重试');
            return;
        }
        
        if (targetAccount.type !== 'friend') {
            alert('此邀请码不是好友账单的邀请码');
            return;
        }
        
        // 检查用户是否已经是成员
        if (targetAccount.members.includes(this.currentUser)) {
            alert('您已经是该账单的成员了');
            this.hideInviteSection();
            return;
        }
        
        // 加入账单
        targetAccount.members.push(this.currentUser);
        this.saveUserAccounts();
        this.hideInviteSection();
        this.renderAccountList();
        
        alert(`成功加入账单 "${targetAccount.name}"！`);
        
        // 自动选择加入的账单
        this.selectAccount(targetAccount.id);
    }
    
    updateMembersDisplay() {
        const membersInfoEl = document.getElementById('account-members-info');
        const membersListEl = document.getElementById('members-list');
        
        if (!this.currentAccount || this.currentAccount.type === 'personal') {
            membersInfoEl.style.display = 'none';
            return;
        }
        
        membersInfoEl.style.display = 'block';
        
        membersListEl.innerHTML = this.currentAccount.members.map(member => {
            const isCreator = member === this.currentAccount.createdBy;
            const canRemove = !isCreator && this.currentAccount.members.length > 1;
            
            return `
                <div class="member-tag ${isCreator ? 'creator' : ''}">
                    ${member} ${isCreator ? '(创建者)' : ''}
                    ${canRemove ? `<button class="remove-member-btn" onclick="moneyTracker.removeMember('${member}')">×</button>` : ''}
                </div>
            `;
        }).join('');
    }
    
    addMember() {
        if (!this.currentAccount || this.currentAccount.type === 'personal') {
            alert('个人账单不支持添加成员');
            return;
        }
        
        const newMember = prompt('请输入新成员名称:');
        if (!newMember || !newMember.trim()) return;
        
        const memberName = newMember.trim();
        
        if (this.currentAccount.members.includes(memberName)) {
            alert('该成员已存在');
            return;
        }
        
        this.currentAccount.members.push(memberName);
        this.saveUserAccounts();
        this.updateMembersDisplay();
        
        alert(`成员 "${memberName}" 已添加到账单中`);
    }
    
    removeMember(memberName) {
        if (!this.currentAccount) return;
        
        if (memberName === this.currentAccount.createdBy) {
            alert('不能移除账单创建者');
            return;
        }
        
        if (this.currentAccount.members.length <= 1) {
            alert('账单至少需要一个成员');
            return;
        }
        
        if (confirm(`确定要移除成员 "${memberName}" 吗？`)) {
            this.currentAccount.members = this.currentAccount.members.filter(m => m !== memberName);
            this.saveUserAccounts();
            this.updateMembersDisplay();
        }
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
            }),
            recordedBy: this.currentUser,
            accountId: this.currentAccount ? this.currentAccount.id : null
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.autoBackup(); // 自动备份
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
                        ${transaction.recordedBy && this.currentAccount && this.currentAccount.type !== 'personal' ? 
                            `<div class="transaction-recorder">记录者: ${transaction.recordedBy}</div>` : ''}
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
        if (!this.currentAccount) return [];
        const key = `money-tracker-transactions-${this.currentAccount.id}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    }

    saveTransactions() {
        if (!this.currentAccount) return;
        const key = `money-tracker-transactions-${this.currentAccount.id}`;
        localStorage.setItem(key, JSON.stringify(this.transactions));
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

    // 备份数据功能
    backupData() {
        const backupData = {
            user: this.currentUser,
            transactions: this.transactions,
            backupTime: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-') + '_' + 
                         new Date().toLocaleTimeString('zh-CN').replace(/:/g, '-');
        link.download = `followYOUmoney_备份_${this.currentUser}_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('数据备份成功！');
        
        // 同时保存到本地存储作为自动备份
        this.autoBackup();
    }

    // 自动备份功能
    autoBackup() {
        const backupData = {
            user: this.currentUser,
            transactions: this.transactions,
            backupTime: new Date().toISOString()
        };
        
        localStorage.setItem(`money-tracker-backup-${this.currentUser}`, JSON.stringify(backupData));
    }

    // 恢复备份数据
    restoreBackup() {
        const backupKey = `money-tracker-backup-${this.currentUser}`;
        const backup = localStorage.getItem(backupKey);
        
        if (backup) {
            try {
                const backupData = JSON.parse(backup);
                if (backupData.transactions && Array.isArray(backupData.transactions)) {
                    return backupData.transactions;
                }
            } catch (error) {
                console.error('备份数据解析失败:', error);
            }
        }
        
        return [];
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