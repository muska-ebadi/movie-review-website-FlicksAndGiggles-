<?php
/**
 * Database configuration file
 * 
 * NOTE:
 * This is an example configuration.
 */

// Database host
define("DBHOST", "localhost");

// Database name
define("DBNAME", "your_database_name");

// Database username
define("DBUSER", "your_username");

// Database password
define("DBPASS", "your_password");

// PDO connection string
define(
    "DBCONNSTRING",
    "mysql:host=" . DBHOST . ";dbname=" . DBNAME . ";charset=utf8mb4"
);
?>
