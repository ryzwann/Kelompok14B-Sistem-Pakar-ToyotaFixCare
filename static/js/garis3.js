document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const headerHamburgerPlaceholder = document.getElementById('headerHamburgerPlaceholder');

    toggleSidebarBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('hidden')) {
            // Tampilkan sidebar, pindahkan ikon hamburger kembali ke sidebar
            sidebar.classList.remove('hidden');
            sidebar.appendChild(toggleSidebarBtn);
        } else {
            // Sembunyikan sidebar, pindahkan ikon hamburger ke header
            sidebar.classList.add('hidden');
            headerHamburgerPlaceholder.appendChild(toggleSidebarBtn);
        }
    });
});

