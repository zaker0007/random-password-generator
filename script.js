const password = document.getElementById("password");

const lengthSlider = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const generateBtn = document.getElementById("generateBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const copyBtn = document.getElementById("copyBtn");
const toggleBtn = document.getElementById("toggleBtn");

const error = document.getElementById("error");
const strengthText = document.getElementById("strengthText");

const bars = document.querySelectorAll(".strength-bars span");

const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/"
};

const similarCharacters = "0O1lI";

// Update password length
lengthSlider.addEventListener("input", function () {
    lengthValue.textContent = lengthSlider.value;
});

// Get secure random number without modulo bias
function secureRandomInt(max) {

    if (!Number.isSafeInteger(max) || max < 1) {
        throw new Error("Invalid random range");
    }

    const range = 0x100000000;
    const limit = range - (range % max);

    const buffer = new Uint32Array(1);

    let value;

    do {
        crypto.getRandomValues(buffer);
        value = buffer[0];
    } while (value >= limit);

    return value % max;
}

// Securely shuffle password characters
function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = secureRandomInt(i + 1);

        [array[i], array[j]] =
            [array[j], array[i]];
    }

    return array;
}

// Generate Password
function generatePassword() {

    error.textContent = "";

    if (!window.crypto ||
        typeof crypto.getRandomValues !== "function") {

        error.textContent =
            "Secure password generation is not supported.";

        return;
    }

    let selectedSets = [];

    for (let key in characterSets) {

        const checkbox =
            document.getElementById(key);

        if (checkbox.checked) {
            selectedSets.push(characterSets[key]);
        }
    }

    // Validate selection
    if (selectedSets.length === 0) {

        password.value = "";

        error.textContent =
            "Please select at least one character type.";

        updateStrength("");

        return;
    }

    // Exclude similar characters
    const excludeSimilar =
        document.getElementById("excludeSimilar").checked;

    if (excludeSimilar) {

        selectedSets = selectedSets.map(set => {

            return [...set]
                .filter(char =>
                    !similarCharacters.includes(char)
                )
                .join("");

        });
    }

    selectedSets = selectedSets.filter(set => set.length > 0);

    if (selectedSets.length === 0) {

        error.textContent =
            "No characters available. Change your settings.";

        return;
    }

    const length = Number(lengthSlider.value);

    const pool = [...new Set(selectedSets.join(""))];

    let result = [];

    // Include at least one character from each selected set
    for (let set of selectedSets) {

        const randomIndex = secureRandomInt(set.length);

        result.push(set[randomIndex]);
    }

    // Fill remaining password positions
    while (result.length < length) {

        const randomIndex = secureRandomInt(pool.length);

        result.push(pool[randomIndex]);
    }

    // Shuffle password securely
    result = shuffle(result);

    password.type = "text";
    password.value = result.join("");

    toggleBtn.textContent = "Hide";

    updateStrength(password.value);
}

// Password strength indicator
function updateStrength(value) {

    let score = 0;

    if (value.length >= 12) score++;

    if (value.length >= 16) score++;

    if (/[a-z]/.test(value) &&
        /[A-Z]/.test(value)) score++;

    if (/[0-9]/.test(value) &&
        /[^A-Za-z0-9]/.test(value)) score++;

    bars.forEach((bar, index) => {

        bar.classList.toggle("active", index < score);

    });

    const labels = [
        "Ready to generate",
        "Basic",
        "Fair",
        "Strong",
        "Very Strong"
    ];

    strengthText.textContent =
        value ? labels[score] : labels[0];
}

// Copy Password
async function copyPassword() {

    if (!password.value) {

        error.textContent =
            "Please generate a password first.";

        return;
    }

    try {

        if (navigator.clipboard &&
            window.isSecureContext) {

            await navigator.clipboard.writeText(
                password.value
            );

        } else {

            password.focus();
            password.select();

            const copied =
                document.execCommand("copy");

            if (!copied) {
                throw new Error("Copy failed");
            }
        }

        copyBtn.textContent = "Copied!";

        setTimeout(() => {
            copyBtn.textContent = "Copy";
        }, 1500);

    } catch (err) {

        error.textContent =
            "Copy failed. Please copy manually.";
    }
}

// Show / Hide Password
function togglePassword() {

    if (!password.value) return;

    if (password.type === "password") {

        password.type = "text";
        toggleBtn.textContent = "Hide";

    } else {

        password.type = "password";
        toggleBtn.textContent = "Show";
    }
}

// Button Events
generateBtn.addEventListener(
    "click",
    generatePassword
);

regenerateBtn.addEventListener(
    "click",
    generatePassword
);

copyBtn.addEventListener(
    "click",
    copyPassword
);

toggleBtn.addEventListener(
    "click",
    togglePassword
);

// Generate first password on page load
generatePassword();