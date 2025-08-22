# 💰 دليل النظام المحاسبي المتكامل - tar.ad

---

## 🎯 **نظرة عامة شاملة**

### ✅ **الوضع الحالي:**
- نظام مالي مبسط يعمل بكفاءة
- فصل صحيح للأموال (الإيجارات منفصلة عن محاسبة الشركة)
- تسجيل دقيق للمصروفات على مستوى العقار والمالك
- حساب تلقائي للعمولات

### 🚀 **الهدف من التطوير:**
- إضافة دليل حسابات شامل (تلقائي)
- تطبيق نظام القيود المزدوجة
- إدارة متقدمة للصناديق والحسابات
- تصنيف ذكي للمصروفات
- تقارير مالية متقدمة

---

## 🏗️ **هيكل قاعدة البيانات**

### 1. الجداول المحاسبية الجديدة

```sql
-- دليل الحسابات
CREATE TABLE ChartOfAccounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accountCode VARCHAR(50) UNIQUE NOT NULL,
    accountName VARCHAR(255) NOT NULL,
    accountType ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'),
    parentAccountId INT,
    isActive BOOLEAN DEFAULT TRUE,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parentAccountId) REFERENCES ChartOfAccounts(id)
);

-- القيود اليومية
CREATE TABLE JournalEntry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entryNumber VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    totalDebit DECIMAL(15,2) NOT NULL,
    totalCredit DECIMAL(15,2) NOT NULL,
    entryDate DATE NOT NULL,
    referenceType VARCHAR(100),
    referenceId INT,
    status ENUM('DRAFT', 'POSTED', 'CANCELLED') DEFAULT 'DRAFT',
    createdBy INT,
    approvedBy INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    approvedAt DATETIME,
    notes TEXT
);

-- تفاصيل القيود
CREATE TABLE JournalEntryLine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journalEntryId INT NOT NULL,
    accountId INT NOT NULL,
    debitAmount DECIMAL(15,2) DEFAULT 0,
    creditAmount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    costCenter VARCHAR(100),
    projectId INT,
    FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id),
    FOREIGN KEY (accountId) REFERENCES ChartOfAccounts(id)
);

-- الحسابات المالية (صناديق وبنوك)
CREATE TABLE FinancialAccount (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accountName VARCHAR(255) NOT NULL,
    accountType ENUM('PETTY_CASH', 'COMPANY_BANK', 'SAVINGS_BANK', 'CREDIT_CARD'),
    accountCode VARCHAR(50) UNIQUE,
    chartOfAccountsId INT,
    currentBalance DECIMAL(15,2) DEFAULT 0,
    maxBalance DECIMAL(15,2),
    bankName VARCHAR(255),
    accountNumber VARCHAR(100),
    iban VARCHAR(50),
    purpose TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chartOfAccountsId) REFERENCES ChartOfAccounts(id)
);

-- معاملات الحسابات المالية
CREATE TABLE FinancialAccountTransaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    financialAccountId INT NOT NULL,
    journalEntryId INT,
    transactionType ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT'),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    referenceType VARCHAR(100),
    referenceId INT,
    fromAccountId INT,
    toAccountId INT,
    transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    runningBalance DECIMAL(15,2),
    FOREIGN KEY (financialAccountId) REFERENCES FinancialAccount(id),
    FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id),
    FOREIGN KEY (fromAccountId) REFERENCES FinancialAccount(id),
    FOREIGN KEY (toAccountId) REFERENCES FinancialAccount(id)
);

-- التزامات المُلّاك
CREATE TABLE OwnerExpenseCommitment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ownerId INT NOT NULL,
    propertyId INT,
    unitId INT,
    rentAgreementId INT,
    totalOutstandingAmount DECIMAL(15,2) DEFAULT 0,
    lastExpenseDate DATE,
    startDate DATE,
    endDate DATE,
    isActive BOOLEAN DEFAULT TRUE,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES Client(id),
    FOREIGN KEY (propertyId) REFERENCES Property(id),
    FOREIGN KEY (unitId) REFERENCES Unit(id),
    FOREIGN KEY (rentAgreementId) REFERENCES RentAgreement(id)
);

-- تفاصيل مصروفات المُلّاك
CREATE TABLE OwnerExpenseDetail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commitmentId INT NOT NULL,
    expenseType ENUM('MAINTENANCE', 'UTILITIES', 'INSURANCE', 'OTHER'),
    referenceType VARCHAR(100),
    referenceId INT,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    expenseDate DATE NOT NULL,
    isSettled BOOLEAN DEFAULT FALSE,
    settledDate DATE,
    settledAmount DECIMAL(15,2),
    FOREIGN KEY (commitmentId) REFERENCES OwnerExpenseCommitment(id)
);

-- فواتير الملاك
CREATE TABLE OwnerInvoice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoiceNumber VARCHAR(100) UNIQUE NOT NULL,
    invoiceDate DATE NOT NULL,
    ownerId INT NOT NULL,
    period VARCHAR(20) NOT NULL,
    previousBalance DECIMAL(15,2) DEFAULT 0,
    currentCharges DECIMAL(15,2) NOT NULL,
    totalAmount DECIMAL(15,2) NOT NULL,
    status ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
    dueDate DATE NOT NULL,
    paidDate DATE,
    paidAmount DECIMAL(15,2),
    invoiceData JSON,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES Client(id)
);

-- سجل تسليم الفواتير
CREATE TABLE InvoiceDeliveryLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoiceId INT NOT NULL,
    deliveryMethod ENUM('EMAIL', 'WHATSAPP', 'SMS', 'PRINT') NOT NULL,
    success BOOLEAN NOT NULL,
    messageId VARCHAR(255),
    deliveryStatus VARCHAR(50),
    errorMessage TEXT,
    deliveredAt DATETIME,
    attemptedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoiceId) REFERENCES OwnerInvoice(id)
);
```

---

## ⚙️ **خدمات النظام المحاسبي**

### 1. خدمة إنشاء دليل الحسابات

```javascript
// services/ChartOfAccountsService.js
class ChartOfAccountsService {
    async createDefaultChartOfAccounts() {
        const defaultAccounts = [
            // الأصول
            { code: '1000', name: 'الأصول', type: 'ASSET', parent: null },
            { code: '1100', name: 'الأصول المتداولة', type: 'ASSET', parent: '1000' },
            { code: '1110', name: 'صندوق النثرية', type: 'ASSET', parent: '1100' },
            { code: '1115', name: 'الحساب الجاري التشغيلي', type: 'ASSET', parent: '1100' },
            { code: '1120', name: 'حساب التوفير - الضمانات', type: 'ASSET', parent: '1100' },
            { code: '1160', name: 'مدفوعات نيابة عن المُلّاك', type: 'ASSET', parent: '1100' },
            { code: '1170', name: 'مستحقات عمولة الإدارة', type: 'ASSET', parent: '1100' },
            
            // الخصوم
            { code: '2000', name: 'الخصوم', type: 'LIABILITY', parent: null },
            { code: '2100', name: 'الخصوم المتداولة', type: 'LIABILITY', parent: '2000' },
            { code: '2110', name: 'أمانات المستأجرين', type: 'LIABILITY', parent: '2100' },
            { code: '2120', name: 'مستحقات للمُلّاك', type: 'LIABILITY', parent: '2100' },
            
            // حقوق الملكية
            { code: '3000', name: 'حقوق الملكية', type: 'EQUITY', parent: null },
            { code: '3100', name: 'رأس المال', type: 'EQUITY', parent: '3000' },
            { code: '3200', name: 'الأرباح المحتجزة', type: 'EQUITY', parent: '3000' },
            
            // الإيرادات
            { code: '4000', name: 'الإيرادات', type: 'REVENUE', parent: null },
            { code: '4100', name: 'عمولات الإدارة', type: 'REVENUE', parent: '4000' },
            { code: '4110', name: 'عمولة إدارة العقارات السكنية', type: 'REVENUE', parent: '4100' },
            { code: '4120', name: 'عمولة إدارة العقارات التجارية', type: 'REVENUE', parent: '4100' },
            { code: '4200', name: 'رسوم أخرى', type: 'REVENUE', parent: '4000' },
            { code: '4210', name: 'رسوم تسجيل العقود', type: 'REVENUE', parent: '4200' },
            { code: '4220', name: 'رسوم إدارية', type: 'REVENUE', parent: '4200' },
            
            // المصروفات
            { code: '5000', name: 'المصروفات', type: 'EXPENSE', parent: null },
            { code: '5100', name: 'مصروفات نيابة عن المُلّاك', type: 'EXPENSE', parent: '5000' },
            { code: '5110', name: 'مصروفات صيانة عامة', type: 'EXPENSE', parent: '5100' },
            { code: '5120', name: 'مصروفات الخدمات', type: 'EXPENSE', parent: '5100' },
            { code: '5130', name: 'مصروفات التأمين', type: 'EXPENSE', parent: '5100' },
            { code: '5200', name: 'مصروفات الشركة', type: 'EXPENSE', parent: '5000' },
            { code: '5210', name: 'رواتب وأجور', type: 'EXPENSE', parent: '5200' },
            { code: '5220', name: 'مصروفات إدارية', type: 'EXPENSE', parent: '5200' },
            { code: '5230', name: 'مصروفات تسويق', type: 'EXPENSE', parent: '5200' }
        ];

        const accountMap = new Map();
        
        for (const account of defaultAccounts) {
            const parentId = account.parent ? accountMap.get(account.parent) : null;
            
            const created = await prisma.chartOfAccounts.create({
                data: {
                    accountCode: account.code,
                    accountName: account.name,
                    accountType: account.type,
                    parentAccountId: parentId,
                    isActive: true
                }
            });
            
            accountMap.set(account.code, created.id);
        }

        await this.createDefaultFinancialAccounts(accountMap);
        return accountMap;
    }

    async createDefaultFinancialAccounts(accountMap) {
        const financialAccounts = [
            {
                accountName: 'صندوق النثرية الرئيسي',
                accountType: 'PETTY_CASH',
                accountCode: 'PETTY-001',
                chartOfAccountsId: accountMap.get('1110'),
                maxBalance: 5000,
                purpose: 'المصروفات الصغيرة والطارئة أقل من 500 ريال'
            },
            {
                accountName: 'الحساب الجاري التشغيلي',
                accountType: 'COMPANY_BANK',
                accountCode: 'BANK-001',
                chartOfAccountsId: accountMap.get('1115'),
                purpose: 'المصروفات الكبيرة والعمليات التشغيلية'
            },
            {
                accountName: 'حساب التوفير للضمانات',
                accountType: 'SAVINGS_BANK',
                accountCode: 'SAVINGS-001',
                chartOfAccountsId: accountMap.get('1120'),
                purpose: 'إيداع أمانات المستأجرين فقط'
            }
        ];

        for (const account of financialAccounts) {
            await prisma.financialAccount.create({ data: account });
        }
    }
}
```

### 2. خدمة التكامل المحاسبي

```javascript
// services/AccountingIntegrationService.js
class AccountingIntegrationService {
    
    // ربط عقد الإيجار بالنظام المحاسبي
    async processRentAgreement(rentAgreementId) {
        const agreement = await prisma.rentAgreement.findUnique({
            where: { id: rentAgreementId },
            include: { renter: true, unit: true, property: { include: { client: true } } }
        });

        const entries = [];

        // 1. تسجيل أمانة المستأجر
        if (agreement.securityDeposit > 0) {
            entries.push(await this.createDepositEntry(agreement));
        }

        // 2. تسجيل رسوم التسجيل
        if (agreement.registrationFee > 0) {
            entries.push(await this.createRegistrationFeeEntry(agreement));
        }

        // 3. تسجيل عمولة الإدارة
        if (agreement.managementCommission > 0) {
            entries.push(await this.createManagementCommissionEntry(agreement));
        }

        return entries;
    }

    async createDepositEntry(agreement) {
        const entryNumber = await this.generateEntryNumber('DEP');
        
        const journalEntry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                description: `إيداع أمانة ${agreement.renter.name} - وحدة ${agreement.unit.unitNumber}`,
                totalDebit: agreement.securityDeposit,
                totalCredit: agreement.securityDeposit,
                entryDate: new Date(),
                referenceType: 'RENT_AGREEMENT',
                referenceId: agreement.id,
                status: 'POSTED'
            }
        });

        // طرف مدين: حساب التوفير
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId('1120'),
                debitAmount: agreement.securityDeposit,
                description: `إيداع أمانة ${agreement.renter.name}`
            }
        });

        // طرف دائن: أمانات المستأجرين
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId('2110'),
                creditAmount: agreement.securityDeposit,
                description: `أمانة مستحقة لـ ${agreement.renter.name}`
            }
        });

        // تسجيل المعاملة في الحساب المالي
        await this.recordFinancialTransaction({
            accountCode: 'SAVINGS-001',
            type: 'DEPOSIT',
            amount: agreement.securityDeposit,
            description: `إيداع أمانة ${agreement.renter.name}`,
            referenceType: 'RENT_AGREEMENT',
            referenceId: agreement.id,
            journalEntryId: journalEntry.id
        });

        return journalEntry;
    }

    // معالجة مصروفات الصيانة
    async processMaintenanceExpense(maintenanceId) {
        const maintenance = await prisma.maintenance.findUnique({
            where: { id: maintenanceId },
            include: { client: true, property: true, unit: true, type: true }
        });

        // تصنيف المصروف
        const classification = await this.classifyExpense(maintenance);
        
        if (classification.type === 'OWNER_EXPENSE') {
            return await this.processOwnerExpense(maintenance);
        } else {
            return await this.processCompanyExpense(maintenance);
        }
    }

    async classifyExpense(maintenance) {
        if (maintenance.clientId && maintenance.propertyId) {
            return {
                type: 'OWNER_EXPENSE',
                ownerId: maintenance.clientId,
                propertyId: maintenance.propertyId,
                unitId: maintenance.unitId
            };
        } else {
            return {
                type: 'COMPANY_EXPENSE'
            };
        }
    }

    async processOwnerExpense(maintenance) {
        const entryNumber = await this.generateEntryNumber('MAINT');

        // قيد دفع المصروف
        const journalEntry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                description: `صيانة ${maintenance.type.name} - ${maintenance.property.name}`,
                totalDebit: maintenance.cost,
                totalCredit: maintenance.cost,
                entryDate: new Date(),
                referenceType: 'MAINTENANCE',
                referenceId: maintenance.id,
                status: 'POSTED'
            }
        });

        // طرف مدين: مدفوعات نيابة عن المُلّاك
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId('1160'),
                debitAmount: maintenance.cost,
                description: `مدفوع نيابة عن ${maintenance.client.name}`
            }
        });

        // طرف دائن: الحساب المدفوع منه
        const paymentAccount = maintenance.cost < 500 ? '1110' : '1115';
        const financialAccountCode = maintenance.cost < 500 ? 'PETTY-001' : 'BANK-001';

        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId(paymentAccount),
                creditAmount: maintenance.cost,
                description: `دفع ${maintenance.type.name}`
            }
        });

        // تحديث التزامات المالك
        await this.updateOwnerLiability(
            maintenance.clientId,
            maintenance.propertyId,
            maintenance.unitId,
            maintenance.cost,
            'MAINTENANCE',
            maintenance.id
        );

        // تسجيل المعاملة المالية
        await this.recordFinancialTransaction({
            accountCode: financialAccountCode,
            type: 'WITHDRAWAL',
            amount: maintenance.cost,
            description: `صيانة ${maintenance.type.name}`,
            referenceType: 'MAINTENANCE',
            referenceId: maintenance.id,
            journalEntryId: journalEntry.id
        });

        return journalEntry;
    }

    async updateOwnerLiability(ownerId, propertyId, unitId, amount, expenseType, referenceId) {
        let commitment = await prisma.ownerExpenseCommitment.findFirst({
            where: { ownerId, propertyId, unitId, isActive: true }
        });

        if (!commitment) {
            commitment = await prisma.ownerExpenseCommitment.create({
                data: {
                    ownerId,
                    propertyId,
                    unitId,
                    totalOutstandingAmount: amount,
                    lastExpenseDate: new Date(),
                    startDate: new Date(),
                    isActive: true
                }
            });
        } else {
            await prisma.ownerExpenseCommitment.update({
                where: { id: commitment.id },
                data: {
                    totalOutstandingAmount: commitment.totalOutstandingAmount + amount,
                    lastExpenseDate: new Date()
                }
            });
        }

        // تسجيل تفاصيل المصروف
        await prisma.ownerExpenseDetail.create({
            data: {
                commitmentId: commitment.id,
                expenseType,
                referenceType: 'MAINTENANCE',
                referenceId,
                amount,
                description: `مصروف ${expenseType}`,
                expenseDate: new Date()
            }
        });

        return commitment;
    }

    // دوال مساعدة
    async generateEntryNumber(prefix) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        
        const lastEntry = await prisma.journalEntry.findFirst({
            where: { entryNumber: { startsWith: `${prefix}-${year}${month}` } },
            orderBy: { entryNumber: 'desc' }
        });

        let sequence = 1;
        if (lastEntry) {
            const lastSequence = parseInt(lastEntry.entryNumber.split('-').pop());
            sequence = lastSequence + 1;
        }

        return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
    }

    async getAccountId(accountCode) {
        const account = await prisma.chartOfAccounts.findUnique({
            where: { accountCode }
        });
        return account?.id;
    }

    async recordFinancialTransaction(data) {
        const account = await prisma.financialAccount.findUnique({
            where: { accountCode: data.accountCode }
        });

        if (!account) {
            throw new Error(`الحساب المالي غير موجود: ${data.accountCode}`);
        }

        const newBalance = data.type === 'DEPOSIT' || data.type === 'TRANSFER_IN'
            ? account.currentBalance + data.amount
            : account.currentBalance - data.amount;

        await prisma.financialAccountTransaction.create({
            data: {
                financialAccountId: account.id,
                journalEntryId: data.journalEntryId,
                transactionType: data.type,
                amount: data.amount,
                description: data.description,
                referenceType: data.referenceType,
                referenceId: data.referenceId,
                runningBalance: newBalance
            }
        });

        await prisma.financialAccount.update({
            where: { id: account.id },
            data: { currentBalance: newBalance }
        });

        return newBalance;
    }
}
```

---

## 📊 **التقارير والتحليلات**

### 1. خدمة التقارير المالية

```javascript
// services/FinancialReportsService.js
class FinancialReportsService {
    
    // تقرير الأرباح والخسائر
    async generateProfitLossReport(startDate, endDate) {
        const revenues = await this.getAccountBalancesByType('REVENUE', startDate, endDate);
        const expenses = await this.getAccountBalancesByType('EXPENSE', startDate, endDate);

        const companyExpenses = expenses.filter(acc => acc.accountCode.startsWith('52'));
        const ownerExpenses = expenses.filter(acc => acc.accountCode.startsWith('51'));

        const totalRevenues = revenues.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
        const totalCompanyExpenses = companyExpenses.reduce((sum, acc) => sum + acc.balance, 0);
        const totalOwnerExpenses = ownerExpenses.reduce((sum, acc) => sum + acc.balance, 0);

        const netProfit = totalRevenues - totalCompanyExpenses;

        return {
            period: { startDate, endDate },
            revenues: { accounts: revenues, total: totalRevenues },
            expenses: {
                companyExpenses: { accounts: companyExpenses, total: totalCompanyExpenses },
                ownerExpenses: { accounts: ownerExpenses, total: totalOwnerExpenses }
            },
            netProfit,
            profitMargin: totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0
        };
    }

    // تقرير التزامات الملاك
    async generateOwnerLiabilityReport(ownerId, startDate, endDate) {
        const commitments = await prisma.ownerExpenseCommitment.findMany({
            where: {
                ownerId,
                isActive: true,
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
                expenseDetails: {
                    where: { expenseDate: { gte: startDate, lte: endDate } },
                    orderBy: { expenseDate: 'desc' }
                }
            }
        });

        const summary = {
            totalOutstanding: 0,
            byProperty: {},
            byUnit: {},
            recentExpenses: []
        };

        for (const commitment of commitments) {
            summary.totalOutstanding += commitment.totalOutstandingAmount;
            
            const propertyKey = commitment.property.name;
            if (!summary.byProperty[propertyKey]) {
                summary.byProperty[propertyKey] = { amount: 0, units: 0 };
            }
            summary.byProperty[propertyKey].amount += commitment.totalOutstandingAmount;
            summary.byProperty[propertyKey].units += 1;

            if (commitment.unit) {
                const unitKey = `${commitment.property.name} - ${commitment.unit.unitNumber}`;
                summary.byUnit[unitKey] = commitment.totalOutstandingAmount;
            }

            summary.recentExpenses.push(...commitment.expenseDetails);
        }

        summary.recentExpenses.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));

        return { commitments, summary };
    }

    // ميزان المراجعة
    async generateTrialBalance(asOfDate) {
        const accounts = await prisma.chartOfAccounts.findMany({
            where: { isActive: true },
            orderBy: { accountCode: 'asc' }
        });

        const trialBalance = [];
        let totalDebits = 0;
        let totalCredits = 0;

        for (const account of accounts) {
            const balance = await this.calculateAccountBalance(account.id, asOfDate);
            
            if (balance !== 0) {
                const isDebitAccount = ['ASSET', 'EXPENSE'].includes(account.accountType);
                const debitBalance = (isDebitAccount && balance > 0) || (!isDebitAccount && balance < 0) 
                    ? Math.abs(balance) : 0;
                const creditBalance = (!isDebitAccount && balance > 0) || (isDebitAccount && balance < 0) 
                    ? Math.abs(balance) : 0;

                trialBalance.push({
                    accountCode: account.accountCode,
                    accountName: account.accountName,
                    accountType: account.accountType,
                    debitBalance,
                    creditBalance
                });

                totalDebits += debitBalance;
                totalCredits += creditBalance;
            }
        }

        return {
            asOfDate,
            accounts: trialBalance,
            totals: {
                totalDebits,
                totalCredits,
                isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
            }
        };
    }

    async calculateAccountBalance(accountId, asOfDate) {
        const result = await prisma.journalEntryLine.aggregate({
            where: {
                accountId,
                journalEntry: {
                    entryDate: { lte: asOfDate },
                    status: 'POSTED'
                }
            },
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        });

        const totalDebits = result._sum.debitAmount || 0;
        const totalCredits = result._sum.creditAmount || 0;
        
        return totalDebits - totalCredits;
    }

    async getAccountBalancesByType(accountType, startDate, endDate) {
        const accounts = await prisma.chartOfAccounts.findMany({
            where: { accountType, isActive: true }
        });

        const balances = [];
        
        for (const account of accounts) {
            const balance = await this.calculateAccountBalancePeriod(account.id, startDate, endDate);
            if (balance !== 0) {
                balances.push({
                    accountCode: account.accountCode,
                    accountName: account.accountName,
                    balance: Math.abs(balance)
                });
            }
        }

        return balances;
    }

    async calculateAccountBalancePeriod(accountId, startDate, endDate) {
        const result = await prisma.journalEntryLine.aggregate({
            where: {
                accountId,
                journalEntry: {
                    entryDate: { gte: startDate, lte: endDate },
                    status: 'POSTED'
                }
            },
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        });

        const totalDebits = result._sum.debitAmount || 0;
        const totalCredits = result._sum.creditAmount || 0;
        
        return totalDebits - totalCredits;
    }
}
```

---

## 🔍 **تحليل النظام الحالي ودعم الملاك المتعددين**

### 📊 **الوضع الحالي في tar.ad:**

#### **✅ النظام الحالي يدعم الملاك المتعددين بالفعل:**

```sql
-- هيكل قاعدة البيانات الحالي (من schema.prisma)
Client {
  id: معرف المالك
  name: اسم المالك
  properties: العقارات المملوكة (علاقة واحد لمتعدد)
  units: الوحدات المملوكة (علاقة واحد لمتعدد)
  maintenances: طلبات الصيانة الخاصة به
}

Property {
  id: معرف العقار
  clientId: معرف المالك (علاقة متعدد لواحد)
  units: الوحدات في هذا العقار
  maintenances: طلبات الصيانة للعقار
}

Unit {
  id: معرف الوحدة
  propertyId: معرف العقار
  clientId: معرف المالك (مباشرة)
  rentAgreements: عقود الإيجار
}

Maintenance {
  id: معرف طلب الصيانة
  cost: التكلفة
  propertyId: العقار المرتبط
  ownerId: المالك المتحمل للتكلفة
  unitId: الوحدة (اختياري)
  isPaid: حالة الدفع
}
```

#### **✅ مثال على البيانات الحالية:**

```javascript
// مالك لديه عدة عقارات
const owner1 = {
  id: 1,
  name: "أحمد محمد",
  properties: [
    { id: 101, name: "عمارة الزهور" },
    { id: 102, name: "مجمع النخيل" }
  ]
};

// عقار به وحدات متعددة لنفس المالك
const property101 = {
  id: 101,
  clientId: 1, // أحمد محمد
  units: [
    { id: 1001, unitNumber: "A1", clientId: 1 },
    { id: 1002, unitNumber: "A2", clientId: 1 },
    { id: 1003, unitNumber: "B1", clientId: 1 }
  ]
};

// مصروفات صيانة مرتبطة بالمالك والعقار
const maintenanceExpenses = [
  {
    id: 501,
    cost: 1500,
    propertyId: 101,  // عمارة الزهور
    ownerId: 1,       // أحمد محمد
    unitId: 1001,     // وحدة A1
    description: "إصلاح مكيف وحدة A1"
  },
  {
    id: 502,
    cost: 3000,
    propertyId: 101,  // عمارة الزهور
    ownerId: 1,       // أحمد محمد
    unitId: null,     // عام للعقار
    description: "صيانة المصعد"
  }
];
```

### ⚠️ **النقص في النظام الحالي:**

#### **1. مصروفات الشركة غير مدعومة:**
```javascript
// ❌ النظام الحالي لا يميز بين:
const ownerExpense = {
  cost: 2000,
  ownerId: 1,          // مصروف خاص بالمالك
  propertyId: 101,     // مرتبط بعقار معين
  type: "صيانة مكيف"
};

const companyExpense = {
  cost: 5000,
  ownerId: null,       // ❌ لا يوجد مكان لتسجيل مصروفات الشركة
  propertyId: null,    // ❌ مصروف عام غير مرتبط بعقار
  type: "رواتب موظفين"
};
```

#### **2. لا يوجد تصنيف واضح للمصروفات:**
```javascript
// ❌ كل المصروفات تُعامل كمصروفات ملاك
const expenses = [
  { cost: 1000, ownerId: 1, type: "صيانة" },      // مصروف مالك
  { cost: 3000, ownerId: null, type: "رواتب" },   // ❌ مصروف شركة لكن لا يوجد تصنيف
  { cost: 500, ownerId: 2, type: "كهرباء" }       // مصروف مالك آخر
];
```

---

## 🚀 **الحل في النظام المحاسبي الجديد**

### 1. **تصنيف ذكي للمصروفات**

```javascript
// services/ExpenseClassificationService.js
class ExpenseClassificationService {
      async classifyExpense(expenseData) {
        // 1. مصروف مرتبط بعقار (المفضل - يتم استنتاج المالك من العقار)
        if (expenseData.propertyId) {
            // استنتاج المالك من العقار
            const property = await this.getPropertyWithOwner(expenseData.propertyId);
            if (!property) {
                throw new Error(`العقار غير موجود: ${expenseData.propertyId}`);
            }
            
            // التحقق من الوحدة إذا تم تحديدها
            let unitId = expenseData.unitId;
            if (unitId) {
                const unit = await this.validateUnitBelongsToProperty(unitId, expenseData.propertyId);
                if (!unit) {
                    throw new Error(`الوحدة ${unitId} لا تنتمي للعقار ${expenseData.propertyId}`);
                }
            }
            
            return {
                type: 'OWNER_EXPENSE',
                category: 'PROPERTY_SPECIFIC',
                propertyId: expenseData.propertyId,
                ownerId: property.clientId, // استنتاج من العقار
                unitId: unitId,
                accountCode: '5110', // مصروفات نيابة عن الملاك
                description: `مصروف ${expenseData.description} - ${property.client.name} - ${property.name}`,
                ownerInferredFromProperty: true
            };
        }
        
        // 2. مصروف عام للشركة (غير مرتبط بأي عقار)
        if (!expenseData.propertyId) {
            return {
                type: 'COMPANY_EXPENSE',
                category: 'GENERAL_OPERATIONS',
                propertyId: null,
                ownerId: null,
                unitId: null,
                accountCode: this.getCompanyExpenseAccount(expenseData.expenseType),
                description: `مصروف الشركة: ${expenseData.description}`
            };
        }
        
        // 3. حالة غير متوقعة
        throw new Error('لا يمكن تصنيف المصروف - يجب تحديد العقار أو تركه فارغاً للمصروفات العامة');
    }

    // دالة مساعدة للحصول على العقار مع بيانات المالك
    async getPropertyWithOwner(propertyId) {
        return await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                client: { select: { id: true, name: true } }
            }
        });
    }

    // دالة مساعدة للتحقق من أن الوحدة تنتمي للعقار
    async validateUnitBelongsToProperty(unitId, propertyId) {
        return await prisma.unit.findFirst({
            where: { 
                id: unitId, 
                propertyId: propertyId 
            }
        });
    }
    
    getCompanyExpenseAccount(expenseType) {
        const companyExpenseTypes = {
            'SALARIES': '5210',        // رواتب وأجور
            'ADMINISTRATIVE': '5220',   // مصروفات إدارية
            'MARKETING': '5230',       // مصروفات تسويق
            'OFFICE_RENT': '5240',     // إيجار المكتب
            'UTILITIES': '5250',       // خدمات المكتب (كهرباء، ماء، إنترنت)
            'EQUIPMENT': '5260',       // معدات ومستلزمات
            'INSURANCE': '5270',       // تأمين الشركة
            'PROFESSIONAL': '5280',    // رسوم مهنية (محاماة، محاسبة)
            'OTHER': '5290'           // مصروفات أخرى
        };
        
        return companyExpenseTypes[expenseType] || '5290';
    }
}
```

### 2. **خدمة معالجة المصروفات المتقدمة**

```javascript
// services/AdvancedExpenseService.js
class AdvancedExpenseService {
    
    async processExpense(expenseData) {
        // تصنيف المصروف
        const classification = await this.classifyExpense(expenseData);
        
        switch (classification.type) {
            case 'OWNER_EXPENSE':
                return await this.processOwnerExpense(expenseData, classification);
                
            case 'COMPANY_EXPENSE':
                return await this.processCompanyExpense(expenseData, classification);
                
            case 'MIXED_EXPENSE':
                return await this.processMixedExpense(expenseData, classification);
        }
    }
    
    // معالجة مصروفات الملاك
    async processOwnerExpense(expenseData, classification) {
        const entryNumber = await this.generateEntryNumber('OWN-EXP');
        
        // إنشاء القيد المحاسبي
        const journalEntry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                description: classification.description,
                totalDebit: expenseData.amount,
                totalCredit: expenseData.amount,
                entryDate: new Date(),
                referenceType: 'OWNER_EXPENSE',
                referenceId: expenseData.id,
                status: 'POSTED'
            }
        });
        
        // طرف مدين: مدفوعات نيابة عن المُلّاك
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId('1160'), // مدفوعات نيابة عن المُلّاك
                debitAmount: expenseData.amount,
                description: `مدفوع نيابة عن ${await this.getOwnerName(classification.ownerId)}`,
                costCenter: `PROP-${classification.propertyId}`
            }
        });
        
        // طرف دائن: الصندوق أو البنك
        const paymentAccount = expenseData.amount < 500 ? '1110' : '1115';
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId(paymentAccount),
                creditAmount: expenseData.amount,
                description: `دفع ${expenseData.description}`
            }
        });

        // تحديث التزامات المالك
        await this.updateOwnerLiability(classification, expenseData);
        
        // تسجيل المعاملة المالية
        await this.recordFinancialTransaction(expenseData, 'OWNER_EXPENSE');
        
        return {
            type: 'OWNER_EXPENSE',
            journalEntry,
            ownerLiabilityUpdated: true,
            message: `تم تسجيل مصروف المالك بقيمة ${expenseData.amount} ريال`
        };
    }
    
    // معالجة مصروفات الشركة
    async processCompanyExpense(expenseData, classification) {
        const entryNumber = await this.generateEntryNumber('COM-EXP');
        
        // إنشاء القيد المحاسبي
        const journalEntry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                description: classification.description,
                totalDebit: expenseData.amount,
                totalCredit: expenseData.amount,
                entryDate: new Date(),
                referenceType: 'COMPANY_EXPENSE',
                referenceId: expenseData.id,
                status: 'POSTED'
            }
        });
        
        // طرف مدين: حساب المصروف المناسب
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId(classification.accountCode),
                debitAmount: expenseData.amount,
                description: classification.description,
                costCenter: 'COMPANY-GENERAL'
            }
        });
        
        // طرف دائن: الصندوق أو البنك
        const paymentAccount = expenseData.amount < 500 ? '1110' : '1115';
        await prisma.journalEntryLine.create({
            data: {
                journalEntryId: journalEntry.id,
                accountId: await this.getAccountId(paymentAccount),
                creditAmount: expenseData.amount,
                description: `دفع ${expenseData.description}`
            }
        });
        
        // تسجيل المعاملة المالية
        await this.recordFinancialTransaction(expenseData, 'COMPANY_EXPENSE');
        
        return {
            type: 'COMPANY_EXPENSE',
            journalEntry,
            message: `تم تسجيل مصروف الشركة بقيمة ${expenseData.amount} ريال`
        };
    }
    
    // تحديث التزامات المالك (مع دعم الملاك المتعددين)
    async updateOwnerLiability(classification, expenseData) {
        // البحث عن التزام موجود للمالك لهذا العقار/الوحدة
        let commitment = await prisma.ownerExpenseCommitment.findFirst({
            where: {
                ownerId: classification.ownerId,
                propertyId: classification.propertyId,
                unitId: classification.unitId,
                isActive: true
            }
        });
        
        if (!commitment) {
            // إنشاء التزام جديد
            commitment = await prisma.ownerExpenseCommitment.create({
                data: {
                    ownerId: classification.ownerId,
                    propertyId: classification.propertyId,
                    unitId: classification.unitId,
                    totalOutstandingAmount: expenseData.amount,
                    lastExpenseDate: new Date(),
                    startDate: new Date(),
                    isActive: true,
                    notes: `التزام للمالك ${await this.getOwnerName(classification.ownerId)}`
                }
            });
        } else {
            // تحديث التزام موجود
            await prisma.ownerExpenseCommitment.update({
                where: { id: commitment.id },
                data: {
                    totalOutstandingAmount: commitment.totalOutstandingAmount + expenseData.amount,
                    lastExpenseDate: new Date()
                }
            });
        }
        
        // تسجيل تفاصيل المصروف
        await prisma.ownerExpenseDetail.create({
            data: {
                commitmentId: commitment.id,
                expenseType: expenseData.expenseType || 'OTHER',
                referenceType: expenseData.referenceType || 'MANUAL',
                referenceId: expenseData.referenceId,
                amount: expenseData.amount,
                description: expenseData.description,
                expenseDate: new Date(),
                isSettled: false
            }
        });
        
        return commitment;
    }
}
```

---

## 📱 **نظام إرسال الفواتير عبر الواتساب**

### 🎯 **التكامل مع نظام الواتساب الموجود**

#### **المميزات الجديدة:**
- **إرسال تلقائي للفواتير** عبر الواتساب فور إنشائها
- **تذكيرات ذكية** للفواتير المتأخرة
- **تقارير إدارية** عبر الواتساب
- **رسائل مُنسقة ومهنية** مع رموز تعبيرية

#### **نظام الإرسال التلقائي المحدث:**

```javascript
// jobs/EnhancedMonthlyInvoicingJob.js
class EnhancedMonthlyInvoicingJob {
    
    async runMonthlyInvoicing() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        console.log(`🚀 بدء إنشاء وإرسال فواتير الشهر ${month}/${year}`);
        
        try {
            const invoicingService = new OwnerInvoicingService();
            const result = await invoicingService.generateMonthlyInvoicesForAllOwners(year, month);
            
            console.log(`✅ تم إنشاء ${result.totalInvoices} فاتورة بإجمالي ${result.totalAmount} ريال`);
            
            // إحصائيات الإرسال
            const deliveryStats = {
                whatsapp: { sent: 0, failed: 0 },
                email: { sent: 0, failed: 0 },
                noContact: 0
            };
            
            // إرسال الفواتير مع أولوية للواتساب
            for (const invoice of result.invoices) {
                await this.deliverInvoice(invoice, deliveryStats);
                
                // تأخير بين الرسائل لتجنب الحظر
                await this.delay(2500);
            }
            
            // تقرير شامل للإدارة
            await this.sendComprehensiveReport(result, deliveryStats);
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء الفواتير الشهرية:', error);
            await this.notifyError(error);
        }
    }
    
    async deliverInvoice(invoice, stats) {
        const owner = invoice.owner;
        
        // الأولوية الأولى: الواتساب
        if (owner.phone) {
            try {
                const invoicingService = new OwnerInvoicingService();
                await invoicingService.sendInvoiceByWhatsApp(invoice.invoiceId);
                
                stats.whatsapp.sent++;
                console.log(`📱 ✅ تم إرسال فاتورة ${invoice.invoiceNumber} عبر الواتساب للمالك ${owner.name}`);
                return;
                
            } catch (whatsappError) {
                stats.whatsapp.failed++;
                console.log(`📱 ❌ فشل إرسال الواتساب للمالك ${owner.name}: ${whatsappError.message}`);
                
                // الخيار البديل: البريد الإلكتروني
                if (owner.email) {
                    try {
                        const invoicingService = new OwnerInvoicingService();
                        await invoicingService.sendInvoiceByEmail(invoice.invoiceId);
                        
                        stats.email.sent++;
                        console.log(`📧 ✅ تم إرسال فاتورة ${invoice.invoiceNumber} عبر الإيميل للمالك ${owner.name} (بديل)`);
                        return;
                        
                    } catch (emailError) {
                        stats.email.failed++;
                        console.log(`📧 ❌ فشل إرسال الإيميل للمالك ${owner.name}: ${emailError.message}`);
                    }
                }
            }
        }
        // إذا لم يكن هناك واتساب، جرب الإيميل مباشرة
        else if (owner.email) {
            try {
                const invoicingService = new OwnerInvoicingService();
                await invoicingService.sendInvoiceByEmail(invoice.invoiceId);
                
                stats.email.sent++;
                console.log(`📧 ✅ تم إرسال فاتورة ${invoice.invoiceNumber} عبر الإيميل للمالك ${owner.name}`);
                return;
                
            } catch (emailError) {
                stats.email.failed++;
                console.log(`📧 ❌ فشل إرسال الإيميل للمالك ${owner.name}: ${emailError.message}`);
            }
        } else {
            stats.noContact++;
            console.log(`⚠️ لا توجد وسيلة اتصال للمالك ${owner.name}`);
        }
    }
    
    async sendComprehensiveReport(invoiceResult, deliveryStats) {
        const totalSent = deliveryStats.whatsapp.sent + deliveryStats.email.sent;
        const totalFailed = deliveryStats.whatsapp.failed + deliveryStats.email.failed + deliveryStats.noContact;
        const successRate = ((totalSent / invoiceResult.totalInvoices) * 100).toFixed(1);
        
        const report = `
🎯 *تقرير الفوترة الشهرية الشامل*
📅 الفترة: ${invoiceResult.period}
⏰ وقت الإنشاء: ${new Date().toLocaleString('ar-SA')}

📊 *إحصائيات الفواتير:*
✅ تم إنشاء: ${invoiceResult.totalInvoices} فاتورة
💰 إجمالي المبلغ: ${invoiceResult.totalAmount.toLocaleString()} ريال
📈 متوسط الفاتورة: ${(invoiceResult.totalAmount / invoiceResult.totalInvoices).toLocaleString()} ريال

📤 *إحصائيات الإرسال:*
📱 واتساب: ${deliveryStats.whatsapp.sent} نجح، ${deliveryStats.whatsapp.failed} فشل
📧 إيميل: ${deliveryStats.email.sent} نجح، ${deliveryStats.email.failed} فشل
⚠️ بلا اتصال: ${deliveryStats.noContact} مالك

📈 *معدل النجاح:* ${successRate}% (${totalSent}/${invoiceResult.totalInvoices})

${deliveryStats.whatsapp.sent > 0 ? `
📱 *الواتساب هو الوسيلة الأساسية المفضلة*
✅ تم إرسال ${deliveryStats.whatsapp.sent} فاتورة بنجاح
` : ''}

${deliveryStats.noContact > 0 ? `
⚠️ *تحتاج متابعة:*
${deliveryStats.noContact} مالك بحاجة لتحديث بيانات الاتصال
` : ''}

🏢 tar.ad - نظام الفوترة التلقائي
        `;
        
        await this.sendToManagement(report, 'MONTHLY_REPORT');
    }
    
    async sendToManagement(message, type = 'GENERAL') {
        const managementContacts = [
            {
                number: '966501234567',
                name: 'المدير العام',
                types: ['MONTHLY_REPORT', 'ERROR', 'URGENT']
            },
            {
                number: '966507654321', 
                name: 'المحاسب',
                types: ['MONTHLY_REPORT', 'REMINDER_REPORT']
            },
            {
                number: '966555123456',
                name: 'مدير العمليات',
                types: ['ERROR', 'URGENT']
            }
        ];
        
        for (const contact of managementContacts) {
            if (contact.types.includes(type)) {
                try {
                    await fetch('/api/whatsapp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: contact.number,
                            message: message,
                            type: `MANAGEMENT_${type}`,
                            priority: type === 'ERROR' || type === 'URGENT' ? 'HIGH' : 'NORMAL'
                        })
                    });
                    
                    console.log(`📱 تم إرسال تقرير لـ ${contact.name}`);
                    await this.delay(1000);
                    
                } catch (error) {
                    console.error(`❌ فشل إرسال تقرير لـ ${contact.name}:`, error);
                }
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async notifyError(error) {
        const errorMessage = `
🚨 *خطأ طارئ في نظام الفوترة*
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
❌ نوع الخطأ: ${error.name || 'خطأ غير محدد'}
📝 التفاصيل: ${error.message}

🔧 *إجراءات مطلوبة:*
1. فحص نظام قاعدة البيانات
2. التحقق من نظام الواتساب
3. مراجعة سجلات النظام

⚠️ يُرجى التدخل الفوري لحل المشكلة
        `;
        
        await this.sendToManagement(errorMessage, 'ERROR');
    }
}

// مهمة التذكيرات الذكية
class SmartReminderJob {
    
    async runSmartReminders() {
        console.log('🔔 بدء إرسال التذكيرات الذكية');
        
        try {
            // تصنيف الفواتير حسب مدة التأخير
            const overdueCategories = await this.categorizeOverdueInvoices();
            
            let totalReminders = 0;
            const reminderResults = {
                gentle: { sent: 0, failed: 0 },      // 1-7 أيام
                firm: { sent: 0, failed: 0 },        // 8-30 يوم
                urgent: { sent: 0, failed: 0 },      // 31+ يوم
                escalation: { sent: 0, failed: 0 }   // 60+ يوم
            };
            
            // إرسال تذكيرات مخصصة حسب نوع التأخير
            for (const [category, invoices] of Object.entries(overdueCategories)) {
                for (const invoice of invoices) {
                    const success = await this.sendCategorizedReminder(invoice, category);
                    
                    if (success) {
                        reminderResults[category].sent++;
                    } else {
                        reminderResults[category].failed++;
                    }
                    
                    totalReminders++;
                    await this.delay(2000);
                }
            }
            
            // تقرير التذكيرات للإدارة
            await this.sendReminderReport(reminderResults, totalReminders);
            
        } catch (error) {
            console.error('❌ خطأ في نظام التذكيرات:', error);
        }
    }
    
    async categorizeOverdueInvoices() {
        const now = new Date();
        const overdueInvoices = await prisma.ownerInvoice.findMany({
            where: {
                status: 'PENDING',
                dueDate: { lt: now }
            },
            include: { owner: true }
        });
        
        const categories = {
            gentle: [],    // 1-7 أيام
            firm: [],      // 8-30 يوم  
            urgent: [],    // 31-59 يوم
            escalation: [] // 60+ يوم
        };
        
        for (const invoice of overdueInvoices) {
            const daysPastDue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
            
            if (daysPastDue <= 7) {
                categories.gentle.push({ ...invoice, daysPastDue });
            } else if (daysPastDue <= 30) {
                categories.firm.push({ ...invoice, daysPastDue });
            } else if (daysPastDue <= 59) {
                categories.urgent.push({ ...invoice, daysPastDue });
            } else {
                categories.escalation.push({ ...invoice, daysPastDue });
            }
        }
        
        return categories;
    }
    
    async sendCategorizedReminder(invoice, category) {
        if (!invoice.owner.phone) return false;
        
        try {
            const message = this.generateReminderMessage(invoice, category);
            const whatsappNumber = this.formatPhoneForWhatsApp(invoice.owner.phone);
            
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: whatsappNumber,
                    message: message,
                    type: `REMINDER_${category.toUpperCase()}`,
                    clientId: invoice.owner.id,
                    referenceId: invoice.id,
                    priority: category === 'escalation' ? 'HIGH' : 'NORMAL'
                })
            });
            
            const result = await response.json();
            return result.success;
            
        } catch (error) {
            console.error(`فشل إرسال تذكير ${category} للمالك ${invoice.owner.name}:`, error);
            return false;
        }
    }
    
    generateReminderMessage(invoice, category) {
        const baseInfo = `
👤 السيد/ة *${invoice.owner.name}* المحترم/ة
📋 فاتورة رقم: *${invoice.invoiceNumber}*
💰 المبلغ: *${invoice.totalAmount.toLocaleString()} ريال*
📅 مستحقة منذ: *${invoice.daysPastDue} يوم*
        `;
        
        switch (category) {
            case 'gentle':
                return `🔔 *تذكير ودي* ${baseInfo}
نتفهم انشغالكم، ونذكركم بلطف بالفاتورة المستحقة أعلاه.
📞 للاستفسار أو التسديد، تواصلوا معنا
🙏 نقدر تعاونكم المستمر`;
                
            case 'firm':
                return `⚠️ *تذكير مهم* ${baseInfo}
الفاتورة متأخرة أكثر من أسبوع، يُرجى التسديد العاجل
📋 يمكنكم مراجعة تفاصيل الفاتورة معنا
📞 للتسديد أو الاستفسار، اتصلوا بنا فوراً`;
                
            case 'urgent':
                return `🚨 *تذكير عاجل* ${baseInfo}
⏰ الفاتورة متأخرة أكثر من شهر!
⚠️ قد نضطر لاتخاذ إجراءات إضافية إذا لم يتم التسديد
📞 تواصلوا معنا فوراً لتجنب أي مضاعفات`;
                
            case 'escalation':
                return `🔴 *إشعار نهائي* ${baseInfo}
⛔ الفاتورة متأخرة أكثر من شهرين
⚖️ سيتم اتخاذ الإجراءات القانونية المناسبة قريباً
📞 آخر فرصة للتسديد - اتصلوا بنا فوراً`;
                
            default:
                return `🔔 تذكير بفاتورة مستحقة ${baseInfo}`;
        }
    }
    
    formatPhoneForWhatsApp(phone) {
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        if (cleanPhone.startsWith('05')) {
            cleanPhone = '966' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('+966')) {
            cleanPhone = cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('966')) {
            cleanPhone = '966' + cleanPhone;
        }
        
        return cleanPhone;
    }
    
    async sendReminderReport(results, totalReminders) {
        const totalSent = Object.values(results).reduce((sum, cat) => sum + cat.sent, 0);
        const totalFailed = Object.values(results).reduce((sum, cat) => sum + cat.failed, 0);
        
        const report = `
🔔 *تقرير التذكيرات الذكية*
📅 ${new Date().toLocaleDateString('ar-SA')}

📊 *الإحصائيات:*
✅ تم الإرسال: ${totalSent}
❌ فشل: ${totalFailed}
📱 إجمالي التذكيرات: ${totalReminders}

📈 *التفصيل حسب النوع:*
😊 تذكير ودي (1-7 أيام): ${results.gentle.sent} ✅ ${results.gentle.failed} ❌
⚠️ تذكير مهم (8-30 يوم): ${results.firm.sent} ✅ ${results.firm.failed} ❌
🚨 تذكير عاجل (31-59 يوم): ${results.urgent.sent} ✅ ${results.urgent.failed} ❌
🔴 إشعار نهائي (60+ يوم): ${results.escalation.sent} ✅ ${results.escalation.failed} ❌

${results.escalation.sent > 0 ? `
⚖️ *تنبيه:* ${results.escalation.sent} مالك وصل للمرحلة النهائية
يُرجى المتابعة القانونية حسب السياسة المعتمدة
` : ''}

🤖 نظام التذكيرات الذكي - tar.ad
        `;
        
        await this.sendToManagement(report, 'REMINDER_REPORT');
    }
    
    async sendToManagement(message, type) {
        // نفس آلية إرسال التقارير للإدارة
        const managementNumbers = ['966501234567', '966507654321'];
        
        for (const number of managementNumbers) {
            try {
                await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: number,
                        message: message,
                        type: `MANAGEMENT_${type}`
                    })
                });
                
                await this.delay(1000);
                
            } catch (error) {
                console.error('فشل إرسال تقرير التذكيرات:', error);
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

---

## **التغييرات الجديدة في النظام المحاسبي**

### 1. **إضافة دعم مصروفات الشركة:**
- تم إضافة إمكانية تسجيل مصروفات الشركة بشكل منفصل عن مصروفات الملاك.
- تصنيف المصروفات إلى نوعين: مصروفات ملاك (OWNER_EXPENSE) ومصروفات شركة (COMPANY_EXPENSE).

### 2. **تحسينات على خدمات التقارير:**
- تقارير مفصلة للأرباح والخسائر تشمل إيرادات الشركة ومصروفاتها.
- تقارير التزامات الملاك توضح المستحقات والتفاصيل المالية الأخرى.

### 3. **نظام فوترة تلقائي للملاك:**
- إنشاء فواتير شهرية تلقائياً لكل مالك بناءً على المستحقات.
- إرسال الفواتير عبر البريد الإلكتروني والواتساب.

### 4. **تحسينات على خدمات التكامل المحاسبي:**
- تحسينات على كيفية معالجة عقود الإيجار والمصروفات المرتبطة بها.
- دعم أفضل لتحديث التزامات الملاك ومعالجة مصروفات الصيانة.

### 5. **إضافة خدمات جديدة:**
- خدمة تصنيف المصروفات بشكل ذكي بناءً على البيانات المدخلة.
- خدمة معالجة مصروفات متقدمة تدعم أنواع جديدة من المصروفات.

### 6. **تحسينات على مستوى الأمان والموثوقية:**
- تحسينات على كيفية تسجيل المعاملات المالية وضمان دقتها.
- تحسينات على مستوى الأمان عند التعامل مع بيانات العملاء والمعاملات المالية.

### 7. **تغييرات طفيفة وتحسينات عامة:**
- تحسينات على مستوى الأداء وسرعة الاستجابة.
- إصلاحات للأخطاء وتحسينات على واجهة المستخدم.

---

## **ملاحظات ختامية:**
- يُرجى من جميع المستخدمين مراجعة التغييرات الجديدة وتجربة الميزات المحاسبية المتقدمة.
- لمزيد من المعلومات والدعم، يُرجى التواصل مع فريق الدعم الفني.
