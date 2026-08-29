/* ==========================================================
   GAME SETTINGS & CONFIGURATIONS
   ========================================================== */
const GAME_SETTINGS = {
    minNumber: 1,
    maxNumber: 9,
    maxAnswer: 10,
    answerChoicesCount: 5,
    questionDelay: 1500
};

const NUMBER_IMAGES = {
    1: "images/numbers/number-1.png",
    2: "images/numbers/number-2.png",
    3: "images/numbers/number-3.png",
    4: "images/numbers/number-4.png",
    5: "images/numbers/number-5.png",
    6: "images/numbers/number-6.png",
    7: "images/numbers/number-7.png",
    8: "images/numbers/number-8.png",
    9: "images/numbers/number-9.png",
    10: "images/numbers/number-10.png"
};

const AUDIO = {
    numbers: {
        1: "audio/numbers/number-1.mp3",
        2: "audio/numbers/number-2.mp3",
        3: "audio/numbers/number-3.mp3",
        4: "audio/numbers/number-4.mp3",
        5: "audio/numbers/number-5.mp3",
        6: "audio/numbers/number-6.mp3",
        7: "audio/numbers/number-7.mp3",
        8: "audio/numbers/number-8.mp3",
        9: "audio/numbers/number-9.mp3",
        10: "audio/numbers/number-10.mp3"
    },
    correct: "audio/correct.mp3",
    cheer: "audio/cheer.mp3",
    wrong: "audio/wrong.mp3"
};

/* Game State */
const gameState = {
    mode: null, // "addition" or "missing"
    numberA: null,
    numberB: null,
    answer: null,
    score: 0,
    questionNumber: 1,
    recentQuestions: [],
    soundEnabled: true,
    isProcessingAnswer: false
};

/* DOM Elements */
const modeSelectionScreen = document.getElementById("modeSelectionScreen");
const gameScreen = document.getElementById("gameScreen");
const scoreDisplay = document.getElementById("scoreDisplay");
const questionCountDisplay = document.getElementById("questionCountDisplay");
const box1 = document.getElementById("box1");
const box2 = document.getElementById("box2");
const box3 = document.getElementById("box3");
const choicesContainer = document.getElementById("choicesContainer");
const feedbackMessage = document.getElementById("feedbackMessage");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const changeModeBtn = document.getElementById("changeModeBtn");
const modeIndicator = document.getElementById("modeIndicator");
const confettiContainer = document.getElementById("confettiContainer");

/* ==========================================================
   INITIALIZATION & EVENT LISTENERS
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadSoundPreference();
    setupEventListeners();
});

function setupEventListeners() {
    // Mode selection buttons
    document.querySelectorAll(".mode-card").forEach(card => {
        const mode = card.getAttribute("data-mode");
        const btn = card.querySelector(".play-btn");
        btn.addEventListener("click", () => selectMode(mode));
    });

    // Sound toggle
    soundToggleBtn.addEventListener("click", toggleSound);

    // Change game mode button
    changeModeBtn.addEventListener("click", returnToModeSelection);
}

/* ==========================================================
   SOUND SYSTEM & AUDIO HANDLING
   ========================================================== */
function loadSoundPreference() {
    const savedSound = localStorage.getItem("soundEnabled");
    if (savedSound !== null) {
        gameState.soundEnabled = JSON.parse(savedSound);
    }
    updateSoundButtonUI();
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    localStorage.setItem("soundEnabled", gameState.soundEnabled);
    updateSoundButtonUI();
}

function updateSoundButtonUI() {
    soundToggleBtn.textContent = gameState.soundEnabled ? "🔊" : "🔇";
}

function playSound(src) {
    if (!gameState.soundEnabled) return;
    const audio = new Audio(src);
    audio.play().catch(e => console.log("Audio play blocked or missing:", e));
}

function playNumberAudio(num) {
    if (AUDIO.numbers[num]) {
        playSound(AUDIO.numbers[num]);
    }
}

/* ==========================================================
   MODE SELECTION & GAME FLOW
   ========================================================== */
function selectMode(mode) {
    gameState.mode = mode;
    gameState.score = 0;
    gameState.questionNumber = 1;
    gameState.recentQuestions = [];
    
    startGame();
}

function startGame() {
    modeSelectionScreen.classList.remove("active");
    gameScreen.classList.add("active");
    changeModeBtn.classList.remove("hidden");
    modeIndicator.classList.remove("hidden");

    if (gameState.mode === "addition") {
        modeIndicator.textContent = "➕ ADD THE NUMBERS";
    } else {
        modeIndicator.textContent = "🔍 FIND THE MISSING NUMBER";
    }

    generateQuestion();
}

function returnToModeSelection() {
    gameScreen.classList.remove("active");
    changeModeBtn.classList.add("hidden");
    modeIndicator.classList.add("hidden");
    modeSelectionScreen.classList.add("active");
    feedbackMessage.textContent = "";
}

/* ==========================================================
   QUESTION GENERATION LOGIC
   ========================================================== */
function generateQuestion() {
    gameState.isProcessingAnswer = false;
    feedbackMessage.textContent = "";
    box1.classList.remove("correct-glow", "shake", "drop-target");
    box2.classList.remove("correct-glow", "shake", "drop-target");
    box3.classList.remove("correct-glow", "shake", "drop-target");

    if (gameState.mode === "addition") {
        generateAdditionQuestion();
    } else {
        generateMissingNumberQuestion();
    }

    displayQuestion();
    setupDragAndDrop();
}

function generateAdditionQuestion() {
    let valid = false;
    while (!valid) {
        gameState.numberA = Math.floor(Math.random() * GAME_SETTINGS.maxNumber) + GAME_SETTINGS.minNumber;
        gameState.numberB = Math.floor(Math.random() * GAME_SETTINGS.maxNumber) + GAME_SETTINGS.minNumber;
        gameState.answer = gameState.numberA + gameState.numberB;

        const qString = `${gameState.numberA}+${gameState.numberB}`;
        if (gameState.answer <= GAME_SETTINGS.maxAnswer && !gameState.recentQuestions.includes(qString)) {
            valid = true;
            trackQuestion(qString);
        }
    }
}

function generateMissingNumberQuestion() {
    let valid = false;
    while (!valid) {
        let a = Math.floor(Math.random() * GAME_SETTINGS.maxNumber) + GAME_SETTINGS.minNumber;
        let ans = Math.floor(Math.random() * GAME_SETTINGS.maxNumber) + GAME_SETTINGS.minNumber;
        
        if (ans > a && ans <= GAME_SETTINGS.maxAnswer) {
            gameState.numberA = a;
            gameState.answer = ans; // This serves as total sum box 3
            gameState.numberB = ans - a; // This is the hidden missing number for box 2

            const qString = `${gameState.numberA}+?=${gameState.answer}`;
            if (!gameState.recentQuestions.includes(qString)) {
                valid = true;
                trackQuestion(qString);
            }
        }
    }
}

function trackQuestion(qString) {
    gameState.recentQuestions.push(qString);
    if (gameState.recentQuestions.length > 4) {
        gameState.recentQuestions.shift();
    }
}

/* ==========================================================
   DISPLAY RENDERERS
   ========================================================== */
function displayQuestion() {
    scoreDisplay.textContent = `⭐ Score: ${gameState.score}`;
    questionCountDisplay.textContent = `Question: ${gameState.questionNumber}`;

    // Reset boxes content
    box1.innerHTML = "";
    box2.innerHTML = "";
    box3.innerHTML = "";

    if (gameState.mode === "addition") {
        // Mode 1: [ A ] + [ B ] = [ ? ]
        displayNumber(box1, gameState.numberA);
        displayNumber(box2, gameState.numberB);
        displayEmptyBox(box3, "Drop Answer Here");

        // Audio sequence playback
        playNumberAudio(gameState.numberA);
        setTimeout(() => playSound("audio/plus.mp3"), 800);
        setTimeout(() => playNumberAudio(gameState.numberB), 1600);

    } else {
        // Mode 2: [ A ] + [ ? ] = [ Answer ]
        displayNumber(box1, gameState.numberA);
        displayEmptyBox(box2, "Missing Number");
        displayNumber(box3, gameState.answer);

        // Audio sequence playback
        playNumberAudio(gameState.numberA);
        setTimeout(() => playNumberAudio(gameState.answer), 600);
    }

    generateAnswerChoices();
}

function displayNumber(boxElement, number) {
    const img = document.createElement("img");
    img.src = NUMBER_IMAGES[number];
    img.alt = `Number ${number}`;
    boxElement.appendChild(img);
}

function displayEmptyBox(boxElement, placeholderText) {
    boxElement.innerHTML = `<span style="font-size: 2rem; color: #ff4757; font-weight: bold;">?</span>`;
    boxElement.setAttribute("aria-label", placeholderText);
}

function generateAnswerChoices() {
    choicesContainer.innerHTML = "";
    
    // Determine correct answer depending on mode
    const targetCorrectValue = (gameState.mode === "addition") ? gameState.answer : gameState.numberB;
    
    let choices = [targetCorrectValue];
    while (choices.length < GAME_SETTINGS.answerChoicesCount) {
        let randomChoice = Math.floor(Math.random() * GAME_SETTINGS.maxNumber) + GAME_SETTINGS.minNumber;
        if (!choices.includes(randomChoice) && randomChoice <= GAME_SETTINGS.maxAnswer) {
            choices.push(randomChoice);
        }
    }

    // Shuffle choices
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(val => {
        const item = document.createElement("div");
        item.classList.add("choice-item");
        item.setAttribute("data-value", val);

        const img = document.createElement("img");
        img.src = NUMBER_IMAGES[val];
        img.alt = `Number ${val}`;
        item.appendChild(img);

        choicesContainer.appendChild(item);
    });
}

/* ==========================================================
   POINTER EVENTS DRAG AND DROP SYSTEM
   ========================================================== */
function setupDragAndDrop() {
    const choices = choicesContainer.querySelectorAll(".choice-item");
    const targetBox = (gameState.mode === "addition") ? box3 : box2;

    choices.forEach(choice => {
        let activePointerId = null;
        let clone = null;
        let startX, startY;
        let grabOffsetX, grabOffsetY;

        choice.addEventListener("pointerdown", (e) => {
            if (gameState.isProcessingAnswer) return;
            playNumberAudio(parseInt(choice.getAttribute("data-value")));
            activePointerId = e.pointerId;
            choice.setPointerCapture(activePointerId);

            const rect = choice.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            grabOffsetX = e.clientX - rect.left;
            grabOffsetY = e.clientY - rect.top;

            // Create floating drag clone element
            clone = choice.cloneNode(true);
            clone.style.position = "fixed";
            clone.style.left = `${rect.left}px`;
            clone.style.top = `${rect.top}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.zIndex = "1000";
            clone.style.pointerEvents = "none";
            clone.style.animation = "none";
            clone.style.transform = "scale(1.15)";
            clone.style.boxShadow = "0 15px 30px rgba(0,0,0,0.3)";
            document.body.appendChild(clone);

            choice.style.opacity = "0.4";
            targetBox.classList.add("drop-target");

            e.preventDefault();
        });

        choice.addEventListener("pointermove", (e) => {
            if (e.pointerId !== activePointerId || !clone) return;

            clone.style.left = `${e.clientX - grabOffsetX}px`;
            clone.style.top = `${e.clientY - grabOffsetY}px`;

            // Check overlap with target box
            const targetRect = targetBox.getBoundingClientRect();
            if (
                e.clientX >= targetRect.left &&
                e.clientX <= targetRect.right &&
                e.clientY >= targetRect.top &&
                e.clientY <= targetRect.bottom
            ) {
                targetBox.style.background = "#ffeaa7";
            } else {
                targetBox.style.background = "";
            }
        });

        choice.addEventListener("pointerup", (e) => {
            if (e.pointerId !== activePointerId || !clone) return;

            choice.style.opacity = "1";
            targetBox.classList.remove("drop-target");
            targetBox.style.background = "";

            // Check drop coordinates against target box
            const targetRect = targetBox.getBoundingClientRect();
            const droppedCorrectly = (
                e.clientX >= targetRect.left &&
                e.clientX <= targetRect.right &&
                e.clientY >= targetRect.top &&
                e.clientY <= targetRect.bottom
            );

            if (droppedCorrectly) {
                clone.remove();
                clone = null;
                const selectedValue = parseInt(choice.getAttribute("data-value"));
                checkAnswer(selectedValue, targetBox);
            } else {
                clone.style.transition = "left 0.18s ease, top 0.18s ease, opacity 0.18s ease";
                clone.style.left = `${choice.getBoundingClientRect().left}px`;
                clone.style.top = `${choice.getBoundingClientRect().top}px`;
                clone.style.opacity = "0";
                setTimeout(() => {
                    if (clone) {
                        clone.remove();
                        clone = null;
                    }
                }, 180);
            }

            choice.releasePointerCapture(activePointerId);
            activePointerId = null;
        });
    });
}

/* ==========================================================
   ANSWER VALIDATION & FEEDBACK
   ========================================================== */
function checkAnswer(selectedValue, targetBox) {
    if (gameState.isProcessingAnswer) return;

    const correctValue = (gameState.mode === "addition") ? gameState.answer : gameState.numberB;

    if (selectedValue === correctValue) {
        handleCorrectAnswer(targetBox, correctValue);
    } else {
        handleWrongAnswer(targetBox);
    }
}

function handleCorrectAnswer(targetBox, correctValue) {
    gameState.isProcessingAnswer = true;
    gameState.score++;
    
    // Play audio reinforcement
    playSound(AUDIO.correct);
    setTimeout(() => playSound(AUDIO.cheer), 400);

    // Visual feedback
    targetBox.innerHTML = "";
    displayNumber(targetBox, correctValue);
    setTimeout(() => playNumberAudio(correctValue), 800);
    targetBox.classList.add("correct-glow");

    const messages = ["🎉 Great Job!", "⭐ Excellent!", "🌟 Well Done!"];
    feedbackMessage.textContent = messages[Math.floor(Math.random() * messages.length)];

    showCelebrationConfetti();

    // Proceed to next question after delay
    setTimeout(() => {
        gameState.questionNumber++;
        generateQuestion();
    }, GAME_SETTINGS.questionDelay);
}

function handleWrongAnswer(targetBox) {
    playSound(AUDIO.wrong);
    targetBox.classList.add("shake");
    
    const messages = ["Try Again!", "Almost!", "Give it another go!"];
    feedbackMessage.textContent = messages[Math.floor(Math.random() * messages.length)];

    setTimeout(() => {
        targetBox.classList.remove("shake");
        feedbackMessage.textContent = "";
    }, 800);
}

/* ==========================================================
   CELEBRATION / CONFETTI EFFECT
   ========================================================== */
function showCelebrationConfetti() {
    const colors = ["#ff4757", "#2ed573", "#ffa502", "#70a1ff", "#ff6b81", "#dfe4ea"];
    
    for (let i = 0; i < 40; i++) {
        const piece = document.createElement("div");
        piece.classList.add("confetti-piece");
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = `${Math.random() * 1 + 1}s`;
        piece.style.animationDelay = `${Math.random() * 0.3}s`;
        
        confettiContainer.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, 2000);
    }
}