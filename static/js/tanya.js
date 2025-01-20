async function sendMessage() {
    const userText = userInput.value;
    if (!userText.trim()) return;

    // Tambahkan pesan pengguna ke UI
    addMessage(userText, 'user');
    addChatHistory(userText);
    userInput.value = '';

    try {
        // Kirim data ke backend Flask
        const response = await fetch('/tanya', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: userText }),
        });

        const data = await response.json();

        if (data.answer) {
            addMessage(data.answer, 'bot');
            addChatHistory(data.answer);
        } else {
            addMessage('Terjadi kesalahan pada server. Coba lagi nanti.', 'bot');
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('Tidak dapat terhubung ke server.', 'bot');
    }
}
