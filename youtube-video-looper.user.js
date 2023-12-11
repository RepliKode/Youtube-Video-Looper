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
    let videoId; // Déclarer la variable en dehors du bloc if

    // Vérifier si la page actuelle est une vidéo YouTube ou YouTube Short
    if (isYouTubeVideoPage()) {
        // Récupérer l'ID de la vidéo à partir de l'URL
        const videoIdMatch = window.location.search.match(/(?:v=|\/shorts\/)([^&/]+)/);
        videoId = videoIdMatch ? videoIdMatch[1] : null;

        // Vérifier si la vidéo a déjà une boucle définie
        const storedLoopStart = localStorage.getItem(`loopStart_${videoId}`);
        const storedLoopEnd = localStorage.getItem(`loopEnd_${videoId}`);

        if (storedLoopStart !== null && storedLoopEnd !== null) {
            loopStartSeconds = parseFloat(storedLoopStart);
            loopEndSeconds = parseFloat(storedLoopEnd);
            startLoop();
        }
    }

    // Fonction pour vérifier si la page actuelle est une vidéo YouTube ou YouTube Short
    function isYouTubeVideoPage() {
        return window.location.href.includes('/watch?v=') || window.location.href.includes('/shorts/');
    }

    function startLoop() {
        // Attendre que le lecteur vidéo soit prêt
        player = document.querySelector('video');
        if (player) {
            player.currentTime = loopStartSeconds;

            // Lancer la lecture
            player.play();

            // Vérifier le temps périodiquement
            loopInterval = setInterval(checkTime, 500);
        } else {
            setTimeout(startLoop, 500); // Attendre et réessayer
        }
    }

    function checkTime() {
        if (player.currentTime >= loopEndSeconds) {
            // Revenir au point de départ à la fin de la section
            player.currentTime = loopStartSeconds;
        }
    }

    function resetVideoLooper() {
        // Si la boucle est déjà définie, réinitialiser la vidéo à la boucle
        if (loopStartSeconds !== undefined && loopEndSeconds !== undefined) {
            // Supprimer la boucle en réinitialisant les valeurs
            loopStartSeconds = undefined;
            loopEndSeconds = undefined;
            localStorage.removeItem(`loopStart_${videoId}`);
            localStorage.removeItem(`loopEnd_${videoId}`);
            clearInterval(loopInterval); // Arrêter la boucle
            player.play(); // Reprendre la lecture
        } else {
            // Si la boucle n'est pas définie, demander à l'utilisateur
            const userInput = prompt('Entrez le temps de début et de fin (format hhmmss hhmmss) :');

            if (userInput !== null) { // Si l'utilisateur n'a pas cliqué sur "Annuler"
                const inputParts = userInput.split(' ');
                if (inputParts.length === 2) {
                    loopStartSeconds = timeStringToSeconds(inputParts[0] + '00');
                    loopEndSeconds = timeStringToSeconds(inputParts[1] + '00');

                    // Enregistrer la boucle dans le stockage local pour une utilisation future
                    localStorage.setItem(`loopStart_${videoId}`, loopStartSeconds);
                    localStorage.setItem(`loopEnd_${videoId}`, loopEndSeconds);

                    // Commencer la boucle
                    startLoop();
                } else {
                    alert('Format invalide. Utilisez le format "hhmmss hhmmss".');
                }
            }
        }

        // Mettre à jour le texte du bouton en fonction de la présence ou de l'absence de boucle
        updateButtonLabel();
    }

    // Fonction pour mettre à jour le texte du bouton en fonction de la présence ou de l'absence de boucle
    function updateButtonLabel() {
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.textContent = loopStartSeconds !== undefined ? 'Réinitialiser le Looper' : 'Initialiser le Looper';
        }
    }

    // Créez un bouton de réinitialisation
    const resetButton = document.createElement('button');
    resetButton.id = 'resetButton';
    resetButton.style.position = 'fixed';
    resetButton.style.top = '60px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '1000';
    resetButton.addEventListener('click', resetVideoLooper);

    // Ajoutez le bouton à la page
    document.body.appendChild(resetButton);

    // Initialise le texte du bouton au chargement de la page
    updateButtonLabel();

    // Convertir une chaîne de temps au format hhmmss en secondes
    function timeStringToSeconds(timeString) {
        const hours = parseInt(timeString.substring(0, 2)) || 0;
        const minutes = parseInt(timeString.substring(2, 4)) || 0;
        const seconds = parseInt(timeString.substring(4, 6)) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

})();
