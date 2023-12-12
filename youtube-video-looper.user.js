// ==UserScript==
// @name         YouTube Video Looper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Loop a specific section of a YouTube video automatically
// @author       RepliKode
// @match        *://www.youtube.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let player;
    let loopInterval;
    let loopStartSeconds;
    let loopEndSeconds;
    let videoId; // Declare the variable outside the if block

    // Check if the current page is a YouTube video or YouTube Short
    if (isYouTubeVideoPage()) {
        // Get the video ID from the URL
        const videoIdMatch = window.location.search.match(/(?:v=|\/shorts\/)([^&/]+)/);
        videoId = videoIdMatch ? videoIdMatch[1] : null;

        // Check if the video already has a defined loop
        const storedLoopStart = localStorage.getItem(`loopStart_${videoId}`);
        const storedLoopEnd = localStorage.getItem(`loopEnd_${videoId}`);

        if (storedLoopStart !== null && storedLoopEnd !== null) {
            loopStartSeconds = parseFloat(storedLoopStart);
            loopEndSeconds = parseFloat(storedLoopEnd);
            startLoop();
        }
    }

    // Function to check if the current page is a YouTube video or YouTube Short
    function isYouTubeVideoPage() {
        return window.location.href.includes('/watch?v=') || window.location.href.includes('/shorts/');
    }

    function startLoop() {
        // Wait for the video player to be ready
        player = document.querySelector('video');
        if (player) {
            player.currentTime = loopStartSeconds;

            // Start playback
            player.play();

            // Check the time periodically
            loopInterval = setInterval(checkTime, 500);
        } else {
            setTimeout(startLoop, 500); // Wait and try again
        }
    }

    function checkTime() {
        if (player.currentTime >= loopEndSeconds) {
            // Return to the starting point at the end of the section
            player.currentTime = loopStartSeconds;
        }
    }

    function resetVideoLooper() {
        // If the loop is already defined, reset the video to the loop
        if (loopStartSeconds !== undefined && loopEndSeconds !== undefined) {
            // Remove the loop by resetting the values
            loopStartSeconds = undefined;
            loopEndSeconds = undefined;
            localStorage.removeItem(`loopStart_${videoId}`);
            localStorage.removeItem(`loopEnd_${videoId}`);
            clearInterval(loopInterval); // Stop the loop
            player.play(); // Resume playback
        } else {
            // If the loop is not defined, ask the user
            const userInput = prompt('Enter start and end time (format hhmmss hhmmss):');

            if (userInput !== null) { // If the user didn't click "Cancel"
                const inputParts = userInput.split(' ');
                if (inputParts.length === 2) {
                    loopStartSeconds = timeStringToSeconds(inputParts[0] + '00');
                    loopEndSeconds = timeStringToSeconds(inputParts[1] + '00');

                    // Save the loop in local storage for future use
                    localStorage.setItem(`loopStart_${videoId}`, loopStartSeconds);
                    localStorage.setItem(`loopEnd_${videoId}`, loopEndSeconds);

                    // Start the loop
                    startLoop();
                } else {
                    alert('Invalid format. Use the format "hhmmss hhmmss".');
                }
            }
        }

        // Update the button text based on the presence or absence of a loop
        updateButtonLabel();
    }

    // Function to update the button text based on the presence or absence of a loop
    function updateButtonLabel() {
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.textContent = loopStartSeconds !== undefined ? 'Reset Looper' : 'Initialize Looper';
        }
    }

    // Create a reset button
    const resetButton = document.createElement('button');
    resetButton.id = 'resetButton';
    resetButton.style.position = 'fixed';
    resetButton.style.top = '60px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '1000';
    resetButton.addEventListener('click', resetVideoLooper);

    // Add the button to the page
    document.body.appendChild(resetButton);

    // Initialize the button text when the page loads
    updateButtonLabel();

    // Observe changes in full-screen mode
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Convert a time string in hhmmss format to seconds
    function timeStringToSeconds(timeString) {
        const hours = parseInt(timeString.substring(0, 2)) || 0;
        const minutes = parseInt(timeString.substring(2, 4)) || 0;
        const seconds = parseInt(timeString.substring(4, 6)) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

    function handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
        resetButton.style.display = isFullscreen ? 'none' : 'block';
    }
})();
