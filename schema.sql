-- Construction Cost Management System (CCMS)
-- Database Initialization Script

CREATE DATABASE IF NOT EXISTS `estate_developer_ccms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `estate_developer_ccms`;

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Houses Table
CREATE TABLE IF NOT EXISTS `houses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `block_number` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `selling_price` DECIMAL(15,2) DEFAULT 0.00,
  `progress_percent` INT DEFAULT 0,
  `status` ENUM('Belum Mulai', 'Pembangunan', 'Selesai', 'Serah Terima') DEFAULT 'Belum Mulai',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Materials Table
CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `default_price` DECIMAL(15,2) DEFAULT 0.00,
  `minimum_stock` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Warehouse Stocks Table
CREATE TABLE IF NOT EXISTS `warehouse_stocks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT UNIQUE NOT NULL,
  `quantity` DECIMAL(12,2) DEFAULT 0.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Suppliers Table
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Kepala Tukang Table
CREATE TABLE IF NOT EXISTS `kepala_tukang` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. RAB Templates Table
CREATE TABLE IF NOT EXISTS `rab_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `house_type` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RAB Template Items Table
CREATE TABLE IF NOT EXISTS `rab_template_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rab_template_id` INT NOT NULL,
  `item_type` ENUM('Material', 'Tenaga Kerja') NOT NULL,
  `material_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `estimated_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `estimated_price`) STORED,
  FOREIGN KEY (`rab_template_id`) REFERENCES `rab_templates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. House Rabs Table
CREATE TABLE IF NOT EXISTS `house_rabs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `house_id` INT UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. House RAB Items Table
CREATE TABLE IF NOT EXISTS `house_rab_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `house_rab_id` INT NOT NULL,
  `item_type` ENUM('Material', 'Tenaga Kerja') NOT NULL,
  `material_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `estimated_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `estimated_price`) STORED,
  FOREIGN KEY (`house_rab_id`) REFERENCES `house_rabs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Purchases Table
CREATE TABLE IF NOT EXISTS `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supplier_id` INT NOT NULL,
  `invoice_number` VARCHAR(100) UNIQUE NOT NULL,
  `purchase_date` DATE NOT NULL,
  `total_amount` DECIMAL(15,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Purchase Items Table
CREATE TABLE IF NOT EXISTS `purchase_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `price_unit` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `price_unit`) STORED,
  `destination_type` ENUM('Gudang', 'Rumah') NOT NULL,
  `house_id` INT NULL,
  `qty_remaining` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`),
  FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Material Mutations Table (with FIFO data)
CREATE TABLE IF NOT EXISTS `material_mutations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL,
  `type` ENUM(
    'Beli-Gudang',
    'Beli-Rumah',
    'Keluar-Rumah',
    'Retur-Gudang',
    'Pindah-Rumah',
    'Opname-Penyesuaian'
  ) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `source_house_id` INT NULL,
  `destination_house_id` INT NULL,
  `price_unit` DECIMAL(15,2) NOT NULL,
  `total_cost` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `price_unit`) STORED,
  `mutation_date` DATE NOT NULL,
  `reference_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`),
  FOREIGN KEY (`source_house_id`) REFERENCES `houses`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`destination_house_id`) REFERENCES `houses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Borongan Contracts Table
CREATE TABLE IF NOT EXISTS `borongan_contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `house_id` INT NOT NULL,
  `kepala_tukang_id` INT NOT NULL,
  `work_name` VARCHAR(255) NOT NULL,
  `contract_value` DECIMAL(15,2) NOT NULL,
  `status` ENUM('Aktif', 'Selesai', 'Batal') DEFAULT 'Aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kepala_tukang_id`) REFERENCES `kepala_tukang`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Borongan Payments Table
CREATE TABLE IF NOT EXISTS `borongan_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contract_id` INT NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contract_id`) REFERENCES `borongan_contracts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
