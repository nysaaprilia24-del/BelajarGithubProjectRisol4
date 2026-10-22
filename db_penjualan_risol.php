
<?php
$host = "localhost";
$user = "root";
$password = "";
$dbname = "db_penjualan_risol";

$koneksi = mysqli_connect($host, $user, $password, $dbname);

if (!$koneksi) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}

echo "Koneksi database berhasil";
?>
