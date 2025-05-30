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
let clearAllBtnElement = null; 

// --- Theme Management ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIconMoon.classList.remove('hidden'); 
        themeIconSun.classList.add('hidden');    
    } else {
        document.documentElement.classList.remove('dark');
        themeIconSun.classList.remove('hidden');  
        themeIconMoon.classList.add('hidden');   
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
        applyTheme('light'); 
    }
}
initializeTheme(); 

themeToggleBtn.addEventListener('click', () => {
    let newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- Clear All Inputs Functionality ---
function clearAllInputs() {
    for (let i = 1; i <= TOTAL_SEMESTERS; i++) {
        const semId = `sem${i}`;
        const sgpaInput = document.getElementById(`sgpa-${semId}`);
        const creditsInput = document.getElementById(`credits-${semId}`);
        const includeCheckbox = document.getElementById(`include-${semId}`);
        const card = document.getElementById(`card-${semId}`);

        if (sgpaInput) sgpaInput.value = '';
        if (creditsInput) creditsInput.value = '';
        
        if (includeCheckbox) {
            includeCheckbox.checked = true; 
            if(sgpaInput) sgpaInput.disabled = false;     
            if(creditsInput) creditsInput.disabled = false;
        }
        if (card) {
            card.classList.remove('excluded'); 
        }
    }
    resultArea.innerHTML = '';
    percentageArea.innerHTML = '';
    convertToPercentageBtn.disabled = true;
    currentOverallCgpa = null;
}


// --- Semester Card Creation & Dynamic Button Insertion ---
for (let i = 1; i <= TOTAL_SEMESTERS; i++) {
    const semId = `sem${i}`;
    const card = document.createElement('div');
    card.className = 'semester-card'; 
    card.id = `card-${semId}`;

    card.innerHTML = `
        <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg">Semester ${i}</h2> 
            <div class="flex items-center">
                <span class="text-sm mr-3">Include:</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="include-${semId}" checked>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <div>
                <label for="sgpa-${semId}" class="block text-sm font-medium mb-2">SGPA/GPA:</label>
                <input type="number" id="sgpa-${semId}" name="sgpa-${semId}" placeholder="e.g., 8.5" step="0.01" min="0" max="10" class="w-full">
            </div>
            <div>
                <label for="credits-${semId}" class="block text-sm font-medium mb-2">Credits:</label>
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
        if (resultArea.querySelector('.result-box')) { 
            resultArea.innerHTML = '';
        }
    };

    includeCheckbox.addEventListener('change', () => {
        const isIncluded = includeCheckbox.checked;
        sgpaInput.disabled = !isIncluded;
        creditsInput.disabled = !isIncluded;
        if (!isIncluded) { 
            sgpaInput.value = '';
            creditsInput.value = '';
        }
        card.classList.toggle('excluded', !isIncluded);
        resetDependentFields();
    });
    [sgpaInput, creditsInput].forEach(input => {
        input.addEventListener('input', resetDependentFields);
    });
} // End of semester card creation loop

// Now, create and append the Clear All button AFTER all semester cards
clearAllBtnElement = document.createElement('button');
clearAllBtnElement.id = 'clearAllBtn';
// Add a new class for specific styling if general .tertiary-btn isn't enough
clearAllBtnElement.className = 'action-btn tertiary-btn clear-all-dynamic-btn'; 
clearAllBtnElement.textContent = 'Clear All Inputs';
semestersContainer.appendChild(clearAllBtnElement); // Append to the grid container

if(clearAllBtnElement) { 
    clearAllBtnElement.addEventListener('click', clearAllInputs);
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
            if (sgpa > 0 && credits <= 0) { 
                displayError(`Credits for Semester ${i} must be positive if SGPA > 0.`);
                creditsInput.focus(); hasError = true; break;
            }
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
                if (sgpaInput.value && creditsInput.value) {
                    includedAndFilled++;
                }
            }
        }
        if (anyIncluded && includedAndFilled === 0) {
             displayError("Please enter SGPA and Credits for included semesters.");
        } else if (!anyIncluded) {
             displayError("Please include at least one semester.");
        } else { 
             displayResult("Overall CGPA is: 0.00 (Total credits are zero)");
             currentOverallCgpa = 0.00; 
             convertToPercentageBtn.disabled = false; 
        }
        return;
    }

    const overallCgpa = totalWeightedSgpa / totalCredits;
    displayResult(`Your Overall CGPA is: ${overallCgpa.toFixed(2)}`);
    currentOverallCgpa = overallCgpa; 
    convertToPercentageBtn.disabled = false; 
});

// --- Convert to Percentage ---
convertToPercentageBtn.addEventListener('click', () => {
    if (currentOverallCgpa === null) {
        percentageArea.innerHTML = `<div class="error-box">Please calculate CGPA first.</div>`;
        return;
    }
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
