// Fungsi untuk menambahkan ikon salin pada pesan bot
function addCopyIcon(messageContent, content) {
    const copyIcon = document.createElement('span');
    copyIcon.classList.add('copy-icon');
    copyIcon.textContent = '📑';  // Anda bisa mengganti dengan ikon lain jika ingin

    // Event listener untuk menyalin teks ke clipboard
    copyIcon.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
            console.log('Teks berhasil disalin: ', content);
        }).catch(err => {
            console.error('Gagal menyalin teks: ', err);
        });
    });

    // Menambahkan ikon salin ke dalam messageContent
    messageContent.appendChild(copyIcon);
}