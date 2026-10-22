<?php
require_once "db_penjualan_risol.php";

// Mengambil semua data produk
$query = mysqli_query($conn, "SELECT * FROM produk");

if (!$query) {
    die("Query gagal: " . mysqli_error($conn));
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daftar Produk RisolKu</title>
</head>
<body>
    <h1>Daftar Produk RisolKu</h1>

    <table border="1" cellpadding="10">
        <tr>
            <th>ID</th>
            <th>Nama Produk</th>
            <th>Harga</th>
            <th>Stok</th>
        </tr>

        <?php while ($produk = mysqli_fetch_assoc($query)) { ?>
        <tr>
            <td><?= htmlspecialchars($produk['id_produk']) ?></td>
            <td><?= htmlspecialchars($produk['nama_produk']) ?></td>
            <td>Rp<?= number_format($produk['harga'], 0, ',', '.') ?></td>
            <td><?= htmlspecialchars($produk['stok']) ?></td>
        </tr>
        <?php } ?>
    </table>
</body>
</html>