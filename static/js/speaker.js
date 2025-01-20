// Fungsi global untuk menghentikan semua TTS
function stopAllTTS() {
    speechSynthesis.cancel(); // Menghentikan semua TTS yang sedang berjalan
}

function addSpeakerIcon(messageElement, textContent) {
    // Hentikan semua suara yang sedang diputar sebelum memulai yang baru
    stopAllTTS();

    const ttsIcon = document.createElement('div');
    ttsIcon.classList.add('tts-icon');
    ttsIcon.innerHTML = '🔊';

    let isSpeaking = false;  // Menyimpan status apakah suara sedang diputar

    // Fungsi untuk memulai atau menghentikan suara
    ttsIcon.onclick = () => {
        if (isSpeaking) {
            // Jika suara sedang diputar, hentikan
            speechSynthesis.cancel();
            isSpeaking = false;
            ttsIcon.classList.remove('playing'); // Menghilangkan animasi memperbesar ikon
        } else {
            // Jika suara belum diputar, mulai
            stopAllTTS(); // Pastikan tidak ada suara lain berjalan
            const utterance = new SpeechSynthesisUtterance(textContent);
            utterance.lang = 'id-ID'; // Bahasa Indonesia
            speechSynthesis.speak(utterance);

            // Menambahkan animasi segera setelah suara mulai
            isSpeaking = true;
            ttsIcon.classList.add('playing'); // Menambahkan kelas untuk animasi

            // Mengatur pengaturan setelah suara selesai
            utterance.onend = () => {
                isSpeaking = false;
                ttsIcon.classList.remove('playing'); // Menghilangkan animasi setelah selesai
            };
        }
    };

    // Tambahkan ikon ke dalam elemen message
    messageElement.appendChild(ttsIcon);
}
