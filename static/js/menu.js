document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const headerHamburgerPlaceholder = document.getElementById('headerHamburgerPlaceholder');

    // Fungsi untuk menampilkan popup
    const showPopupMenu = () => {
        // Periksa apakah popup sudah ada
        if (document.querySelector('.popup-menu')) return;

        // Buat elemen popup
        const popup = document.createElement('div');
        popup.classList.add('popup-menu');

        // Buat fungsi untuk mengganti opsi
        const updateSidebarOption = () => {
            // Hapus opsi sebelumnya
            const existingOptions = popup.querySelectorAll('.popup-option');
            existingOptions.forEach(option => option.remove());

            // Tentukan opsi yang sesuai
            const toggleSidebarOption = document.createElement('div');
            toggleSidebarOption.classList.add('popup-option'); // Tambahkan kelas untuk gaya
            if (sidebar.classList.contains('hidden')) {
                // Jika sidebar tersembunyi, tampilkan opsi untuk menampilkan sidebar
                toggleSidebarOption.textContent = 'Tampilkan Sidebar';
                toggleSidebarOption.addEventListener('click', () => {
                    sidebar.classList.remove('hidden');
                    headerHamburgerPlaceholder.appendChild(toggleSidebarBtn);
                    document.body.removeChild(popup); // Tutup popup setelah menampilkan sidebar
                });
            } else {
                // Jika sidebar terlihat, tampilkan opsi untuk menyembunyikan sidebar
                toggleSidebarOption.textContent = 'Sembunyikan Sidebar';
                toggleSidebarOption.addEventListener('click', () => {
                    sidebar.classList.add('hidden');
                    headerHamburgerPlaceholder.appendChild(toggleSidebarBtn);
                    document.body.removeChild(popup); // Tutup popup setelah menyembunyikan sidebar
                });
            }

           // Tambahkan opsi "Kembali"
const goBackOption = document.createElement('div');
goBackOption.textContent = 'Kembali';
goBackOption.classList.add('popup-option'); // Tambahkan kelas untuk gaya
goBackOption.addEventListener('click', () => {
    window.location.href = "http://127.0.0.1:5000/static/fixlanding/robotoyota/tampilan.html#landing-page";
});


            // Tambahkan opsi ke dalam popup
            popup.appendChild(toggleSidebarOption);
            popup.appendChild(goBackOption);
        };

        // Update opsi saat popup pertama kali dibuka
        updateSidebarOption();

        // Tambahkan popup ke body
        document.body.appendChild(popup);

        // Tentukan posisi popup agar muncul di samping kanan tombol hamburger
        const buttonRect = toggleSidebarBtn.getBoundingClientRect();
        popup.style.top = `${buttonRect.top + window.scrollY + buttonRect.height / 2 - popup.offsetHeight / 2}px`; // Vertikal sejajar tengah tombol
        popup.style.left = `${buttonRect.right + 10}px`; // Sedikit jarak di kanan tombol

        // Tutup popup ketika pengguna mengklik di luar popup
        const closePopupOnClickOutside = (event) => {
            if (!popup.contains(event.target) && event.target !== toggleSidebarBtn) {
                document.body.removeChild(popup);
                document.removeEventListener('click', closePopupOnClickOutside);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closePopupOnClickOutside);
        }, 0); // Delay untuk mencegah popup langsung tertutup
    };

    // Tambahkan event listener ke tombol hamburger
    toggleSidebarBtn.addEventListener('click', showPopupMenu);
});
