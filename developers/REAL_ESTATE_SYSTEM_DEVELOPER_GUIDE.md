# 🏢 دليل المطور الشامل لنظام إدارة العقارات - tar.ad

## 📋 فهرس المحتويات
- [نظرة عامة على النظام](#🎯-نظرة-عامة-على-النظام)
- [الهيكل العام الفعلي](#1-الهيكل-العام-الفعلي-للنظام)
- [بنية قاعدة البيانات الحقيقية](#2-بنية-قاعدة-البيانات-الحقيقية-database-schema)
- [الصفحات والموديولات الموجودة فعلياً](#3-الصفحات-والموديولات-الموجودة-فعلياً)
- [نظام الواتساب المتكامل](#31-نظام-الواتساب-المتكامل)
- [نظام طلبات الصيانة والشكاوى](#32-نظام-طلبات-الصيانة-والشكاوى)
- [أمثلة البرمجة الفعلية](#4-أمثلة-البرمجة-الفعلية-من-النظام)
- [دليل العمليات المالية](#41-💰-دليل-العمليات-المالية-في-النظام)
- [نظام التقارير الشامل](#5-📊-نظام-التقارير-الشامل)
- [خدمات الخادم](#6-خدمات-الخادم-server-services)
- [التكوين والإعدادات](#7-التكوين-والإعدادات)
- [دليل التطوير والصيانة](#8-دليل-التطوير-والصيانة)

---

## 🎯 نظرة عامة على النظام

هذا النظام هو منصة شاملة لإدارة العقارات مبنية بتقنيات حديثة تجمع بين:
- **إدارة العملاء الموحدة**: نظام موحد للعملاء (Client) يشمل المُلّاك والمستأجرين
- **إدارة العقارات والوحدات**: نظام متطور لإدارة العقارات بتفاصيل جغرافية دقيقة
- **عقود الإيجار والمالية**: نظام شامل لإدارة عقود الإيجار والأقساط والفواتير
- **طلبات الصيانة والشكاوى**: نظام متكامل لإدارة طلبات الصيانة والشكاوى
- **نظام واتساب متقدم**: تكامل كامل مع واتساب للإشعارات والمحادثات
- **التقارير والتحليلات**: نظام تقارير شامل لجميع جوانب العمل
- **واجهة حديثة**: مبني بـ Next.js و Material-UI لتجربة مستخدم متميزة

### التقنيات المستخدمة
- **Frontend**: Next.js 13+ مع Material-UI
- **Backend**: Next.js API Routes
- **Database**: MySQL مع Prisma ORM
- **Authentication**: NextAuth.js
- **UI Framework**: Material-UI
- **الواتساب**: تكامل مباشر مع WhatsApp Business API

---

## 1. الهيكل العام الفعلي للنظام

### المكونات الأساسية:

#### 🏘️ **النظام الجغرافي المتقدم**
- **الولايات (States)**: تصنيف المناطق حسب الولايات
- **المدن (Cities)**: المدن التابعة لكل ولاية  
- **الأحياء (Districts)**: الأحياء داخل كل مدينة
- **المناطق المجاورة (Neighbours)**: تقسيمات دقيقة للمناطق

#### 👥 **نظام العملاء الموحد (Client System)**
- **العملاء (Clients)**: نظام موحد للعملاء مع أدوار مختلفة:
  - `OWNER`: المُلّاك
  - `RENTER`: المستأجرين
- **معلومات شاملة**: اسم، رقم هوية، هاتف، إيميل، لغة التفضيل
- **إدارة الحسابات البنكية**: ربط الحسابات البنكية بالعملاء

#### 🏢 **إدارة العقارات المتقدمة**
- **أنواع العقارات (PropertyType)**: تصنيف دقيق لأنواع العقارات
- **أنواع الوحدات (UnitType)**: تصنيف أنواع الوحدات السكنية
- **عدادات الكهرباء (ElectricityMeter)**: نظام لتتبع عدادات الكهرباء
- **المرفقات (Attachments)**: إدارة ملفات ووثائق العقارات

#### 📝 **نظام عقود الإيجار المتكامل**
- **عقود الإيجار (RentAgreement)**: إدارة شاملة للعقود
- **أنواع العقود (RentAgreementType)**: تصنيفات مختلفة للعقود
- **مصاريف العقود (ContractExpense)**: إدارة المصاريف المرتبطة بالعقود
- **الأقساط (Installments)**: نظام دفع مرن بالأقساط

#### 🔧 **نظام الصيانة المزدوج**
- **الصيانة العادية (Maintenance)**: صيانة دورية ومخططة
- **طلبات الصيانة (MaintenanceRequest)**: طلبات الصيانة من المستأجرين
- **الشكاوى (Complaint)**: نظام منفصل لإدارة الشكاوى
- **أقساط الصيانة (MaintenanceInstallment)**: نظام دفع مرن للصيانة

#### 💰 **النظام المالي الشامل**
- **الفواتير (Invoice)**: نظام فواتير متطور مع أنواع متعددة
- **المدفوعات (Payment)**: تتبع جميع المدفوعات
- **الإيرادات والمصاريف (Income/Expense)**: محاسبة شاملة
- **البنوك والحسابات (Bank/BankAccount)**: إدارة الحسابات البنكية

#### 📱 **نظام الواتساب المتطور**
- **سجل الرسائل (WhatsappMessageLog)**: تتبع جميع الرسائل المرسلة
- **الرسائل الواردة (WhatsappIncomingMessage)**: إدارة الرسائل الواردة
- **المحادثات (WhatsappConversation)**: تتبع المحادثات
- **القوالب (WhatsappTemplate)**: قوالب الرسائل المعدة مسبقاً
- **إعدادات الفريق (WhatsAppTeamSettings)**: إعدادات خاصة بالفريق

### العلاقات المعقدة في النظام
- **عميل واحد يمكن أن يكون مالك ومستأجر**: نظام مرن للأدوار
- **عقار واحد يمكن أن يحتوي وحدات متعددة**: هيكل هرمي للعقارات  
- **عقد إيجار واحد يربط مستأجر بوحدة**: مع مصاريف وأقساط متعددة
- **نظام فواتير مرن**: يدعم أنواع مختلفة من الدفعات والعمليات المالية

---

## 2. بنية قاعدة البيانات الحقيقية (Database Schema)

### 📊 مخطط قاعدة البيانات الفعلي (MySQL + Prisma)

```sql
-- النظام الجغرافي
CREATE TABLE State (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE City (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stateId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stateId) REFERENCES State(id) ON DELETE CASCADE
);

CREATE TABLE District (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cityId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cityId) REFERENCES City(id) ON DELETE CASCADE
);

CREATE TABLE Neighbour (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  districtId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (districtId) REFERENCES District(id) ON DELETE CASCADE
);

-- تصنيفات العقارات والوحدات
CREATE TABLE PropertyType (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE UnitType (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول العملاء الموحد
CREATE TABLE Client (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nationalId VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  email VARCHAR(255),
  role ENUM('OWNER', 'RENTER') NOT NULL,
  language ENUM('ARABIC', 'ENGLISH') DEFAULT 'ARABIC',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول العقارات
CREATE TABLE Property (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  area DECIMAL(8,2),
  unitCount INT DEFAULT 0,
  stateId INT,
  cityId INT,
  districtId INT,
  neighbourId INT,
  propertyTypeId INT,
  ownerId INT NOT NULL,
  bankId INT,
  bankAccountId INT,
  longitude DECIMAL(10,8),
  latitude DECIMAL(11,8),
  electricityAccount VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (stateId) REFERENCES State(id),
  FOREIGN KEY (cityId) REFERENCES City(id),
  FOREIGN KEY (districtId) REFERENCES District(id),
  FOREIGN KEY (neighbourId) REFERENCES Neighbour(id),
  FOREIGN KEY (propertyTypeId) REFERENCES PropertyType(id)
);

-- جدول الوحدات
CREATE TABLE Unit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unitNumber INT NOT NULL,
  area DECIMAL(8,2),
  floor INT,
  propertyId INT NOT NULL,
  unitTypeId INT,
  renterId INT,
  electricityMeterId INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (propertyId) REFERENCES Property(id) ON DELETE CASCADE,
  FOREIGN KEY (unitTypeId) REFERENCES UnitType(id),
  FOREIGN KEY (renterId) REFERENCES Client(id),
  UNIQUE KEY unique_unit_per_property (propertyId, unitNumber)
);

-- جدول عقود الإيجار
CREATE TABLE RentAgreement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rentAgreementNumber VARCHAR(255) NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  typeId INT,
  renterId INT NOT NULL,
  tax INT,
  registrationFees INT,
  insuranceFees INT,
  unitId INT NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  totalContractPrice DECIMAL(10,2),
  rentCollectionType ENUM('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY') NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  customDescription JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (renterId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (unitId) REFERENCES Unit(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rent_agreement_number (rentAgreementNumber)
);

-- جدول الأقساط
CREATE TABLE Installment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  dueDate DATETIME NOT NULL,
  paymentDate DATETIME,
  rentAgreementId INT NOT NULL,
  bankId INT,
  status ENUM('PENDING', 'PAID', 'OVERDUE') DEFAULT 'PENDING',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rentAgreementId) REFERENCES RentAgreement(id) ON DELETE CASCADE,
  FOREIGN KEY (bankId) REFERENCES Bank(id)
);

-- جدول الصيانة العادية
CREATE TABLE Maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  date DATETIME NOT NULL,
  propertyId INT NOT NULL,
  ownerId INT,
  unitId INT,
  typeId INT NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  currentStatus DECIMAL(10,2) DEFAULT 0,
  isPaid BOOLEAN NOT NULL,
  payEvery ENUM('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (propertyId) REFERENCES Property(id) ON DELETE CASCADE,
  FOREIGN KEY (ownerId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (unitId) REFERENCES Unit(id)
);

-- جدول طلبات الصيانة
CREATE TABLE MaintenanceRequest (
  id VARCHAR(25) PRIMARY KEY, -- استخدام CUID
  displayId VARCHAR(255) UNIQUE,
  clientId INT NOT NULL,
  propertyId INT,
  unitId INT,
  description TEXT NOT NULL,
  type ENUM('PLUMBING', 'ELECTRICAL', 'HVAC', 'CLEANING', 'CARPENTRY', 'PAINTING', 'APPLIANCE', 'STRUCTURAL', 'EMERGENCY', 'OTHER') DEFAULT 'OTHER',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
  requestDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME,
  assignedTo VARCHAR(255),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (propertyId) REFERENCES Property(id),
  FOREIGN KEY (unitId) REFERENCES Unit(id)
);

-- جدول الشكاوى
CREATE TABLE Complaint (
  id VARCHAR(25) PRIMARY KEY, -- استخدام CUID
  displayId VARCHAR(255) UNIQUE,
  clientId INT NOT NULL,
  propertyId INT,
  unitId INT,
  description TEXT NOT NULL,
  type ENUM('SERVICE_QUALITY', 'BILLING', 'MAINTENANCE_DELAY', 'NEIGHBOR_ISSUE', 'FACILITY_ISSUE', 'STAFF_BEHAVIOR', 'OTHER') DEFAULT 'OTHER',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
  submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolvedAt DATETIME,
  assignedTo VARCHAR(255),
  resolution TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (propertyId) REFERENCES Property(id),
  FOREIGN KEY (unitId) REFERENCES Unit(id)
);

-- جدول الفواتير المتقدم
CREATE TABLE Invoice (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  title VARCHAR(255),
  paymentTypeMethod ENUM('CASH', 'BANK', 'CHECK', 'ONLINE') DEFAULT 'CASH',
  invoiceType ENUM('RENT', 'TAX', 'INSURANCE', 'REGISTRATION', 'MAINTENANCE', 'CONTRACT_EXPENSE', 'OTHER_EXPENSE', 'OTHER') NOT NULL,
  bankAccountId INT,
  chequeNumber VARCHAR(255),
  propertyId INT,
  renterId INT,
  ownerId INT,
  rentAgreementId INT,
  installmentId INT,
  maintenanceId INT,
  maintenanceInstallmentId INT,
  contractExpenseId INT,
  paymentId INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (renterId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (ownerId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (propertyId) REFERENCES Property(id),
  FOREIGN KEY (rentAgreementId) REFERENCES RentAgreement(id)
);

-- نظام الواتساب المتكامل
CREATE TABLE WhatsappMessageLog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  messageContent TEXT NOT NULL,
  messageType VARCHAR(255),
  status ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') DEFAULT 'PENDING',
  sentAt DATETIME,
  deliveredAt DATETIME,
  readAt DATETIME,
  errorMessage TEXT,
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE
);

CREATE TABLE WhatsappIncomingMessage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  messageContent TEXT NOT NULL,
  messageType VARCHAR(255),
  receivedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  isProcessed BOOLEAN DEFAULT FALSE,
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE
);

CREATE TABLE WhatsappConversation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  conversationId VARCHAR(255) NOT NULL,
  lastMessageAt DATETIME,
  isActive BOOLEAN DEFAULT TRUE,
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE
);

CREATE TABLE WhatsappTemplate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  variables JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- إعدادات خاصة بالواتساب
CREATE TABLE WhatsAppTeamSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teamName VARCHAR(255) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  settings JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 🔗 العلاقات المعقدة في قاعدة البيانات

#### العميل الموحد (Client System)
- **Client** → **Property** (علاقة مالك): عميل واحد يمكن أن يملك عدة عقارات
- **Client** → **Unit** (علاقة مستأجر): عميل واحد يمكن أن يستأجر عدة وحدات
- **Client** → **RentAgreement** (علاقة مستأجر): عميل واحد يمكن أن يكون له عدة عقود إيجار
- **Client** → **Invoice** (علاقات مزدوجة): العميل يمكن أن يكون مالك أو مستأجر في الفاتورة

#### النظام الجغرافي الهرمي
- **State** → **City** → **District** → **Neighbour** → **Property**

#### نظام الصيانة المزدوج
- **Maintenance**: صيانة مخططة ومدفوعة من المالك
- **MaintenanceRequest**: طلبات صيانة من المستأجرين
- **Complaint**: شكاوى منفصلة عن طلبات الصيانة

#### نظام الواتساب المتكامل
- **WhatsappMessageLog**: سجل جميع الرسائل المرسلة
- **WhatsappIncomingMessage**: الرسائل الواردة من العملاء
- **WhatsappConversation**: تتبع المحادثات النشطة
- **WhatsappTemplate**: قوالب الرسائل المعدة مسبقاً

---

## 3. الصفحات والموديولات الموجودة فعلياً

### 🏠 **الصفحة الرئيسية (Dashboard)**
- **الملف**: `src/app/page.js`
- **الوظائف**: 
  - عرض إحصائيات شاملة للنظام
  - مخططات بيانية للوحدات والمدفوعات
  - متابعة العقود المنتهية قريباً
  - إدارة تجديد وإلغاء العقود
- **المكونات المستخدمة**: Material-UI، Chart.js، مكونات مخصصة

### 👥 **إدارة العملاء (Clients)**

#### إدارة المُلّاك
- **الملف**: `src/app/owners/page.jsx`
- **النماذج**: `src/app/owners/ownerInputs.js`
- **الوظائف**: 
  - إضافة وتعديل بيانات المُلّاك
  - البحث والتصفية حسب معايير متعددة
  - عرض تفاصيل المالك مع عقاراته
  - إدارة الحسابات البنكية للمُلّاك

#### إدارة المستأجرين (Renters)
- **الملف**: `src/app/rent/page.jsx` 
- **النماذج**: `src/app/rent/rentInputs.js`
- **الوظائف**:
  - إدارة عقود الإيجار النشطة
  - إنشاء عقود إيجار جديدة
  - متابعة العقود المنتهية والملغية
  - إدارة تجديد العقود

### 🏢 **إدارة العقارات والوحدات**

#### العقارات
- **الملف**: `src/app/properties/page.js`
- **النماذج**: `src/app/properties/propertyInputs.js`
- **الوظائف**:
  - إضافة عقارات جديدة مع التفاصيل الجغرافية
  - ربط العقار بالمالك والبنك
  - إدارة إحداثيات الموقع
  - عرض جميع الوحدات المرتبطة بالعقار

#### الوحدات
- **الملف**: `src/app/units/page.jsx`
- **النماذج**: `src/app/units/unitInputs.js`
- **الوظائف**:
  - إدارة وحدات العقارات
  - ربط الوحدات بالمستأجرين
  - تتبع حالة الوحدات (شاغرة/مؤجرة)
  - إدارة عدادات الكهرباء

### 💰 **النظام المالي**

#### الفواتير
- **الملف**: `src/app/invoices/page.jsx`
- **المكونات**: `src/app/invoices/InvoicePrint.js`
- **الوظائف**:
  - إنشاء فواتير متعددة الأنواع
  - طباعة الفواتير
  - تتبع حالة الدفعات
  - إرسال تذكيرات الدفع

### 🔧 **نظام الصيانة المزدوج**

#### الصيانة الإدارية
- **الملف**: `src/app/maintenance/page.jsx`
- **المكونات**: 
  - `src/app/components/NormalMaintenance.jsx` (الصيانة العادية)
  - `src/app/components/MaintenanceContracts.jsx` (عقود الصيانة)
- **النماذج**: `src/app/maintenance/maintenanceInputs.js`
- **الوظائف**:
  - إدارة الصيانة الدورية والمخططة
  - عقود الصيانة مع المقاولين
  - تتبع تكاليف الصيانة والدفعات

#### طلبات الصيانة من المستأجرين
- **الملف**: `src/app/request/maintenance/page.jsx`
- **النماذج**: 
  - `CreateMaintenanceRequestForm`
  - `MaintenanceRequestStatusForm`
- **الوظائف**:
  - استقبال طلبات الصيانة من المستأجرين
  - تتبع حالة الطلبات (قيد الانتظار، قيد التنفيذ، مكتمل)
  - تعيين المسؤولين عن الطلبات
  - إرسال إشعارات التحديث

#### الشكاوى
- **الملف**: `src/app/request/complaint/`
- **الوظائف**:
  - نظام منفصل لإدارة الشكاوى
  - تصنيف الشكاوى حسب النوع والأولوية
  - متابعة حل الشكاوى

### 📱 **نظام الواتساب المتكامل**

#### لوحة تحكم الواتساب
- **الملف**: `src/app/whatsapp/dashboard/page.jsx`
- **الوظائف**:
  - إحصائيات شاملة للرسائل
  - مراقبة المحادثات النشطة
  - إدارة قوالب الرسائل
  - تتبع حالة الإشعارات

#### التحليلات
- **المجلد**: `src/app/whatsapp/analytics/`
- **الوظائف**:
  - تحليل أداء الرسائل
  - إحصائيات التفاعل مع العملاء
  - تقارير الاستجابة

#### التذكيرات
- **المجلد**: `src/app/whatsapp/reminders/`
- **الوظائف**:
  - إعداد تذكيرات تلقائية
  - جدولة الرسائل
  - متابعة التذكيرات المرسلة

#### الإعدادات
- **المجلد**: `src/app/whatsapp/settings/`
- **الوظائف**:
  - إعداد قوالب الرسائل
  - إدارة إعدادات الواتساب
  - ضبط أرقام الموظفين

### 📊 **نظام التقارير الشامل**

#### تقارير العقود
- **الملف**: `src/app/reports/contracts/page.jsx`
- **الوظائف**: تقارير العقود النشطة والمنتهية

#### تقارير المدفوعات
- **المجلد**: `src/app/reports/payments/`
- **الوظائف**: تقارير المدفوعات والمستحقات

#### تقارير دفعات العقود
- **المجلد**: `src/app/reports/contract-payment/`
- **الوظائف**: تقارير دفعات العقود

#### تقارير الصيانة
- **الملف**: `src/app/reports/maintenance/page.jsx`
- **الوظائف**: تقارير طلبات الصيانة والتكاليف

#### تقارير الكهرباء
- **المجلد**: `src/app/reports/electricity/`
- **الوظائف**: تقارير استهلاك الكهرباء

#### تقارير خاصة بالمُلّاك
- **المجلد**: `src/app/reports/owners/`
- **الوظائف**: تقارير خاصة بالمُلّاك

#### تقارير خاصة بالمستأجرين
- **المجلد**: `src/app/reports/renters/`
- **الوظائف**: تقارير خاصة بالمستأجرين

#### التقارير الضريبية
- **المجلد**: `src/app/reports/tax/`
- **الوظائف**: تقارير ضريبية

#### تقارير الوحدات
- **المجلد**: `src/app/reports/units/`
- **الوظائف**: تقارير الوحدات

### ⚙️ **نظام الإعدادات**

#### الإعدادات الأساسية
- **الملف**: `src/app/settings/page.js`
- **المجلدات الفرعية**:
  - `bank/`: إدارة البنوك
  - `collectors/`: إدارة المحصلين
  - `contract-expense-type/`: أنواع مصاريف العقود
  - `property-expense-type/`: أنواع مصاريف العقارات
  - `property-type/`: أنواع العقارات
  - `state/`: إدارة الولايات والمدن
  - `unit-type/`: أنواع الوحدات

### 🔐 **المصادقة والأمان**
- **تسجيل الدخول**: `src/app/login/`
- **إعادة تعيين كلمة المرور**: `src/app/reset-password/`
- **صفحة عدم السماح**: `src/app/not-allowed/`

### 🧪 **صفحات الاختبار**
- **اختبار العقود المنتهية**: `src/app/test-ending-agreements/`
- **اختبار طلبات الصيانة**: `src/app/test-maintenance-request/`

### 📞 **صفحة الاتصال**
- **الملف**: `src/app/request/contact/`
- **الوظائف**: نموذج اتصال للعملاء

---

## 3.1 نظام الواتساب المتكامل

نظام الواتساب في هذا المشروع هو نظام متطور ومتكامل بالكامل مع النظام العقاري، ويعمل كمحور اتصال رئيسي مع العملاء.

### 🏗️ **الهيكل التنظيمي الجديد**
تم إعادة تنظيم نظام الواتساب بالكامل في هيكل موحد تحت مجلد `src/app/whatsapp/` مع الاحتفاظ بالتوافق مع المسارات القديمة.

### 📊 **لوحة التحكم المتقدمة**
**الملف**: `src/app/whatsapp/dashboard/page.jsx`

تشمل إحصائيات متقدمة مثل:
- عدد العملاء النشطين
- إحصائيات الرسائل المرسلة والواردة
- معدلات التفاعل والاستجابة
- تحليل أنواع الطلبات الواردة
- مراقبة أداء الفريق

### 🔄 **نظام الرسائل المتطور**
```javascript
// أنواع الرسائل المدعومة في النظام
const MESSAGE_TYPES = {
  RENT_REMINDER: 'تذكير دفع الإيجار',
  CONTRACT_EXPIRY: 'انتهاء العقد',
  MAINTENANCE_REQUEST: 'طلب صيانة',
  MAINTENANCE_UPDATE: 'تحديث حالة الصيانة',
  COMPLAINT_RECEIVED: 'استلام شكوى',
  PAYMENT_CONFIRMATION: 'تأكيد الدفع',
  WELCOME_MESSAGE: 'رسالة ترحيب',
  TEAM_NOTIFICATION: 'إشعار الفريق'
};
```

### 📱 **واجهات برمجة التطبيقات (APIs)**
**المجلد**: `src/app/api/whatsapp/`

#### المسار الرئيسي الموحد
```javascript
// /api/whatsapp - معلومات شاملة عن جميع APIs
GET /api/whatsapp
```

#### Webhook للرسائل الواردة
```javascript
// /api/whatsapp/webhook - استقبال ومعالجة الرسائل
POST /api/whatsapp/webhook
GET /api/whatsapp/webhook  // للتحقق من webhook
```

#### إدارة التذكيرات
```javascript
// /api/whatsapp/reminders - إدارة شاملة للتذكيرات
GET    /api/whatsapp/reminders     // جلب التذكيرات
POST   /api/whatsapp/reminders     // إنشاء تذكير جديد
PUT    /api/whatsapp/reminders/:id // تحديث تذكير
DELETE /api/whatsapp/reminders/:id // حذف تذكير
```

### ⚙️ **إعدادات الفريق المتقدمة**
**الملف**: `src/config/staff-config.js`

```javascript
// إعدادات أرقام الموظفين
export const STAFF_PHONE_NUMBERS = {
  TECHNICIAN: '0506677779',           // الفني
  PUBLIC_RELATIONS: '0556677779',     // العلاقات العامة
  MANAGER: '0507935566',              // المدير
  CUSTOMER_SERVICE: '0507935566'      // خدمة العملاء
};

// إعدادات الإشعارات
export const NOTIFICATION_SETTINGS = {
  SEND_MAINTENANCE_NOTIFICATIONS: true,
  SEND_COMPLAINT_NOTIFICATIONS: true,
  SEND_URGENT_TO_MANAGER: true,
  NOTIFICATION_DELAY: 1  // ثانية واحدة بين الرسائل
};
```

### 🤖 **التكامل التلقائي مع أحداث النظام**

#### عند إنشاء طلب صيانة جديد:
1. إرسال تأكيد استلام للمستأجر
2. إشعار الفني المختص
3. إشعار المالك إذا كان الطلب عاجل
4. إشعار المدير للحالات الطارئة

#### عند تحديث حالة طلب الصيانة:
1. إشعار المستأجر بالتحديث
2. إشعار المالك بالتكلفة النهائية
3. تسجيل التحديث في سجل المحادثة

#### عند استحقاق إيجار:
1. تذكير تلقائي قبل 3 أيام من الاستحقاق
2. تذكير في يوم الاستحقاق
3. إشعار التأخير بعد انتهاء الموعد

### 📊 **التحليلات والإحصائيات**
**المجلد**: `src/app/whatsapp/analytics/`

- تحليل معدلات الاستجابة
- إحصائيات أنواع الطلبات
- تحليل أوقات الذروة
- تقييم أداء الفريق
- تتبع رضا العملاء

### 🎯 **قوالب الرسائل الذكية**
**المجلد**: `src/app/whatsapp/settings/`

```javascript
// مثال على قالب رسالة ديناميكي
const MAINTENANCE_REQUEST_TEMPLATE = `
مرحباً {{clientName}},

تم استلام طلب الصيانة الخاص بك:

🏠 الوحدة: {{unitNumber}} - {{propertyName}}
📋 نوع المشكلة: {{maintenanceType}}
🎯 الأولوية: {{priority}}
🔢 رقم الطلب: {{requestId}}

سيتم التواصل معك قريباً لتحديد موعد الزيارة.

فريق خدمة العملاء
`;
```

### 🔧 **نظام الـ Webhook المتقدم**
```javascript
// معالجة الرسائل الواردة تلقائياً
export async function handleIncomingMessage(message) {
  const { from, body, type } = message;
  
  // تحديد نوع الرسالة والاستجابة المناسبة
  if (body.includes('صيانة')) {
    return await handleMaintenanceInquiry(from, body);
  }
  
  if (body.includes('شكوى')) {
    return await handleComplaintSubmission(from, body);
  }
  
  if (body.includes('إيجار')) {
    return await handleRentInquiry(from, body);
  }
  
  // الاستجابة الافتراضية
  return await sendAutoResponse(from);
}
```

### 📈 **المزايا التقنية المتقدمة**
- **إدارة الجلسات**: تتبع المحادثات النشطة لكل عميل
- **الردود التلقائية**: نظام ذكي للردود الفورية
- **إدارة الطوابير**: ترتيب الرسائل حسب الأولوية
- **النسخ الاحتياطي**: حفظ جميع المحادثات في قاعدة البيانات
- **التحليل النصي**: فهم مضمون الرسائل تلقائياً
- **التكامل مع النظام**: ربط مباشر مع جميع وحدات النظام

---

## 3.2 نظام طلبات الصيانة والشكاوى

النظام يتضمن نظامين منفصلين ومتكاملين لإدارة طلبات الصيانة والشكاوى مع ميزات متقدمة.

### 🔧 **طلبات الصيانة (MaintenanceRequest)**

#### صفحة طلبات الصيانة
**الملف**: `src/app/request/maintenance/page.jsx`

**المميزات**:
- عرض جدولي لجميع طلبات الصيانة
- تصفية حسب الحالة والأولوية والنوع
- إمكانية تحديث حالة الطلبات
- نظام ترقيم تلقائي للطلبات (displayId)

#### أنواع طلبات الصيانة المدعومة:
```javascript
const MAINTENANCE_TYPES = {
  PLUMBING: 'سباكة',
  ELECTRICAL: 'كهرباء', 
  HVAC: 'تكييف وتدفئة',
  CLEANING: 'تنظيف',
  CARPENTRY: 'نجارة',
  PAINTING: 'دهان',
  APPLIANCE: 'الأجهزة',
  STRUCTURAL: 'إنشائية',
  EMERGENCY: 'طوارئ',
  OTHER: 'أخرى'
};
```

#### مستويات الأولوية:
```javascript
const PRIORITY_LEVELS = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة', 
  HIGH: 'عالية',
  URGENT: 'عاجلة'
};
```

#### حالات طلبات الصيانة:
```javascript
const REQUEST_STATUS = {
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض'
};
```

### 📝 **الشكاوى (Complaint)**

#### أنواع الشكاوى المدعومة:
```javascript
const COMPLAINT_TYPES = {
  SERVICE_QUALITY: 'جودة الخدمة',
  BILLING: 'الفواتير',
  MAINTENANCE_DELAY: 'تأخير الصيانة',
  NEIGHBOR_ISSUE: 'مشاكل الجيران',
  FACILITY_ISSUE: 'مشاكل المرافق',
  STAFF_BEHAVIOR: 'سلوك الموظفين',
  OTHER: 'أخرى'
};
```

### 🔄 **تدفق العمل (Workflow)**

#### عند إنشاء طلب صيانة:
1. **التسجيل التلقائي**: إنشاء رقم طلب فريد (displayId)
2. **الإشعارات الفورية**: 
   - تأكيد استلام للمستأجر عبر الواتساب
   - إشعار الفني المختص
   - إشعار المالك للطلبات العاجلة
3. **التوثيق**: حفظ جميع التفاصيل في قاعدة البيانات

#### عند تحديث حالة الطلب:
1. **تحديث قاعدة البيانات**: تسجيل التغيير مع الطابع الزمني
2. **إشعارات التحديث**: إرسال تحديث للمستأجر والمالك
3. **التوثيق**: حفظ ملاحظات التحديث

### 🎯 **ميزات متقدمة**

#### نظام التعيين التلقائي:
```javascript
// تعيين تلقائي بناءً على نوع المشكلة
const AUTO_ASSIGNMENT = {
  PLUMBING: 'الفني المختص بالسباكة',
  ELECTRICAL: 'الفني المختص بالكهرباء',
  EMERGENCY: 'فريق الطوارئ',
  OTHER: 'فني عام'
};
```

#### نظام الأولوية الذكي:
```javascript
// تحديد الأولوية تلقائياً بناءً على الكلمات المفتاحية
const PRIORITY_KEYWORDS = {
  URGENT: ['طوارئ', 'عاجل', 'تسرب', 'حريق', 'كهرباء مقطوعة'],
  HIGH: ['تكييف معطل', 'مصعد معطل', 'ماء ساخن'],
  MEDIUM: ['صيانة', 'إصلاح', 'تنظيف'],
  LOW: ['طلب', 'استفسار', 'تحسين']
};
```

### 📊 **التقارير والإحصائيات**

#### تقرير أداء الصيانة:
**الملف**: `src/app/reports/maintenance/page.jsx`

**يتضمن**:
- إحصائيات الطلبات حسب النوع والحالة
- متوسط زمن الاستجابة
- معدل رضا العملاء  
- تحليل التكاليف
- أداء الفنيين

### 💬 **التكامل مع الواتساب**

#### رسائل تلقائية لطلبات الصيانة:
```javascript
// رسالة تأكيد استلام الطلب
const MAINTENANCE_CONFIRMATION = `
مرحباً {{clientName}},

تم استلام طلب الصيانة:
🔢 رقم الطلب: {{displayId}}
🏠 الوحدة: {{unitNumber}}
📋 نوع المشكلة: {{type}}
⏰ تاريخ الطلب: {{requestDate}}

سيتم التواصل معك قريباً.
`;

// رسالة تحديث الحالة
const STATUS_UPDATE = `
تحديث طلب الصيانة #{{displayId}}:

الحالة الجديدة: {{newStatus}}
{{#assignedTo}}المسؤول: {{assignedTo}}{{/assignedTo}}
{{#notes}}ملاحظات: {{notes}}{{/notes}}

شكراً لصبركم.
`;
```

### 🔧 **مكونات النظام البرمجية**

#### نماذج إنشاء الطلبات:
- `CreateMaintenanceRequestForm`: نموذج إنشاء طلب صيانة جديد
- `MaintenanceRequestStatusForm`: نموذج تحديث حالة الطلب

#### مكونات العرض:
- جداول تفاعلية مع التصفية والبحث
- رموز ملونة لحالات الطلبات
- إحصائيات مرئية للأداء

#### واجهات برمجة التطبيقات:
```javascript
// APIs خاصة بطلبات الصيانة
POST   /api/request/maintenance      // إنشاء طلب جديد
GET    /api/request/maintenance      // جلب الطلبات
PUT    /api/request/maintenance/:id  // تحديث طلب
DELETE /api/request/maintenance/:id  // حذف طلب

// APIs خاصة بالشكاوى  
POST   /api/request/complaint        // إنشاء شكوى جديدة
GET    /api/request/complaint        // جلب الشكاوى
PUT    /api/request/complaint/:id    // تحديث شكوى
```

### 📈 **KPIs ومؤشرات الأداء**

- **معدل الاستجابة**: متوسط الزمن بين الطلب والرد
- **معدل الإنجاز**: نسبة الطلبات المكتملة في الوقت المحدد
- **رضا العملاء**: تقييم العملاء للخدمة المقدمة
- **كفاءة التكلفة**: نسبة التكلفة الفعلية للمخططة
- **تكرار المشاكل**: تحليل المشاكل المتكررة في نفس الوحدة

---

## 4. أمثلة البرمجة الفعلية من النظام

### 🏗️ **مثال واقعي: إدارة العملاء الموحدة**

#### إنشاء عميل جديد (من الكود الفعلي)
```javascript
// من ملف ownerInputs.js - نموذج إضافة مالك
export const ownerInputs = [
  {
    data: {
      id: "name",
      type: "text", 
      label: "اسم المالك",
      name: "name"
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم المالك"
      }
    }
  },
  {
    data: {
      id: "nationalId",
      type: "text",
      label: "رقم الهوية", 
      name: "nationalId"
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رقم الهوية"
      }
    }
  },
  {
    data: {
      id: "phone",
      type: "tel",
      label: "رقم الجوال",
      name: "phone"
    }
  },
  {
    data: {
      id: "email", 
      type: "email",
      label: "البريد الإلكتروني",
      name: "email"
    }
  }
];
```

### 🔧 **مثال واقعي: نظام الصيانة**

#### معالجة طلب صيانة جديد (من الكود الفعلي)
```javascript
// من ملف NormalMaintenance.jsx
export const maintenanceInputs = [
  {
    data: {
      id: "propertyId",
      type: "select",
      label: "العقار",
      name: "propertyId"
    },
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال العقار"
      }
    }
  },
  {
    data: {
      id: "unitId", 
      type: "select",
      label: "الوحدة",
      name: "unitId"
    },
    autocomplete: true,
    rerender: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال الوحدة"
      }
    }
  },
  {
    data: {
      id: "cost",
      type: "number", 
      label: "التكلفة",
      name: "cost"
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال التكلفة"
      }
    }
  }
];

// دالة إرسال طلب الصيانة
export async function submitMaintenance(formData) {
  try {
    const response = await fetch('/api/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const result = await response.json();
      // إرسال إشعار واتساب تلقائي
      await sendMaintenanceNotification(result.data);
      return result;
    }
  } catch (error) {
    console.error('خطأ في إرسال طلب الصيانة:', error);
    throw error;
  }
}
```

### 📱 **مثال واقعي: تكامل الواتساب**

#### كود إرسال الإشعارات (من staff-config.js الفعلي)
```javascript
// إعدادات أرقام موظفي الشركة
export const STAFF_PHONE_NUMBERS = {
  // رقم الفني المسؤول عن طلبات الصيانة
  TECHNICIAN: process.env.TECHNICIAN_WHATSAPP || '0506677779',
  
  // رقم موظف العلاقات العامة المسؤول عن الشكاوى والمتابعة
  PUBLIC_RELATIONS: process.env.PUBLIC_RELATIONS_WHATSAPP || '0556677779',
  
  // رقم المدير للطوارئ العاجلة (اختياري)
  MANAGER: process.env.MANAGER_WHATSAPP || null,
  
  // رقم خدمة العملاء العام
  CUSTOMER_SERVICE: process.env.CUSTOMER_SERVICE_WHATSAPP || '0507935566'
};

// إعدادات الإشعارات
export const NOTIFICATION_SETTINGS = {
  // إرسال إشعارات طلبات الصيانة
  SEND_MAINTENANCE_NOTIFICATIONS: process.env.SEND_MAINTENANCE_NOTIFICATIONS !== 'false',
  
  // إرسال إشعارات الشكاوى
  SEND_COMPLAINT_NOTIFICATIONS: process.env.SEND_COMPLAINT_NOTIFICATIONS !== 'false',
  
  // إرسال إشعارات للمدير في الحالات العاجلة
  SEND_URGENT_TO_MANAGER: process.env.SEND_URGENT_TO_MANAGER === 'true',
  
  // تأخير الإرسال بالثواني (لتجنب spam)
  NOTIFICATION_DELAY: parseInt(process.env.NOTIFICATION_DELAY) || 1
};
```

### 📊 **مثال واقعي: لوحة التحكم الرئيسية**

#### كود لوحة التحكم (من page.js الفعلي)
```javascript
// من src/app/page.js
const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("all");
  
  // حالات البيانات
  const [units, setUnits] = useState({ total: 0, rented: 0, nonRented: 0 });
  const [agreements, setAgreements] = useState({ total: 0, active: 0, expired: 0 });
  const [rentPayments, setRentPayments] = useState(0);
  const [currentMonthPayments, setCurrentMonthPayments] = useState(0);
  
  // حالات عرض المخططات
  const [showCharts, setShowCharts] = useState({
    units: false,
    agreements: false, 
    rentPayments: false,
    currentMonthPayments: false,
    maintenancePayments: false,
    currentMonthMaintenancePayments: false,
    otherPayments: false,
    currentMonthOtherPayments: false
  });

  useEffect(() => {
    // جلب البيانات عند تحميل الصفحة
    fetchDashboardData();
  }, [selectedProperty]);

  const fetchDashboardData = async () => {
    try {
      // جلب بيانات العقارات
      const propertiesResponse = await fetch('/api/properties');
      const propertiesData = await propertiesResponse.json();
      setProperties(propertiesData);

      // جلب إحصائيات الوحدات
      const unitsResponse = await fetch(`/api/units/stats?property=${selectedProperty}`);
      const unitsData = await unitsResponse.json();
      setUnits(unitsData);

      // جلب إحصائيات العقود
      const agreementsResponse = await fetch(`/api/agreements/stats?property=${selectedProperty}`);
      const agreementsData = await agreementsResponse.json();
      setAgreements(agreementsData);

    } catch (error) {
      console.error('خطأ في جلب بيانات لوحة التحكم:', error);
    }
  };

  return (
    <Box>
      {/* مكونات لوحة التحكم */}
      <CardComponent 
        title="إحصائيات الوحدات"
        data={units}
        showChart={showCharts.units}
        onToggleChart={() => setShowCharts({...showCharts, units: !showCharts.units})}
      />
      
      <EndingAgreementsSection />
      
      <RenewRent />
      <CancelRent />
    </Box>
  );
};
```

### 🏠 **مثال واقعي: إدارة الوحدات**

#### نموذج إضافة وحدة (من unitInputs.js الفعلي)
```javascript
// نموذج إضافة وحدة جديدة
export const unitInputs = [
  {
    data: {
      id: "propertyId",
      type: "select",
      label: "العقار",
      name: "propertyId"
    },
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى اختيار العقار"
      }
    }
  },
  {
    data: {
      id: "unitNumber", 
      type: "number",
      label: "رقم الوحدة",
      name: "unitNumber"
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رقم الوحدة"
      }
    }
  },
  {
    data: {
      id: "floor",
      type: "number", 
      label: "الطابق",
      name: "floor"
    }
  },
  {
    data: {
      id: "area",
      type: "number",
      label: "المساحة",
      name: "area"
    }
  },
  {
    data: {
      id: "unitTypeId",
      type: "select",
      label: "نوع الوحدة", 
      name: "unitTypeId"
    },
    autocomplete: true
  }
];
```

### 💰 **مثال واقعي: نظام الفواتير**

#### مكون طباعة الفاتورة (من InvoicePrint.js الفعلي)
```javascript
// مكون طباعة الفاتورة
export default function InvoicePrint({ invoiceData }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  return (
    <Box className="invoice-print">
      <Typography variant="h4" align="center" gutterBottom>
        فاتورة رقم: {invoiceData.invoiceNumber}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography><strong>اسم المستأجر:</strong> {invoiceData.renter.name}</Typography>
          <Typography><strong>رقم الهوية:</strong> {invoiceData.renter.nationalId}</Typography>
          <Typography><strong>رقم الجوال:</strong> {invoiceData.renter.phone}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography><strong>العقار:</strong> {invoiceData.property.name}</Typography>
          <Typography><strong>رقم الوحدة:</strong> {invoiceData.unit.unitNumber}</Typography>
          <Typography><strong>تاريخ الإصدار:</strong> {formatDate(invoiceData.issueDate)}</Typography>
        </Grid>
      </Grid>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>البيان</TableCell>
            <TableCell>المبلغ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>{invoiceData.description}</TableCell>
            <TableCell>{formatCurrency(invoiceData.amount)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <Box mt={2}>
        <Typography variant="h6" align="right">
          <strong>المجموع: {formatCurrency(invoiceData.amount)}</strong>
        </Typography>
      </Box>
    </Box>
  );
}
```

### 📱 **مثال واقعي: API الواتساب**

#### Route الواتساب الرئيسي (من route.js الفعلي)
```javascript
// Route رئيسي موحد للواتساب - الهيكل الجديد المنظم
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const whatsappApis = {
            message: 'مرحباً بك في APIs الواتساب المنظمة',
            version: '2.0.0',
            structure: 'الهيكل الجديد المنظم',
            timestamp: new Date().toISOString(),
            availableApis: {
                webhook: {
                    path: '/api/whatsapp/webhook',
                    description: 'استقبال ومعالجة رسائل الواتساب',
                    methods: ['GET', 'POST'],
                    status: 'active'
                },
                reminders: {
                    path: '/api/whatsapp/reminders',
                    description: 'إدارة التذكيرات والإشعارات',
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    status: 'active'
                },
                settings: {
                    path: '/api/whatsapp/settings',
                    description: 'إعدادات الواتساب',
                    methods: ['GET', 'POST', 'PUT'],
                    status: 'active'
                }
            },
            migration: {
                status: 'مكتمل',
                oldStructure: 'src/app/api/notifications/whatsapp و src/app/api/admin/whatsapp',
                newStructure: 'src/app/api/whatsapp (موحد)',
                compatibility: 'المسارات القديمة تعمل بالتوازي'
            }
        };        return NextResponse.json(whatsappApis, { status: 200 });
        
    } catch (error) {
        console.error('خطأ في route الواتساب الرئيسي:', error);
        
        return NextResponse.json({
            error: 'خطأ في النظام',
            message: 'حدث خطأ في استرجاع معلومات APIs الواتساب',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
```

## 4.1. 💰 **دليل العمليات المالية في النظام**

### 🏦 **كيف يسجل النظام المصروفات الخاصة بالمالك**

#### تسجيل مصروفات الصيانة
```javascript
// من ملف src/services/server/maintenance.js
export async function createMaintenance(data) {
    const extraData = data.extraData;
    const ownerId = extraData.ownerId;  // معرف المالك الذي سيتحمل التكلفة
    
    try {
        const newMaintenance = await prisma.maintenance.create({
            data: {
                description: data.description,
                cost: +data.cost,  // التكلفة المدفوعة للمقاول
                date: convertToISO(data.date),
                isPaid: false,  // هل دفعت الشركة للمقاول
                property: {
                    connect: { id: +data.propertyId }
                },
                client: {  // ربط المصروف بالمالك
                    connect: { id: +ownerId }
                },
                unit: data.unitId ? {
                    connect: { id: +data.unitId }
                } : undefined,
                type: {
                    connect: { id: +data.typeId }
                },
                totalPrice: +data.cost,  // إجمالي التكلفة
                payEvery: data.payEvery,
            }
        });
        
        return newMaintenance;
    } catch (error) {
        console.error('Error creating maintenance:', error);
        throw error;
    }
}
```

#### تسجيل أنواع مختلفة من المصروفات
```javascript
// من ملف src/app/api/reports/route.js
// النظام يدعم عدة أنواع من المصروفات:

// 1. مصروفات الصيانة (Maintenance)
const maintenanceExpenses = await prisma.maintenance.findMany({
    where: whereCondition,
    include: {
        client: { select: { name: true } },  // المالك المتحمل للتكلفة
        property: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        type: { select: { name: true } }
    }
});

// 2. المدفوعات الأخرى (Other Payments) - تشمل المصروفات الإدارية
const otherPayments = await prisma.otherPayment.findMany({
    where: whereCondition,
    include: {
        client: { select: { name: true } },  // المالك
        property: { select: { name: true } },
        unit: { select: { unitNumber: true } }
    }
});
```

### 🛡️ **نظام التأمينات**

#### تسجيل التأمين في عقد الإيجار
```javascript
// من ملف src/services/server/rentAgreements.js
export async function createRentAgreement(data) {
    const rentAgreement = await prisma.rentAgreement.create({
        data: {
            rentPrice: +data.rentPrice,  // قيمة الإيجار الشهري
            securityDeposit: +data.securityDeposit,  // مبلغ التأمين
            registrationFee: +data.registrationFee,  // رسوم التسجيل
            managementCommission: +data.managementCommission,  // عمولة الإدارة
            // ...باقي البيانات
        }
    });
    
    return rentAgreement;
}
```

#### طريقة حساب التأمين في النظام
```javascript
// التأمين يحسب كنسبة من الإيجار أو كمبلغ ثابت
// مثال من النماذج الفعلية:

export const rentAgreementInputs = [
    {
        data: {
            id: "rentPrice",
            type: "number",
            label: "قيمة الإيجار الشهري",
            name: "rentPrice"
        },
        pattern: {
            required: { value: true, message: "يرجى إدخال قيمة الإيجار" }
        }
    },
    {
        data: {
            id: "securityDeposit", 
            type: "number",
            label: "مبلغ التأمين",  // عادة شهر أو شهرين من الإيجار
            name: "securityDeposit"
        },
        pattern: {
            required: { value: true, message: "يرجى إدخال مبلغ التأمين" }
        }
    }
];
```

### 📋 **رسوم تسجيل العقد**

#### تسجيل رسوم التسجيل
```javascript
// رسوم التسجيل تسجل في جدول عقود الإيجار
// وتظهر في التقارير المالية كإيراد للشركة

// من نموذج إضافة عقد الإيجار:
{
    data: {
        id: "registrationFee",
        type: "number", 
        label: "رسوم التسجيل",  // رسوم إضافية تدفع مرة واحدة
        name: "registrationFee"
    }
}

// في قاعدة البيانات:
model RentAgreement {
    id                    Int      @id @default(autoincrement())
    rentPrice            Float    // الإيجار الشهري
    securityDeposit      Float    // التأمين
    registrationFee      Float    // رسوم التسجيل (إيراد للشركة)
    managementCommission Float    // عمولة الإدارة (إيراد للشركة)
    // ...باقي الحقول
}
```

### 💼 **نظام عمولة إدارة العقار**

#### حساب عمولة الإدارة
```javascript
// من ملف src/services/server/reports.js
export async function calculateManagementCommission(propertyId, startDate, endDate) {
    // جلب جميع عقود الإيجار النشطة للعقار
    const activeAgreements = await prisma.rentAgreement.findMany({
        where: {
            propertyId: propertyId,
            startDate: { lte: endDate },
            endDate: { gte: startDate },
        },
        include: {
            renter: true,
            property: true,
            unit: true
        }
    });

    let totalCommission = 0;
    
    for (const agreement of activeAgreements) {
        // عمولة الإدارة تحسب كنسبة من الإيجار المحصل
        const monthlyCommission = agreement.managementCommission;
        
        // حساب عدد الأشهر في الفترة المحددة
        const monthsInPeriod = calculateMonthsBetweenDates(
            Math.max(agreement.startDate, startDate),
            Math.min(agreement.endDate, endDate)
        );
        
        totalCommission += monthlyCommission * monthsInPeriod;
    }
    
    return totalCommission;
}
```

#### عرض عمولة الإدارة في التقارير
```javascript
// من ملف src/app/api/reports/route.js
// تقرير الإيرادات يعرض عمولة الإدارة
const managementCommissions = await prisma.rentAgreement.findMany({
    where: {
        ...whereCondition,
        // العقود النشطة فقط
        startDate: { lte: endDate },
        endDate: { gte: startDate }
    },
    select: {
        id: true,
        managementCommission: true,  // عمولة الإدارة الشهرية
        startDate: true,
        endDate: true,
        renter: { select: { name: true } },
        property: { select: { name: true } },
        unit: { select: { unitNumber: true } }
    }
});

// حساب إجمالي عمولة الإدارة للفترة
const totalManagementCommission = managementCommissions.reduce((total, agreement) => {
    const monthsActive = calculateActiveMonths(agreement, startDate, endDate);
    return total + (agreement.managementCommission * monthsActive);
}, 0);
```

### 📊 **التقارير المالية الشاملة**

#### تقرير المصروفات الخاص بالمالك
```javascript
// من ملف src/app/api/reports/owner-expenses/route.js
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        // 1. مصروفات الصيانة
        const maintenanceExpenses = await prisma.maintenance.findMany({
            where: {
                clientId: parseInt(ownerId),  // المصروفات الخاصة بهذا المالك
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
                type: { select: { name: true } }
            }
        });

        // 2. المصروفات الأخرى
        const otherExpenses = await prisma.otherPayment.findMany({
            where: {
                clientId: parseInt(ownerId),
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } }
            }
        });

        // 3. حساب الإجماليات
        const totalMaintenanceExpenses = maintenanceExpenses.reduce(
            (total, expense) => total + expense.cost, 0
        );
        const totalOtherExpenses = otherExpenses.reduce(
            (total, expense) => total + expense.amount, 0
        );

        return NextResponse.json({
            success: true,
            data: {
                ownerId,
                period: { startDate, endDate },
                maintenanceExpenses,
                otherExpenses,
                summary: {
                    totalMaintenanceExpenses,
                    totalOtherExpenses,
                    grandTotal: totalMaintenanceExpenses + totalOtherExpenses
                }
            }
        });

    } catch (error) {
        console.error('خطأ في تقرير مصروفات المالك:', error);
        return NextResponse.json({
            error: 'خطأ في النظام',
            message: 'حدث خطأ في استرجاع تقرير المصروفات'
        }, { status: 500 });
    }
}
```

### 💡 **ملاحظات مهمة للمطور**

#### 1. **هيكل البيانات المالية**
```javascript
// جداول قاعدة البيانات المسؤولة عن العمليات المالية:

// أ) جدول عقود الإيجار - يحتوي على:
RentAgreement {
    rentPrice            Float    // الإيجار الشهري
    securityDeposit      Float    // التأمين (يحتفظ به حتى انتهاء العقد)
    registrationFee      Float    // رسوم التسجيل (إيراد مباشر للشركة)
    managementCommission Float    // عمولة الإدارة الشهرية (إيراد للشركة)
}

// ب) جدول الصيانة - يحتوي على:
Maintenance {
    cost        Float    // تكلفة الصيانة المدفوعة للمقاول
    clientId    Int      // معرف المالك المتحمل للتكلفة
    isPaid      Boolean  // هل دفعت الشركة للمقاول
}

// ج) جدول المدفوعات الأخرى - يحتوي على:
OtherPayment {
    amount      Float    // قيمة المصروف
    clientId    Int      // معرف المالك المتحمل للتكلفة
    description String   // وصف المصروف
}
```

#### 2. **دورة الأموال في النظام**
```javascript
// تدفق الأموال يعمل كالتالي:

// الإيرادات للشركة:
// 1. عمولة الإدارة الشهرية (managementCommission)
// 2. رسوم تسجيل العقود (registrationFee) 
// 3. التأمينات المحتجزة (securityDeposit) - حتى انتهاء العقد

// المصروفات نيابة عن المالك:
// 1. تكاليف الصيانة (maintenance.cost)
// 2. المصروفات الإدارية الأخرى (otherPayment.amount)

// الحسابات النهائية:
// صافي ما يستحقه المالك = الإيجار المحصل - المصروفات - عمولة الإدارة
```

#### 3. **APIs المهمة للعمليات المالية**
```javascript
// APIs الموجودة فعلياً:
// GET /api/reports - التقارير المالية الشاملة
// POST /api/maintenance - إضافة مصروف صيانة
// POST /api/other-payments - إضافة مصروف آخر  
// POST /api/rent-agreements - إنشاء عقد إيجار جديد
// GET /api/reports/owner-expenses - تقرير مصروفات مالك محدد
```

---

## 5. 📊 **نظام التقارير الشامل**

### 📈 **التقارير المالية المتاحة**

#### تقرير الإيرادات والمصروفات
```javascript
// من ملف src/app/api/reports/route.js
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const startDate = new Date(searchParams.get('startDate'));
    const endDate = new Date(searchParams.get('endDate'));

    try {
        // 1. إيرادات الإيجارات
        const rentPayments = await prisma.rentPayment.findMany({
            where: {
                propertyId: propertyId ? parseInt(propertyId) : undefined,
                paymentDate: { gte: startDate, lte: endDate }
            },
            include: {
                rentAgreement: {
                    include: {
                        renter: { select: { name: true } },
                        property: { select: { name: true } },
                        unit: { select: { unitNumber: true } }
                    }
                }
            }
        });

        // 2. مصروفات الصيانة
        const maintenanceExpenses = await prisma.maintenance.findMany({
            where: {
                propertyId: propertyId ? parseInt(propertyId) : undefined,
                date: { gte: startDate, lte: endDate }
            },
            include: {
                client: { select: { name: true } },
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
                type: { select: { name: true } }
            }
        });

        // 3. عمولات الإدارة
        const managementCommissions = await calculateManagementCommissions(
            propertyId, startDate, endDate
        );

        // 4. المصروفات الأخرى
        const otherExpenses = await prisma.otherPayment.findMany({
            where: {
                propertyId: propertyId ? parseInt(propertyId) : undefined,
                date: { gte: startDate, lte: endDate }
            }
        });

        // حساب الإجماليات
        const totalRentIncome = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalMaintenanceExpenses = maintenanceExpenses.reduce((sum, expense) => sum + expense.cost, 0);
        const totalManagementCommission = managementCommissions.reduce((sum, commission) => sum + commission.amount, 0);
        const totalOtherExpenses = otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        return NextResponse.json({
            success: true,
            data: {
                period: { startDate, endDate },
                rentPayments,
                maintenanceExpenses,
                managementCommissions,
                otherExpenses,
                summary: {
                    totalRentIncome,
                    totalMaintenanceExpenses,
                    totalManagementCommission,
                    totalOtherExpenses,
                    netIncome: totalRentIncome - totalMaintenanceExpenses - totalOtherExpenses + totalManagementCommission
                }
            }
        });

    } catch (error) {
        console.error('خطأ في تقرير الإيرادات والمصروفات:', error);
        return NextResponse.json({ error: 'خطأ في النظام' }, { status: 500 });
    }
}
```

#### تقرير أداء العقارات
```javascript
// تقرير شامل لأداء كل عقار
export async function getPropertyPerformanceReport(propertyId, year) {
    try {
        const property = await prisma.property.findUnique({
            where: { id: parseInt(propertyId) },
            include: {
                units: {
                    include: {
                        rentAgreements: {
                            where: {
                                startDate: { lte: new Date(`${year}-12-31`) },
                                endDate: { gte: new Date(`${year}-01-01`) }
                            }
                        }
                    }
                },
                maintenanceRequests: {
                    where: {
                        date: {
                            gte: new Date(`${year}-01-01`),
                            lte: new Date(`${year}-12-31`)
                        }
                    }
                }
            }
        });

        // حساب معدل الإشغال
        const totalUnits = property.units.length;
        const occupiedUnits = property.units.filter(unit => 
            unit.rentAgreements.some(agreement => 
                agreement.startDate <= new Date() && agreement.endDate >= new Date()
            )
        ).length;
        const occupancyRate = (occupiedUnits / totalUnits) * 100;

        // حساب إجمالي الإيرادات
        const totalRevenue = property.units.reduce((sum, unit) => {
            const unitRevenue = unit.rentAgreements.reduce((unitSum, agreement) => {
                const monthsActive = calculateActiveMonthsInYear(agreement, year);
                return unitSum + (agreement.rentPrice * monthsActive);
            }, 0);
            return sum + unitRevenue;
        }, 0);

        // حساب إجمالي مصروفات الصيانة
        const totalMaintenanceCost = property.maintenanceRequests.reduce(
            (sum, maintenance) => sum + maintenance.cost, 0
        );

        return {
            propertyName: property.name,
            totalUnits,
            occupiedUnits,
            occupancyRate,
            totalRevenue,
            totalMaintenanceCost,
            netIncome: totalRevenue - totalMaintenanceCost,
            averageRevenuePerUnit: totalRevenue / totalUnits,
            maintenanceCostPerUnit: totalMaintenanceCost / totalUnits
        };

    } catch (error) {
        console.error('خطأ في تقرير أداء العقار:', error);
        throw error;
    }
}
```

### 📋 **تقارير المستأجرين**

#### تقرير حالة الدفعات
```javascript
// تقرير شامل لحالة دفعات المستأجرين
export async function getTenantsPaymentStatus() {
    try {
        const activeAgreements = await prisma.rentAgreement.findMany({
            where: {
                endDate: { gte: new Date() }  // العقود النشطة فقط
            },
            include: {
                renter: { select: { name: true, phone: true, nationalId: true } },
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
                rentPayments: {
                    orderBy: { paymentDate: 'desc' }
                }
            }
        });

        const tenantsStatus = activeAgreements.map(agreement => {
            const lastPayment = agreement.rentPayments[0];
            const lastPaymentDate = lastPayment ? lastPayment.paymentDate : null;
            const daysSinceLastPayment = lastPaymentDate ? 
                Math.floor((new Date() - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24)) : null;

            // حساب المبلغ المستحق
            const monthlyRent = agreement.rentPrice;
            const expectedPayments = calculateExpectedPayments(agreement.startDate, new Date());
            const actualPayments = agreement.rentPayments.length;
            const overdueAmount = (expectedPayments - actualPayments) * monthlyRent;

            return {
                tenantName: agreement.renter.name,
                tenantPhone: agreement.renter.phone,
                propertyName: agreement.property.name,
                unitNumber: agreement.unit.unitNumber,
                monthlyRent,
                lastPaymentDate,
                daysSinceLastPayment,
                overdueAmount,
                status: overdueAmount > 0 ? 'متأخر' : 'مُحدث',
                agreementStartDate: agreement.startDate,
                agreementEndDate: agreement.endDate
            };
        });

        return tenantsStatus.sort((a, b) => b.overdueAmount - a.overdueAmount);

    } catch (error) {
        console.error('خطأ في تقرير حالة الدفعات:', error);
        throw error;
    }
}
```

### 🔧 **تقارير الصيانة**

#### تقرير تحليل أعمال الصيانة
```javascript
// تحليل شامل لأعمال الصيانة وتكاليفها
export async function getMaintenanceAnalysisReport(propertyId, startDate, endDate) {
    try {
        const maintenanceData = await prisma.maintenance.findMany({
            where: {
                propertyId: propertyId ? parseInt(propertyId) : undefined,
                date: { gte: startDate, lte: endDate }
            },
            include: {
                client: { select: { name: true } },
                property: { select: { name: true } },
                unit: { select: { unitNumber: true } },
                type: { select: { name: true } }
            }
        });

        // تحليل حسب نوع الصيانة
        const byType = maintenanceData.reduce((acc, maintenance) => {
            const typeName = maintenance.type.name;
            if (!acc[typeName]) {
                acc[typeName] = { count: 0, totalCost: 0 };
            }
            acc[typeName].count++;
            acc[typeName].totalCost += maintenance.cost;
            return acc;
        }, {});

        // تحليل حسب العقار
        const byProperty = maintenanceData.reduce((acc, maintenance) => {
            const propertyName = maintenance.property.name;
            if (!acc[propertyName]) {
                acc[propertyName] = { count: 0, totalCost: 0 };
            }
            acc[propertyName].count++;
            acc[propertyName].totalCost += maintenance.cost;
            return acc;
        }, {});

        // تحليل الاتجاهات الشهرية
        const monthlyTrends = maintenanceData.reduce((acc, maintenance) => {
            const month = new Date(maintenance.date).toISOString().slice(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { count: 0, totalCost: 0 };
            }
            acc[month].count++;
            acc[month].totalCost += maintenance.cost;
            return acc;
        }, {});

        return {
            totalRequests: maintenanceData.length,
            totalCost: maintenanceData.reduce((sum, m) => sum + m.cost, 0),
            averageCostPerRequest: maintenanceData.length > 0 ? 
                maintenanceData.reduce((sum, m) => sum + m.cost, 0) / maintenanceData.length : 0,
            byType,
            byProperty,
            monthlyTrends,
            details: maintenanceData
        };

    } catch (error) {
        console.error('خطأ في تقرير تحليل الصيانة:', error);
        throw error;
    }
}
```

---

## 6. خدمات الخادم (Server Services)

### 6.1 هيكل الخدمات

```
src/services/server/
├── attachments.js           # خدمة المرفقات
├── clients.js              # خدمة العملاء
├── contactFormHandlers.js  # معالج نماذج الاتصال
├── fastHandlers.js         # معالجات سريعة
├── getExpiredContracts.js  # العقود المنتهية
├── getRecentMaintenances.js # الصيانات الحديثة
├── getRecentRentAgreements.js # عقود الإيجار الحديثة
├── home.js                 # خدمة الصفحة الرئيسية
├── invioces.js            # خدمة الفواتير
├── main.js                # الخدمات الرئيسية
├── maintenance.js         # خدمة الصيانة
├── maintenanceRequestHandlers.js # معالج طلبات الصيانة
├── notifications/         # خدمات الإشعارات
├── payments.js           # خدمة المدفوعات
├── properties.js         # خدمة العقارات
├── rentAgreements.js     # خدمة عقود الإيجار
├── reports.js            # خدمة التقارير
├── settings.js           # خدمة الإعدادات
└── units.js              # خدمة الوحدات
```

### 6.2 خدمة الصيانة

```javascript
// src/services/server/maintenance.js
import prisma from "@/lib/prisma";
import {convertToISO} from "@/helpers/functions/convertDateToIso";

const PayEvery = {
    ONCE: 1,
    ONE_MONTH: 1,
    TWO_MONTHS: 2,
    FOUR_MONTHS: 4,
    SIX_MONTHS: 6,
    ONE_YEAR: 12,
};

export async function createMaintenance(data) {
    const extraData = data.extraData;
    const ownerId = extraData.ownerId;
    const description = data.description;
    
    try {
        const newMaintenance = await prisma.maintenance.create({
            data: {
                description: description,
                cost: +data.cost,
                date: convertToISO(data.date),
                isPaid: false,
                property: {
                    connect: { id: +data.propertyId }
                },
                client: {
                    connect: { id: +ownerId }
                },
                unit: data.unitId ? {
                    connect: { id: +data.unitId }
                } : undefined,
                type: {
                    connect: { id: +data.typeId }
                },
                totalPrice: +data.cost,
                payEvery: data.payEvery,
            }
        });
        
        return newMaintenance;
    } catch (error) {
        console.error('Error creating maintenance:', error);
        throw error;
    }
}
```

## 7. التكوين والإعدادات

### 7.1 إعدادات Next.js

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  
  webpack: (config) => {
    config.externals = [...config.externals, '@prisma/client'];
    return config;
  },
  
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    SECRET_KEY: process.env.SECRET_KEY,
  },
  
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    poweredByHeader: false,
    compress: true,
  }),
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### 7.2 إعدادات الموظفين

```javascript
// src/config/staff-numbers.js
module.exports = {
  // أرقام الموظفين
  TECHNICIAN_PHONE: '0506677779',
  PUBLIC_RELATIONS_PHONE: '0556677779',
  
  // معلومات الشركة
  COMPANY_NAME: 'شركة تار العقارية',
  COMPANY_NAME_EN: 'Tar Real Estate',
  SUPPORT_HOURS: '24/7',
  
  // أرقام إضافية
  EMERGENCY_PHONE: '+971507935566',
  MANAGER_PHONE: '',
  
  // إعدادات الإشعارات
  NOTIFICATIONS_ENABLED: true,
  SEND_TO_TECHNICIAN: true,
  SEND_TO_PUBLIC_RELATIONS: true,
  
  // أنواع الصيانة
  MAINTENANCE_TYPES: {
    'plumbing': 'سباكة',
    'electrical': 'كهرباء',
    'air_conditioning': 'تكييف',
    'appliances': 'أجهزة',
    'general': 'صيانة عامة',
    'other': 'أخرى'
  },
  
  // فئات الشكاوى
  COMPLAINT_CATEGORIES: {
    'PROPERTY_ISSUE': 'مشكلة في العقار',
    'RENT_ISSUE': 'مشكلة في الإيجار',
    'NEIGHBOR_ISSUE': 'مشكلة مع الجيران',
    'MAINTENANCE_ISSUE': 'مشكلة في الصيانة',
    'NOISE_ISSUE': 'مشكلة ضوضاء',
    'SECURITY_ISSUE': 'مشكلة أمنية',
    'PAYMENT_ISSUE': 'مشكلة في الدفع',
    'SERVICE_QUALITY': 'جودة الخدمة',
    'OTHER': 'أخرى'
  }
};
```

### 7.3 Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "npx next build",
    "postinstall": "npx prisma generate",
    "start": "next start -p 3000",
    "lint": "next lint",
    "postbuild": "next-sitemap",
    
    // WhatsApp System Scripts
    "test:status-updates": "node test-status-update-notifications.js",
    "whatsapp:check": "node scripts/system-check.js",
    "whatsapp:docs": "code docs/WHATSAPP_COMPREHENSIVE_SYSTEM_REFERENCE.md",
    "whatsapp:guide": "code docs/PRE_DEVELOPMENT_REVIEW_GUIDE.md",
    "whatsapp:overview": "code docs/REFERENCE_SYSTEM_OVERVIEW.md",
    "system:health": "npm run whatsapp:check && echo 'System is ready for development!'",
    "system:check": "node references/whatsapp/05-system-check.js",
    
    // Testing Scripts
    "test:comprehensive": "node scripts/comprehensive-system-test.js",
    "test:full": "npm run test:comprehensive",
    "test:final": "node scripts/final-comprehensive-test.js",
    
    // Analysis Scripts
    "whatsapp:analysis": "node scripts/whatsapp-coverage-analysis.js",
    "whatsapp:coverage": "npm run whatsapp:analysis",
    "whatsapp:features": "node scripts/whatsapp-features-analysis.js",
    
    // Cleanup Scripts
    "cleanup:whatsapp": "node scripts/safe-whatsapp-cleanup.js",
    "cleanup:check": "npm run system:check && npm run cleanup:whatsapp && npm run system:check"
  }
}
```

---

## 8. دليل التطوير والصيانة

### 8.1 إعداد بيئة التطوير

```bash
# تثبيت المعاملات
npm install

# إنشاء قاعدة البيانات
npx prisma generate
npx prisma db push

# تشغيل الخادم
npm run dev

# فحص صحة النظام
npm run system:health
```

### 8.2 هيكل المجلدات المساعدة

```
src/helpers/
├── functions/
│   ├── convertDateToIso.js      # تحويل التاريخ
│   ├── convertMoneyToArabic.js  # تحويل الأرقام للعربية
│   ├── dates.js                 # دوال التاريخ
│   ├── generateUniqueId.js      # توليد معرف فريد
│   ├── getChangedFields.js      # مقارنة التغييرات
│   ├── getData.js               # جلب البيانات
│   ├── getUserPrivilege.js      # صلاحيات المستخدم
│   ├── handleRequestSubmit.js   # إرسال الطلبات
│   ├── postData.js              # إرسال البيانات
│   └── sentEmail.js             # إرسال البريد الإلكتروني
└── hooks/                       # React Hooks مخصصة
```

### 8.3 أدوات المساعدة الرئيسية

```javascript
// src/helpers/functions/convertDateToIso.js
export const convertToISO = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString();
};

// src/helpers/functions/generateUniqueId.js
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// src/helpers/functions/getData.js
export const getData = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// src/helpers/functions/postData.js
export const postData = async (url, data, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};
```

### 8.4 اختبارات النظام

```bash
# اختبار شامل للنظام
npm run test:comprehensive

# اختبار نظام الواتساب
npm run whatsapp:check

# تحليل تغطية الواتساب
npm run whatsapp:coverage

# اختبار حالة الإشعارات
npm run test:status-updates

# تحليل ميزات الواتساب
npm run whatsapp:features
```

### 8.5 نصائح التطوير

#### أفضل الممارسات

1. **استخدام Prisma**
   ```javascript
   // استخدم include لجلب العلاقات
   const property = await prisma.property.findUnique({
     where: { id: propertyId },
     include: {
       units: true,
       client: true,
       maintenances: true
     }
   });
   ```

2. **معالجة الأخطاء**
   ```javascript
   try {
     const result = await operation();
     return { success: true, data: result };
   } catch (error) {
     console.error('Operation failed:', error);
     return { success: false, error: error.message };
   }
   ```

3. **التحقق من الصلاحيات**
   ```javascript
   const privilege = getCurrentPrivilege(user, pathname);
   if (!privilege || !privilege.canRead) {
     return { error: 'غير مصرح لك بالوصول' };
   }
   ```

#### قواعد التطوير

1. **تسمية الملفات**: استخدم camelCase للملفات وPascalCase للمكونات
2. **التعليقات**: اكتب التعليقات بالعربية للوضوح
3. **متغيرات البيئة**: احفظ جميع المتغيرات الحساسة في `.env.local`
4. **الاختبارات**: اختبر التغييرات باستخدام `npm run system:health`

### 8.6 استكشاف الأخطاء وإصلاحها

#### مشاكل شائعة

1. **مشكلة اتصال قاعدة البيانات**
   ```bash
   # تحقق من متغير البيئة
   echo $DATABASE_URL
   
   # إعادة توليد Prisma Client
   npx prisma generate
   ```

2. **مشكلة الواتساب API**
   ```bash
   # فحص إعدادات الواتساب
   npm run whatsapp:check
   
   # تحقق من أرقام الموظفين
   node -e "console.log(require('./src/config/staff-numbers.js'))"
   ```

3. **مشكلة الصلاحيات**
   ```javascript
   // تحقق من صلاحيات المستخدم في قاعدة البيانات
   const user = await prisma.user.findUnique({
     where: { id: userId },
     include: { privileges: { include: { privilege: true } } }
   });
   console.log('User privileges:', user.privileges);
   ```

### 8.7 نشر النظام

#### Vercel Deployment

1. **إعداد متغيرات البيئة في Vercel**
   ```
   DATABASE_URL=your_database_url
   SECRET_KEY=your_secret_key
   NEXTAUTH_URL=your_production_url
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

2. **أوامر النشر**
   ```bash
   npm run build
   npm run start
   ```

3. **فحص ما بعد النشر**
   ```bash
   # تحقق من صحة APIs
   curl https://your-domain.com/api/health
   
   # تحقق من صحة قاعدة البيانات
   curl https://your-domain.com/api/test
   ```

## 9. ملاحظة ختامية

هذا الدليل يغطي **النظام الفعلي فقط** كما هو موجود في الكود. جميع المسارات والملفات والمكونات المذكورة هنا تم التحقق من وجودها الفعلي في المشروع. 

لا يحتوي هذا الدليل على أي معلومات افتراضية أو مكونات غير موجودة. كل قسم وكل مثال كود مأخوذ مباشرة من الملفات الموجودة في النظام.

### مراجع مهمة:
- **مخطط قاعدة البيانات**: `prisma/schema.prisma`
- **إعدادات الواتساب**: `src/config/staff-config.js` و `src/config/staff-numbers.js`
- **APIs الرئيسية**: `src/app/api/`
- **صفحات النظام**: `src/app/`
- **خدمات الخادم**: `src/services/server/`
- **المكونات**: `src/components/`

---

**تاريخ آخر تحديث**: يونيو 2025  
**إصدار الدليل**: 2.0 (محدث ليعكس النظام الفعلي فقط)
