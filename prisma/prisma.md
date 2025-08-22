generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "mysql"
url = env("DATABASE_URL")
}

model State {
id Int @id @default(autoincrement())
name String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
cities City[]
properties Property[]
}

model City {
id Int @id @default(autoincrement())
name String
stateId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
state State @relation(fields: [stateId], references: [id], onDelete: Cascade)
districts District[]
properties Property[]

@@index([stateId], map: "City_stateId_fkey")
}

model District {
id Int @id @default(autoincrement())
name String
cityId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
city City @relation(fields: [cityId], references: [id], onDelete: Cascade)
neighbours Neighbour[]
properties Property[]

@@index([cityId], map: "District_cityId_fkey")
}

model Neighbour {
id Int @id @default(autoincrement())
name String
districtId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
district District @relation(fields: [districtId], references: [id], onDelete: Cascade)
properties Property[]

@@index([districtId], map: "Neighbour_districtId_fkey")
}

model PropertyType {
id Int @id @default(autoincrement())
name String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
properties Property[]
}

model UnitType {
id Int @id @default(autoincrement())
name String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
units Unit[]
}

model Property {
id Int @id @default(autoincrement())
name String
typeId Int
propertyId String
voucherNumber String?
location String?
street String?
stateId Int
cityId Int
districtId Int?
neighbourId Int?
price Float
dateOfBuilt DateTime
numElevators Int
numParkingSpaces Int
builtArea Float
buildingGuardName String
buildingGuardPhone String?
buildingGuardId String?
bankId Int
bankAccountId Int?
managementCommission Float
plateNumber String
clientId Int
collectorId Int?
deletedAt DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
attachments Attachment[]
complaints Complaint[]
electricityMeters ElectricityMeter[]
expenses Expense[]
incomes Income[]
invoices Invoice[]
maintenances Maintenance[]
maintenanceRequests MaintenanceRequest[]
payments Payment[]
bankAccount BankAccount? @relation(fields: [bankAccountId], references: [id])
bank Bank @relation("PropertyBank", fields: [bankId], references: [id])
city City @relation(fields: [cityId], references: [id])
client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
collector Collector? @relation(fields: [collectorId], references: [id])
district District? @relation(fields: [districtId], references: [id])
neighbour Neighbour? @relation(fields: [neighbourId], references: [id])
state State @relation(fields: [stateId], references: [id])
type PropertyType @relation(fields: [typeId], references: [id])
units Unit[]
users UserProperty[]
journalLines JournalLine[]

@@index([bankAccountId], map: "Property_bankAccountId_fkey")
@@index([bankId], map: "Property_bankId_fkey")
@@index([cityId], map: "Property_cityId_fkey")
@@index([clientId], map: "Property_clientId_fkey")
@@index([collectorId], map: "Property_collectorId_fkey")
@@index([districtId], map: "Property_districtId_fkey")
@@index([neighbourId], map: "Property_neighbourId_fkey")
@@index([stateId], map: "Property_stateId_fkey")
@@index([typeId], map: "Property_typeId_fkey")
}

model ElectricityMeter {
id Int @id @default(autoincrement())
meterId String
name String
propertyId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

@@index([propertyId], map: "ElectricityMeter_propertyId_fkey")
}

model Attachment {
id Int @id @default(autoincrement())
url String?
propertyId Int?
rentAgreementId Int?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
property Property? @relation(fields: [propertyId], references: [id])
rentAgreement RentAgreement? @relation(fields: [rentAgreementId], references: [id])

@@index([propertyId], map: "Attachment_propertyId_fkey")
@@index([rentAgreementId], map: "Attachment_rentAgreementId_fkey")
}

model Unit {
id Int @id @default(autoincrement())
number String?
yearlyRentPrice Float?
electricityMeter String?
numBedrooms Int?
floor Int
numBathrooms Int?
numACs Int?
numLivingRooms Int?
numKitchens Int?
numSaloons Int?
unitId String?
notes String?
typeId Int?
propertyId Int
clientId Int?
deletedAt DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
complaints Complaint[]
maintenances Maintenance[]
maintenanceRequests MaintenanceRequest[]
payments Payment[]
rentAgreements RentAgreement[]
client Client? @relation(fields: [clientId], references: [id])
property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
type UnitType? @relation(fields: [typeId], references: [id], onDelete: Restrict)
journalLines JournalLine[]

@@index([clientId], map: "Unit_clientId_fkey")
@@index([propertyId], map: "Unit_propertyId_fkey")
@@index([typeId], map: "Unit_typeId_fkey")
}

model ContractExpense {
id Int @id @default(autoincrement())
name String
value Float
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
rentAgreements ContractExpenseToRentAgreement[] @relation("ContractExpenseToRentAgreementToContractExpense")
}

model RentAgreement {
id Int @id @default(autoincrement())
rentAgreementNumber String
startDate DateTime
endDate DateTime
typeId Int?
renterId Int
tax Int?
registrationFees Int?
insuranceFees Int?
unitId Int
totalPrice Float
totalContractPrice Float?
rentCollectionType RentCollectionType
status RentAgreementStatus @default(ACTIVE)
customDescription Json?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
attachments Attachment[]
contractExpenses ContractExpenseToRentAgreement[] @relation("ContractExpenseToRentAgreementToRentAgreement")
installments Installment[]
invoices Invoice[]
payments Payment[]
renter Client @relation("Renter", fields: [renterId], references: [id], onDelete: Cascade)
type RentAgreementType? @relation(fields: [typeId], references: [id])
unit Unit @relation(fields: [unitId], references: [id], onDelete: Cascade)
journalLines JournalLine[]

@@index([renterId], map: "RentAgreement_renterId_fkey")
@@index([typeId], map: "RentAgreement_typeId_fkey")
@@index([unitId], map: "RentAgreement_unitId_fkey")
}

model ContractExpenseToRentAgreement {
id Int @id @default(autoincrement())
contractExpenseId Int
rentAgreementId Int
paidAmount Float @default(0)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
contractExpense ContractExpense @relation("ContractExpenseToRentAgreementToContractExpense", fields: [contractExpenseId], references: [id])
rentAgreement RentAgreement @relation("ContractExpenseToRentAgreementToRentAgreement", fields: [rentAgreementId], references: [id])
invoices Invoice[]
payments Payment[]

@@index([contractExpenseId], map: "ContractExpenseToRentAgreement_contractExpenseId_fkey")
@@index([rentAgreementId], map: "ContractExpenseToRentAgreement_rentAgreementId_fkey")
}

model RentAgreementType {
id Int @id @default(autoincrement())
title String
description Json
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
rentAgreements RentAgreement[]
}

model Installment {
id Int @id @default(autoincrement())
startDate DateTime
endDate DateTime
status Boolean
type PaymentTypeMethod?
bankId Int?
rentAgreementId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
bank Bank? @relation(fields: [bankId], references: [id])
rentAgreement RentAgreement @relation(fields: [rentAgreementId], references: [id], onDelete: Cascade)
invoices Invoice[]
payments Payment[]

@@index([bankId], map: "Installment_bankId_fkey")
@@index([rentAgreementId], map: "Installment_rentAgreementId_fkey")
}

model MaintenanceInstallment {
id Int @id @default(autoincrement())
amount Float
date DateTime
startDate DateTime
endDate DateTime
status Boolean
type PaymentTypeMethod?
bankId Int?
maintenanceId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
invoices Invoice[]
bank Bank? @relation(fields: [bankId], references: [id])
maintenance Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)
payments Payment[]

@@index([bankId], map: "MaintenanceInstallment_bankId_fkey")
@@index([maintenanceId], map: "MaintenanceInstallment_maintenanceId_fkey")
}

model Maintenance {
id Int @id @default(autoincrement())
description String
cost Float
date DateTime
propertyId Int
ownerId Int?
unitId Int?
typeId Int
totalPrice Float
currentStatus Float @default(0)
isPaid Boolean
payEvery PayEvery?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
invoices Invoice[]
client Client? @relation(fields: [ownerId], references: [id], onDelete: Cascade)
property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
type PropertyExpenseType @relation(fields: [typeId], references: [id])
unit Unit? @relation(fields: [unitId], references: [id])
installments MaintenanceInstallment[]
payments Payment[]
journalLines JournalLine[]

@@index([ownerId], map: "Maintenance_ownerId_fkey")
@@index([propertyId], map: "Maintenance_propertyId_fkey")
@@index([typeId], map: "Maintenance_typeId_fkey")
@@index([unitId], map: "Maintenance_unitId_fkey")
}

model PropertyExpenseType {
id Int @id @default(autoincrement())
name String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
maintenances Maintenance[]
}

model Bank {
id Int @id @default(autoincrement())
name String
country String
city String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
BankAccounts BankAccount[]
installments Installment[]
maintenanceInstallments MaintenanceInstallment[]
payments Payment[]
properties Property[] @relation("PropertyBank")
}

model User {
id Int @id @default(autoincrement())
name String?
role UserRole?
phone String?
email String @unique
password String
token String?
resetTokenTime DateTime?
resetPasswordToken String? @unique
resetPasswordExpires DateTime?
nationalId String?
deletedAt DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
privileges UserPrivilege[]
properties UserProperty[]
}

model UserProperty {
userId Int
propertyId Int
property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@id([userId, propertyId])
@@index([propertyId], map: "UserProperty_propertyId_fkey")
}

model Privilege {
id Int @id @default(autoincrement())
name String
canRead Boolean
canWrite Boolean
canDelete Boolean
canEdit Boolean
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
userPrivileges UserPrivilege[]
}

model UserPrivilege {
id Int @id @default(autoincrement())
userId Int
privilegeId Int
area PrivilegeArea
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
privilege Privilege @relation(fields: [privilegeId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([privilegeId], map: "UserPrivilege_privilegeId_fkey")
@@index([userId], map: "UserPrivilege_userId_fkey")
}

model Client {
id Int @id @default(autoincrement())
name String
nationalId String
phone String?
email String?
role ClientRole
language Language @default(ARABIC)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
lastAction ClientLastAction?
bankAccounts BankAccount[]
complaints Complaint[]
expenses Expense[]
incomes Income[]
invoicesAsOwner Invoice[] @relation("OwnerToInvoice")
invoicesAsRenter Invoice[] @relation("RenterToInvoice")
maintenances Maintenance[]
maintenanceRequests MaintenanceRequest[]
payments Payment[]
properties Property[]
rentAgreementsRenter RentAgreement[] @relation("Renter")
units Unit[]
whatsappConversations WhatsappConversation[]
whatsappIncoming WhatsappIncomingMessage[]
whatsappMessages WhatsappMessageLog[]
journalLines JournalLine[]

}

model BankAccount {
id Int @id @default(autoincrement())
bankId Int
accountName String?
accountNumber String?
clientId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
bank Bank @relation(fields: [bankId], references: [id], onDelete: Cascade)
client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
invoices Invoice[]
properties Property[]

@@index([bankId], map: "BankAccount_bankId_fkey")
@@index([clientId], map: "BankAccount_clientId_fkey")
}

model Contact {
id Int @id @default(autoincrement())
name String
phone String
description String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

model Income {
id Int @id @default(autoincrement())
amount Float
date DateTime
description String
clientId Int
propertyId Int
invoiceId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

@@index([clientId], map: "Income_clientId_fkey")
@@index([invoiceId], map: "Income_invoiceId_fkey")
@@index([propertyId], map: "Income_propertyId_fkey")
}

model Expense {
id Int @id @default(autoincrement())
amount Float
date DateTime
description String
propertyId Int
clientId Int
invoiceId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

@@index([clientId], map: "Expense_clientId_fkey")
@@index([invoiceId], map: "Expense_invoiceId_fkey")
@@index([propertyId], map: "Expense_propertyId_fkey")
}

model Collector {
id Int @id @default(autoincrement())
name String
phone String?
nationalId String?
email String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
properties Property[]
}

model Payment {
id Int @id @default(autoincrement())
amount Float
paidAmount Float @default(0)
dueDate DateTime
installmentId Int?
timeOfPayment DateTime @default(now())
paymentTypeMethod PaymentTypeMethod?
chequeNumber String?
maintenanceInstallmentId Int?
title String?
bankId Int?
status PaymentStatus
propertyId Int?
clientId Int?
unitId Int?
maintenanceId Int?
rentAgreementId Int?
contractExpenseId Int?
paymentType PaymentType?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
invoices Invoice[]
bank Bank? @relation(fields: [bankId], references: [id])
client Client? @relation(fields: [clientId], references: [id])
contractExpense ContractExpenseToRentAgreement? @relation(fields: [contractExpenseId], references: [id])
installment Installment? @relation(fields: [installmentId], references: [id], onDelete: Cascade)
maintenance Maintenance? @relation(fields: [maintenanceId], references: [id])
maintenanceInstallment MaintenanceInstallment? @relation(fields: [maintenanceInstallmentId], references: [id])
property Property? @relation(fields: [propertyId], references: [id], onDelete: Cascade)
rentAgreement RentAgreement? @relation(fields: [rentAgreementId], references: [id])
unit Unit? @relation(fields: [unitId], references: [id])

@@index([bankId], map: "Payment_bankId_fkey")
@@index([clientId], map: "Payment_clientId_fkey")
@@index([contractExpenseId], map: "Payment_contractExpenseId_fkey")
@@index([installmentId], map: "Payment_installmentId_fkey")
@@index([maintenanceId], map: "Payment_maintenanceId_fkey")
@@index([maintenanceInstallmentId], map: "Payment_maintenanceInstallmentId_fkey")
@@index([propertyId], map: "Payment_propertyId_fkey")
@@index([rentAgreementId], map: "Payment_rentAgreementId_fkey")
@@index([unitId], map: "Payment_unitId_fkey")
}

model Invoice {
id Int @id @default(autoincrement())
displayId String? @unique
amount Float
description String
title String?
paymentTypeMethod PaymentTypeMethod?
invoiceType PaymentType
bankAccountId Int?
chequeNumber String?
propertyId Int?
renterId Int?
ownerId Int?
rentAgreementId Int?
installmentId Int?
maintenanceId Int?
maintenanceInstallmentId Int?
contractExpenseId Int?
paymentId Int?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
expenses Expense[]
incomes Income[]
bankAccount BankAccount? @relation(fields: [bankAccountId], references: [id])
contractExpense ContractExpenseToRentAgreement? @relation(fields: [contractExpenseId], references: [id])
installment Installment? @relation(fields: [installmentId], references: [id])
maintenance Maintenance? @relation(fields: [maintenanceId], references: [id])
maintenanceInstallment MaintenanceInstallment? @relation(fields: [maintenanceInstallmentId], references: [id])
owner Client? @relation("OwnerToInvoice", fields: [ownerId], references: [id], onDelete: Cascade)
payment Payment? @relation(fields: [paymentId], references: [id])
property Property? @relation(fields: [propertyId], references: [id])
rentAgreement RentAgreement? @relation(fields: [rentAgreementId], references: [id])
renter Client? @relation("RenterToInvoice", fields: [renterId], references: [id], onDelete: Cascade)

@@index([bankAccountId], map: "Invoice_bankAccountId_fkey")
@@index([contractExpenseId], map: "Invoice_contractExpenseId_fkey")
@@index([installmentId], map: "Invoice_installmentId_fkey")
@@index([maintenanceId], map: "Invoice_maintenanceId_fkey")
@@index([maintenanceInstallmentId], map: "Invoice_maintenanceInstallmentId_fkey")
@@index([ownerId], map: "Invoice_ownerId_fkey")
@@index([paymentId], map: "Invoice_paymentId_fkey")
@@index([propertyId], map: "Invoice_propertyId_fkey")
@@index([rentAgreementId], map: "Invoice_rentAgreementId_fkey")
@@index([renterId], map: "Invoice_renterId_fkey")
}

model MaintenanceRequest {
id String @id @default(cuid())
displayId String? @unique
clientId Int
propertyId Int?
unitId Int?
description String @db.Text
type MaintenanceType @default(OTHER)
priority Priority @default(MEDIUM)
status RequestStatus @default(PENDING)
requestDate DateTime @default(now())
completedAt DateTime?
assignedTo String?
notes String? @db.Text
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
property Property? @relation(fields: [propertyId], references: [id])
unit Unit? @relation(fields: [unitId], references: [id])

@@index([clientId])
@@index([status])
@@index([priority])
@@index([propertyId], map: "MaintenanceRequest_propertyId_fkey")
@@index([unitId], map: "MaintenanceRequest_unitId_fkey")
}

model Complaint {
id String @id @default(cuid())
displayId String? @unique
clientId Int
propertyId Int?
unitId Int?
description String @db.Text
type ComplaintCategory @default(OTHER)
priority Priority @default(MEDIUM)
status RequestStatus @default(PENDING)
submittedAt DateTime @default(now())
resolvedAt DateTime?
assignedTo String?
resolution String? @db.Text
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
property Property? @relation(fields: [propertyId], references: [id])
unit Unit? @relation(fields: [unitId], references: [id])

@@index([clientId])
@@index([status])
@@index([type])
@@index([propertyId], map: "Complaint_propertyId_fkey")
@@index([unitId], map: "Complaint_unitId_fkey")
}

model WhatsappMessageLog {
id String @id @default(cuid())
messageId String @unique
recipient String
messageType String
templateName String?
language String?
status String
metadata Json?
sentAt DateTime @default(now())
updatedAt DateTime @default(now())
clientId Int?
client Client? @relation(fields: [clientId], references: [id])

@@index([clientId], map: "WhatsappMessageLog_clientId_fkey")
}

model WhatsappIncomingMessage {
id String @id @default(cuid())
messageId String @unique
sender String
messageType String
content String? @db.Text
language String?
metadata Json?
receivedAt DateTime @default(now())
clientId Int?
client Client? @relation(fields: [clientId], references: [id])

@@index([clientId], map: "WhatsappIncomingMessage_clientId_fkey")
}

model WhatsappConversation {
id String @id @default(cuid())
phoneNumber String
clientId Int?
startedAt DateTime @default(now())
lastMessageAt DateTime @default(now())
status String
topic String?
messageCount Int @default(0)
metadata Json?
client Client? @relation(fields: [clientId], references: [id])

@@index([phoneNumber])
@@index([clientId], map: "WhatsappConversation_clientId_fkey")
}

model WhatsappTemplate {
id String @id @default(cuid())
name String @unique
displayName String?
description String? @db.Text
category String?
languages Json?
isActive Boolean @default(true)
components Json?
createdAt DateTime @default(now())
updatedAt DateTime @default(now())
}

model ReminderSettings {
id String @id @default("default_reminder_settings")
paymentReminderDays Json
contractReminderDays Json
maintenanceFollowupDays Json
maxRetries Int @default(3)
messageDelay Int @default(2000)
enableAutoReminders Boolean @default(true)
enabledReminderTypes Json
workingHoursStart String @default("09:00:00")
workingHoursEnd String @default("18:00:00")
workingDays Json
highPriorityThreshold Int @default(3)
mediumPriorityThreshold Int @default(7)
defaultLanguage String @default("ar_AE")
includeCompanySignature Boolean @default(true)
isActive Boolean @default(true)
updatedBy String?
createdAt DateTime @default(now())
updatedAt DateTime @default(now()) @updatedAt
}

model WhatsAppTeamSettings {
id String @id @default("default_team_settings")
technicianPhone String?
technicianName String? @default("الفني")
notifyTechnicianForMaintenance Boolean @default(true)
technicianWorkingHours String? @default("من 8:00 صباحاً إلى 5:00 مساءً")
customerServicePhone String?
customerServiceName String? @default("خدمة العملاء")
notifyCustomerServiceForComplaints Boolean @default(true)
notifyCustomerServiceForContacts Boolean @default(true)
customerServiceWorkingHours String? @default("من 9:00 صباحاً إلى 6:00 مساءً")
maxDailyNotifications Int @default(10)
notificationDelay Int @default(5)
enableUrgentNotifications Boolean @default(true)
enableBackupNotifications Boolean @default(false)
customNotificationMessage String? @db.Text
isActive Boolean @default(true)
updatedBy String?
createdAt DateTime @default(now())
updatedAt DateTime @default(now())
}

enum RentAgreementStatus {
CANCELED
EXPIRED
ACTIVE
}

enum RentCollectionType {
TWO_MONTHS
THREE_MONTHS
FOUR_MONTHS
SIX_MONTHS
ONE_YEAR
}

enum PaymentTypeMethod {
CASH
BANK
CHEQUE
}

enum PayEvery {
ONCE
ONE_MONTH
TWO_MONTHS
FOUR_MONTHS
SIX_MONTHS
ONE_YEAR
}

enum UserRole {
ADMIN
USER
}

enum PrivilegeArea {
HOME
FOLLOW_UP
PROPERTY
UNIT
RENT
INVOICE
MAINTENANCE
REQUEST
REPORT
OWNER
RENTER
SETTING
WHATSAPP
}

enum ClientRole {
OWNER
RENTER
}

enum PaymentStatus {
PENDING
PAID
OVERDUE
}

enum PaymentType {
RENT
TAX
INSURANCE
REGISTRATION
MAINTENANCE
CONTRACT_EXPENSE
OTHER_EXPENSE
MANAGEMENT_COMMISSION
OTHER
}

enum RequestStatus {
PENDING
IN_PROGRESS
COMPLETED
REJECTED
}

enum Priority {
LOW
MEDIUM
HIGH
URGENT
}

enum Language {
ENGLISH
ARABIC
}

enum ClientLastAction {
COMPLAINT_SUBMISSION
MAINTENANCE_REQUEST
PAYMENT_SUBMITTED
RENT_AGREEMENT_SIGNED
PROFILE_UPDATE
}

enum ComplaintCategory {
PROPERTY_ISSUE
RENT_ISSUE
NEIGHBOR_ISSUE
MAINTENANCE_ISSUE
NOISE_ISSUE
SECURITY_ISSUE
PAYMENT_ISSUE
SERVICE_QUALITY
OTHER
}

enum MaintenanceType {
ELECTRICAL
PLUMBING
AC_HEATING
APPLIANCES
STRUCTURAL
CLEANING
PAINTING
CARPENTRY
PEST_CONTROL
OTHER
}

// جزء المحاسبة
// ===== Enums (محاسبة) =====
enum EntrySide {
DEBIT // مدين
CREDIT // دائن
}

enum PartyType {
OWNER
RENTER
}

enum CompanyAccountType {
CHECKING // الحساب الجاري
SAVINGS // حساب التوفير/الوديعة
PETTY_CASH // صندوق نثرية
}

enum GLAccountType {
ASSET
LIABILITY
EQUITY
REVENUE
EXPENSE
}

// ===== شجرة الحسابات العامة (للإيرادات/المصروفات وغيرها، ليست للذمم) =====
model GLAccount {
id Int @id @default(autoincrement())
code String @unique
name String
type GLAccountType
isActive Boolean @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

journalLines JournalLine[]
}

// ===== حسابات الشركة النقدية/البنكية (يشمل النثرية) =====
model CompanyBankAccount {
id Int @id @default(autoincrement())
name String
accountType CompanyAccountType
openingBalance Float @default(0)
isActive Boolean @default(true)
notes String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

journalLines JournalLine[]

@@unique([name, accountType])
}

// ===== رأس القيد (نخليه بسيط ونظيف) =====
model JournalEntry {
id Int @id @default(autoincrement())
entryDate DateTime @default(now())
description String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

lines JournalLine[]

@@index([entryDate])
}

// ===== سطر القيد =====
model JournalLine {
id Int @id @default(autoincrement())
entryId Int
side EntrySide
amount Float
memo String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// هدف السطر (اختَر واحد لكل سطر):
// 1) بنك/نقدية الشركة
companyBankAccountId Int?
companyBankAccount CompanyBankAccount? @relation(fields: [companyBankAccountId], references: [id], onDelete: SetNull)

// 2) حساب من الشجرة (GL) — للإيرادات/المصروفات... (مش للذمم)
glAccountId Int?
glAccount GLAccount? @relation(fields: [glAccountId], references: [id], onDelete: SetNull)

// 3) Subledger (ذمم) — المالك/المستأجر
partyType PartyType?
partyClientId Int?
partyClient Client? @relation(fields: [partyClientId], references: [id], onDelete: SetNull)

// 4) تسمية حرة (لو مش عايز تربط بكيان)
counterpartyLabel String?

// سياق تشغيلي اختياري
propertyId Int?
property Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

unitId Int?
unit Unit? @relation(fields: [unitId], references: [id], onDelete: SetNull)

maintenanceId Int?
maintenance Maintenance? @relation(fields: [maintenanceId], references: [id], onDelete: SetNull)

rentAgreementId Int?
rentAgreement RentAgreement? @relation(fields: [rentAgreementId], references: [id], onDelete: SetNull)

// حالة التسوية (اختياري - فلاغ/تسهيل)
isSettled Boolean? @default(false)
settledAt DateTime?

// Backrefs
entry JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
settlementLines JournalSettlementLine[]

@@index([entryId])
@@index([companyBankAccountId])
@@index([glAccountId])
@@index([partyClientId, partyType])
@@index([propertyId])
@@index([unitId])
@@index([maintenanceId])
@@index([rentAgreementId])
}

// ===== رأس تسوية: تربط أكتر من سطر مدين مع أكتر من سطر دائن =====
model JournalSettlement {
id Int @id @default(autoincrement())
matchedAt DateTime @default(now())
note String?

lines JournalSettlementLine[]
}

// ===== جدول وسيط للتسوية (Many-to-Many) =====
model JournalSettlementLine {
id Int @id @default(autoincrement())
settlementId Int
lineId Int
side EntrySide // اتجاه سطر القيد نفسه داخل التسوية
amountMatched Float
matchedAt DateTime @default(now())
note String?

settlement JournalSettlement @relation(fields: [settlementId], references: [id], onDelete: Cascade)
line JournalLine @relation(fields: [lineId], references: [id], onDelete: Cascade)

@@unique([settlementId, lineId])
@@index([settlementId])
@@index([lineId])
}
