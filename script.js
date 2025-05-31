// script.js

// Declare variables that will hold DOM elements
let semestersContainer, calculateCgpaBtn, convertToPercentageBtn, clearAllBtn, addSemesterBtn, removeSemesterBtn;
let resultArea, percentageArea;
let themeToggleBtn, themeIconMoon, themeIconSun;

// Declare other global variables
let currentOverallCgpa = null; 
let semesterCount = 0; 
const MIN_SEMESTERS = 1;
const MAX_SEMESTERS = 12; 

// --- Theme Management ---
function applyTheme(theme) {
    if (!document.documentElement || !themeIconMoon || !themeIconSun) {
        // Guard against null elements if called too early, though DOMContentLoaded should prevent this.
        console.error("Theme elements not ready for applyTheme");
        return;
    }
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIconMoon.classList.remove('hidden'); 
        themeIconSun.classList.add('hidden');    
    } else { // Light mode
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
        applyTheme('light'); // Default to light
    }
}

// --- Input Validation & Feedback ---
function validateField(inputElement, isCreditsField = false) {
    if (!inputElement) return true; // Should not happen if called correctly
    const value = parseFloat(inputElement.value);
    let isValid = true;

    if (isCreditsField) {
        if (isNaN(value) || value < 0) {
            isValid = false;
        }
    } else { // SGPA field
        if (isNaN(value) || value < 0 || value > 10) {
            isValid = false;
        }
    }

    if (isValid) {
        inputElement.classList.remove('input-error');
    } else {
        if (inputElement.value !== "") { 
             inputElement.classList.add('input-error');
        } else {
            inputElement.classList.remove('input-error'); 
        }
    }
    return isValid;
}


// --- Semester Card Creation ---
function createSemesterCard(semNum) {
    const semId = `sem${semNum}`;
    const card = document.createElement('div');
    card.className = 'semester-card'; 
    card.id = `card-${semId}`;

    card.innerHTML = `
        <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg">Semester ${semNum}</h2> 
            <div class="flex items-center toggle-switch-container has-tooltip" data-tooltip="Check to include this semester in CGPA calculation">
                <span class="text-sm mr-3 include-label-span">Include:</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="include-${semId}" checked>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <div>
                <label for="sgpa-${semId}" class="block text-sm font-medium mb-2 has-tooltip" data-tooltip="Semester Grade Point Average (0-10)">SGPA/GPA:</label>
                <input type="number" id="sgpa-${semId}" name="sgpa-${semId}" placeholder="e.g., 8.5" step="0.01" min="0" max="10" class="w-full">
            </div>
            <div>
                <label for="credits-${semId}" class="block text-sm font-medium mb-2 has-tooltip" data-tooltip="Total credits for this semester (e.g., 24)">Credits:</label>
                <input type="number" id="credits-${semId}" name="credits-${semId}" placeholder="e.g., 24" step="1" min="0" class="w-full">
            </div>
        </div>`;
    
    const sgpaInput = card.querySelector(`#sgpa-${semId}`);
    const creditsInput = card.querySelector(`#credits-${semId}`);
    const includeCheckbox = card.querySelector(`#include-${semId}`);

    sgpaInput.addEventListener('input', () => validateField(sgpaInput, false));
    creditsInput.addEventListener('input', () => validateField(creditsInput, true));
    
    const resetDependentFieldsAndClearError = () => {
        if(percentageArea) percentageArea.innerHTML = '';
        if(convertToPercentageBtn) convertToPercentageBtn.disabled = true;
        currentOverallCgpa = null;
        if (resultArea && (resultArea.querySelector('.result-box') || resultArea.querySelector('.error-box'))) { 
            resultArea.innerHTML = '';
        }
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    };

    includeCheckbox.addEventListener('change', () => {
        const isIncluded = includeCheckbox.checked;
        sgpaInput.disabled = !isIncluded;
        creditsInput.disabled = !isIncluded;
        if (!isIncluded) { 
            sgpaInput.value = '';
            creditsInput.value = '';
            sgpaInput.classList.remove('input-error');
            creditsInput.classList.remove('input-error');
        }
        card.classList.toggle('excluded', !isIncluded);
        resetDependentFieldsAndClearError();
    });
    [sgpaInput, creditsInput].forEach(input => {
        input.addEventListener('input', resetDependentFieldsAndClearError); 
    });
    
    return card;
}

function updateSemesterButtons() {
    if(removeSemesterBtn) removeSemesterBtn.disabled = semesterCount <= MIN_SEMESTERS;
    if(addSemesterBtn) addSemesterBtn.disabled = semesterCount >= MAX_SEMESTERS;
}

function addSemester() {
    if (semesterCount < MAX_SEMESTERS) {
        semesterCount++;
        const newCard = createSemesterCard(semesterCount);
        if(semestersContainer) semestersContainer.appendChild(newCard);
        updateSemesterButtons();
        clearResultsAndErrors(); 
    }
}

function removeLastSemester() {
    if (semesterCount > MIN_SEMESTERS) {
        const lastSemCard = document.getElementById(`card-sem${semesterCount}`);
        if (lastSemCard && semestersContainer) {
            semestersContainer.removeChild(lastSemCard);
        }
        semesterCount--;
        updateSemesterButtons();
        clearResultsAndErrors(); 
    }
}

function initializeSemesters(count) { 
    if(!semestersContainer) return;
    semestersContainer.innerHTML = ''; 
    semesterCount = 0; 
    let initialCount = count;
    if (initialCount < MIN_SEMESTERS) initialCount = MIN_SEMESTERS;
    if (initialCount > MAX_SEMESTERS) initialCount = MAX_SEMESTERS;

    for (let i = 1; i <= initialCount; i++) {
        semesterCount++; 
        const newCard = createSemesterCard(semesterCount);
        semestersContainer.appendChild(newCard);
    }
    updateSemesterButtons(); 
}


// --- Clear All Inputs Functionality ---
function clearAllInputs() {
    for (let i = 1; i <= semesterCount; i++) { 
        const semId = `sem${i}`;
        const sgpaInput = document.getElementById(`sgpa-${semId}`);
        const creditsInput = document.getElementById(`credits-${semId}`);
        const includeCheckbox = document.getElementById(`include-${semId}`);
        const card = document.getElementById(`card-sem${i}`); 

        if (sgpaInput) {
            sgpaInput.value = '';
            sgpaInput.classList.remove('input-error');
        }
        if (creditsInput) {
            creditsInput.value = '';
            creditsInput.classList.remove('input-error');
        }
        
        if (includeCheckbox) {
            includeCheckbox.checked = true; 
            if(sgpaInput) sgpaInput.disabled = false;     
            if(creditsInput) creditsInput.disabled = false;
        }
        if (card) {
            card.classList.remove('excluded'); 
        }
    }
    clearResultsAndErrors();
}

function clearResultsAndErrors(){
    if(resultArea) resultArea.innerHTML = '';
    if(percentageArea) percentageArea.innerHTML = '';
    if(convertToPercentageBtn) convertToPercentageBtn.disabled = true;
    currentOverallCgpa = null;
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// --- CGPA Calculation ---
function calculateCgpa() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    let totalWeightedSgpa = 0;
    let totalCredits = 0;
    let hasError = false;
    if(resultArea) resultArea.innerHTML = ''; 
    if(percentageArea) percentageArea.innerHTML = ''; 
    if(convertToPercentageBtn) convertToPercentageBtn.disabled = true; 
    currentOverallCgpa = null;

    for (let i = 1; i <= semesterCount; i++) { 
        const semId = `sem${i}`;
        const includeCheckbox = document.getElementById(`include-${semId}`);
        const sgpaInput = document.getElementById(`sgpa-sem${i}`);
        const creditsInput = document.getElementById(`credits-sem${i}`);

        if (includeCheckbox && includeCheckbox.checked) {
            const sgpa = parseFloat(sgpaInput.value);
            const credits = parseInt(creditsInput.value, 10);

            if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
                displayError(`Invalid SGPA for Semester ${i}. Must be 0-10.`);
                sgpaInput.classList.add('input-error');
                sgpaInput.focus(); hasError = true; break;
            } else {
                sgpaInput.classList.remove('input-error');
            }

            if (isNaN(credits) || credits < 0) {
                displayError(`Invalid Credits for Semester ${i}. Must be non-negative.`);
                creditsInput.classList.add('input-error');
                creditsInput.focus(); hasError = true; break;
            } else {
                creditsInput.classList.remove('input-error');
            }
            
            if (sgpa > 0 && credits <= 0) { 
                displayError(`Credits for Semester ${i} must be positive if SGPA > 0.`);
                creditsInput.classList.add('input-error');
                creditsInput.focus(); hasError = true; break;
            } else if (sgpa > 0 && credits > 0) { 
                 creditsInput.classList.remove('input-error');
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
        for (let i = 1; i <= semesterCount; i++) {
            const includeCheckbox = document.getElementById(`include-sem${i}`);
            if (includeCheckbox && includeCheckbox.checked) {
                anyIncluded = true;
                const sgpaInput = document.getElementById(`sgpa-sem${i}`);
                const creditsInput = document.getElementById(`credits-sem${i}`);
                if (sgpaInput.value && creditsInput.value) { 
                    if(!isNaN(parseFloat(sgpaInput.value)) && !isNaN(parseInt(creditsInput.value,10)) ){
                         includedAndFilled++;
                    }
                }
            }
        }
        if (anyIncluded && includedAndFilled === 0) {
             displayError("Please enter valid SGPA and Credits for included semesters.");
        } else if (!anyIncluded && semesterCount > 0) { 
             displayError("Please include at least one semester for calculation.");
        } else if (semesterCount === 0) {
            displayError("Please add at least one semester.");
        }
         else { 
             displayResult("Overall CGPA is: 0.00 (Total credits are zero)");
             currentOverallCgpa = 0.00; 
             if(convertToPercentageBtn) convertToPercentageBtn.disabled = false; 
        }
        return;
    }

    const overallCgpa = totalWeightedSgpa / totalCredits;
    displayResult(`Your Overall CGPA is: ${overallCgpa.toFixed(2)}`);
    currentOverallCgpa = overallCgpa; 
    if(convertToPercentageBtn) convertToPercentageBtn.disabled = false; 
}

// --- Convert to Percentage ---
function convertToPercentage() {
    if (currentOverallCgpa === null) {
        if(percentageArea) percentageArea.innerHTML = `<div class="error-box">Please calculate CGPA first.</div>`;
        return;
    }
    const numericCgpa = parseFloat(currentOverallCgpa);
    if (isNaN(numericCgpa)) {
         if(percentageArea) percentageArea.innerHTML = `<div class="error-box">Invalid CGPA value for percentage conversion.</div>`;
         return;
    }
    const percentage = numericCgpa * 9.5;
    if(percentageArea) percentageArea.innerHTML = `<div class="percentage-box">Equivalent Percentage: ${percentage.toFixed(2)}%</div>`;
}


function displayError(message) {
    if(resultArea) resultArea.innerHTML = `<div class="error-box">${message}</div>`;
    if(percentageArea) percentageArea.innerHTML = ''; 
    if(convertToPercentageBtn) convertToPercentageBtn.disabled = true;
}
function displayResult(message) {
    if(resultArea) resultArea.innerHTML = `<div class="result-box">${message}</div>`;
}

// --- Event Listeners and Initializations ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements
    semestersContainer = document.getElementById('semestersContainer');
    calculateCgpaBtn = document.getElementById('calculateCgpaBtn');
    convertToPercentageBtn = document.getElementById('convertToPercentageBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    addSemesterBtn = document.getElementById('addSemesterBtn');
    removeSemesterBtn = document.getElementById('removeSemesterBtn');
    resultArea = document.getElementById('resultArea');
    percentageArea = document.getElementById('percentageArea');
    themeToggleBtn = document.getElementById('themeToggleBtn');
    themeIconMoon = document.getElementById('themeIconMoon');
    themeIconSun = document.getElementById('themeIconSun');

    // Add event listeners (check if elements exist before adding)
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            let newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllInputs);
    if (addSemesterBtn) addSemesterBtn.addEventListener('click', addSemester);
    if (removeSemesterBtn) removeSemesterBtn.addEventListener('click', removeLastSemester);
    if (calculateCgpaBtn) calculateCgpaBtn.addEventListener('click', calculateCgpa);
    if (convertToPercentageBtn) convertToPercentageBtn.addEventListener('click', convertToPercentage);
    
    // Initializations
    initializeTheme(); 
    initializeSemesters(8); 
});
