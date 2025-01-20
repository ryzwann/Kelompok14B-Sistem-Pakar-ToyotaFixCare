function toggleRecordingPopup(show) {
    const recordingPopup = document.getElementById('recordingPopup');
    if (show) {
        recordingPopup.classList.remove('hidden');
    } else {
        recordingPopup.classList.add('hidden');
    }
}

// Modifikasi toggleRecording untuk menampilkan popup
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
