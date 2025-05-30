// script.js
const semestersContainer = document.getElementById('semestersContainer');
const calculateCgpaBtn = document.getElementById('calculateCgpaBtn');
const convertToPercentageBtn = document.getElementById('convertToPercentageBtn');
const resultArea = document.getElementById('resultArea');
const percentageArea = document.getElementById('percentageArea');
const TOTAL_SEMESTERS = 8;

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconMoon = document.getElementById('themeIconMoon');
const themeIconSun = document.getElementById('themeIconSun');

let currentOverallCgpa = null; 

// --- Theme Management ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIconMoon.classList.remove('hidden'); // Show moon
        themeIconSun.classList.add('hidden');    // Hide sun
    } else {
        document.documentElement.classList.remove('dark');
        themeIconSun.classList.remove('hidden');  // Show sun
        themeIconMoon.classList.add('hidden');   // Hide moon
    }
}
function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) {
        applyTheme(storedTheme);
    } else if (systemPrefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light'); // Default to light
    }
}
initializeTheme(); // Call on page load

themeToggleBtn.addEventListener('click', () => {
    let newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- Semester Card Creation ---
function createSemesterCard(semNumber) {
    const semId = `sem${semNumber}`;
    const card = document.createElement('div');
    // Add Tailwind classes directly here or ensure they are in style.css if this element is complex
    card.className = 'semester-card'; // Ensure this class matches your CSS
    card.id = `card-${semId}`;

    // Using Tailwind classes directly in the JS-generated HTML
    card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Semester ${semNumber}</h2>
            <div class="flex items-center">
                <span class="text-sm mr-2.5">Include:</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="include-${semId}" checked>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
                <label for="sgpa-${semId}" class="block text-sm font-medium mb-1.5">SGPA/GPA:</label>
                <input type="number" id="sgpa-${semId}" name="sgpa-${semId}" placeholder="e.g., 8.5" step="0.01" min="0" max="10" class="w-full">
            </div>
            <div>
                <label for="credits-${semId}" class="block text-sm font-medium mb-1.5">Credits:</label>
                <input type="number" id="credits-${semId}" name="credits-${semId}" placeholder="e.g., 24" step="1" min="0" class="w-full">
            </div>
        </div>`;
    semestersContainer.appendChild(card);

    const includeCheckbox = card.querySelector(`#include-${semId}`);
    const sgpaInput = card.querySelector(`#sgpa-${semId}`);
    const creditsInput = card.querySelector(`#credits-${semId}`);
    
    const resetDependentFields = () => {
        percentageArea.innerHTML = '';
        convertToPercentageBtn.disabled = true;
        currentOverallCgpa = null;
    };

    includeCheckbox.addEventListener('change', () => {
        const isIncluded = includeCheckbox.checked;
        sgpaInput.disabled = !isIncluded;
        creditsInput.disabled = !isIncluded;
        card.classList.toggle('excluded', !isIncluded);
        resetDependentFields();
    });
    [sgpaInput, creditsInput].forEach(input => {
        input.addEventListener('input', resetDependentFields);
    });
}
// Generate semester cards on page load
for (let i = 1; i <= TOTAL_SEMESTERS; i++) {
    createSemesterCard(i);
}

// --- CGPA Calculation ---
calculateCgpaBtn.addEventListener('click', () => {
    let totalWeightedSgpa = 0;
    let totalCredits = 0;
    let hasError = false;
    resultArea.innerHTML = ''; 
    percentageArea.innerHTML = ''; 
    convertToPercentageBtn.disabled = true; 
    currentOverallCgpa = null;

    for (let i = 1; i <= TOTAL_SEMESTERS; i++) {
        const semId = `sem${i}`;
        const includeCheckbox = document.getElementById(`include-${semId}`);
        if (includeCheckbox && includeCheckbox.checked) {
            const sgpaInput = document.getElementById(`sgpa-${semId}`);
            const creditsInput = document.getElementById(`credits-${semId}`);
            const sgpa = parseFloat(sgpaInput.value);
            const credits = parseInt(creditsInput.value, 10);

            if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
                displayError(`Invalid SGPA for Semester ${i}. Must be 0-10.`);
                sgpaInput.focus(); hasError = true; break;
            }
            if (isNaN(credits) || credits < 0) {
                displayError(`Invalid Credits for Semester ${i}. Must be non-negative.`);
                creditsInput.focus(); hasError = true; break;
            }
            // If SGPA is entered and is > 0, credits must also be > 0.
            // Allows (SGPA=0, Credits=0) or (SGPA=0, Credits=positive_value)
            if (sgpa > 0 && credits <= 0) { 
                displayError(`Credits for Semester ${i} must be positive if SGPA > 0.`);
                creditsInput.focus(); hasError = true; break;
            }
            
            // Only add to totals if credits are positive. SGPA can be 0.
            if (credits > 0) {
                totalWeightedSgpa += sgpa * credits;
                totalCredits += credits;
            }
        }
    }

    if (hasError) return;

    if (totalCredits === 0) {
        let includedAndFilled = 0;
        let anyIncluded = false;
        for (let i = 1; i <= TOTAL_SEMESTERS; i++) {
            const includeCheckbox = document.getElementById(`include-sem${i}`);
            if (includeCheckbox && includeCheckbox.checked) {
                anyIncluded = true;
                const sgpaInput = document.getElementById(`sgpa-sem${i}`);
                const creditsInput = document.getElementById(`credits-sem${i}`);
                if (sgpaInput.value && creditsInput.value) { // Check if both fields have some value
                    includedAndFilled++;
                }
            }
        }

        if (anyIncluded && includedAndFilled === 0) {
             displayError("Please enter SGPA and Credits for included semesters.");
        } else if (!anyIncluded) {
             displayError("Please include at least one semester.");
        } else { // Included semesters are present, but total credits sum to 0 (e.g., all included sems have 0 credits)
             displayResult("Overall CGPA is: 0.00 (Total credits are zero)");
             currentOverallCgpa = 0.00; 
             convertToPercentageBtn.disabled = false; 
        }
        return;
    }

    const overallCgpa = totalWeightedSgpa / totalCredits;
    displayResult(`Your Overall CGPA is: ${overallCgpa.toFixed(2)}`);
    currentOverallCgpa = overallCgpa; // Store the actual numeric value
    convertToPercentageBtn.disabled = false; 
});

// --- Convert to Percentage ---
convertToPercentageBtn.addEventListener('click', () => {
    if (currentOverallCgpa === null) {
        percentageArea.innerHTML = `<div class="error-box">Please calculate CGPA first.</div>`;
        return;
    }
    // Ensure currentOverallCgpa is treated as a number for calculation
    const numericCgpa = parseFloat(currentOverallCgpa);
    if (isNaN(numericCgpa)) {
         percentageArea.innerHTML = `<div class="error-box">Invalid CGPA value for percentage conversion.</div>`;
         return;
    }
    const percentage = numericCgpa * 9.5;
    percentageArea.innerHTML = `<div class="percentage-box">Equivalent Percentage: ${percentage.toFixed(2)}%</div>`;
});


function displayError(message) {
    resultArea.innerHTML = `<div class="error-box">${message}</div>`;
    percentageArea.innerHTML = ''; 
    convertToPercentageBtn.disabled = true;
}
function displayResult(message) {
    resultArea.innerHTML = `<div class="result-box">${message}</div>`;
}
