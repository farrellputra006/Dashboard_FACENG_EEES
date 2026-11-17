<?php

/**
 * Energy Equity - Project Control Dashboard
 * Script Migrasi & Seeder Mandiri ke Database MySQL
 */

// 1. Baca konfigurasi dari .env jika ada
$envFile = __DIR__ . '/../.env';
$dbHost = '127.0.0.1';
$dbPort = '3306';
$dbDatabase = 'sengkang_dashboard';
$dbUsername = 'root';
$dbPassword = '';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (str_starts_with($line, '#')) continue;
        if (str_starts_with($line, 'DB_HOST=')) $dbHost = trim(substr($line, 8));
        if (str_starts_with($line, 'DB_PORT=')) $dbPort = trim(substr($line, 8));
        if (str_starts_with($line, 'DB_DATABASE=')) $dbDatabase = trim(substr($line, 12));
        if (str_starts_with($line, 'DB_USERNAME=')) $dbUsername = trim(substr($line, 12));
        if (str_starts_with($line, 'DB_PASSWORD=')) $dbPassword = trim(substr($line, 12));
    }
}

echo "=== MEMULAI MIGRASI & SEEDING MYSQL ===\n";
echo "Host: {$dbHost}:{$dbPort}\n";
echo "Database Target: {$dbDatabase}\n";
echo "User: {$dbUsername}\n\n";

try {
    // 2. Koneksi awal ke server MySQL
    $pdo = new PDO("mysql:host={$dbHost};port={$dbPort}", $dbUsername, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // 3. Buat database jika belum ada
    echo "[1/4] Membuat / memastikan database `{$dbDatabase}`... ";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbDatabase}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "BERHASIL!\n";

    // 4. Pilih database target
    $pdo->exec("USE `{$dbDatabase}`;");

    // 5. Buat tabel migrations standar Laravel
    echo "[2/4] Menyiapkan tabel skema migrasi Laravel... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `migrations` (
            `id` int unsigned NOT NULL AUTO_INCREMENT,
            `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `batch` int NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "BERHASIL!\n";

    // 6. Buat ke-7 tabel utama secara berurutan
    echo "[3/4] Menjalankan 7 migrasi tabel secara berurutan:\n";

    // A. Tabel projects
    echo "  - Migrating: projects... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `projects` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `project_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sengkang - Sulawesi Selatan',
            `contractor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `contract_value` decimal(18,2) DEFAULT NULL,
            `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
            `start_date` date DEFAULT NULL,
            `end_date` date DEFAULT NULL,
            `current_week` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'W-46',
            `cutoff_date` date DEFAULT NULL,
            `plan_cumulative` decimal(6,2) NOT NULL DEFAULT '0.00',
            `actual_cumulative` decimal(6,2) NOT NULL DEFAULT '0.00',
            `deviation` decimal(6,2) NOT NULL DEFAULT '0.00',
            `status` enum('On Track','Ahead','Delayed','Watchlist','Completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'On Track',
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `projects_project_code_unique` (`project_code`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // B. Tabel wbs_categories
    echo "  - Migrating: wbs_categories... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `wbs_categories` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_id` bigint unsigned NOT NULL,
            `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
            `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `weight_factor` decimal(6,2) NOT NULL DEFAULT '0.00',
            `prev_week_plan` decimal(6,2) NOT NULL DEFAULT '0.00',
            `prev_week_actual` decimal(6,2) NOT NULL DEFAULT '0.00',
            `this_week_plan` decimal(6,2) NOT NULL DEFAULT '0.00',
            `this_week_actual` decimal(6,2) NOT NULL DEFAULT '0.00',
            `cum_plan` decimal(6,2) NOT NULL DEFAULT '0.00',
            `cum_actual` decimal(6,2) NOT NULL DEFAULT '0.00',
            `variance` decimal(6,2) NOT NULL DEFAULT '0.00',
            `sort_order` int NOT NULL DEFAULT '0',
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `wbs_categories_project_id_foreign` (`project_id`),
            CONSTRAINT `wbs_categories_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // C. Tabel s_curve_metrics
    echo "  - Migrating: s_curve_metrics... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `s_curve_metrics` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_id` bigint unsigned NOT NULL,
            `week_label` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
            `week_number` int NOT NULL,
            `cutoff_date` date DEFAULT NULL,
            `cum_plan` decimal(6,2) DEFAULT NULL,
            `cum_actual` decimal(6,2) DEFAULT NULL,
            `cum_forecast` decimal(6,2) DEFAULT NULL,
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `s_curve_metrics_project_id_foreign` (`project_id`),
            CONSTRAINT `s_curve_metrics_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // D. Tabel subcontractor_packages
    echo "  - Migrating: subcontractor_packages... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `subcontractor_packages` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_id` bigint unsigned NOT NULL,
            `wbs_category_id` bigint unsigned DEFAULT NULL,
            `item_no` int NOT NULL,
            `work_description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `subcontractor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `po_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `completion_plan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `current_status_text` text COLLATE utf8mb4_unicode_ci,
            `plan_progress` decimal(6,2) NOT NULL DEFAULT '0.00',
            `actual_progress` decimal(6,2) NOT NULL DEFAULT '0.00',
            `status_badge` enum('Completed','On Track','Delayed','Watchlist') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'On Track',
            `obstacles` text COLLATE utf8mb4_unicode_ci,
            `notes` text COLLATE utf8mb4_unicode_ci,
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `subcontractor_packages_project_id_foreign` (`project_id`),
            KEY `subcontractor_packages_wbs_category_id_foreign` (`wbs_category_id`),
            CONSTRAINT `subcontractor_packages_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
            CONSTRAINT `subcontractor_packages_wbs_category_id_foreign` FOREIGN KEY (`wbs_category_id`) REFERENCES `wbs_categories` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // E. Tabel weekly_activities
    echo "  - Migrating: weekly_activities... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `weekly_activities` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_id` bigint unsigned NOT NULL,
            `week_label` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
            `activity_type` enum('this_week_actual','next_week_plan') COLLATE utf8mb4_unicode_ci NOT NULL,
            `discipline` enum('Engineering & QC','Procurement','Construction','HSE','General') COLLATE utf8mb4_unicode_ci NOT NULL,
            `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
            `sort_order` int NOT NULL DEFAULT '0',
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `weekly_activities_project_id_foreign` (`project_id`),
            CONSTRAINT `weekly_activities_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // F. Tabel progress_photos
    echo "  - Migrating: progress_photos... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `progress_photos` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_id` bigint unsigned NOT NULL,
            `week_label` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
            `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `caption` text COLLATE utf8mb4_unicode_ci,
            `image_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `taken_at` date DEFAULT NULL,
            `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Poleonro, Kec. Gilireng, Kab. Wajo',
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `progress_photos_project_id_foreign` (`project_id`),
            CONSTRAINT `progress_photos_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // G. Tabel hse_reports
    echo "  - Migrating: hse_reports... ";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `hse_reports` (
            `id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `project_id` bigint unsigned NOT NULL,
            `week_label` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
            `total_personnel` int NOT NULL DEFAULT '0',
            `period_manhours` int NOT NULL DEFAULT '0',
            `cumulative_manhours` int NOT NULL DEFAULT '0',
            `near_miss` int NOT NULL DEFAULT '0',
            `first_aid` int NOT NULL DEFAULT '0',
            `mtc` int NOT NULL DEFAULT '0',
            `lta` int NOT NULL DEFAULT '0',
            `fatality` int NOT NULL DEFAULT '0',
            `oil_spill` int NOT NULL DEFAULT '0',
            `gas_leaks` int NOT NULL DEFAULT '0',
            `safety_induction` int NOT NULL DEFAULT '0',
            `toolbox_meeting` int NOT NULL DEFAULT '0',
            `safety_inspection` int NOT NULL DEFAULT '0',
            `created_at` timestamp NULL DEFAULT NULL,
            `updated_at` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `hse_reports_project_id_foreign` (`project_id`),
            CONSTRAINT `hse_reports_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "OK\n";

    // Catat batch migrasi ke tabel migrations
    $migrationsList = [
        '2025_01_01_000001_create_projects_table',
        '2025_01_01_000002_create_wbs_categories_table',
        '2025_01_01_000003_create_s_curve_metrics_table',
        '2025_01_01_000004_create_subcontractor_packages_table',
        '2025_01_01_000005_create_weekly_activities_table',
        '2025_01_01_000006_create_progress_photos_table',
        '2025_01_01_000007_create_hse_reports_table',
    ];

    $checkMig = $pdo->prepare("SELECT `migration` FROM `migrations` WHERE `migration` = ?");
    $insertMig = $pdo->prepare("INSERT INTO `migrations` (`migration`, `batch`) VALUES (?, 1)");
    foreach ($migrationsList as $m) {
        $checkMig->execute([$m]);
        if (!$checkMig->fetch()) {
            $insertMig->execute([$m]);
        }
    }

    // 7. SEEDING DATA RIIL ENERGY EQUITY SENGKANG
    echo "\n[4/4] Menjalankan Seeding Data Riil ProjectControlSeeder:\n";

    $now = date('Y-m-d H:i:s');

    // Projects Data
    $projects = [
        [
            'project_code' => 'GBKB-55',
            'project_name' => 'Booster Gas Compressor 55 MMSCFD',
            'location' => 'Kampung Baru, Wajo, South Sulawesi',
            'contractor_name' => 'PT Triguna Internusa Pratama',
            'contract_value' => 25330000000.00,
            'currency' => 'IDR',
            'start_date' => '2024-10-15',
            'end_date' => '2025-10-31',
            'current_week' => 'W-46',
            'cutoff_date' => '2025-08-29',
            'plan_cumulative' => 89.82,
            'actual_cumulative' => 93.45,
            'deviation' => 3.63,
            'status' => 'Ahead',
        ],
        [
            'project_code' => 'KP9-FL',
            'project_name' => 'KP-9 Flowline Construction',
            'location' => 'Sengkang Gas Field, Wajo',
            'contractor_name' => 'PT Meindo Elang Indah',
            'contract_value' => 25330000000.00,
            'currency' => 'IDR',
            'start_date' => '2025-01-10',
            'end_date' => '2025-11-30',
            'current_week' => 'W-33',
            'cutoff_date' => '2025-08-19',
            'plan_cumulative' => 92.40,
            'actual_cumulative' => 86.20,
            'deviation' => -6.15,
            'status' => 'Delayed',
        ],
        [
            'project_code' => 'PIS-03',
            'project_name' => 'Pipeline Integrity Survey',
            'location' => 'Offshore & Main Trunkline Sengkang',
            'contractor_name' => 'PT Radiant Utama Interinsco',
            'contract_value' => 8650000000.00,
            'currency' => 'IDR',
            'start_date' => '2025-03-01',
            'end_date' => '2025-10-15',
            'current_week' => 'W-44',
            'cutoff_date' => '2025-08-18',
            'plan_cumulative' => 45.00,
            'actual_cumulative' => 45.50,
            'deviation' => 0.50,
            'status' => 'On Track',
        ],
        [
            'project_code' => 'CPF-04',
            'project_name' => 'CPF Facility Upgrade',
            'location' => 'Central Processing Facility, Kampung Baru',
            'contractor_name' => 'PT Timas Suplindo',
            'contract_value' => 32100000000.00,
            'currency' => 'IDR',
            'start_date' => '2024-11-01',
            'end_date' => '2025-12-15',
            'current_week' => 'W-44',
            'cutoff_date' => '2025-08-17',
            'plan_cumulative' => 61.20,
            'actual_cumulative' => 62.00,
            'deviation' => 0.80,
            'status' => 'On Track',
        ],
        [
            'project_code' => 'ARR-05',
            'project_name' => 'Access Road Rehabilitation',
            'location' => 'Field Access Corridors, Gilireng',
            'contractor_name' => 'PT Waskita Karya',
            'contract_value' => 4200000000.00,
            'currency' => 'IDR',
            'start_date' => '2025-02-15',
            'end_date' => '2025-09-30',
            'current_week' => 'W-44',
            'cutoff_date' => '2025-08-16',
            'plan_cumulative' => 88.00,
            'actual_cumulative' => 84.50,
            'deviation' => -3.50,
            'status' => 'Watchlist',
        ],
    ];

    $stmtProj = $pdo->prepare("
        INSERT INTO `projects` (
            `project_code`, `project_name`, `location`, `contractor_name`, `contract_value`,
            `currency`, `start_date`, `end_date`, `current_week`, `cutoff_date`,
            `plan_cumulative`, `actual_cumulative`, `deviation`, `status`, `created_at`, `updated_at`
        ) VALUES (
            :project_code, :project_name, :location, :contractor_name, :contract_value,
            :currency, :start_date, :end_date, :current_week, :cutoff_date,
            :plan_cumulative, :actual_cumulative, :deviation, :status, :created_at, :updated_at
        ) ON DUPLICATE KEY UPDATE
            `project_name` = VALUES(`project_name`),
            `contract_value` = VALUES(`contract_value`),
            `plan_cumulative` = VALUES(`plan_cumulative`),
            `actual_cumulative` = VALUES(`actual_cumulative`),
            `deviation` = VALUES(`deviation`),
            `status` = VALUES(`status`),
            `updated_at` = VALUES(`updated_at`);
    ");

    foreach ($projects as $p) {
        $p['created_at'] = $now;
        $p['updated_at'] = $now;
        $stmtProj->execute($p);
    }
    echo "  - Seeding 5 Proyek Master... SUKSES\n";

    // Ambil ID Project 1 (Booster Gas)
    $stmtFind = $pdo->prepare("SELECT `id` FROM `projects` WHERE `project_code` = 'GBKB-55'");
    $stmtFind->execute();
    $project1Id = $stmtFind->fetchColumn();

    // WBS Categories
    $wbsRows = [
        ['code' => 'A', 'name' => 'PREPARATION', 'weight_factor' => 3.06, 'prev_week_plan' => 3.06, 'prev_week_actual' => 3.06, 'this_week_plan' => 0.00, 'this_week_actual' => 0.00, 'cum_plan' => 3.06, 'cum_actual' => 3.06, 'variance' => 0.00, 'sort_order' => 1],
        ['code' => 'B.1', 'name' => 'ENGINEERING', 'weight_factor' => 2.54, 'prev_week_plan' => 2.54, 'prev_week_actual' => 2.54, 'this_week_plan' => 0.00, 'this_week_actual' => 0.00, 'cum_plan' => 2.54, 'cum_actual' => 2.54, 'variance' => 0.00, 'sort_order' => 2],
        ['code' => 'B.2', 'name' => 'PROCUREMENT', 'weight_factor' => 77.85, 'prev_week_plan' => 74.45, 'prev_week_actual' => 76.28, 'this_week_plan' => 0.47, 'this_week_actual' => 0.75, 'cum_plan' => 74.92, 'cum_actual' => 77.03, 'variance' => 2.10, 'sort_order' => 3],
        ['code' => 'B.3', 'name' => 'CONSTRUCTION', 'weight_factor' => 15.17, 'prev_week_plan' => 9.06, 'prev_week_actual' => 10.32, 'this_week_plan' => 0.47, 'this_week_actual' => 0.73, 'cum_plan' => 9.53, 'cum_actual' => 11.05, 'variance' => 1.53, 'sort_order' => 4],
        ['code' => 'B.4', 'name' => 'PRE-COMMISSIONING & START UP', 'weight_factor' => 1.37, 'prev_week_plan' => 0.00, 'prev_week_actual' => 0.00, 'this_week_plan' => 0.00, 'this_week_actual' => 0.00, 'cum_plan' => 0.00, 'cum_actual' => 0.00, 'variance' => 0.00, 'sort_order' => 5],
    ];

    $pdo->prepare("DELETE FROM `wbs_categories` WHERE `project_id` = ?")->execute([$project1Id]);
    $stmtWbs = $pdo->prepare("
        INSERT INTO `wbs_categories` (
            `project_id`, `code`, `name`, `weight_factor`, `prev_week_plan`, `prev_week_actual`,
            `this_week_plan`, `this_week_actual`, `cum_plan`, `cum_actual`, `variance`, `sort_order`, `created_at`, `updated_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $wbsMap = [];
    foreach ($wbsRows as $w) {
        $stmtWbs->execute([
            $project1Id, $w['code'], $w['name'], $w['weight_factor'], $w['prev_week_plan'],
            $w['prev_week_actual'], $w['this_week_plan'], $w['this_week_actual'],
            $w['cum_plan'], $w['cum_actual'], $w['variance'], $w['sort_order'], $now, $now
        ]);
        $wbsMap[$w['code']] = $pdo->lastInsertId();
    }
    echo "  - Seeding 5 Kategori WBS... SUKSES\n";

    // S-Curve Metrics
    $sCurveRows = [
        ['week_label' => 'W-28', 'week_number' => 28, 'cutoff_date' => '2025-04-25', 'cum_plan' => 32.10, 'cum_actual' => 31.40, 'cum_forecast' => null],
        ['week_label' => 'W-29', 'week_number' => 29, 'cutoff_date' => '2025-05-02', 'cum_plan' => 35.80, 'cum_actual' => 36.20, 'cum_forecast' => null],
        ['week_label' => 'W-30', 'week_number' => 30, 'cutoff_date' => '2025-05-09', 'cum_plan' => 40.10, 'cum_actual' => 41.50, 'cum_forecast' => null],
        ['week_label' => 'W-31', 'week_number' => 31, 'cutoff_date' => '2025-05-16', 'cum_plan' => 44.60, 'cum_actual' => 46.00, 'cum_forecast' => null],
        ['week_label' => 'W-32', 'week_number' => 32, 'cutoff_date' => '2025-05-23', 'cum_plan' => 49.30, 'cum_actual' => 51.20, 'cum_forecast' => null],
        ['week_label' => 'W-33', 'week_number' => 33, 'cutoff_date' => '2025-05-30', 'cum_plan' => 54.00, 'cum_actual' => 56.10, 'cum_forecast' => null],
        ['week_label' => 'W-34', 'week_number' => 34, 'cutoff_date' => '2025-06-06', 'cum_plan' => 58.70, 'cum_actual' => 61.30, 'cum_forecast' => null],
        ['week_label' => 'W-35', 'week_number' => 35, 'cutoff_date' => '2025-06-13', 'cum_plan' => 63.40, 'cum_actual' => 66.00, 'cum_forecast' => null],
        ['week_label' => 'W-36', 'week_number' => 36, 'cutoff_date' => '2025-06-20', 'cum_plan' => 67.80, 'cum_actual' => 70.80, 'cum_forecast' => null],
        ['week_label' => 'W-37', 'week_number' => 37, 'cutoff_date' => '2025-06-27', 'cum_plan' => 71.90, 'cum_actual' => 75.10, 'cum_forecast' => null],
        ['week_label' => 'W-38', 'week_number' => 38, 'cutoff_date' => '2025-07-04', 'cum_plan' => 75.80, 'cum_actual' => 79.20, 'cum_forecast' => null],
        ['week_label' => 'W-39', 'week_number' => 39, 'cutoff_date' => '2025-07-11', 'cum_plan' => 79.30, 'cum_actual' => 82.60, 'cum_forecast' => null],
        ['week_label' => 'W-40', 'week_number' => 40, 'cutoff_date' => '2025-07-18', 'cum_plan' => 82.40, 'cum_actual' => 85.50, 'cum_forecast' => null],
        ['week_label' => 'W-41', 'week_number' => 41, 'cutoff_date' => '2025-07-25', 'cum_plan' => 84.80, 'cum_actual' => 87.70, 'cum_forecast' => null],
        ['week_label' => 'W-42', 'week_number' => 42, 'cutoff_date' => '2025-08-01', 'cum_plan' => 86.60, 'cum_actual' => 89.40, 'cum_forecast' => null],
        ['week_label' => 'W-43', 'week_number' => 43, 'cutoff_date' => '2025-08-08', 'cum_plan' => 87.90, 'cum_actual' => 90.80, 'cum_forecast' => null],
        ['week_label' => 'W-44', 'week_number' => 44, 'cutoff_date' => '2025-08-15', 'cum_plan' => 88.80, 'cum_actual' => 91.90, 'cum_forecast' => 87.50],
        ['week_label' => 'W-45', 'week_number' => 45, 'cutoff_date' => '2025-08-22', 'cum_plan' => 89.35, 'cum_actual' => 92.70, 'cum_forecast' => 88.20],
        ['week_label' => 'W-46', 'week_number' => 46, 'cutoff_date' => '2025-08-29', 'cum_plan' => 89.82, 'cum_actual' => 93.45, 'cum_forecast' => 88.82],
        ['week_label' => 'W-47', 'week_number' => 47, 'cutoff_date' => '2025-09-05', 'cum_plan' => 92.20, 'cum_actual' => null,  'cum_forecast' => 95.80],
        ['week_label' => 'W-48', 'week_number' => 48, 'cutoff_date' => '2025-09-12', 'cum_plan' => 95.10, 'cum_actual' => null,  'cum_forecast' => 97.60],
        ['week_label' => 'W-49', 'week_number' => 49, 'cutoff_date' => '2025-09-19', 'cum_plan' => 97.90, 'cum_actual' => null,  'cum_forecast' => 99.10],
        ['week_label' => 'W-50', 'week_number' => 50, 'cutoff_date' => '2025-09-26', 'cum_plan' => 100.00, 'cum_actual' => null, 'cum_forecast' => 100.00],
    ];

    $pdo->prepare("DELETE FROM `s_curve_metrics` WHERE `project_id` = ?")->execute([$project1Id]);
    $stmtSc = $pdo->prepare("
        INSERT INTO `s_curve_metrics` (`project_id`, `week_label`, `week_number`, `cutoff_date`, `cum_plan`, `cum_actual`, `cum_forecast`, `created_at`, `updated_at`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    foreach ($sCurveRows as $sc) {
        $stmtSc->execute([
            $project1Id, $sc['week_label'], $sc['week_number'], $sc['cutoff_date'],
            $sc['cum_plan'], $sc['cum_actual'], $sc['cum_forecast'], $now, $now
        ]);
    }
    echo "  - Seeding 23 Runtun Waktu S-Curve (W-28 s/d W-50)... SUKSES\n";

    // Subcontractor Packages
    $subcontractorRows = [
        ['item_no' => 1, 'work_description' => 'Site Preparation', 'subcontractor_name' => 'PT. Toha Sittah Energi', 'wbs_category_id' => $wbsMap['A'] ?? null, 'po_number' => 'PO-EE-CIV-001', 'completion_plan' => 'Completed', 'current_status_text' => 'All civil grading & grubbing finished', 'plan_progress' => 100.00, 'actual_progress' => 100.00, 'status_badge' => 'Completed', 'obstacles' => null, 'notes' => 'Done, after construction assurance'],
        ['item_no' => 2, 'work_description' => 'Piling & Foundations', 'subcontractor_name' => 'PT. Karya Pancang Jaya', 'wbs_category_id' => $wbsMap['A'] ?? null, 'po_number' => 'PO-EE-CIV-002', 'completion_plan' => 'Completed', 'current_status_text' => 'Concrete pedestal curing complete', 'plan_progress' => 100.00, 'actual_progress' => 100.00, 'status_badge' => 'Completed', 'obstacles' => null, 'notes' => 'Done'],
        ['item_no' => 3, 'work_description' => 'Structure Steel Work & Pipe Rack Erection', 'subcontractor_name' => 'PT. Matra Engineering & Constructions', 'wbs_category_id' => $wbsMap['B.3'] ?? null, 'po_number' => 'PO-EE-STR-003', 'completion_plan' => 'Completed', 'current_status_text' => '100% steel structure bolted and aligned', 'plan_progress' => 100.00, 'actual_progress' => 100.00, 'status_badge' => 'Completed', 'obstacles' => null, 'notes' => 'Completed erection with zero punchlist'],
        ['item_no' => 4, 'work_description' => 'Piping Fabrication and Installation', 'subcontractor_name' => 'PT. Matra Engineering & Constructions', 'wbs_category_id' => $wbsMap['B.3'] ?? null, 'po_number' => 'PO-EE-PIP-004', 'completion_plan' => 'Reschedule to 20 Sep 2025', 'current_status_text' => 'Spool welding repair in progress at bay #2', 'plan_progress' => 98.44, 'actual_progress' => 74.67, 'status_badge' => 'Delayed', 'obstacles' => 'Welding repairs & generator broken', 'notes' => 'Mobilized backup 250kVA generator & 4 additional certified welders'],
        ['item_no' => 5, 'work_description' => 'Field Instrument & Gas Metering', 'subcontractor_name' => 'PT. Yokogawa Indonesia', 'wbs_category_id' => $wbsMap['B.3'] ?? null, 'po_number' => 'PO-EE-INS-005', 'completion_plan' => 'Target 15 Sep 2025', 'current_status_text' => 'Transmitters calibration on schedule', 'plan_progress' => 95.05, 'actual_progress' => 94.90, 'status_badge' => 'On Track', 'obstacles' => 'Delivery time long lead items', 'notes' => 'Expedited airfreight for safety relief valve calibration seals'],
        ['item_no' => 6, 'work_description' => 'Electrical Works & Substation Hookup', 'subcontractor_name' => 'PT. Dwi Tunggal Jaya Agung', 'wbs_category_id' => $wbsMap['B.3'] ?? null, 'po_number' => 'PO-EE-ELE-006', 'completion_plan' => 'Target 10 Sep 2025', 'current_status_text' => 'Lighting & cable tray installation', 'plan_progress' => 95.48, 'actual_progress' => 86.20, 'status_badge' => 'Watchlist', 'obstacles' => null, 'notes' => 'All 12 pendant lights installed at shelter; pull cable to CCR ongoing'],
    ];

    $pdo->prepare("DELETE FROM `subcontractor_packages` WHERE `project_id` = ?")->execute([$project1Id]);
    $stmtSub = $pdo->prepare("
        INSERT INTO `subcontractor_packages` (
            `project_id`, `wbs_category_id`, `item_no`, `work_description`, `subcontractor_name`, `po_number`,
            `completion_plan`, `current_status_text`, `plan_progress`, `actual_progress`, `status_badge`,
            `obstacles`, `notes`, `created_at`, `updated_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    foreach ($subcontractorRows as $sub) {
        $stmtSub->execute([
            $project1Id, $sub['wbs_category_id'], $sub['item_no'], $sub['work_description'],
            $sub['subcontractor_name'], $sub['po_number'], $sub['completion_plan'], $sub['current_status_text'],
            $sub['plan_progress'], $sub['actual_progress'], $sub['status_badge'], $sub['obstacles'],
            $sub['notes'], $now, $now
        ]);
    }
    echo "  - Seeding 6 Paket Subcontractor & PO... SUKSES\n";

    // Weekly Activities
    $activityRows = [
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Engineering & QC', 'description' => 'Inspection N2 Generator at vendor shop & review factory calibration test certificates', 'sort_order' => 1],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Engineering & QC', 'description' => 'Review MDR Pipe Support & Pressure Vessel documentation package', 'sort_order' => 2],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Engineering & QC', 'description' => 'Preparation drawing OH Crane certification with BKI (Biro Klasifikasi Indonesia)', 'sort_order' => 3],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Procurement', 'description' => 'Delivery SIKAGROUT 215 batch 3 to site warehouse', 'sort_order' => 4],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Procurement', 'description' => 'Delivery LV Switchgear & Distribution Panel to CCR electrical room', 'sort_order' => 5],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Procurement', 'description' => 'Delivery E&I Bulk Material to site staging area', 'sort_order' => 6],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Construction', 'description' => 'Skidding GEC#2 (Gas Engine Compressor) to permanent foundation pad', 'sort_order' => 7],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'Construction', 'description' => 'Setup Cable Tray at CCR Building & Pipe Rack header', 'sort_order' => 8],
        ['week_label' => 'W-46', 'activity_type' => 'this_week_actual', 'discipline' => 'HSE', 'description' => '13,064 safe manhours reached with zero accident record & daily DCU check', 'sort_order' => 9],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Engineering & QC', 'description' => 'Closing outstanding document & drawing for Penelaah Design approval', 'sort_order' => 1],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Engineering & QC', 'description' => 'Follow up Factory Acceptance Test (FAT) Oily Water Pumps inspection protocol', 'sort_order' => 2],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Engineering & QC', 'description' => 'Follow up FAT SDV, BDV, ON-OFF Valve verification package with Ditjen Migas', 'sort_order' => 3],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Procurement', 'description' => 'Award installation & hook up equipment Vessel/Compressor/OH Crane 5T to PT. Matra', 'sort_order' => 4],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Procurement', 'description' => 'Leak test Manual Valve on Site warehouse staging area', 'sort_order' => 5],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Procurement', 'description' => 'Delivery spare part manlift & scissor lifts to staging area', 'sort_order' => 6],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Construction', 'description' => 'Install GEC Unit #6 to foundation pad with precision laser alignment', 'sort_order' => 7],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'Construction', 'description' => 'Continue pulling & laying instrument cables from Junction Box (JB) to CCR', 'sort_order' => 8],
        ['week_label' => 'W-47', 'activity_type' => 'next_week_plan', 'discipline' => 'HSE', 'description' => 'Weekly HSE Inspection & Daily Check Up (DCU) for all high-risk crew', 'sort_order' => 9],
    ];

    $pdo->prepare("DELETE FROM `weekly_activities` WHERE `project_id` = ?")->execute([$project1Id]);
    $stmtAct = $pdo->prepare("
        INSERT INTO `weekly_activities` (`project_id`, `week_label`, `activity_type`, `discipline`, `description`, `sort_order`, `created_at`, `updated_at`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    foreach ($activityRows as $act) {
        $stmtAct->execute([$project1Id, $act['week_label'], $act['activity_type'], $act['discipline'], $act['description'], $act['sort_order'], $now, $now]);
    }
    echo "  - Seeding 18 Aktivitas Mingguan (W-46 Aktual & W-47 Rencana)... SUKSES\n";

    // Progress Photos
    $photoRows = [
        ['week_label' => 'W-46', 'title' => 'Foundation of Gas Compressors & Shelter, Pipe Rack', 'caption' => 'Reinforced concrete pedestal and base plate preparation for compressor units with pipe rack support frame aligned.', 'image_path' => '/storage/progress_photos/EE_W46_01.jpg', 'taken_at' => '2025-08-29', 'location' => 'Compressor Pad Bay A, Gilireng, Wajo'],
        ['week_label' => 'W-46', 'title' => 'Transportation of GEC #6 & Cooler #4 to Site Sengkang', 'caption' => 'Multi-axle heavy cargo trailer en route to Sengkang facility with police escort and bridge clearance verified.', 'image_path' => '/storage/progress_photos/EE_W46_02.jpg', 'taken_at' => '2025-09-01', 'location' => 'Heavy Transport Route KM-14, Sengkang'],
        ['week_label' => 'W-46', 'title' => 'Skidding Gas Engine Compressor to Foundation', 'caption' => 'Hydraulic jacking and heavy skidding operation of 42-ton GEC#2 unit onto permanent anchor bolts.', 'image_path' => '/storage/progress_photos/EE_W46_03.jpg', 'taken_at' => '2025-08-29', 'location' => 'Shelter Bay #2, Poleonro, Gilireng, Wajo'],
        ['week_label' => 'W-46', 'title' => 'Electrical Works: All 12 Pendant Lights Installed at Shelter', 'caption' => 'Explosion-proof hazardous area LED high-bay pendant fixtures fully mounted, cabled, and tested.', 'image_path' => '/storage/progress_photos/EE_W46_04.jpg', 'taken_at' => '2025-08-25', 'location' => 'Main Compressor Shelter Bay, Wajo'],
    ];

    $pdo->prepare("DELETE FROM `progress_photos` WHERE `project_id` = ?")->execute([$project1Id]);
    $stmtPhoto = $pdo->prepare("
        INSERT INTO `progress_photos` (`project_id`, `week_label`, `title`, `caption`, `image_path`, `taken_at`, `location`, `created_at`, `updated_at`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    foreach ($photoRows as $pr) {
        $stmtPhoto->execute([$project1Id, $pr['week_label'], $pr['title'], $pr['caption'], $pr['image_path'], $pr['taken_at'], $pr['location'], $now, $now]);
    }
    echo "  - Seeding 4 Foto Dokumentasi Lapangan... SUKSES\n";

    // HSE Reports
    $pdo->prepare("DELETE FROM `hse_reports` WHERE `project_id` = ?")->execute([$project1Id]);
    $stmtHse = $pdo->prepare("
        INSERT INTO `hse_reports` (
            `project_id`, `week_label`, `total_personnel`, `period_manhours`, `cumulative_manhours`,
            `near_miss`, `first_aid`, `mtc`, `lta`, `fatality`, `oil_spill`, `gas_leaks`,
            `safety_induction`, `toolbox_meeting`, `safety_inspection`, `created_at`, `updated_at`
        ) VALUES (?, 'W-46', 179, 13064, 186056, 0, 0, 0, 0, 0, 0, 0, 42, 14, 6, ?, ?)
    ");
    $stmtHse->execute([$project1Id, $now, $now]);
    echo "  - Seeding Laporan HSE (186,056 Safe Manhours, 0 LTA)... SUKSES\n";

    echo "\n=== MIGRASI & SEEDING SELESAI DENGAN SUKSES! ===\n";

    // Tampilkan verifikasi ringkasan tabel di MySQL
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "\nTabel terverifikasi di MySQL (`{$dbDatabase}`):\n";
    foreach ($tables as $t) {
        $count = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        echo "  - {$t} ({$count} baris data)\n";
    }

} catch (Exception $e) {
    echo "\n[ERROR] Gagal mengeksekusi migrasi & seeding: " . $e->getMessage() . "\n";
    exit(1);
}
