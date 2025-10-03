class MoneyTracker {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.currentType = 'expense';
        this.isRegistering = false;
        this.accounts = []; // 用户的所有账单
        this.currentAccount = null; // 当前选中的账单
        this.goals = []; // 理财目标
        this.currentEditingGoal = null; // 当前编辑的目标
        this.ducks = 0; // 小黄鸭数量
        this.totalTransactions = 0; // 总交易次数
        
        // 自定义分类管理
        this.categories = {
            expense: ['餐饮', '交通', '购物', '娱乐', '其他'],
            income: ['工资', '奖金', '投资收益', '其他']
        }; // 默认分类
        this.customCategories = {
            expense: [],
            income: []
        }; // 用户自定义分类
        
        // 多货币支持
        this.exchangeRates = {}; // 汇率缓存
        this.lastRateUpdate = null; // 上次汇率更新时间
        this.defaultCurrency = 'CNY'; // 默认货币
        this.supportedCurrencies = {
            'CNY': { name: '人民币', symbol: '¥' },
            'USD': { name: '美元', symbol: '$' },
            'EUR': { name: '欧元', symbol: '€' }
        };
        this.exchangeApiKey = null; // 汇率API密钥
        
        this.initEmailJS();
        this.init();
    }

    init() {
        this.loadCurrencySettings();
        this.loadCustomCategories();
        this.checkAuthStatus();
        this.bindEvents();
        this.setDefaultDate();
        this.initCurrencySelect();
        this.loadExchangeRates(); // 加载汇率缓存
        this.updateCategorySelector(); // 初始化分类选择器
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
        this.handleInviteLinkFromURL();
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

        // 忘记密码
        document.getElementById('forgot-password-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPasswordModal();
        });

        // 关闭忘记密码弹窗
        document.getElementById('close-forgot-modal').addEventListener('click', () => {
            this.hideForgotPasswordModal();
        });

        // 发送重置链接
        document.getElementById('send-reset-btn').addEventListener('click', () => {
            this.sendResetEmail();
        });

        // 重置密码
        document.getElementById('reset-password-btn').addEventListener('click', () => {
            this.resetPassword();
        });

        // 返回邮箱输入步骤
        document.getElementById('back-to-email-btn').addEventListener('click', () => {
            this.showEmailStep();
        });

        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // 备份按钮
        document.getElementById('backup-btn').addEventListener('click', () => {
            this.backupData();
        });
        
        // 分析报告按钮
        document.getElementById('analysis-btn').addEventListener('click', () => {
            this.showAnalysisView();
        });
        
        // 理财目标按钮
        document.getElementById('goals-btn').addEventListener('click', () => {
            this.showGoalsView();
        });

        // 货币设置按钮
        document.getElementById('currency-settings-btn').addEventListener('click', () => {
            this.showCurrencySettings();
        });

        // 货币设置保存按钮
        document.getElementById('save-currency-btn').addEventListener('click', () => {
            this.saveCurrencySettings();
        });

        // 货币设置取消按钮
        document.getElementById('cancel-currency-btn').addEventListener('click', () => {
            this.hideCurrencySettings();
        });

        // 分类管理按钮事件
        document.getElementById('category-manage-btn').addEventListener('click', () => {
            this.showCategoryManage();
        });
        
        document.getElementById('cancel-category-btn').addEventListener('click', () => {
            this.hideCategoryManage();
        });
        
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.handleAddCategory();
        });
        
        // 分类类型切换事件
        document.querySelectorAll('.category-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchCategoryType(e.target.dataset.categoryType);
            });
        });
        
        // 新分类输入框回车事件
        document.getElementById('new-category-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddCategory();
            }
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
        const forgotPasswordLink = document.getElementById('forgot-password-link');

        if (this.isRegistering) {
            title.textContent = '注册';
            submitBtn.textContent = '注册';
            confirmGroup.style.display = 'block';
            switchText.textContent = '已有账号？';
            switchLink.textContent = '立即登录';
            forgotPasswordLink.style.display = 'none';
        } else {
            title.textContent = '登录';
            submitBtn.textContent = '登录';
            confirmGroup.style.display = 'none';
            switchText.textContent = '还没有账号？';
            switchLink.textContent = '立即注册';
            forgotPasswordLink.style.display = 'block';
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
            alert('该邮箱已注册，请换其他邮箱注册或者直接登录');
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
        
        // 添加邮件邀请事件监听器
        const inviteByEmailBtn = document.getElementById('invite-by-email-btn');
        if (inviteByEmailBtn) {
            inviteByEmailBtn.addEventListener('click', () => {
                this.showEmailInviteForm();
            });
        }
        
        const sendInviteBtn = document.getElementById('send-invite-btn');
        if (sendInviteBtn) {
            sendInviteBtn.addEventListener('click', () => {
                this.handleSendEmailInvite();
            });
        }
        
        const cancelInviteBtn = document.getElementById('cancel-invite-btn');
        if (cancelInviteBtn) {
            cancelInviteBtn.addEventListener('click', () => {
                this.hideEmailInviteForm();
            });
        }
        
        this.transactions = this.loadTransactions();
        this.loadDuckData();
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
                            <button class="copy-invite-btn" onclick="app.copyInviteCode('${account.inviteCode || account.id.substr(-6)}')">复制</button>
                        </div>
                    ` : ''}
                </div>
                <div class="account-actions">
                    <button class="select-account-btn" onclick="app.selectAccount('${account.id}')">选择</button>
                    <button class="delete-account-btn" onclick="app.deleteAccount('${account.id}')">删除</button>
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
    
    // 删除账单
    deleteAccount(accountId) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) {
            alert('账单不存在');
            return;
        }
        
        // 确认删除
        const confirmMessage = `确定要删除账单 "${account.name}" 吗？\n\n注意：删除后该账单的所有交易记录都将被永久删除，此操作无法撤销！`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 如果删除的是当前选中的账单，清除当前账单
        if (this.currentAccount && this.currentAccount.id === accountId) {
            this.currentAccount = null;
        }
        
        // 从账单列表中移除
        this.accounts = this.accounts.filter(acc => acc.id !== accountId);
        
        // 删除该账单的所有交易记录
        const transactionsKey = `money-tracker-transactions-${this.currentUser}-${accountId}`;
        localStorage.removeItem(transactionsKey);
        
        // 删除该账单的理财目标
        const goalsKey = `money-tracker-goals-${this.currentUser}`;
        const savedGoals = localStorage.getItem(goalsKey);
        if (savedGoals) {
            const goals = JSON.parse(savedGoals);
            const filteredGoals = goals.filter(goal => goal.accountId !== accountId);
            localStorage.setItem(goalsKey, JSON.stringify(filteredGoals));
        }
        
        // 保存更新后的账单列表
        this.saveUserAccounts();
        
        // 重新渲染账单列表
        this.renderAccountList();
        
        alert(`账单 "${account.name}" 已删除`);
        
        // 如果没有账单了，确保用户能看到创建提示
        if (this.accounts.length === 0) {
            this.renderAccountList();
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
        
        // 更新分类选择器以显示对应类型的分类
        this.updateCategorySelector();
    }

    async addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const transactionDate = document.getElementById('transaction-date').value;
        const currency = document.getElementById('currency').value;

        if (!description || !amount || !category || !transactionDate || !currency) {
            alert('请填写完整信息');
            return;
        }

        if (amount <= 0) {
            alert('金额必须大于0');
            return;
        }

        // 转换为基准货币（CNY）
        const baseAmount = await this.convertToBaseCurrency(amount, currency);
        const finalAmount = this.currentType === 'expense' ? -baseAmount : baseAmount;

        const selectedDate = new Date(transactionDate);
        const transaction = {
            id: Date.now().toString(),
            description,
            amount: finalAmount, // 基准货币金额
            originalAmount: amount, // 原始输入金额
            originalCurrency: currency, // 原始货币
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
        
        // 奖励小黄鸭
        this.rewardDuck();
        
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
        document.getElementById('currency').value = this.defaultCurrency;
        this.setDefaultDate();
    }

    updateDisplay() {
        this.updateBalance();
        this.updateStatistics();
        this.updateTransactionList();
    }

    updateBalance() {
        const balance = this.transactions.reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('balance').textContent = this.formatCurrencyWithSymbol(balance, this.defaultCurrency);
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
            
            // 显示原始货币和金额（如果存在），否则显示转换后的CNY金额
            let displayAmount, currencySymbol;
            if (transaction.originalAmount && transaction.originalCurrency) {
                displayAmount = Math.abs(transaction.originalAmount);
                currencySymbol = this.supportedCurrencies[transaction.originalCurrency]?.symbol || transaction.originalCurrency;
            } else {
                displayAmount = Math.abs(transaction.amount);
                currencySymbol = this.supportedCurrencies[this.defaultCurrency].symbol;
            }

            return `
                <div class="transaction-item ${transaction.type}">
                    <div class="transaction-info">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-meta">${transaction.category} • ${transaction.displayTime || transaction.displayDate}</div>
                        ${transaction.recordedBy && this.currentAccount && this.currentAccount.type !== 'personal' ? 
                            `<div class="transaction-recorder">记录者: ${transaction.recordedBy}</div>` : ''}
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountPrefix}${currencySymbol}${displayAmount.toFixed(2)}
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
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.transactions && Array.isArray(data.transactions)) {
                            this.transactions = data.transactions;
                            this.saveTransactions();
                            this.updateDisplay();
                            alert('数据恢复成功！');
                        } else {
                            alert('无效的备份文件格式');
                        }
                    } catch (error) {
                        alert('文件读取失败，请检查文件格式');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // ===== 分析报告功能 =====
    showAnalysisView() {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('analysis-view').style.display = 'block';
        this.initAnalysisView();
    }
    
    initAnalysisView() {
        // 绑定关闭按钮
        document.getElementById('close-analysis-btn').addEventListener('click', () => {
            this.closeAnalysisView();
        });
        
        // 绑定标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAnalysisTab(e.target.dataset.tab);
            });
        });
        
        // 初始化日期选择器
        this.initDateSelectors();
        
        // 绑定日期选择器事件
        document.getElementById('month-selector').addEventListener('change', () => {
            this.updateMonthlyAnalysis();
        });
        document.getElementById('year-selector').addEventListener('change', () => {
            this.updateMonthlyAnalysis();
        });
        document.getElementById('year-analysis-selector').addEventListener('change', () => {
            this.updateYearlyAnalysis();
        });
        
        // 显示默认分析
        this.updateMonthlyAnalysis();
        this.updateYearlyAnalysis();
    }
    
    closeAnalysisView() {
        document.getElementById('analysis-view').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    }
    
    switchAnalysisTab(tab) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // 切换内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-analysis`).classList.add('active');
    }
    
    initDateSelectors() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        // 月份选择器
        const monthSelector = document.getElementById('month-selector');
        monthSelector.innerHTML = '';
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            if (index === currentMonth) option.selected = true;
            monthSelector.appendChild(option);
        });
        
        // 年份选择器（月度分析）
        const yearSelector = document.getElementById('year-selector');
        yearSelector.innerHTML = '';
        for (let year = currentYear - 5; year <= currentYear + 1; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            if (year === currentYear) option.selected = true;
            yearSelector.appendChild(option);
        }
        
        // 年份选择器（年度分析）
        const yearAnalysisSelector = document.getElementById('year-analysis-selector');
        yearAnalysisSelector.innerHTML = '';
        for (let year = currentYear - 5; year <= currentYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            if (year === currentYear) option.selected = true;
            yearAnalysisSelector.appendChild(option);
        }
    }
    
    updateMonthlyAnalysis() {
        const selectedMonth = parseInt(document.getElementById('month-selector').value);
        const selectedYear = parseInt(document.getElementById('year-selector').value);
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === selectedMonth && 
                   transactionDate.getFullYear() === selectedYear &&
                   (!this.currentAccount || t.accountId === this.currentAccount.id);
        });
        
        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = Math.abs(monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0));
            
        const netIncome = income - expense;
        
        document.getElementById('monthly-total-income').textContent = this.formatCurrency(income);
        document.getElementById('monthly-total-expense').textContent = this.formatCurrency(expense);
        document.getElementById('monthly-net-income').textContent = this.formatCurrency(netIncome);
        
        // 更新分类统计
        this.updateCategoryChart(monthlyTransactions);
    }
    
    updateYearlyAnalysis() {
        const selectedYear = parseInt(document.getElementById('year-analysis-selector').value);
        
        const yearlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === selectedYear &&
                   (!this.currentAccount || t.accountId === this.currentAccount.id);
        });
        
        const income = yearlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = Math.abs(yearlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0));
            
        const netIncome = income - expense;
        
        document.getElementById('yearly-total-income').textContent = this.formatCurrency(income);
        document.getElementById('yearly-total-expense').textContent = this.formatCurrency(expense);
        document.getElementById('yearly-net-income').textContent = this.formatCurrency(netIncome);
        
        // 更新月度趋势
        this.updateYearlyTrendChart(selectedYear);
    }
    
    updateCategoryChart(transactions) {
        const categoryStats = {};
        
        transactions.filter(t => t.type === 'expense').forEach(t => {
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = 0;
            }
            categoryStats[t.category] += Math.abs(t.amount);
        });
        
        const chartContainer = document.getElementById('monthly-category-chart');
        chartContainer.innerHTML = '';
        
        if (Object.keys(categoryStats).length === 0) {
            chartContainer.innerHTML = '<div class="empty-state">暂无支出数据</div>';
            return;
        }
        
        const maxAmount = Math.max(...Object.values(categoryStats));
        
        Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, amount]) => {
                const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                const chartItem = document.createElement('div');
                chartItem.className = 'chart-item';
                chartItem.innerHTML = `
                    <span>${category}</span>
                    <div class="chart-bar" style="width: ${percentage}%"></div>
                    <span>${this.formatCurrency(amount)}</span>
                `;
                chartContainer.appendChild(chartItem);
            });
    }
    
    updateYearlyTrendChart(year) {
        const monthlyData = [];
        
        for (let month = 0; month < 12; month++) {
            const monthTransactions = this.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === month && 
                       transactionDate.getFullYear() === year &&
                       (!this.currentAccount || t.accountId === this.currentAccount.id);
            });
            
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expense = Math.abs(monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0));
                
            monthlyData.push({ month: month + 1, income, expense, net: income - expense });
        }
        
        const chartContainer = document.getElementById('yearly-trend-chart');
        chartContainer.innerHTML = '';
        
        const maxAmount = Math.max(
            ...monthlyData.map(d => Math.max(d.income, d.expense))
        );
        
        monthlyData.forEach(data => {
            const incomePercentage = maxAmount > 0 ? (data.income / maxAmount) * 100 : 0;
            const expensePercentage = maxAmount > 0 ? (data.expense / maxAmount) * 100 : 0;
            
            const chartItem = document.createElement('div');
            chartItem.className = 'chart-item';
            chartItem.innerHTML = `
                <span>${data.month}月</span>
                <div style="display: flex; align-items: center; flex: 1; margin: 0 10px;">
                    <div class="chart-bar" style="width: ${incomePercentage}%; background-color: #28a745; margin-right: 5px;"></div>
                    <div class="chart-bar" style="width: ${expensePercentage}%; background-color: #dc3545;"></div>
                </div>
                <span>净收入: ${this.formatCurrency(data.net)}</span>
            `;
            chartContainer.appendChild(chartItem);
        });
    }
    
    // ===== 理财目标功能 =====
    showGoalsView() {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('goals-view').style.display = 'block';
        this.initGoalsView();
        this.loadGoals();
        this.renderGoals();
    }
    
    initGoalsView() {
        // 绑定关闭按钮
        document.getElementById('close-goals-btn').addEventListener('click', () => {
            this.closeGoalsView();
        });
        
        // 绑定添加目标按钮
        document.getElementById('add-goal-btn').addEventListener('click', () => {
            this.showGoalForm();
        });
        
        // 绑定目标表单
        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });
        
        // 绑定取消按钮
        document.getElementById('cancel-goal-btn').addEventListener('click', () => {
            this.hideGoalForm();
        });
    }
    
    closeGoalsView() {
        document.getElementById('goals-view').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    }
    
    loadGoals() {
        const savedGoals = localStorage.getItem(`money-tracker-goals-${this.currentUser}`);
        if (savedGoals) {
            this.goals = JSON.parse(savedGoals);
        }
    }
    
    saveGoalsToStorage() {
        localStorage.setItem(`money-tracker-goals-${this.currentUser}`, JSON.stringify(this.goals));
    }
    
    showGoalForm(goal = null) {
        this.currentEditingGoal = goal;
        const modal = document.getElementById('goal-form-modal');
        const title = document.getElementById('goal-form-title');
        
        if (goal) {
            title.textContent = '编辑理财目标';
            document.getElementById('goal-name').value = goal.name;
            document.getElementById('goal-amount').value = goal.amount;
            document.getElementById('goal-deadline').value = goal.deadline;
            document.getElementById('goal-description').value = goal.description || '';
        } else {
            title.textContent = '添加理财目标';
            document.getElementById('goal-form').reset();
        }
        
        modal.style.display = 'flex';
    }
    
    hideGoalForm() {
        document.getElementById('goal-form-modal').style.display = 'none';
        this.currentEditingGoal = null;
    }
    
    saveGoal() {
        const name = document.getElementById('goal-name').value.trim();
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const deadline = document.getElementById('goal-deadline').value;
        const description = document.getElementById('goal-description').value.trim();
        
        if (!name || !amount || !deadline) {
            alert('请填写完整信息');
            return;
        }
        
        if (amount <= 0) {
            alert('目标金额必须大于0');
            return;
        }
        
        const goalData = {
            id: this.currentEditingGoal ? this.currentEditingGoal.id : Date.now().toString(),
            name,
            amount,
            deadline,
            description,
            createdAt: this.currentEditingGoal ? this.currentEditingGoal.createdAt : new Date().toISOString(),
            accountId: this.currentAccount ? this.currentAccount.id : null
        };
        
        if (this.currentEditingGoal) {
            const index = this.goals.findIndex(g => g.id === this.currentEditingGoal.id);
            if (index !== -1) {
                this.goals[index] = goalData;
            }
        } else {
            this.goals.push(goalData);
        }
        
        this.saveGoalsToStorage();
        this.renderGoals();
        this.hideGoalForm();
    }
    
    deleteGoal(goalId) {
        if (confirm('确定要删除这个目标吗？')) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoalsToStorage();
            this.renderGoals();
        }
    }
    
    renderGoals() {
        const goalsList = document.getElementById('goals-list');
        
        // 过滤当前账单的目标
        const accountGoals = this.goals.filter(g => 
            !this.currentAccount || g.accountId === this.currentAccount.id
        );
        
        if (accountGoals.length === 0) {
            goalsList.innerHTML = '<div class="empty-state">暂无理财目标</div>';
            return;
        }
        
        goalsList.innerHTML = accountGoals.map(goal => {
            const progress = this.calculateGoalProgress(goal);
            const progressPercentage = Math.min((progress / goal.amount) * 100, 100);
            const remainingDays = this.calculateRemainingDays(goal.deadline);
            
            return `
                <div class="goal-item">
                    <div class="goal-header">
                        <span class="goal-name">${goal.name}</span>
                        <span class="goal-amount">${this.formatCurrency(goal.amount)}</span>
                    </div>
                    
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="progress-text">
                            已完成: ${this.formatCurrency(progress)} (${progressPercentage.toFixed(1)}%)
                        </div>
                    </div>
                    
                    <div class="goal-deadline">
                        目标日期: ${new Date(goal.deadline).toLocaleDateString('zh-CN')} 
                        ${remainingDays >= 0 ? `(还有${remainingDays}天)` : `(已过期${Math.abs(remainingDays)}天)`}
                    </div>
                    
                    ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                    
                    <div class="goal-actions">
                        <button class="edit-goal-btn" onclick="moneyTracker.showGoalForm(${JSON.stringify(goal).replace(/"/g, '&quot;')})">编辑</button>
                        <button class="delete-goal-btn" onclick="moneyTracker.deleteGoal('${goal.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    calculateGoalProgress(goal) {
        // 计算从目标创建到现在的收入总和
        const goalStartDate = new Date(goal.createdAt);
        const now = new Date();
        
        const relevantTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= goalStartDate && 
                   transactionDate <= now &&
                   t.type === 'income' &&
                   (!this.currentAccount || t.accountId === this.currentAccount.id);
        });
        
        return relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    }
    
    calculateRemainingDays(deadline) {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const timeDiff = deadlineDate.getTime() - today.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    // 小黄鸭奖励系统
    rewardDuck() {
        this.ducks += 1;
        this.totalTransactions += 1;
        this.saveDuckData();
        this.updateDuckDisplay();
        this.playDuckAnimation();
    }

    loadDuckData() {
        const accountKey = this.currentAccount ? this.currentAccount.id : 'default';
        const duckData = JSON.parse(localStorage.getItem(`ducks_${this.currentUser}_${accountKey}`)) || { ducks: 0, totalTransactions: 0 };
        this.ducks = duckData.ducks;
        this.totalTransactions = duckData.totalTransactions;
        this.updateDuckDisplay();
    }

    saveDuckData() {
        const accountKey = this.currentAccount ? this.currentAccount.id : 'default';
        const duckData = {
            ducks: this.ducks,
            totalTransactions: this.totalTransactions
        };
        localStorage.setItem(`ducks_${this.currentUser}_${accountKey}`, JSON.stringify(duckData));
    }

    updateDuckDisplay() {
        const duckCountEl = document.getElementById('duck-count');
        if (duckCountEl) {
            duckCountEl.textContent = this.ducks;
        }
    }

    playDuckAnimation() {
        const duckCollection = document.querySelector('.duck-collection');
        if (duckCollection) {
            duckCollection.classList.add('duck-reward-animation');
            
            // 显示奖励提示
            this.showDuckRewardMessage();
            
            setTimeout(() => {
                duckCollection.classList.remove('duck-reward-animation');
            }, 600);
        }
    }

    showDuckRewardMessage() {
        // 创建奖励消息元素
        const message = document.createElement('div');
        message.className = 'duck-reward-message';
        message.textContent = '+1 🦆';
        message.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #b8860b;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 1.2rem;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
            z-index: 10000;
            animation: duck-message-show 2s ease-out forwards;
        `;
        
        document.body.appendChild(message);
        
        // 2秒后移除消息
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }

    // EmailJS 邮件发送功能
    initEmailJS() {
        // 初始化 EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init({
                publicKey: 'YOUR_PUBLIC_KEY', // 需要替换为实际的公钥
            });
        }
    }

    async sendInviteEmail(recipientEmail, accountName, inviteCode, inviterName, customMessage = '') {
        if (typeof emailjs === 'undefined') {
            alert('邮件服务未加载，请检查网络连接');
            return false;
        }

        const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`;
        
        let message = `您好！${inviterName} 邀请您加入 "${accountName}" 账单。\n\n`;
        if (customMessage) {
            message += `邀请留言：${customMessage}\n\n`;
        }
        message += `您可以点击以下链接直接加入：\n${inviteLink}\n\n或者在应用中输入邀请码：${inviteCode}\n\n快来一起记账吧！`;
        
        const templateParams = {
            to_email: recipientEmail,
            to_name: recipientEmail.split('@')[0],
            from_name: inviterName,
            account_name: accountName,
            invite_code: inviteCode,
            invite_link: inviteLink,
            message: message
        };

        try {
            const response = await emailjs.send(
                'YOUR_SERVICE_ID', // 需要替换为实际的服务ID
                'YOUR_TEMPLATE_ID', // 需要替换为实际的模板ID
                templateParams
            );
            
            console.log('邮件发送成功:', response);
            return true;
        } catch (error) {
            console.error('邮件发送失败:', error);
            alert('邮件发送失败，请检查邮箱地址或稍后重试');
            return false;
        }
    }

    generateInviteLink(inviteCode) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?invite=${inviteCode}`;
    }

    handleInviteLinkFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite');
        
        if (inviteCode && this.currentUser) {
            // 自动填入邀请码并尝试加入
            const inviteInput = document.getElementById('invite-code-input');
            if (inviteInput) {
                inviteInput.value = inviteCode;
                this.showInviteSection();
                
                // 询问用户是否要自动加入
                if (confirm(`检测到邀请链接，邀请码为：${inviteCode}\n是否立即加入该账单？`)) {
                    this.joinAccountByInviteCode();
                }
            }
        }
    }
    
    // 显示邮件邀请表单
    showEmailInviteForm() {
        const form = document.getElementById('email-invite-form');
        if (form) {
            form.style.display = 'block';
            // 清空表单
            document.getElementById('invite-email').value = '';
            document.getElementById('invite-message').value = '';
        }
    }
    
    // 隐藏邮件邀请表单
    hideEmailInviteForm() {
        const form = document.getElementById('email-invite-form');
        if (form) {
            form.style.display = 'none';
        }
    }
    
    // 处理发送邮件邀请
    async handleSendEmailInvite() {
        const emailInput = document.getElementById('invite-email');
        const messageInput = document.getElementById('invite-message');
        
        if (!emailInput || !messageInput) {
            alert('表单元素未找到');
            return;
        }
        
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        if (!email) {
            alert('请输入邮箱地址');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            alert('请输入有效的邮箱地址');
            return;
        }
        
        try {
            // 生成邀请码
            const inviteCode = this.generateInviteCode();
            
            // 发送邮件
            await this.sendInviteEmail(
                email, 
                this.currentAccount.name, 
                inviteCode, 
                this.currentUser.email,
                message
            );
            
            alert('邀请邮件发送成功！');
            this.hideEmailInviteForm();
            
        } catch (error) {
            console.error('发送邮件失败:', error);
            alert('发送邮件失败，请检查网络连接或稍后重试');
        }
    }

    // 忘记密码功能
    showForgotPasswordModal() {
        document.getElementById('forgot-password-modal').style.display = 'flex';
        this.showEmailStep();
    }

    hideForgotPasswordModal() {
        document.getElementById('forgot-password-modal').style.display = 'none';
        this.clearForgotPasswordForm();
    }

    showEmailStep() {
        document.getElementById('step-email').style.display = 'block';
        document.getElementById('step-reset').style.display = 'none';
    }

    showResetStep() {
        document.getElementById('step-email').style.display = 'none';
        document.getElementById('step-reset').style.display = 'block';
    }

    async sendResetEmail() {
        const email = document.getElementById('reset-email').value.trim();
        
        if (!email) {
            alert('请输入邮箱地址');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('请输入有效的邮箱地址');
            return;
        }

        const users = this.loadUsers();
        if (!users[email]) {
            alert('该邮箱未注册，请检查邮箱地址或先注册账号');
            return;
        }

        // 生成6位数字验证码
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 保存验证码到localStorage（实际应用中应该保存到服务器）
        const resetCodes = JSON.parse(localStorage.getItem('money-tracker-reset-codes') || '{}');
        resetCodes[email] = {
            code: resetCode,
            timestamp: Date.now(),
            expires: Date.now() + 10 * 60 * 1000 // 10分钟过期
        };
        localStorage.setItem('money-tracker-reset-codes', JSON.stringify(resetCodes));

        try {
            // 发送重置邮件
            await this.sendResetCodeEmail(email, resetCode);
            alert('验证码已发送到您的邮箱，请查收（有效期10分钟）');
            this.showResetStep();
        } catch (error) {
            console.error('发送邮件失败:', error);
            alert('发送邮件失败，请稍后重试');
        }
    }

    async sendResetCodeEmail(email, resetCode) {
        // 使用EmailJS发送重置验证码邮件
        const templateParams = {
            to_email: email,
            reset_code: resetCode,
            app_name: '记账小助手',
            expires_in: '10分钟'
        };

        // 注意：需要在EmailJS中创建对应的邮件模板
        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_RESET_TEMPLATE_ID', templateParams, 'YOUR_PUBLIC_KEY');
    }

    resetPassword() {
        const email = document.getElementById('reset-email').value.trim();
        const code = document.getElementById('reset-code').value.trim();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        if (!code) {
            alert('请输入验证码');
            return;
        }

        if (!newPassword) {
            alert('请输入新密码');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            alert('密码长度至少6位');
            return;
        }

        // 验证重置码
        const resetCodes = JSON.parse(localStorage.getItem('money-tracker-reset-codes') || '{}');
        const resetData = resetCodes[email];

        if (!resetData) {
            alert('验证码无效，请重新获取');
            return;
        }

        if (Date.now() > resetData.expires) {
            alert('验证码已过期，请重新获取');
            delete resetCodes[email];
            localStorage.setItem('money-tracker-reset-codes', JSON.stringify(resetCodes));
            return;
        }

        if (resetData.code !== code) {
            alert('验证码错误');
            return;
        }

        // 更新密码
        const users = this.loadUsers();
        users[email].password = newPassword;
        localStorage.setItem('money-tracker-users', JSON.stringify(users));

        // 清除验证码
        delete resetCodes[email];
        localStorage.setItem('money-tracker-reset-codes', JSON.stringify(resetCodes));

        alert('密码重置成功！请使用新密码登录');
        this.hideForgotPasswordModal();
    }

    clearForgotPasswordForm() {
        document.getElementById('reset-email').value = '';
        document.getElementById('reset-code').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
    }

    // 多货币支持方法
    async getExchangeRates() {
        // 检查缓存是否有效（1小时内）
        const now = Date.now();
        if (this.lastRateUpdate && (now - this.lastRateUpdate) < 3600000) {
            return this.exchangeRates;
        }

        try {
            // 使用免费的ExchangeRate-API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/CNY');
            const data = await response.json();
            
            if (data.rates) {
                this.exchangeRates = {
                    'CNY': 1, // 基准货币
                    'USD': data.rates.USD || 0.14,
                    'EUR': data.rates.EUR || 0.13
                };
                this.lastRateUpdate = now;
                this.saveExchangeRates();
                return this.exchangeRates;
            }
        } catch (error) {
            console.warn('获取汇率失败，使用缓存或默认汇率:', error);
        }

        // 如果API失败，使用缓存或默认汇率
        if (Object.keys(this.exchangeRates).length === 0) {
            this.exchangeRates = {
                'CNY': 1,
                'USD': 0.14, // 默认汇率
                'EUR': 0.13
            };
        }
        
        return this.exchangeRates;
    }

    saveExchangeRates() {
        localStorage.setItem('exchange-rates', JSON.stringify({
            rates: this.exchangeRates,
            lastUpdate: this.lastRateUpdate
        }));
    }

    loadExchangeRates() {
        const saved = localStorage.getItem('exchange-rates');
        if (saved) {
            const data = JSON.parse(saved);
            this.exchangeRates = data.rates || {};
            this.lastRateUpdate = data.lastUpdate;
        }
    }

    // 货币转换：将任意货币金额转换为默认货币（CNY）
    async convertToBaseCurrency(amount, fromCurrency) {
        if (fromCurrency === this.defaultCurrency) {
            return amount;
        }

        const rates = await this.getExchangeRates();
        const rate = rates[fromCurrency];
        
        if (!rate) {
            console.warn(`未找到货币 ${fromCurrency} 的汇率`);
            return amount;
        }

        // 从其他货币转换为CNY
        return amount / rate;
    }

    // 从基准货币转换为指定货币
    async convertFromBaseCurrency(amount, toCurrency) {
        if (toCurrency === this.defaultCurrency) {
            return amount;
        }

        const rates = await this.getExchangeRates();
        const rate = rates[toCurrency];
        
        if (!rate) {
            console.warn(`未找到货币 ${toCurrency} 的汇率`);
            return amount;
        }

        return amount * rate;
    }

    // 格式化货币显示
    formatCurrencyWithSymbol(amount, currency = this.defaultCurrency) {
        const currencyInfo = this.supportedCurrencies[currency];
        const symbol = currencyInfo ? currencyInfo.symbol : currency;
        return `${symbol}${Math.abs(amount).toFixed(2)}`;
    }

    // 获取货币选项HTML
    getCurrencyOptionsHTML() {
        return Object.entries(this.supportedCurrencies)
            .map(([code, info]) => `<option value="${code}">${info.name} (${info.symbol})</option>`)
            .join('');
    }

    // 初始化货币选择下拉框
    initCurrencySelect() {
        const currencySelect = document.getElementById('currency');
        if (currencySelect) {
            currencySelect.innerHTML = this.getCurrencyOptionsHTML();
            currencySelect.value = this.defaultCurrency;
        }
    }

    // ===== 货币设置功能 =====
    showCurrencySettings() {
        const modal = document.getElementById('currency-settings-modal');
        const defaultCurrencySelect = document.getElementById('default-currency');
        const apiKeyInput = document.getElementById('exchange-api-key');
        
        // 设置当前值
        defaultCurrencySelect.value = this.defaultCurrency;
        apiKeyInput.value = this.exchangeApiKey || '';
        
        modal.style.display = 'flex';
    }

    hideCurrencySettings() {
        const modal = document.getElementById('currency-settings-modal');
        modal.style.display = 'none';
    }

    saveCurrencySettings() {
        const defaultCurrency = document.getElementById('default-currency').value;
        const apiKey = document.getElementById('exchange-api-key').value.trim();
        
        // 更新设置
        this.defaultCurrency = defaultCurrency;
        this.exchangeApiKey = apiKey;
        
        // 保存到本地存储
        localStorage.setItem('defaultCurrency', defaultCurrency);
        if (apiKey) {
            localStorage.setItem('exchangeApiKey', apiKey);
        } else {
            localStorage.removeItem('exchangeApiKey');
        }
        
        // 更新货币选择下拉框
        this.initCurrencySelect();
        
        // 清除汇率缓存，强制重新获取
        this.exchangeRates = {};
        this.lastRateUpdate = null;
        localStorage.removeItem('exchangeRates');
        localStorage.removeItem('lastRateUpdate');
        
        // 重新获取汇率
        this.getExchangeRates();
        
        // 更新显示
        this.updateDisplay();
        
        this.hideCurrencySettings();
        alert('货币设置已保存！');
    }

    // 加载货币设置
    loadCurrencySettings() {
        const savedCurrency = localStorage.getItem('defaultCurrency');
        const savedApiKey = localStorage.getItem('exchangeApiKey');
        
        if (savedCurrency && this.supportedCurrencies[savedCurrency]) {
            this.defaultCurrency = savedCurrency;
        }
        
        if (savedApiKey) {
            this.exchangeApiKey = savedApiKey;
        }
    }

    // 分类管理方法
    // 获取所有分类（默认 + 自定义）
    getAllCategories(type = 'expense') {
        return [...this.categories[type], ...this.customCategories[type]];
    }

    // 添加自定义分类
    addCustomCategory(categoryName, type = 'expense') {
        if (!categoryName || categoryName.trim() === '') {
            return { success: false, message: '分类名称不能为空' };
        }

        const trimmedName = categoryName.trim();
        const allCategories = this.getAllCategories(type);
        
        if (allCategories.includes(trimmedName)) {
            return { success: false, message: '分类已存在' };
        }

        this.customCategories[type].push(trimmedName);
        this.saveCustomCategories();
        return { success: true, message: '分类添加成功' };
    }

    // 删除自定义分类
    deleteCustomCategory(categoryName, type = 'expense') {
        const index = this.customCategories[type].indexOf(categoryName);
        if (index === -1) {
            return { success: false, message: '分类不存在或为系统默认分类' };
        }

        this.customCategories[type].splice(index, 1);
        this.saveCustomCategories();
        return { success: true, message: '分类删除成功' };
    }

    // 保存自定义分类到本地存储
    saveCustomCategories() {
        const accountKey = this.currentAccount ? this.currentAccount.id : 'default';
        localStorage.setItem(`custom_categories_${this.currentUser}_${accountKey}`, JSON.stringify(this.customCategories));
    }

    // 加载自定义分类
    loadCustomCategories() {
        const accountKey = this.currentAccount ? this.currentAccount.id : 'default';
        const saved = localStorage.getItem(`custom_categories_${this.currentUser}_${accountKey}`);
        if (saved) {
            this.customCategories = JSON.parse(saved);
        }
    }

    // 更新分类选择器
    updateCategorySelector() {
        const categorySelect = document.getElementById('category');
        const currentType = this.currentType;
        const categories = this.getAllCategories(currentType);
        
        // 保存当前选中的值
        const currentValue = categorySelect.value;
        
        // 清空并重新填充选项
        categorySelect.innerHTML = '<option value="">选择分类</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        
        // 恢复之前选中的值（如果还存在）
        if (categories.includes(currentValue)) {
            categorySelect.value = currentValue;
        }
    }

    // 分类管理界面方法
    showCategoryManage() {
        const modal = document.getElementById('category-manage-modal');
        modal.style.display = 'flex';
        this.currentCategoryType = 'expense';
        this.renderCategoryList();
    }

    hideCategoryManage() {
        const modal = document.getElementById('category-manage-modal');
        modal.style.display = 'none';
        document.getElementById('new-category-name').value = '';
    }

    switchCategoryType(type) {
        this.currentCategoryType = type;
        
        // 更新标签页状态
        document.querySelectorAll('.category-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category-type="${type}"]`).classList.add('active');
        
        // 重新渲染分类列表
        this.renderCategoryList();
    }

    handleAddCategory() {
        const categoryName = document.getElementById('new-category-name').value.trim();
        if (!categoryName) {
            alert('请输入分类名称');
            return;
        }

        const result = this.addCustomCategory(categoryName, this.currentCategoryType);
        if (result.success) {
            document.getElementById('new-category-name').value = '';
            this.renderCategoryList();
            this.updateCategorySelector(); // 更新交易表单中的分类选择器
            alert(result.message);
        } else {
            alert(result.message);
        }
    }

    handleDeleteCategory(categoryName) {
        if (confirm(`确定要删除分类"${categoryName}"吗？`)) {
            const result = this.deleteCustomCategory(categoryName, this.currentCategoryType);
            if (result.success) {
                this.renderCategoryList();
                this.updateCategorySelector(); // 更新交易表单中的分类选择器
                alert(result.message);
            } else {
                alert(result.message);
            }
        }
    }

    renderCategoryList() {
        const categoryList = document.getElementById('category-list');
        const defaultCategories = this.categories[this.currentCategoryType];
        const customCategories = this.customCategories[this.currentCategoryType];
        
        if (defaultCategories.length === 0 && customCategories.length === 0) {
            categoryList.innerHTML = '<div class="empty-category-list">暂无分类</div>';
            return;
        }

        let html = '';
        
        // 显示默认分类
        defaultCategories.forEach(category => {
            html += `
                <div class="category-item">
                    <div class="category-info">
                        <span class="category-type-badge default">默认</span>
                        <span class="category-name">${category}</span>
                    </div>
                    <button class="delete-category-btn" disabled>系统分类</button>
                </div>
            `;
        });
        
        // 显示自定义分类
        customCategories.forEach(category => {
            html += `
                <div class="category-item">
                    <div class="category-info">
                        <span class="category-type-badge custom">自定义</span>
                        <span class="category-name">${category}</span>
                    </div>
                    <button class="delete-category-btn" onclick="app.handleDeleteCategory('${category}')">删除</button>
                </div>
            `;
        });
        
        categoryList.innerHTML = html;
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