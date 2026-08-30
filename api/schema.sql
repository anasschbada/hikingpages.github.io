-- MySQL 8.4 schema for the shared RSVP list.
-- Run this once against your database, e.g.: mysql -u youruser -p your_db < schema.sql

CREATE TABLE IF NOT EXISTS rsvps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
