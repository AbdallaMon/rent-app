-- إضافة حقل اللغة إلى جدول العملاء وتعيين اللغة الإنجليزية لجميع العملاء

-- التحقق من وجود حقل language في جدول Client
SET @ColumnExist := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'kevxncte_rent_db'
  AND TABLE_NAME = 'Client'
  AND COLUMN_NAME = 'language'
);

-- إذا كان الحقل غير موجود، قم بإضافته
SET @query = IF(@ColumnExist = 0, 
  'ALTER TABLE `Client` ADD COLUMN `language` ENUM("ENGLISH", "ARABIC") NOT NULL DEFAULT "ENGLISH"',
  'SELECT "حقل اللغة موجود بالفعل في جدول العملاء" AS result'
);

-- تنفيذ الاستعلام
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- تحديث قيم اللغة للعملاء الحاليين إلى الإنجليزية
UPDATE `Client` SET `language` = 'ENGLISH' WHERE 1=1;

-- التحقق من عدد العملاء الذين تم تحديث لغتهم
SELECT COUNT(*) AS 'عدد العملاء الذين تم تحديث لغتهم إلى الإنجليزية' FROM `Client` WHERE `language` = 'ENGLISH';
