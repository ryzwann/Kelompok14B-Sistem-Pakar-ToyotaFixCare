
// Fungsi untuk menampilkan pop-up konfirmasi
function showConfirmationPopup() {
    document.getElementById('confirmationPopup').style.display = 'block'; // Menampilkan pop-up
}

// Fungsi untuk membersihkan riwayat chat
function clearChatHistory() {
    document.getElementById('chatMessages').innerHTML = ''; // Menghapus semua pesan
    console.log("Chat history has been cleared!");
    document.getElementById('confirmationPopup').style.display = 'none'; // Menyembunyikan pop-up setelah konfirmasi
}

// Menambahkan event listener pada tombol "Ya" (menghapus pesan)
document.getElementById('confirmYes').addEventListener('click', clearChatHistory);

// Menambahkan event listener pada tombol "Tidak" (membatalkan penghapusan)
document.getElementById('confirmNo').addEventListener('click', function() {
    document.getElementById('confirmationPopup').style.display = 'none'; // Menyembunyikan pop-up tanpa menghapus pesan
});
