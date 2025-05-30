// script.js
const semestersContainer = document.getElementById('semestersContainer');
const calculateCgpaBtn = document.getElementById('calculateCgpaBtn');
const convertToPercentageBtn = document.getElementById('convertToPercentageBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const addSemesterBtn = document.getElementById('addSemesterBtn');
const removeSemesterBtn = document.getElementById('removeSemesterBtn');

const resultArea = document.getElementById('resultArea');
const percentageArea = document.getElementById('percentageArea');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconMoon = document.getElementById('themeIconMoon');
const themeIconSun = document.getElementById('themeIconSun');

let currentOverallCgpa = null; 
let semesterCount = 0; // Will be initialized
const MIN_SEMESTERS = 1;
const MAX_SEMESTERS = 12; // Or any other practical limit

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
    if (storedTheme) applyTheme(storedTheme);
    else if (systemPrefersDark) applyTheme('dark');
    else applyTheme('light');
}
initializeTheme(); 

themeToggleBtn.addEventListener('click', () => {
    let newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- Input Validation & Feedback ---
function validateField(inputElement, isCreditsField = false) {
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

    if (!inputElement.value && !isCreditsField) { // SGPA can be empty initially, credits can be 0
         // If SGPA is empty, don't mark as error immediately on input unless calculation is attempted
         // Or, if you want immediate feedback for empty SGPA:
         // isValid = false; 
    }


    if (isValid) {
        inputElement.classList.remove('input-error');
    } else {
        // Only add error if there's some value or it's a required field during calculation
        // For live validation, if it's empty, we might not want to show error yet.
        // This logic is primarily for when calculate is pressed or if value is present and wrong.
        if (inputElement.value !== "") { // Show error if value is present and invalid
             inputElement.classList.add('input-error');
        } else {
            inputElement.classList.remove('input-error'); // Clear error if field becomes empty
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
    
    const sgpaInput = card.querySelector(`#sgpa-${semId}`);
    const creditsInput = card.querySelector(`#credits-${semId}`);
    const includeCheckbox = card.querySelector(`#include-${semId}`);

    // Live validation listeners
    sgpaInput.addEventListener('input', () => validateField(sgpaInput, false));
    creditsInput.addEventListener('input', () => validateField(creditsInput, true));
    
    const resetDependentFieldsAndClearError = () => {
        percentageArea.innerHTML = '';
        convertToPercentageBtn.disabled = true;
        currentOverallCgpa = null;
        if (resultArea.querySelector('.result-box') || resultArea.querySelector('.error-box')) { 
            resultArea.innerHTML = '';
        }
        // Clear previous error visual states when inputs change significantly
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
        input.addEventListener('input', resetDependentFieldsAndClearError); // Also clear errors on general input
    });
    
    return card;
}

function updateSemesterButtons() {
    removeSemesterBtn.disabled = semesterCount <= MIN_SEMESTERS;
    addSemesterBtn.disabled = semesterCount >= MAX_SEMESTERS;
}

function addSemester() {
    if (semesterCount < MAX_SEMESTERS) {
        semesterCount++;
        const newCard = createSemesterCard(semesterCount);
        semestersContainer.appendChild(newCard);
        updateSemesterButtons();
        clearResultsAndErrors(); // Clear any previous calculation results
    }
}

function removeLastSemester() {
    if (semesterCount > MIN_SEMESTERS) {
        const lastSemCard = document.getElementById(`card-sem${semesterCount}`);
        if (lastSemCard) {
            semestersContainer.removeChild(lastSemCard);
        }
        semesterCount--;
        updateSemesterButtons();
        clearResultsAndErrors(); // Clear any previous calculation results
    }
}

function initializeSemesters(count = 2) { // Default to 2 semesters
    semestersContainer.innerHTML = ''; // Clear any existing
    semesterCount = 0; // Reset before adding
    for (let i = 1; i <= count; i++) {
        addSemester(); // Use the addSemester function to ensure count is managed
    }
    if (count < MIN_SEMESTERS) { // Ensure we have at least MIN_SEMESTERS
        for (let i = semesterCount + 1; i <= MIN_SEMESTERS; i++) {
            addSemester();
        }
    }
    updateSemesterButtons();
}


// --- Clear All Inputs Functionality ---
function clearAllInputs() {
    for (let i = 1; i <= semesterCount; i++) { // Iterate up to current semesterCount
        const semId = `sem${i}`;
        const sgpaInput = document.getElementById(`sgpa-${semId}`);
        const creditsInput = document.getElementById(`credits-${semId}`);
        const includeCheckbox = document.getElementById(`include-${semId}`);
        const card = document.getElementById(`card-sem${i}`); // Corrected ID

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
    resultArea.innerHTML = '';
    percentageArea.innerHTML = '';
    convertToPercentageBtn.disabled = true;
    currentOverallCgpa = null;
    // Clear general error classes from inputs not handled by individual semester loops
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

clearAllBtn.addEventListener('click', clearAllInputs);
addSemesterBtn.addEventListener('click', addSemester);
removeSemesterBtn.addEventListener('click', removeLastSemester);


// --- CGPA Calculation ---
calculateCgpaBtn.addEventListener('click', () => {
    // Clear previous visual errors first
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    let totalWeightedSgpa = 0;
    let totalCredits = 0;
    let hasError = false;
    resultArea.innerHTML = ''; 
    percentageArea.innerHTML = ''; 
    convertToPercentageBtn.disabled = true; 
    currentOverallCgpa = null;

    for (let i = 1; i <= semesterCount; i++) { // Use dynamic semesterCount
        const semId = `sem${i}`;
        const includeCheckbox = document.getElementById(`include-${semId}`);
        const sgpaInput = document.getElementById(`sgpa-${semId}`);
        const creditsInput = document.getElementById(`credits-${semId}`);

        if (includeCheckbox && includeCheckbox.checked) {
            const sgpa = parseFloat(sgpaInput.value);
            const credits = parseInt(creditsInput.value, 10);

            // Validate SGPA
            if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
                displayError(`Invalid SGPA for Semester ${i}. Must be 0-10.`);
                sgpaInput.classList.add('input-error');
                sgpaInput.focus(); hasError = true; break;
            } else {
                sgpaInput.classList.remove('input-error');
            }

            // Validate Credits
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
            } else if (sgpa > 0 && credits > 0) { // Ensure no error class if valid pair
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
                if (sgpaInput.value && creditsInput.value) { // Check if both fields have some value
                    // Further check if they are valid numbers if needed, but main calc loop does this.
                    if(!isNaN(parseFloat(sgpaInput.value)) && !isNaN(parseInt(creditsInput.value,10)) ){
                         includedAndFilled++;
                    }
                }
            }
        }
        if (anyIncluded && includedAndFilled === 0) {
             displayError("Please enter valid SGPA and Credits for included semesters.");
        } else if (!anyIncluded && semesterCount > 0) { // If semesters exist but none are included
             displayError("Please include at least one semester for calculation.");
        } else if (semesterCount === 0) {
            displayError("Please add at least one semester.");
        }
         else { 
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

// Initialize
initializeSemesters(2); // Start with 2 semesters by default
initializeTheme(); 
