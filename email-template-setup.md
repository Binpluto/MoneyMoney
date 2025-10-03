# 邮件邀请功能配置指南

## EmailJS 配置步骤

### 1. 注册 EmailJS 账户
1. 访问 [EmailJS官网](https://www.emailjs.com/)
2. 注册免费账户
3. 验证邮箱

### 2. 创建邮件服务
1. 在 EmailJS 控制台中点击 "Add New Service"
2. 选择邮件服务提供商（如 Gmail, Outlook 等）
3. 按照指引连接你的邮箱账户
4. 记录生成的 **Service ID**

### 3. 创建邮件模板
1. 在 EmailJS 控制台中点击 "Create New Template"
2. 使用以下模板内容：

```
主题: {{from_name}} 邀请您加入 {{account_name}} 账单

内容:
{{message}}

邀请码: {{invite_code}}
邀请链接: {{invite_link}}

此邮件由 MoneyMoney 记账应用自动发送。
```

3. 设置模板变量：
   - `to_email`: 收件人邮箱
   - `to_name`: 收件人姓名
   - `from_name`: 发送人姓名
   - `account_name`: 账单名称
   - `invite_code`: 邀请码
   - `invite_link`: 邀请链接
   - `message`: 邀请消息

4. 记录生成的 **Template ID**

### 4. 获取 Public Key
1. 在 EmailJS 控制台的 "Account" 页面
2. 找到 "Public Key" 并复制

### 5. 配置应用
在 `script.js` 文件中找到 `initEmailJS` 方法，替换以下占位符：

```javascript
initEmailJS() {
    // 替换为你的实际配置
    emailjs.init('YOUR_PUBLIC_KEY'); // 替换为步骤4获取的Public Key
}

async sendInviteEmail(recipientEmail, accountName, inviteCode, inviterName, customMessage = '') {
    // ...
    const response = await emailjs.send(
        'YOUR_SERVICE_ID',  // 替换为步骤2获取的Service ID
        'YOUR_TEMPLATE_ID', // 替换为步骤3获取的Template ID
        templateParams
    );
    // ...
}
```

### 6. 测试配置
1. 启动应用
2. 创建或选择一个家庭账户
3. 点击 "邮件邀请" 按钮
4. 输入测试邮箱地址
5. 发送邀请邮件
6. 检查邮箱是否收到邀请邮件

## 注意事项

- EmailJS 免费版每月限制200封邮件
- 确保邮件服务提供商允许第三方应用发送邮件
- 建议使用专门的邮箱账户用于发送邀请邮件
- 邀请链接会自动包含邀请码，点击后可直接加入账户

## 故障排除

### 邮件发送失败
1. 检查网络连接
2. 确认 EmailJS 配置信息正确
3. 检查邮箱服务商设置
4. 查看浏览器控制台错误信息

### 邀请链接无效
1. 确认 URL 格式正确
2. 检查邀请码是否有效
3. 确认用户已登录应用

如有其他问题，请参考 [EmailJS 官方文档](https://www.emailjs.com/docs/)。