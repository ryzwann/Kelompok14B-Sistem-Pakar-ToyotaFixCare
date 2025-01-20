const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const chatHistory = document.getElementById('chatHistory');
let isRecording = false;
let recognition; // Objek untuk Speech Recognition

// Array untuk menyimpan riwayat chat
let historyData = [];

// Cek dukungan Speech Recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Tidak terus-menerus mendengarkan
    recognition.interimResults = false; // Hanya hasil akhir
    recognition.lang = 'id-ID'; // Atur bahasa ke Bahasa Indonesia

    recognition.onresult = function (event) {
        const speechResult = event.results[0][0].transcript;
        console.log("Hasil Speech-to-Text:", speechResult);

        // Langsung kirim hasil sebagai pertanyaan ke sistem
        sendMessage(speechResult);
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function () {
        console.log("Perekaman suara selesai.");
        isRecording = false; // Setel ulang status perekaman
        toggleMicrophoneAnimation(false); // Hapus animasi mikrofon
        toggleRecordingPopup(false); // Sembunyikan popup
    };
    
} else {
    console.error("Speech recognition tidak didukung di browser ini.");
}

// Fungsi untuk mengaktifkan dan menonaktifkan speech-to-text
function toggleRecording() {
    if (isRecording) {
        recognition.stop(); // Hentikan perekaman suara
        isRecording = false;
        console.log("Perekaman dihentikan.");
        toggleMicrophoneAnimation(false);
        toggleRecordingPopup(false); // Sembunyikan popup
    } else {
        recognition.start(); // Mulai perekaman suara
        isRecording = true;
        console.log("Perekaman dimulai.");
        toggleMicrophoneAnimation(true);
        toggleRecordingPopup(true); // Tampilkan popup
    }
}


// Fungsi untuk menambahkan animasi mikrofon saat sedang merekam
function toggleMicrophoneAnimation(isRecording) {
    const micIcon = document.querySelector('.voice-recording');
    if (isRecording) {
        micIcon.classList.add('recording'); // Menambahkan kelas untuk animasi
    } else {
        micIcon.classList.remove('recording'); // Menghapus kelas animasi
    }
}

// Fungsi untuk mengirim pesan ke server
function sendMessage(userText) {
    if (!userText.trim()) {
        console.log("Input kosong, tidak mengirim pesan.");
        return;
    }

    console.log("Mengirim pesan:", userText);
    addMessage(userText, 'user'); // Tambahkan pesan pengguna ke UI
    userInput.value = ''; // Kosongkan input setelah dikirim

    // Tampilkan animasi titik tiga
    const typingIndicator = showTypingIndicator();

    fetch('/tanya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText })
    })
    .then(response => response.json())
    .then(data => {
        chatMessages.removeChild(typingIndicator); // Hapus animasi titik tiga
        if (data.answer) {
            console.log("Jawaban diterima:", data.answer);
            addMessage(data.answer, 'bot'); // Tambahkan jawaban bot ke UI
            // Simpan riwayat pesan
            addToHistory(userText, data.answer);
        } else {
            console.error("Respons tidak valid:", data);
        }
    })
    .catch(error => {
        chatMessages.removeChild(typingIndicator); // Hapus animasi titik tiga
        console.error("Kesalahan saat mengirim pesan:", error);
    });
}

// Fungsi untuk menambahkan pesan ke chat
function addMessage(content, sender) {
    const message = document.createElement('div');
    message.classList.add('message', sender);

    const profilePic = document.createElement('img');
    profilePic.src = sender === 'user' ? 'static/img/user.jpeg' : 'static/img/botsistem.jpeg';
    profilePic.alt = sender === 'user' ? 'User' : 'Bot';

    const messageContent = document.createElement('div');
    messageContent.classList.add('content');
    messageContent.textContent = content;

    let isSpeaking = false; // Status apakah sedang memutar suara

    function addSpeakerIcon(messageContent, textContent) {
        const ttsIcon = document.createElement('div');
        ttsIcon.classList.add('tts-icon');
        ttsIcon.innerHTML = '🔊';

        // Fungsi untuk memulai atau menghentikan TTS
        ttsIcon.onclick = () => {
            if (isSpeaking) {
                speechSynthesis.cancel(); // Hentikan TTS
                isSpeaking = false;
                ttsIcon.classList.remove('playing'); // Hapus animasi
            } else {
                const utterance = new SpeechSynthesisUtterance(textContent);
                utterance.lang = 'id-ID'; // Bahasa Indonesia
                speechSynthesis.speak(utterance);

                isSpeaking = true;
                ttsIcon.classList.add('playing'); // Tambahkan animasi

                utterance.onend = () => {
                    isSpeaking = false;
                    ttsIcon.classList.remove('playing'); // Hapus animasi
                };
            }
        };

        // Tambahkan ikon ke dalam messageContent
        messageContent.appendChild(ttsIcon);

        // Otomatis jalankan TTS saat pertama kali pesan diterima dari bot
        if (sender === 'bot') {
            ttsIcon.onclick(); // Panggil klik otomatis
        }
    }

    function addCopyIcon(messageContent, content) {
        const copyIcon = document.createElement('span');
        copyIcon.classList.add('copy-icon');
        copyIcon.textContent = '📑'; // Ikon salin
    
        // Event listener untuk menyalin teks ke clipboard
        copyIcon.addEventListener('click', () => {
            navigator.clipboard.writeText(content).then(() => {
                console.log('Teks berhasil disalin: ', content);
    
                // Ubah ikon menjadi centang hijau
                copyIcon.textContent = '✔'; // Ikon centang
                copyIcon.classList.add('success');
    
                // Kembali ke ikon default setelah 3 detik
                setTimeout(() => {
                    copyIcon.textContent = '📑'; // Kembali ke ikon salin
                    copyIcon.classList.remove('success');
                    copyIcon.classList.add('reset');
    
                    // Hapus kelas reset setelah animasi selesai
                    setTimeout(() => {
                        copyIcon.classList.remove('reset');
                    }, 300);
                }, 3000);
            }).catch(err => {
                console.error('Gagal menyalin teks: ', err);
            });
        });
    
        // Tambahkan ikon ke dalam messageContent
        messageContent.appendChild(copyIcon);
    }
    

    // Tambahkan ikon salin dan speaker jika pesan berasal dari bot
    if (sender === 'bot') {
        addCopyIcon(messageContent, content); // Tambahkan ikon salin
        addSpeakerIcon(messageContent, content);
    }

    message.appendChild(profilePic);
    message.appendChild(messageContent);

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi untuk menambahkan riwayat chat
function addToHistory(userText, botAnswer) {
    const historyItem = {
        user: userText,
        bot: botAnswer
    };

    // Menambahkan item riwayat ke array
    historyData.push(historyItem);

    // Update tampilan riwayat di sidebar
    updateChatHistory();
}

// Fungsi untuk memperbarui tampilan riwayat chat di sidebar
function updateChatHistory() {
    chatHistory.innerHTML = ''; // Hapus riwayat sebelumnya

    historyData.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        const userMessage = document.createElement('p');
        userMessage.textContent = "User: " + item.user;
        historyItem.appendChild(userMessage);

        const botMessage = document.createElement('p');
        botMessage.textContent = "Bot: " + item.bot;
        historyItem.appendChild(botMessage);

        chatHistory.appendChild(historyItem);

        // Event listener untuk memilih riwayat chat
        historyItem.addEventListener('click', () => {
            addMessage(item.user, 'user');
            addMessage(item.bot, 'bot');
        });
    });
}

// Fungsi untuk menampilkan animasi titik tiga
function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'bot', 'typing-indicator');

    const profilePic = document.createElement('img');
    profilePic.src = 'static/img/botsistem.jpeg'; // Gambar bot sistem
    profilePic.alt = 'Bot';

    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('dots-container');

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dotsContainer.appendChild(dot);
    }

    typingIndicator.appendChild(profilePic);
    typingIndicator.appendChild(dotsContainer);

    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingIndicator;
}



// Fungsi untuk menangani event ketika pengguna menekan tombol "Enter"
userInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage(userInput.value); // Kirim teks input
    }
});

// Menambahkan event listener untuk tombol kirim (ikon pesawat)
const sendButton = document.querySelector('.chat-input button');
sendButton.addEventListener('click', function () {
    sendMessage(userInput.value); // Kirim teks input
});

