let minutes = 25;
let seconds = 0;
let isRunning = false;
let timer;

// Load saved timer duration from storage when extension is loaded
chrome.storage.local.get(['lastTimerDuration'], (result) => {
    if (result.lastTimerDuration) {
        minutes = result.lastTimerDuration;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message:", request.action);
    
    if (request.action === "startTimer" && !isRunning) {
        isRunning = true;
        minutes = request.minutes;
        seconds = 0;
        timer = setInterval(updateTimer, 1000);
        console.log(`Timer started with ${minutes} minutes`);
        sendResponse({ success: true });
    } 
    else if (request.action === "pauseTimer") {
        isRunning = false;
        clearInterval(timer);
        console.log("Timer paused");
        sendResponse({ success: true });
    } 
    else if (request.action === "resetTimer") {
        clearInterval(timer);
        isRunning = false;
        minutes = 25;
        seconds = 0;
        console.log("Timer reset in background");
        sendResponse({ success: true });
    } 
    else if (request.action === "updateTimer") {
        minutes = request.minutes;
        seconds = 0;
        if (isRunning) {
            clearInterval(timer);
            timer = setInterval(updateTimer, 1000);
            console.log(`Timer updated to ${minutes} minutes`);
        }
        sendResponse({ success: true });
    }
    else if (request.action === "getTimerStatus") {
        sendResponse({
            isRunning: isRunning,
            minutes: minutes,
            seconds: seconds
        });
    }
    
    return true; // Keep the message channel open for async responses
});

function updateTimer() {
    if (minutes === 0 && seconds === 0) {
        clearInterval(timer);
        isRunning = false;
        console.log("Timer finished");
        showNotification();
    } else {
        if (seconds === 0) {
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        console.log(`Time remaining: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`);
    }
}

function showNotification() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Pomodoro Timer",
        message: "Time's up! Take a break!",
        priority: 2,
        requireInteraction: true // This makes the notification stay until user interacts with it
    }, () => {
        console.log("Notification triggered");
        
        // You could add settings in storage to customize notification behavior
        chrome.storage.local.get(['notificationSound'], (result) => {
            if (result.notificationSound) {
                // Play sound logic would go here if implemented
            }
        });
    });
}

// Store timer state in storage periodically in case of browser crashes
setInterval(() => {
    if (isRunning) {
        chrome.storage.local.set({
            timerRunning: isRunning,
            timerMinutes: minutes,
            timerSeconds: seconds
        });
    }
}, 15000);

// Recover timer state if extension restarts
chrome.storage.local.get(['timerRunning', 'timerMinutes', 'timerSeconds'], (result) => {
    if (result.timerRunning) {
        isRunning = true;
        minutes = result.timerMinutes || 25;
        seconds = result.timerSeconds || 0;
        timer = setInterval(updateTimer, 1000);
        console.log("Timer restored from storage:", minutes, seconds);
    }
});

// Ensure timers are cleared when extension is updated or browser is closed
chrome.runtime.onSuspend.addListener(() => {
    if (timer) {
        clearInterval(timer);
        
        // Save current state before suspension
        if (isRunning) {
            chrome.storage.local.set({
                timerRunning: isRunning,
                timerMinutes: minutes,
                timerSeconds: seconds
            });
        }
    }
});