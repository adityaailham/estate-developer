CREATE TABLE `projects` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE `houses` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `project_id` INT NOT NULL,
  `block_number` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `selling_price` DECIMAL(15,2) DEFAULT 0.00,
  `progress_percent` INT DEFAULT 0,
  `status` TEXT DEFAULT 'Belum Mulai',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
CREATE TABLE `materials` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `default_price` DECIMAL(15,2) DEFAULT 0.00,
  `minimum_stock` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `warehouse_stocks` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `material_id` INT UNIQUE NOT NULL,
  `quantity` DECIMAL(12,2) DEFAULT 0.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE
);
CREATE TABLE `suppliers` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `kepala_tukang` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `rab_templates` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `house_type` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `rab_template_items` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `rab_template_id` INT NOT NULL,
  `item_type` TEXT NOT NULL,
  `material_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `estimated_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `estimated_price`) STORED, phase TEXT DEFAULT "Umum", work_volume DECIMAL(10,2) DEFAULT NULL, work_unit VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (`rab_template_id`) REFERENCES `rab_templates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL
);
CREATE TABLE `house_rabs` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `house_id` INT UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE CASCADE
);
CREATE TABLE `house_rab_items` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `house_rab_id` INT NOT NULL,
  `item_type` TEXT NOT NULL,
  `material_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `estimated_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `estimated_price`) STORED, phase TEXT DEFAULT "Umum", work_volume DECIMAL(10,2) DEFAULT NULL, work_unit VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (`house_rab_id`) REFERENCES `house_rabs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL
);
CREATE TABLE `purchases` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `supplier_id` INT NOT NULL,
  `invoice_number` VARCHAR(100) UNIQUE NOT NULL,
  `purchase_date` DATE NOT NULL,
  `total_amount` DECIMAL(15,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`)
);
CREATE TABLE `purchase_items` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `purchase_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `price_unit` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (`quantity` * `price_unit`) STORED,
  `destination_type` TEXT NOT NULL,
  `house_id` INT NULL,
  `qty_remaining` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`),
  FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE SET NULL
);
CREATE TABLE `material_mutations` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `material_id` INT NOT NULL,
  `type` TEXT NOT NULL,
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
);
CREATE TABLE `borongan_contracts` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `house_id` INT NOT NULL,
  `kepala_tukang_id` INT NOT NULL,
  `work_name` VARCHAR(255) NOT NULL,
  `contract_value` DECIMAL(15,2) NOT NULL,
  `status` TEXT DEFAULT 'Aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kepala_tukang_id`) REFERENCES `kepala_tukang`(`id`)
);
CREATE TABLE `borongan_payments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `contract_id` INT NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contract_id`) REFERENCES `borongan_contracts`(`id`) ON DELETE CASCADE
);
CREATE TABLE house_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  stock_quantity DECIMAL(12,2) DEFAULT 0.00,
  UNIQUE(house_id, material_id)
);
CREATE TABLE material_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      phase TEXT,
      quantity_used DECIMAL(12,2),
      usage_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , work_volume DECIMAL(10,2) DEFAULT NULL, work_unit VARCHAR(50) DEFAULT NULL)