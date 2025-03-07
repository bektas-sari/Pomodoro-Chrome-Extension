document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup script loaded.");

    const startButton = document.getElementById("start");
    const resetButton = document.getElementById("reset");
    const setTimeButton = document.getElementById("set-time");
    const customTimeInput = document.getElementById("custom-time");
    const timerDisplay = document.getElementById("timer");

    let isRunning = false;
    let timerInterval = null;

    // Arka plandaki timer durumunu kontrol et
    chrome.runtime.sendMessage({ action: "getTimerStatus" }, (response) => {
        if (response && response.isRunning) {
            isRunning = true;
            updateUI(response.minutes, response.seconds);
            startButton.innerText = "Pause";
            startTimerUpdates();
        }
    });

    // Start/Pause Butonu
    startButton.addEventListener("click", function () {
        if (!isRunning) {
            let customMinutes = parseInt(customTimeInput.value) || 25;

            isRunning = true;
            startButton.innerText = "Pause";

            chrome.runtime.sendMessage({ action: "startTimer", minutes: customMinutes }, (response) => {
                if (response && response.success) {
                    console.log("Timer started.");
                    updateStatusMessage("Timer started.");
                    startTimerUpdates();
                } else {
                    console.error("Failed to start timer.");
                    updateStatusMessage("Failed to start timer.", true);
                }
            });
        } else {
            isRunning = false;
            startButton.innerText = "Start";
            
            chrome.runtime.sendMessage({ action: "pauseTimer" }, (response) => {
                console.log("Timer paused.");
                updateStatusMessage("Timer paused.");
                clearInterval(timerInterval);
            });
        }
    });

    // Reset Butonu
    resetButton.addEventListener("click", function () {
        isRunning = false;
        startButton.innerText = "Start";

        chrome.runtime.sendMessage({ action: "resetTimer" }, (response) => {
            console.log("Timer reset.");
            updateStatusMessage("Timer reset.");
            updateUI(25, 0);
            clearInterval(timerInterval);
        });
    });

    // Set Time Butonu
    setTimeButton.addEventListener("click", function () {
        let customMinutes = parseInt(customTimeInput.value);
        if (customMinutes > 0) {
            updateUI(customMinutes, 0);
            updateStatusMessage(`Timer set to ${customMinutes} minutes.`);
        } else {
            updateStatusMessage("Invalid time input.", true);
        }
    });

    // Arka plandaki timer durumunu sürekli güncelle
    function startTimerUpdates() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            chrome.runtime.sendMessage({ action: "getTimerStatus" }, (response) => {
                if (response && response.isRunning) {
                    updateUI(response.minutes, response.seconds);
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    startButton.innerText = "Start";
                }
            });
        }, 1000);
    }

    // UI Güncelleme Fonksiyonu
    function updateUI(minutes, seconds) {
        timerDisplay.innerText = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
    }

    // Status Mesajlarını Güncelleme
    function updateStatusMessage(message, isError = false) {
        const statusElement = document.getElementById("status-message");
        statusElement.innerText = message;
        statusElement.style.color = isError ? "#ef4444" : "#4b5563";
        
        setTimeout(() => {
            statusElement.innerText = "";
        }, 3000);
    }
});
