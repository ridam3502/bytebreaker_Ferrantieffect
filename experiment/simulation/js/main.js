
    // DOM Elements
    const numDiscsInput = document.getElementById('numDiscs');
    const totalVoltageInput = document.getElementById('totalVoltage');
    const csInput = document.getElementById('cs');
    const cmInput = document.getElementById('cm');
    const insulatorMaterialSelect = document.getElementById('insulatorMaterial');
    const pollutionLevelSelect = document.getElementById('pollutionLevel');
    const humidityInput = document.getElementById('humidity');
    // Fault inputs are now in modal, but still need references for main logic
    const faultVoltageInput = document.getElementById('modalFaultVoltage'); // Renamed to modal
    const faultDurationInput = document.getElementById('modalFaultDuration'); // Renamed to modal
    const faultyDiscIndexInput = document.getElementById('modalFaultyDiscIndex'); // Renamed to modal

    const toggleDesignModeBtn = document.getElementById('toggleDesignModeBtn');
    const designModeContent = document.getElementById('designModeContent');
    const targetSystemVoltageInput = document.getElementById('targetSystemVoltage');
    const maxVoltagePerDiscInput = document.getElementById('maxVoltagePerDisc');
    const calculateDesignBtn = document.getElementById('calculateDesignBtn');
    const designModeResult = document.getElementById('designModeResult');
    const toggleVoltageFlowBtn = document.getElementById('toggleVoltageFlowBtn');
    const saveUserCalculationButton = document.getElementById('saveUserCalculationBtn');
    
    // Define default values for inputs
    const defaultValues = {
        numDiscs: 5,
        totalVoltage: 100,
        cs: 0.5,
        cm: 1,
        insulatorMaterial: 'porcelain',
        pollutionLevel: 'none',
        humidity: 50,
        faultVoltage: 0,
        faultDuration: 0,
        faultyDiscIndex: 0
    };

    // Material properties for Cm and Cs multipliers (example values)
    const materialProperties = {
        porcelain: { cm_mult: 1.0, cs_mult: 1.0, base_efficiency_impact: 0 },
        glass: { cm_mult: 1.1, cs_mult: 0.9, base_efficiency_impact: 2 }, // Slightly better efficiency due to lower Cs
        composite: { cm_mult: 0.9, cs_mult: 0.8, base_efficiency_impact: 5 } // Best efficiency due to lower Cs
    };

    const stringContainer = document.getElementById('insulator-string');
    const efficiencyDisplay = document.getElementById('string-efficiency-display');
    const currentVoltageChartCanvas = document.getElementById('voltageChart');
    let currentVoltageChart;

    const historyTableBody = document.getElementById('historyTable').getElementsByTagName('tbody')[0];
    const currentRunDataTableBody = document.querySelector('#currentRunDataTable tbody'); // New reference
    const manualNoteInput = document.getElementById('manualNote');
    const personalizedFeedbackEl = document.getElementById('personalized-feedback');

    // Step-by-step UI elements
    const guidancePanel = document.getElementById('guidancePanel');
    const stepTitleEl = document.getElementById('stepTitle');
    const stepInstructionEl = document.getElementById('stepInstruction');
    
    const stepWelcomeControls = document.getElementById('stepWelcomeControls');
    const stepParametersContent = document.getElementById('stepParametersContent');
    const stepDataDisplayContent = document.getElementById('stepDataDisplayContent'); 
    const stepTheoryContent = document.getElementById('stepTheoryContent');
    const stepUserCalculationContent = document.getElementById('stepUserCalculationContent'); 
    const stepPlotGraphContent = document.getElementById('stepPlotGraphContent'); // Renamed to logExperimentBtn
    const stepResultsContent = document.getElementById('stepResultsContent');
    const allStepContents = [stepParametersContent, stepDataDisplayContent, stepTheoryContent, stepUserCalculationContent, stepPlotGraphContent, stepResultsContent];
    const allStepControls = [document.getElementById('stepWelcomeControls'), ...Array.from(document.querySelectorAll('#simulationTab .step-controls'))];

    // Data
    let experimentHistory = [];
    let experimentIdCounter = 0;
    let currentSimStep = 0; // 0: Welcome, 1: Params, 2: Data Display, 3: Theory, 4: User Calc, 5: Log Experiment, 6: Results/Analysis
    let calculatedVoltages = []; // Store calculated voltages for user check
    let calculatedEfficiency = 0; // Store calculated efficiency for user check
    let userCalculatedDisc1Voltage = null; // Store user's input for comparison
    let userCalculatedEfficiency = null; // Store user's input for comparison
    let faultTimeoutId = null;

    // Interactive Disc Modification variables
    let discPuncturedStatus = {}; // Stores { discIndex: isPunctured }
    let currentEditedDiscIndex = null; // The index of the disc currently being edited in the modal

    // Comparison Mode variables
    let comparisonExperiments = []; // Array to store experiment objects for comparison (max 2)

    // Voltage Flow Animation variable
    let isVoltageFlowAnimationEnabled = false;

    // Elements for comparative graphing in Analytics
    const compareRunsSelect = document.getElementById('compareRunsSelect');
    const plotComparisonChartBtn = document.getElementById('plotComparisonChartBtn');
    let comparisonVoltagePlotlyChart = null; // To hold the Plotly chart instance

    // Fault Settings Modal Elements
    const faultSettingsModal = document.getElementById('faultSettingsModal');
    const openFaultSettingsBtn = document.getElementById('openFaultSettingsBtn');
    const saveFaultSettingsBtn = document.getElementById('saveFaultSettingsBtn');
    const modalFaultVoltageInput = document.getElementById('modalFaultVoltage');
    const modalFaultDurationInput = document.getElementById('modalFaultDuration');
    const modalFaultyDiscIndexInput = document.getElementById('modalFaultyDiscIndex');


    // --- Loading Indicator Functions ---
    function showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        loadHistoryFromLocalStorage();
        updateAnalyticsDashboard();
        updateHistoryTable();
        setupStepEventListeners();
        updateSimulationStepUI(); // Initialize UI to welcome step

        // Set initial values for number inputs directly
        numDiscsInput.value = defaultValues.numDiscs;
        totalVoltageInput.value = defaultValues.totalVoltage;
        csInput.value = defaultValues.cs;
        cmInput.value = defaultValues.cm;
        humidityInput.value = defaultValues.humidity;
        // Set initial values for modal fault inputs
        modalFaultVoltageInput.value = defaultValues.faultVoltage;
        modalFaultDurationInput.value = defaultValues.faultDuration;
        modalFaultyDiscIndexInput.value = defaultValues.faultyDiscIndex;


        // Event listener for numDiscs to update faultyDiscIndex max (both main and modal)
        numDiscsInput.addEventListener('input', () => {
            const numDiscsVal = parseInt(numDiscsInput.value);
            faultyDiscIndexInput.max = numDiscsVal; // Update modal input's max
            if (parseInt(faultyDiscIndexInput.value) > numDiscsVal) {
                faultyDiscIndexInput.value = numDiscsVal;
            }
        });

        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
            document.getElementById('themeToggle').checked = true;
        }
        document.getElementById('themeToggle').addEventListener('change', toggleTheme);
    });

    // Function to set up real-time display for slider values (no longer used for main inputs)
    // Kept for potential future use or if other sliders are added
    function setupSliderDisplay(slider, displayElement) {
        displayElement.textContent = slider.value; // Initial display
        slider.addEventListener('input', () => {
            displayElement.textContent = slider.value;
        });
    }
    
    function setupStepEventListeners() {
        // Top tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                switchTab(button.dataset.tab);
            });
        });

        // Step progression buttons
        document.getElementById('startExperimentBtn').addEventListener('click', () => advanceSimStep(1));
        document.getElementById('paramsToDataDisplayBtn').addEventListener('click', () => {
            displayEnteredData(); // Populate data display
            advanceSimStep(2);
        });
        document.getElementById('dataDisplayToTheoryBtn').addEventListener('click', () => advanceSimStep(3));
        document.getElementById('showFullTheoryBtn').addEventListener('click', () => {
             document.getElementById('theoryModal').style.display = 'block';
        });
        document.getElementById('theoryToUserCalcBtn').addEventListener('click', () => {
            setupUserCalculation(); // Prepare user calculation inputs
            advanceSimStep(4);
        });
        document.getElementById('checkUserCalculationBtn').addEventListener('click', checkUserCalculation);
        document.getElementById('userCalcToPlotGraphBtn').addEventListener('click', () => advanceSimStep(5));
        document.getElementById('logExperimentBtn').addEventListener('click', () => {
            performCalculationAndLog(); // This will log and then advance step
        });
        document.getElementById('resultsToVariationBtn').addEventListener('click', () => {
            // Go back to parameter step, keeping current values
            currentSimStep = 1; 
            updateSimulationStepUI();
        });
        document.getElementById('resetGlobalSimulationBtn').addEventListener('click', resetSimulationFlow);

        // Skip Calculation button
        document.getElementById('skipCalculationBtn').addEventListener('click', () => {
            userCalculatedDisc1Voltage = null; // Clear user inputs if skipped
            userCalculatedEfficiency = null;
            advanceSimStep(5); // Skip directly to Log Experiment step
        });

        // Load Default Parameters button
        document.getElementById('loadDefaultParamsBtn').addEventListener('click', loadDefaultParameters);

        // Save Configuration buttons
        document.getElementById('saveConfigParamsBtn').addEventListener('click', () => saveCurrentConfigWithNote(true)); // Pass true for auto-note
        document.getElementById('saveConfigResultsBtn').addEventListener('click', () => saveCurrentConfigWithNote(true)); // Pass true for auto-note


        // Other global buttons
        document.getElementById('saveWithNoteBtn').addEventListener('click', () => saveCurrentConfigWithNote(false)); // Pass false for manual note
        document.getElementById('exportCSVBtn').addEventListener('click', exportHistoryToCSV);
        document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
        document.getElementById('screenshotBtnGlobal').addEventListener('click', takeScreenshot);
        document.getElementById('printBtnGlobal').addEventListener('click', printCurrentView); // New print button
        document.getElementById('toggleVoltageFlowBtn').addEventListener('click', toggleVoltageFlowAnimation); // New voltage flow toggle
        saveUserCalculationButton.addEventListener('click', saveUserCurrentInput); // New event listener for saving user input


        // Event listeners for new input fields to update display and calculations
        insulatorMaterialSelect.addEventListener('change', updateCapacitanceBasedOnMaterial);

        // Design Mode event listeners
        toggleDesignModeBtn.addEventListener('click', toggleDesignMode);
        calculateDesignBtn.addEventListener('click', calculateRequiredDiscs);

        // Disc Properties Modal events
        document.getElementById('saveDiscPropertiesBtn').addEventListener('click', saveDiscProperties);

        // New: Comparative graphing in Analytics
        plotComparisonChartBtn.addEventListener('click', renderComparisonVoltageChart);
        // When analytics tab is activated, populate the select dropdown
        document.querySelector('.tab-button[data-tab="analyticsTab"]').addEventListener('click', populateCompareRunsSelect);

        // Fault Settings Modal Event Listeners
        openFaultSettingsBtn.addEventListener('click', openFaultSettingsModal);
        saveFaultSettingsBtn.addEventListener('click', saveFaultSettings);
        // Also update modalFaultyDiscIndexInput max when numDiscsInput changes
        numDiscsInput.addEventListener('input', () => {
            modalFaultyDiscIndexInput.max = parseInt(numDiscsInput.value);
            if (parseInt(modalFaultyDiscIndexInput.value) > parseInt(numDiscsInput.value)) {
                modalFaultyDiscIndexInput.value = numDiscsInput.value;
            }
        });
    }

    // --- Simulation Step Management ---
    function advanceSimStep(nextStep) {
        showLoading();
        setTimeout(() => { // Simulate a small delay for calculations/rendering
            currentSimStep = nextStep;
            updateSimulationStepUI();
            hideLoading();
        }, 300);
    }
    
    function resetSimulationFlow() {
        showConfirmModal("Are you sure you want to reset the entire simulation flow? All current inputs will be cleared.", () => {
            currentSimStep = 0;
            resetControls();
            loadDefaultParameters(); // Reset inputs to defaults
            userCalculatedDisc1Voltage = null;
            userCalculatedEfficiency = null;
            calculatedVoltages = [];
            calculatedEfficiency = 0;
            discPuncturedStatus = {}; // Clear punctured status
            isVoltageFlowAnimationEnabled = false; // Reset animation state
            document.getElementById('userCalculationFeedback').textContent = ''; // Clear feedback
            document.getElementById('userCalcToPlotGraphBtn').classList.add('hidden-step-content'); // Hide plot button
            updateSimulationStepUI();
        });
    }

    function updateSimulationStepUI() {
        // Hide all step-specific content and controls first
        allStepContents.forEach(el => el.classList.add('hidden-step-content'));
        allStepControls.forEach(el => el.style.display = 'none');
        stepWelcomeControls.style.display = 'none';

        // Clear any active fault visual
        clearFaultVisual();

        switch (currentSimStep) {
            case 0: // Welcome
                stepTitleEl.textContent = "Welcome to the Guided Simulation!";
                stepInstructionEl.textContent = "This guided simulation will walk you through a string insulator experiment. Click 'Start Experiment' to begin.";
                stepWelcomeControls.style.display = 'block';
                break;
            case 1: // Set Parameters
                stepTitleEl.textContent = "Step 1: Define Your Experiment Parameters";
                stepInstructionEl.textContent = "Use the input fields and dropdowns below to set the physical and environmental parameters for your insulator string. Click 'Advanced Fault Settings' for fault configuration. Once satisfied, click 'Confirm Parameters & Display Data' to proceed.";
                stepParametersContent.classList.remove('hidden-step-content');
                stepParametersContent.querySelector('.step-controls').style.display = 'block';
                break;
            case 2: // Data Display
                stepTitleEl.textContent = "Step 2: Review Your Entered Data";
                stepInstructionEl.textContent = "Carefully review the parameters you have entered. Ensure all values are correct before moving on to understand the theoretical background of insulator strings.";
                stepDataDisplayContent.classList.remove('hidden-step-content');
                stepDataDisplayContent.querySelector('.step-controls').style.display = 'block';
                break;
            case 3: // Theory
                stepTitleEl.textContent = "Step 3: Understand the Theoretical Background";
                stepInstructionEl.textContent = "Familiarize yourself with the fundamental principles governing voltage distribution in string insulators. Pay attention to the role of shunt and mutual capacitances. Click 'Show Full Theory Details' for an in-depth explanation.";
                stepTheoryContent.classList.remove('hidden-step-content');
                stepTheoryContent.querySelector('.step-controls').style.display = 'block';
                break;
            case 4: // User Calculation
                stepTitleEl.textContent = "Step 4: Self-Calculation Challenge!";
                stepInstructionEl.textContent = "Now, it's your turn! Based on the theory and your selected parameters, try to calculate the voltage across the disc nearest the line end (Disc 1) and the overall string efficiency. Enter your estimates and click 'Check My Calculation' for feedback.";
                stepUserCalculationContent.classList.remove('hidden-step-content');
                stepUserCalculationContent.querySelector('.step-controls').style.display = 'block';
                break;
            case 5: // Log Experiment
                stepTitleEl.textContent = "Step 5: Log Experiment Data";
                stepInstructionEl.textContent = "You've reviewed the theory and tried your hand at calculations. Now, click 'Log Experiment & View Results' to save your current experiment's data. After logging, you can view the results, or go to the Analytics Dashboard to compare multiple runs.";
                stepPlotGraphContent.classList.remove('hidden-step-content');
                stepPlotGraphContent.querySelector('.step-controls').style.display = 'block';
                break;
            case 6: // Results & Analysis
                stepTitleEl.textContent = "Step 6: Analyze Your Experiment Results";
                stepInstructionEl.textContent = "Examine the simulated voltage distribution on the insulator string and the calculated string efficiency. Use the provided table and chart for detailed analysis. You can toggle voltage flow animation or save your configuration. When ready, experiment with variations or explore other sections.";
                stepResultsContent.classList.remove('hidden-step-content');
                stepResultsContent.querySelector('.step-controls').style.display = 'block';
                renderCurrentSimulation(); // Render simulation results (including current chart)
                break;
        }
    }

    function loadDefaultParameters() {
        numDiscsInput.value = defaultValues.numDiscs;
        totalVoltageInput.value = defaultValues.totalVoltage;
        csInput.value = defaultValues.cs;
        cmInput.value = defaultValues.cm;
        insulatorMaterialSelect.value = defaultValues.insulatorMaterial;
        pollutionLevelSelect.value = defaultValues.pollutionLevel;
        humidityInput.value = defaultValues.humidity;
        // Load defaults into modal inputs
        modalFaultVoltageInput.value = defaultValues.faultVoltage;
        modalFaultDurationInput.value = defaultValues.faultDuration;
        modalFaultyDiscIndexInput.value = defaultValues.faultyDiscIndex;
        updateCapacitanceBasedOnMaterial(); // Apply material defaults
        discPuncturedStatus = {}; // Clear any custom disc properties
    }

    function updateCapacitanceBasedOnMaterial() {
        const selectedMaterial = insulatorMaterialSelect.value;
        const props = materialProperties[selectedMaterial];
        if (props) {
            // Apply multipliers to default or original user set values for Cs/Cm
            // A more robust system would store base Cs/Cm and apply multipliers,
            // but for simplicity, we'll just adjust based on *some* base values.
            const originalCm = parseFloat(defaultValues.cm);
            const originalCs = parseFloat(defaultValues.cs);

            cmInput.value = (originalCm * props.cm_mult).toFixed(2);
            csInput.value = (originalCs * props.cs_mult).toFixed(2);
        }
    }

    function displayEnteredData() {
        // Ensure values are parsed as numbers from the input fields
        const n = parseInt(numDiscsInput.value);
        const V = parseFloat(totalVoltageInput.value);
        const Cs = parseFloat(csInput.value);
        const Cm = parseFloat(cmInput.value);
        const k = Cm !== 0 ? parseFloat((Cs / Cm).toFixed(3)) : Infinity;

        // Get fault parameters from modal inputs
        const faultVoltage = parseFloat(modalFaultVoltageInput.value);
        const faultDuration = parseFloat(modalFaultDurationInput.value);
        const faultyDiscIndex = parseInt(modalFaultyDiscIndexInput.value);

        document.getElementById('displayNumDiscs').textContent = n;
        document.getElementById('displayTotalVoltage').textContent = V;
        document.getElementById('displayCs').textContent = Cs;
        document.getElementById('displayCm').textContent = Cm;
        document.getElementById('displayKValue').textContent = k;
        document.getElementById('displayInsulatorMaterial').textContent = insulatorMaterialSelect.value;
        document.getElementById('displayPollutionLevel').textContent = pollutionLevelSelect.value;
        document.getElementById('displayHumidity').textContent = humidityInput.value;
        document.getElementById('displayFaultVoltage').textContent = faultVoltage;
        document.getElementById('displayFaultDuration').textContent = faultDuration;
        document.getElementById('displayFaultyDiscIndex').textContent = faultyDiscIndex;
    }

    function setupUserCalculation() {
        const n = parseInt(numDiscsInput.value);
        const V = parseFloat(totalVoltageInput.value);
        const Cs = parseFloat(csInput.value);
        const Cm = parseFloat(cmInput.value);

        // Get fault parameters from modal inputs for calculation
        const faultVoltage = parseFloat(modalFaultVoltageInput.value);
        const faultDuration = parseFloat(modalFaultDurationInput.value);
        const faultyDiscIndex = parseInt(modalFaultyDiscIndexInput.value);

        // Calculate actual values to check against
        calculatedVoltages = calculateVoltages(n, V, Cs, Cm, discPuncturedStatus);
        calculatedEfficiency = calculateStringEfficiency(
            calculatedVoltages, V, n,
            pollutionLevelSelect.value, humidityInput.value, insulatorMaterialSelect.value, discPuncturedStatus
        );

        const userCalcInputsDiv = document.getElementById('userCalculationInputs');
        userCalcInputsDiv.innerHTML = ''; // Clear previous inputs

        // Input for Disc 1 voltage
        const disc1InputGroup = document.createElement('div');
        disc1InputGroup.innerHTML = `<label>Voltage on Disc 1 (Line End, <span class="unit">kV</span>): <input type="number" id="userDisc1Voltage" class="user-calc-input" step="0.1" tabindex="0" aria-label="Your calculated voltage for Disc 1"></label>`;
        userCalcInputsDiv.appendChild(disc1InputGroup);

        // Input for String Efficiency
        const efficiencyInputGroup = document.createElement('div');
        efficiencyInputGroup.innerHTML = `<label>String Efficiency (<span class="unit">%</span>): <input type="number" id="userEfficiency" class="user-calc-input" step="0.1" tabindex="0" aria-label="Your calculated string efficiency"></label>`;
        userCalcInputsDiv.appendChild(efficiencyInputGroup);

        document.getElementById('userCalculationFeedback').textContent = ''; // Clear feedback
        document.getElementById('userCalcToPlotGraphBtn').classList.add('hidden-step-content'); // Hide plot button until correct
    }

    function checkUserCalculation() {
        const userDisc1VoltageInput = document.getElementById('userDisc1Voltage');
        const userEfficiencyInput = document.getElementById('userEfficiency');
        const userDisc1Voltage = parseFloat(userDisc1VoltageInput.value);
        const userEfficiency = parseFloat(userEfficiencyInput.value);
        const feedbackEl = document.getElementById('userCalculationFeedback');
        const plotButton = document.getElementById('userCalcToPlotGraphBtn');

        const tolerance = 5; // % tolerance for comparison

        const actualDisc1Voltage = calculatedVoltages[0]; // Disc 1 is the first in the array (line end)
        const actualEfficiency = calculatedEfficiency;

        let isDisc1Correct = false;
        let isEfficiencyCorrect = false;

        // Check Disc 1 Voltage
        if (!isNaN(userDisc1Voltage) && Math.abs(userDisc1Voltage - actualDisc1Voltage) <= (actualDisc1Voltage * tolerance / 100)) {
            isDisc1Correct = true;
        }

        // Check String Efficiency
        if (!isNaN(userEfficiency) && Math.abs(userEfficiency - actualEfficiency) <= (actualEfficiency * tolerance / 100)) {
            isEfficiencyCorrect = true;
        }

        if (isDisc1Correct && isEfficiencyCorrect) {
            feedbackEl.textContent = 'Excellent! Both your Disc 1 Voltage and String Efficiency calculations are correct (within ' + tolerance + '% tolerance).';
            feedbackEl.className = 'user-calc-feedback correct';
            plotButton.classList.remove('hidden-step-content');
            // Store user's correct calculations globally for logging
            userCalculatedDisc1Voltage = userDisc1Voltage.toFixed(2);
            userCalculatedEfficiency = userEfficiency.toFixed(2);
        } else {
            let feedbackText = 'Keep trying! Your calculations need some adjustment.';
            if (!isDisc1Correct && !isNaN(userDisc1Voltage)) {
                feedbackText += `\nDisc 1 Voltage: Your estimate (${userDisc1Voltage.toFixed(2)} kV) is off. The actual is ${actualDisc1Voltage.toFixed(2)} kV.`;
            }
            if (!isEfficiencyCorrect && !isNaN(userEfficiency)) {
                feedbackText += `\nString Efficiency: Your estimate (${userEfficiency.toFixed(2)} %) is off. The actual is ${actualEfficiency.toFixed(2)} %.`;
            }
            feedbackEl.textContent = feedbackText;
            feedbackEl.className = 'user-calc-feedback incorrect';
            plotButton.classList.add('hidden-step-content');
            // If incorrect, set user inputs to null for logging
            userCalculatedDisc1Voltage = null;
            userCalculatedEfficiency = null;
        }
    }

    // New: Save User Current Input
    function saveUserCurrentInput() {
        const userDisc1VoltageInput = document.getElementById('userDisc1Voltage');
        const userEfficiencyInput = document.getElementById('userEfficiency');
        
        const userDisc1VoltageVal = parseFloat(userDisc1VoltageInput.value);
        const userEfficiencyVal = parseFloat(userEfficiencyInput.value);

        userCalculatedDisc1Voltage = isNaN(userDisc1VoltageVal) ? null : userDisc1VoltageVal.toFixed(2);
        userCalculatedEfficiency = isNaN(userEfficiencyVal) ? null : userEfficiencyVal.toFixed(2);

        showModal("Your current input has been saved. It will be logged with the next experiment run.");
    }


    // --- Core Calculation Functions ---
    function calculateVoltages(n, V_total, Cs, Cm, puncturedStatus = {}) {
        // Returns voltages from line end (disc 1) to tower end (disc n)
        // puncturedStatus: { discIndex (1-based, from line end): true/false }
        
        const activeDiscs = [];
        for (let i = 1; i <= n; i++) {
            if (!puncturedStatus[i]) { // Only include non-punctured discs
                activeDiscs.push(i);
            }
        }

        if (activeDiscs.length === 0) return Array(n).fill(0); // All discs punctured or no discs

        const k = Cm !== 0 ? Cs / Cm : Infinity;
        let voltages = Array(n).fill(0); // Initialize all voltages to 0

        let V_active_total = V_total; // Total voltage to be distributed among active discs

        // Calculate the sum of multipliers for active discs
        let denominator = 0;
        for (let i = 0; i < activeDiscs.length; i++) {
            // The effective index for the formula is based on its position in the active string
            // The disc closest to the line (first active disc) will be the most stressed
            denominator += Math.pow(1 + k, activeDiscs.length - 1 - i);
        }

        if (V_active_total === 0 || denominator === 0) {
            return voltages; // Return all zeros if no voltage or no active discs
        }

        let activeDiscVoltages = [];
        for (let i = 0; i < activeDiscs.length; i++) {
            // Calculate voltage for each active disc based on its position in the active string
            const V_i_active = V_active_total * (Math.pow(1 + k, activeDiscs.length - 1 - i) / denominator);
            activeDiscVoltages.push(V_i_active);
        }

        // Map calculated voltages back to original disc indices
        let activeDiscCounter = 0;
        for (let i = 0; i < n; i++) {
            const currentDiscIndex = i + 1; // 1-based index from line end
            if (!puncturedStatus[currentDiscIndex]) {
                voltages[i] = activeDiscVoltages[activeDiscCounter];
                activeDiscCounter++;
            } else {
                voltages[i] = 0; // Punctured disc has 0 voltage
            }
        }

        return voltages;
    }

    function calculateStringEfficiency(voltages_line_to_tower, V_total, n, pollutionLevel, humidity, material, puncturedStatus = {}) {
        if (!voltages_line_to_tower || voltages_line_to_tower.length === 0 || n === 0) return 0;

        // Filter out punctured discs for efficiency calculation
        const healthyVoltages = [];
        for (let i = 0; i < n; i++) {
            const discIndex = i + 1; // 1-based index from line end
            if (!puncturedStatus[discIndex]) {
                healthyVoltages.push(voltages_line_to_tower[i]);
            }
        }

        if (healthyVoltages.length === 0) return 0; // All discs punctured

        const V_disc_max = healthyVoltages[0]; // Disc 1 (line end) of healthy string has max voltage
        if (V_disc_max === 0) return (V_total === 0 && n > 0) ? 100 : 0;

        let efficiency = (V_total / (n * V_disc_max)) * 100; // Use total 'n' for string efficiency definition

        // Apply qualitative impact of environmental factors and material
        let efficiencyReduction = 0;
        if (pollutionLevel === 'light') efficiencyReduction += 1;
        else if (pollutionLevel === 'medium') efficiencyReduction += 3;
        else if (pollutionLevel === 'heavy') efficiencyReduction += 7;

        if (humidity > 70) efficiencyReduction += (humidity - 70) * 0.1; // Small reduction for high humidity

        // Material impact (positive impact: higher efficiency)
        const materialEffect = materialProperties[material] ? materialProperties[material].base_efficiency_impact : 0;
        efficiency += materialEffect; // Add positive impact to efficiency

        efficiency = Math.max(0, efficiency - efficiencyReduction); // Ensure efficiency doesn't go below zero
        efficiency = Math.min(100, efficiency); // Ensure efficiency doesn't go above 100

        return parseFloat(efficiency.toFixed(2));
    }

    function performCalculationAndLog() {
        showLoading();
        setTimeout(() => {
            const n = parseInt(numDiscsInput.value);
            const V = parseFloat(totalVoltageInput.value);
            const Cs = parseFloat(csInput.value);
            const Cm = parseFloat(cmInput.value);
            const insulatorMaterial = insulatorMaterialSelect.value;
            const pollutionLevel = pollutionLevelSelect.value;
            const humidity = parseFloat(humidityInput.value);
            // Get fault parameters from modal inputs
            const faultVoltage = parseFloat(modalFaultVoltageInput.value);
            const faultDuration = parseFloat(modalFaultDurationInput.value);
            const faultyDiscIndex = parseInt(modalFaultyDiscIndexInput.value);

            const voltages = calculateVoltages(n, V, Cs, Cm, discPuncturedStatus);
            const efficiency = calculateStringEfficiency(
                voltages, V, n,
                pollutionLevel, humidity, insulatorMaterial, discPuncturedStatus
            );
            const k = Cm !== 0 ? parseFloat((Cs / Cm).toFixed(3)) : Infinity;
            const maxVoltage = voltages.length > 0 ? parseFloat(Math.max(...voltages).toFixed(2)) : 0;

            experimentIdCounter++;
            const newEntry = {
                id: experimentIdCounter,
                timestamp: new Date().toLocaleString(),
                params: { n, V, Cs, Cm, insulatorMaterial, pollutionLevel, humidity, faultVoltage, faultDuration, faultyDiscIndex },
                k: k,
                voltages: voltages.map(v => parseFloat(v.toFixed(2))),
                efficiency: efficiency,
                maxDiscVoltage: maxVoltage,
                userCalculatedDisc1Voltage: userCalculatedDisc1Voltage, // Use global variable
                userCalculatedEfficiency: userCalculatedEfficiency,     // Use global variable
                discPuncturedStatus: JSON.parse(JSON.stringify(discPuncturedStatus)), // Store a copy
                note: "(Auto-logged run)" // Default note for runs from guided flow
            };
            experimentHistory.push(newEntry);
            updateHistoryTable();
            updateAnalyticsDashboard();
            saveHistoryToLocalStorage();
            updatePersonalizedFeedback();

            // Apply fault visualization if applicable
            if (faultVoltage > 0 && faultDuration > 0 && faultyDiscIndex > 0 && faultyDiscIndex <= n) {
                applyFaultVisual(faultyDiscIndex, faultDuration);
            } else {
                clearFaultVisual();
            }

            // Reset user calculation storage after logging
            userCalculatedDisc1Voltage = null;
            userCalculatedEfficiency = null;


            advanceSimStep(6); // Advance to the results display step
            hideLoading();
        }, 500); // Simulate a slight delay for calculation and logging
    }

    function saveCurrentConfigWithNote(autoNote = false) {
        let note = manualNoteInput.value.trim();
        if (autoNote) {
            note = "Saved from Step " + (currentSimStep === 1 ? "1 (Parameters)" : "6 (Results)");
        } else if (!note) {
            showModal("Please enter a note to save with the current configuration.");
            return;
        }

        const n = parseInt(numDiscsInput.value);
        const V = parseFloat(totalVoltageInput.value);
        const Cs = parseFloat(csInput.value);
        const Cm = parseFloat(cmInput.value);
        const insulatorMaterial = insulatorMaterialSelect.value;
        const pollutionLevel = pollutionLevelSelect.value;
        const humidity = parseFloat(humidityInput.value);
        // Get fault parameters from modal inputs
        const faultVoltage = parseFloat(modalFaultVoltageInput.value);
        const faultDuration = parseFloat(modalFaultDurationInput.value);
        const faultyDiscIndex = parseInt(modalFaultyDiscIndexInput.value);

        const voltages = calculateVoltages(n, V, Cs, Cm, discPuncturedStatus);
        const efficiency = calculateStringEfficiency(
            voltages, V, n,
            pollutionLevel, humidity, insulatorMaterial, discPuncturedStatus
        );
        const k = Cm !== 0 ? parseFloat((Cs / Cm).toFixed(3)) : Infinity;
        const maxVoltage = voltages.length > 0 ? parseFloat(Math.max(...voltages).toFixed(2)) : 0;

        experimentIdCounter++;
        const newEntry = {
            id: experimentIdCounter,
            timestamp: new Date().toLocaleString(),
            params: { n, V, Cs, Cm, insulatorMaterial, pollutionLevel, humidity, faultVoltage, faultDuration, faultyDiscIndex },
            k: k,
            voltages: voltages.map(v => parseFloat(v.toFixed(2))),
            efficiency: efficiency,
            maxDiscVoltage: maxVoltage,
            userCalculatedDisc1Voltage: null, // Always null when saving manually, as it's not from self-calc step
            userCalculatedEfficiency: null,
            discPuncturedStatus: JSON.parse(JSON.stringify(discPuncturedStatus)), // Store a copy
            note: note
        };
        experimentHistory.push(newEntry);
        manualNoteInput.value = ''; // Clear note input after saving
        updateHistoryTable();
        updateAnalyticsDashboard();
        saveHistoryToLocalStorage();
        updatePersonalizedFeedback();
        showModal("Configuration saved successfully!");
    }


    // --- Visual Rendering ---
    function renderCurrentSimulation() {
        const n = parseInt(numDiscsInput.value);
        const V = parseFloat(totalVoltageInput.value);
        const Cs = parseFloat(csInput.value);
        const Cm = parseFloat(cmInput.value);
        const pollutionLevel = pollutionLevelSelect.value;
        const humidity = parseFloat(humidityInput.value);
        const insulatorMaterial = insulatorMaterialSelect.value;
        const faultyDiscIndex = parseInt(modalFaultyDiscIndexInput.value); // Get from modal input
        const faultVoltage = parseFloat(modalFaultVoltageInput.value); // Get from modal input


        const voltages = calculateVoltages(n, V, Cs, Cm, discPuncturedStatus);
        stringContainer.innerHTML = '';
        currentRunDataTableBody.innerHTML = ''; // Clear current run data table

        // Display discs from tower end (n) to line end (1) for visual consistency with theory
        // Voltages array is from line end (0) to tower end (n-1)
        const displayVoltages = [...voltages]; 

        // Find the maximum voltage among healthy discs for animation scaling
        const healthyVoltagesForMax = voltages.filter((v, idx) => !discPuncturedStatus[idx + 1]);
        const maxHealthyVoltage = healthyVoltagesForMax.length > 0 ? Math.max(...healthyVoltagesForMax) : 1; // Avoid division by zero
        const baseAnimationDuration = 2; // seconds for a slow pulse

        for (let i = n - 1; i >= 0; i--) { // Loop from tower end to line end
            const disc = document.createElement('div');
            disc.className = 'disc';
            const currentDiscNumberFromLineEnd = i + 1; // 1-based index for disc (1 is line end)
            
            // Add click listener for interactive modification
            disc.setAttribute('data-disc-index', currentDiscNumberFromLineEnd);
            disc.addEventListener('click', openDiscPropertiesModal);

            // Apply fault/punctured visual
            if (faultyDiscIndex === currentDiscNumberFromLineEnd && faultVoltage > 0) {
                disc.classList.add('faulty');
            }
            if (discPuncturedStatus[currentDiscNumberFromLineEnd]) {
                disc.classList.add('punctured');
            }

            const v_disc = displayVoltages[i]; // Get voltage for this disc
            
            // Dynamic color intensity based on voltage
            // Normalize voltage to a 0-1 range for color mapping
            const normalizedVoltage = (v_disc / V) * 1.5; // Scale up for better visual range
            const hue = 240 - (normalizedVoltage * 120); // From blue (240) to green (120) for increasing voltage
            const saturation = 100;
            const lightness = 40 + (normalizedVoltage * 30); // Adjust lightness for intensity

            // Only apply color gradient if not punctured or faulty
            if (!disc.classList.contains('punctured') && !disc.classList.contains('faulty')) {
                disc.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                disc.style.borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`; // Slightly darker border
                disc.style.color = (lightness < 50) ? 'white' : '#333'; // White text for darker backgrounds
            }


            // Apply voltage flow animation if enabled and not faulty/punctured
            if (isVoltageFlowAnimationEnabled && !disc.classList.contains('faulty') && !disc.classList.contains('punctured')) {
                disc.classList.add('voltage-flow-active');
                // Calculate animation duration: faster for higher voltage
                // Avoid division by zero if v_disc is 0
                const animationDuration = (v_disc > 0 && maxHealthyVoltage > 0) ? 
                                           (baseAnimationDuration * (maxHealthyVoltage / v_disc)) : 
                                           (baseAnimationDuration * 2); // Slower for very low/zero voltage
                disc.style.animationDuration = `${animationDuration}s`;
            } else {
                disc.classList.remove('voltage-flow-active');
                disc.style.animationDuration = ''; // Clear duration
            }


            disc.innerHTML = `${v_disc.toFixed(1)}<br><span class="unit">kV</span>`; // Display kV unit
            disc.title = `Disc ${currentDiscNumberFromLineEnd} (from line)\nVoltage: ${v_disc.toFixed(2)} kV\n${((v_disc / V) * 100).toFixed(1)}% of total`;
            stringContainer.appendChild(disc);

            if (i > 0) { // Add connector if not the last disc (tower end)
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("class", "connector-svg");
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M0 45 C 10 35, 10 55, 20 45");
                path.setAttribute("class", "connector-path");
                svg.appendChild(path);
                stringContainer.appendChild(svg);
            }

            // Populate current run data table
            const row = currentRunDataTableBody.insertRow(0); // Insert at the beginning to match visual order (line end first)
            row.insertCell().textContent = currentDiscNumberFromLineEnd;
            row.insertCell().textContent = v_disc.toFixed(2);
            row.insertCell().textContent = discPuncturedStatus[currentDiscNumberFromLineEnd] ? 'Punctured' : 'Healthy';
        }

        const efficiency = calculateStringEfficiency(voltages, V, n, pollutionLevel, humidity, insulatorMaterial, discPuncturedStatus);
        efficiencyDisplay.textContent = `String Efficiency: ${efficiency.toFixed(2)}%`;
        renderVoltageChart(voltages, n); // Still render current chart in results tab
    }

    // Helper function to render a single disc string for comparison
    function renderComparisonDiscString(voltages, n, targetElement, puncturedStatus = {}) {
        targetElement.innerHTML = ''; // Clear previous discs
        const V_total_current = parseFloat(totalVoltageInput.value); // Use current total voltage for normalization

        // Find the maximum voltage among healthy discs for animation scaling
        const healthyVoltagesForMax = voltages.filter((v, idx) => !puncturedStatus[idx + 1]);
        const maxHealthyVoltage = healthyVoltagesForMax.length > 0 ? Math.max(...healthyVoltagesForMax) : 1; // Avoid division by zero
        const baseAnimationDuration = 2; // seconds for a slow pulse

        for (let i = n - 1; i >= 0; i--) { // Loop from tower end to line end
            const disc = document.createElement('div');
            disc.className = 'disc';
            const currentDiscNumberFromLineEnd = i + 1;
            
            if (puncturedStatus[currentDiscNumberFromLineEnd]) {
                disc.classList.add('punctured');
            }

            const v_disc = voltages[i];
            const normalizedVoltage = (v_disc / V_total_current) * 1.5;
            const hue = 240 - (normalizedVoltage * 120);
            const saturation = 100;
            const lightness = 40 + (normalizedVoltage * 30);

            if (!disc.classList.contains('punctured')) {
                disc.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                disc.style.borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
                disc.style.color = (lightness < 50) ? 'white' : '#333';
            }

            disc.innerHTML = `${v_disc.toFixed(1)}<br><span class="unit">kV</span>`;
            disc.title = `Disc ${currentDiscNumberFromLineEnd}\nVoltage: ${v_disc.toFixed(2)} kV`;
            targetElement.appendChild(disc);

            if (i > 0) {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("class", "connector-svg");
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M0 45 C 10 35, 10 55, 20 45");
                path.setAttribute("class", "connector-path");
                svg.appendChild(path);
                targetElement.appendChild(svg);
            }
        }
    }


    function applyFaultVisual(discIndex, duration) {
        clearFaultVisual(); // Clear any previous fault

        const discs = document.querySelectorAll('.disc');
        // DiscIndex is 1-based from line end. Our discs are rendered from tower end (n) to line end (1).
        // So, if discIndex is 1 (line end), it's the last disc in the rendered array (discs.length - 1).
        // If discIndex is n (tower end), it's the first disc in the rendered array (0).
        const targetDiscElement = discs[discs.length - discIndex]; 

        if (targetDiscElement) {
            targetDiscElement.classList.add('faulty');
            faultTimeoutId = setTimeout(() => {
                clearFaultVisual();
            }, duration);
        }
    }

    function clearFaultVisual() {
        const faultyDiscs = document.querySelectorAll('.disc.faulty');
        faultyDiscs.forEach(disc => disc.classList.remove('faulty'));
        if (faultTimeoutId) {
            clearTimeout(faultTimeoutId);
            faultTimeoutId = null;
        }
    }

    function openDiscPropertiesModal(event) {
        const discElement = event.currentTarget;
        const discIndex = parseInt(discElement.getAttribute('data-disc-index'));
        currentEditedDiscIndex = discIndex; // Store for saving changes

        const n = parseInt(numDiscsInput.value);
        const V = parseFloat(totalVoltageInput.value);
        const Cs = parseFloat(csInput.value);
        const Cm = parseFloat(cmInput.value);
        const voltages = calculateVoltages(n, V, Cs, Cm, discPuncturedStatus);
        const discVoltage = voltages[discIndex - 1]; // voltages array is 0-indexed, discIndex is 1-indexed

        document.getElementById('modalDiscIndex').textContent = discIndex;
        document.getElementById('modalDiscVoltage').textContent = discVoltage.toFixed(2);
        document.getElementById('isPuncturedCheckbox').checked = !!discPuncturedStatus[discIndex];

        document.getElementById('discPropertiesModal').style.display = 'block';
    }

    function saveDiscProperties() {
        if (currentEditedDiscIndex === null) return;

        const isPunctured = document.getElementById('isPuncturedCheckbox').checked;
        
        if (isPunctured) {
            discPuncturedStatus[currentEditedDiscIndex] = true;
        } else {
            delete discPuncturedStatus[currentEditedDiscIndex]; // Remove if not punctured
        }

        document.getElementById('discPropertiesModal').style.display = 'none';
        currentEditedDiscIndex = null; // Clear active disc
        renderCurrentSimulation(); // Re-render to show changes
    }

    // New: Toggle Voltage Flow Animation
    function toggleVoltageFlowAnimation() {
        isVoltageFlowAnimationEnabled = !isVoltageFlowAnimationEnabled;
        renderCurrentSimulation(); // Re-render to apply/remove animation
        toggleVoltageFlowBtn.textContent = isVoltageFlowAnimationEnabled ? '⚡ Hide Voltage Flow' : '⚡ Toggle Voltage Flow';
    }


    function renderVoltageChart(voltages, n) {
        const labels = Array.from({ length: n }, (_, i) => `Disc ${i + 1}`);
        const data = voltages.map(v => parseFloat(v.toFixed(2))); // Ensure data is numbers

        if (currentVoltageChart) {
            currentVoltageChart.data.labels = labels;
            currentVoltageChart.data.datasets[0].data = data;
            currentVoltageChart.update();
        } else {
            const ctx = currentVoltageChartCanvas.getContext('2d');
            currentVoltageChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Voltage (kV) per Disc (Disc 1 = Line End)',
                        data: data,
                        backgroundColor: document.body.classList.contains('dark') ? 'rgba(102, 178, 255, 0.7)' : 'rgba(54, 162, 235, 0.7)',
                        borderColor: document.body.classList.contains('dark') ? 'rgba(102, 178, 255, 1)' : 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Voltage (kV)',
                                color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333'
                            },
                            ticks: {
                                color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333'
                            },
                            grid: {
                                color: document.body.classList.contains('dark') ? 'rgba(200,200,200,0.1)' : 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Disc Number (from Line End)',
                                color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333'
                            },
                            ticks: {
                                color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333'
                            },
                            grid: {
                                color: document.body.classList.contains('dark') ? 'rgba(200,200,200,0.1)' : 'rgba(0,0,0,0.1)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Current Voltage Distribution',
                            color: document.body.classList.contains('dark') ? '#e0e0e0' : '#333'
                        }
                    }
                }
            });
        }
    }

    // --- History & Analytics (mostly from previous version, updated for new data) ---
    function updateHistoryTable() {
        historyTableBody.innerHTML = '';
        experimentHistory.forEach(entry => {
            const row = historyTableBody.insertRow();
            row.insertCell().textContent = entry.id;
            row.insertCell().textContent = entry.timestamp;
            row.insertCell().textContent = entry.params.n;
            row.insertCell().textContent = entry.params.V;
            row.insertCell().textContent = entry.params.Cs;
            row.insertCell().textContent = entry.params.Cm;
            row.insertCell().textContent = entry.k;
            row.insertCell().textContent = entry.efficiency;
            row.insertCell().textContent = entry.maxDiscVoltage;
            row.insertCell().textContent = entry.userCalculatedEfficiency !== null ? entry.userCalculatedEfficiency : 'N/A';
            row.insertCell().textContent = entry.userCalculatedDisc1Voltage !== null ? entry.userCalculatedDisc1Voltage : 'N/A';
            row.insertCell().textContent = entry.params.insulatorMaterial;
            row.insertCell().textContent = entry.params.pollutionLevel;
            row.insertCell().textContent = entry.params.humidity;
            row.insertCell().textContent = entry.params.faultVoltage;
            row.insertCell().textContent = entry.params.faultDuration;
            row.insertCell().textContent = entry.params.faultyDiscIndex;
            row.insertCell().textContent = entry.note;

            const actionCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'action-btn-delete';
            deleteBtn.onclick = () => deleteHistoryEntry(entry.id);
            actionCell.appendChild(deleteBtn);

            const compareCell = row.insertCell();
            const compareBtn = document.createElement('button');
            compareBtn.textContent = 'Compare';
            compareBtn.className = 'action-btn';
            compareBtn.onclick = () => addForComparison(entry.id);
            compareCell.appendChild(compareBtn);
        });
        populateCompareRunsSelect(); // Update the select options whenever history changes
    }

    function deleteHistoryEntry(id) {
        showConfirmModal("Are you sure you want to delete this experiment entry?", () => {
            experimentHistory = experimentHistory.filter(entry => entry.id !== id);
            // Also remove from comparison if present
            comparisonExperiments = comparisonExperiments.filter(exp => exp.id !== id);
            renderComparisonView(); // Re-render comparison view
            saveHistoryToLocalStorage();
            updateHistoryTable();
            updateAnalyticsDashboard();
            updatePersonalizedFeedback();
        });
    }

    function loadHistoryFromLocalStorage() {
        const storedHistory = localStorage.getItem('experimentHistory');
        if (storedHistory) {
            experimentHistory = JSON.parse(storedHistory);
            // Ensure proper parsing for older entries without new fields
            experimentHistory.forEach(entry => {
                if (entry.userCalculatedDisc1Voltage === undefined) entry.userCalculatedDisc1Voltage = null;
                if (entry.userCalculatedEfficiency === undefined) entry.userCalculatedEfficiency = null;
                if (entry.params.insulatorMaterial === undefined) entry.params.insulatorMaterial = defaultValues.insulatorMaterial;
                if (entry.params.pollutionLevel === undefined) entry.params.pollutionLevel = defaultValues.pollutionLevel;
                if (entry.params.humidity === undefined) entry.params.humidity = defaultValues.humidity;
                if (entry.params.faultVoltage === undefined) entry.params.faultVoltage = defaultValues.faultVoltage;
                if (entry.params.faultDuration === undefined) entry.params.faultDuration = defaultValues.faultDuration;
                if (entry.params.faultyDiscIndex === undefined) entry.params.faultyDiscIndex = defaultValues.faultyDiscIndex;
                if (entry.discPuncturedStatus === undefined) entry.discPuncturedStatus = {};
            });

            const maxId = experimentHistory.reduce((max, entry) => Math.max(max, entry.id), 0);
            experimentIdCounter = maxId;
        }
    }

    function saveHistoryToLocalStorage() {
        localStorage.setItem('experimentHistory', JSON.stringify(experimentHistory));
    }

    function resetControls() {
        numDiscsInput.value = defaultValues.numDiscs;
        totalVoltageInput.value = defaultValues.totalVoltage;
        csInput.value = defaultValues.cs;
        cmInput.value = defaultValues.cm;
        insulatorMaterialSelect.value = defaultValues.insulatorMaterial;
        pollutionLevelSelect.value = defaultValues.pollutionLevel;
        humidityInput.value = defaultValues.humidity;
        // Reset modal inputs
        modalFaultVoltageInput.value = defaultValues.faultVoltage;
        modalFaultDurationInput.value = defaultValues.faultDuration;
        modalFaultyDiscIndexInput.value = defaultValues.faultyDiscIndex;
        manualNoteInput.value = '';
        discPuncturedStatus = {}; // Reset punctured status
        isVoltageFlowAnimationEnabled = false; // Reset animation state
    }

    function exportHistoryToCSV() {
        if (experimentHistory.length === 0) {
            showModal("No history to export.");
            return;
        }
        const headers = [
            "ID", "Timestamp", "n", "V_total(kV)", "Cs(nF)", "Cm(nF)", "k",
            "Efficiency(%)", "MaxDiscVoltage(kV)",
            "UserEfficiency(%)", "UserDisc1Voltage(kV)",
            "Material", "Pollution", "Humidity(%)", "FaultVoltage(kV)", "FaultDuration(ms)", "FaultyDiscIndex",
            "PuncturedDiscs", // New column for punctured status
            "Notes", "VoltagesPerDisc(kV)"
        ];
        const rows = experimentHistory.map(entry => {
            const puncturedDiscs = Object.keys(entry.discPuncturedStatus).filter(key => entry.discPuncturedStatus[key]).join(';');
            return [
                entry.id,
                entry.timestamp,
                entry.params.n,
                entry.params.V,
                entry.params.Cs,
                entry.params.Cm,
                entry.k,
                entry.efficiency,
                entry.maxDiscVoltage,
                entry.userCalculatedEfficiency !== null ? entry.userCalculatedEfficiency : 'N/A',
                entry.userCalculatedDisc1Voltage !== null ? entry.userCalculatedDisc1Voltage : 'N/A',
                entry.params.insulatorMaterial,
                entry.params.pollutionLevel,
                entry.params.humidity,
                entry.params.faultVoltage,
                entry.params.faultDuration,
                entry.params.faultyDiscIndex,
                `"${puncturedDiscs}"`, // Export punctured discs
                `"${entry.note.replace(/"/g, '""')}"`,
                `"${entry.voltages.join(';')}"`
            ];
        });
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "insulator_experiment_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function clearHistory() {
        showConfirmModal("Are you sure you want to clear all experiment history? This cannot be undone.", () => {
            experimentHistory = [];
            experimentIdCounter = 0;
            comparisonExperiments = []; // Clear comparison as well
            renderComparisonView();
            updateHistoryTable();
            updateAnalyticsDashboard();
            saveHistoryToLocalStorage();
            updatePersonalizedFeedback();
        });
    }

    function updateAnalyticsDashboard() {
        renderEfficiencyVsKGraph();
        renderVoltageTrendsGraph();
        renderEfficiencyOverTimeGraph();
        renderUserVsSystemEfficiencyGraph(); // New chart
        renderUserVsSystemDisc1VoltageGraph(); // New chart
        // Do NOT automatically render comparisonVoltageChart here, it's user-triggered
    }

    function getPlotlyLayoutDefaults() {
        const isDark = document.body.classList.contains('dark');
        return {
            paper_bgcolor: isDark ? '#282828' : '#fff',
            plot_bgcolor: isDark ? '#282828' : '#fff',
            font: {
                color: isDark ? '#e0e0e0' : '#333'
            },
            xaxis: {
                gridcolor: isDark ? 'rgba(200,200,200,0.1)' : 'rgba(0,0,0,0.1)',
                linecolor: isDark ? '#666' : '#ccc',
                zerolinecolor: isDark ? '#666' : '#ccc'
            },
            yaxis: {
                gridcolor: isDark ? 'rgba(200,200,200,0.1)' : 'rgba(0,0,0,0.1)',
                linecolor: isDark ? '#666' : '#ccc',
                zerolinecolor: isDark ? '#666' : '#ccc'
            },
            hovermode: 'closest',
            margin: { t: 50, b: 50, l: 60, r: 30 }
        };
    }

    function renderEfficiencyVsKGraph() {
        const layout = {
            title: 'String Efficiency vs. k (Cs/Cm)',
            xaxis: { title: 'k (Cs/Cm)' },
            yaxis: { title: 'String Efficiency (%)', range: [0, 105] },
            ...getPlotlyLayoutDefaults()
        };

        const data = [{
            x: experimentHistory.map(e => e.k),
            y: experimentHistory.map(e => e.efficiency),
            text: experimentHistory.map(e => `ID:${e.id}`),
            hovertext: experimentHistory.map(e => `Run ${e.id}: ${e.note || 'No note'}<br>n=${e.params.n}, V=${e.params.V}, Cs=${e.params.Cs}, Cm=${e.params.Cm}`),
            mode: 'markers+text',
            type: 'scatter',
            textposition: 'top center',
            marker: {
                size: 10,
                color: experimentHistory.map(e => e.efficiency),
                colorscale: 'Viridis',
                showscale: true
            }
        }];
        Plotly.newPlot('efficiencyVsKGraph', data, layout, { responsive: true });
    }

    function renderVoltageTrendsGraph() {
        const nValues = Array.from(new Set(experimentHistory.map(e => e.params.n))).sort((a, b) => a - b);
        let data = [];
        const isDark = document.body.classList.contains('dark');
        const colorScale = [
            isDark ? '#88CCEE' : '#1f77b4', // blue
            isDark ? '#CC6677' : '#ff7f0e', // red
            isDark ? '#DDCCEE' : '#2ca02c', // purple
            isDark ? '#44AA99' : '#d62728', // teal
            isDark ? '#999933' : '#9467bd'  // olive
        ];

        nValues.forEach((n, idx) => {
            const nFilteredHistory = experimentHistory.filter(e => e.params.n === n);
            if (nFilteredHistory.length > 0) {
                data.push({
                    x: nFilteredHistory.map(e => e.id),
                    y: nFilteredHistory.map(e => e.maxDiscVoltage),
                    mode: 'lines+markers',
                    name: `Max V for n=${n}`,
                    line: { color: colorScale[idx % colorScale.length] },
                    marker: { size: 8 }
                });
            }
        });

        const layout = {
            title: 'Maximum Disc Voltage Trends Across Experiments',
            xaxis: { title: 'Experiment Run ID' },
            yaxis: { title: 'Max Disc Voltage (kV)' },
            ...getPlotlyLayoutDefaults()
        };
        Plotly.newPlot('voltageTrendsGraph', data, layout, { responsive: true });
    }

    function renderEfficiencyOverTimeGraph() {
        const data = [{
            x: experimentHistory.map(e => e.id),
            y: experimentHistory.map(e => e.efficiency),
            text: experimentHistory.map(e => `Eff:${e.efficiency}%`),
            hovertext: experimentHistory.map(e => `Run ${e.id}: Eff ${e.efficiency}%<br>k=${e.k}, n=${e.params.n}`),
            mode: 'lines+markers',
            type: 'scatter',
            marker: { size: 8 }
        }];

        const layout = {
            title: 'String Efficiency Over Experiments',
            xaxis: { title: 'Experiment Run ID' },
            yaxis: { title: 'String Efficiency (%)', range: [0, 105] },
            ...getPlotlyLayoutDefaults()
        };
        Plotly.newPlot('efficiencyOverTimeGraph', data, layout, { responsive: true });
    }

    function renderUserVsSystemEfficiencyGraph() {
        const experimentsWithUserEff = experimentHistory.filter(e => e.userCalculatedEfficiency !== null);
        
        const labels = experimentsWithUserEff.map(e => `Run ${e.id}`);
        const userEfficiencies = experimentsWithUserEff.map(e => e.userCalculatedEfficiency);
        const systemEfficiencies = experimentsWithUserEff.map(e => e.efficiency);

        const data = [
            {
                x: labels,
                y: userEfficiencies,
                type: 'bar',
                name: 'User Calculated Efficiency (%)',
                marker: { color: document.body.classList.contains('dark') ? '#4CAF50' : '#8BC34A' } // Greenish
            },
            {
                x: labels,
                y: systemEfficiencies,
                type: 'bar',
                name: 'System Calculated Efficiency (%)',
                marker: { color: document.body.classList.contains('dark') ? '#2196F3' : '#03A9F4' } // Bluish
            }
        ];

        const layout = {
            barmode: 'group',
            title: 'User vs. System Calculated String Efficiency',
            xaxis: { title: 'Experiment Run', automargin: true },
            yaxis: { title: 'Efficiency (%)', range: [0, 105] },
            ...getPlotlyLayoutDefaults()
        };
        Plotly.newPlot('userVsSystemEfficiencyGraph', data, layout, { responsive: true });
    }

    function renderUserVsSystemDisc1VoltageGraph() {
        const experimentsWithUserDisc1V = experimentHistory.filter(e => e.userCalculatedDisc1Voltage !== null);
        
        const labels = experimentsWithUserDisc1V.map(e => `Run ${e.id}`);
        const userDisc1Voltages = experimentsWithUserDisc1V.map(e => e.userCalculatedDisc1Voltage);
        const systemDisc1Voltages = experimentsWithUserDisc1V.map(e => e.voltages[0]); // voltages[0] is Disc 1 voltage

        const data = [
            {
                x: labels,
                y: userDisc1Voltages,
                type: 'bar',
                name: 'User Calculated Disc 1 Voltage (kV)',
                marker: { color: document.body.classList.contains('dark') ? '#FFC107' : '#FFEB3B' } // Yellowish
            },
            {
                x: labels,
                y: systemDisc1Voltages,
                type: 'bar',
                name: 'System Calculated Disc 1 Voltage (kV)',
                marker: { color: document.body.classList.contains('dark') ? '#FF5722' : '#FF9800' } // Orangish
            }
        ];

        const layout = {
            barmode: 'group',
            title: 'User vs. System Calculated Disc 1 Voltage',
            xaxis: { title: 'Experiment Run', automargin: true },
            yaxis: { title: 'Voltage (kV)', rangemode: 'tozero' },
            ...getPlotlyLayoutDefaults()
        };
        Plotly.newPlot('userVsSystemDisc1VoltageGraph', data, layout, { responsive: true });
    }


    function takeScreenshot() {
        showLoading();
        setTimeout(() => { // Add a slight delay to ensure rendering is complete before screenshot
            const activeTabPanel = document.querySelector('.tab-panel.active') || document.body;
            html2canvas(activeTabPanel, { 
                scale: 1.5, 
                useCORS: true, 
                backgroundColor: (document.body.classList.contains('dark') ? '#1e1e1e' : '#f4f7f6') 
            })
            .then(canvas => {
                const link = document.createElement('a');
                link.download = 'insulator_simulation_screenshot.png';
                link.href = canvas.toDataURL();
                link.click();
                hideLoading();
            }).catch(err => {
                console.error("Screenshot failed:", err);
                showModal("Could not take screenshot. Please try again.");
                hideLoading();
            });
        }, 100);
    }

    function printCurrentView() {
        window.print();
    }

    function toggleTheme(event) {
        document.body.classList.toggle('dark', event.target.checked);
        localStorage.setItem('theme', event.target.checked ? 'dark' : 'light');
        updateAnalyticsDashboard(); // Redraw Plotly with new theme
        if (currentVoltageChart) { // Update Chart.js chart as well
            currentVoltageChart.options.scales.y.title.color = document.body.classList.contains('dark') ? '#e0e0e0' : '#333';
            currentVoltageChart.options.scales.y.ticks.color = document.body.classList.contains('dark') ? '#e0e0e0' : '#333';
            currentVoltageChart.options.scales.y.grid.color = document.body.classList.contains('dark') ? 'rgba(200,200,200,0.1)' : 'rgba(0,0,0,0.1)';
            currentVoltageChart.options.scales.x.title.color = document.body.classList.contains('dark') ? '#e0e0e0' : '#333';
            currentVoltageChart.options.scales.x.ticks.color = document.body.classList.contains('dark') ? '#e0e0e0' : '#333';
            currentVoltageChart.options.scales.x.grid.color = document.body.classList.contains('dark') ? 'rgba(200,200,200,0.1)' : 'rgba(0,0,0,0.1)';
            currentVoltageChart.options.plugins.title.color = document.body.classList.contains('dark') ? '#e0e0e0' : '#333';
            currentVoltageChart.data.datasets[0].backgroundColor = document.body.classList.contains('dark') ? 'rgba(102, 178, 255, 0.7)' : 'rgba(54, 162, 235, 0.7)';
            currentVoltageChart.data.datasets[0].borderColor = document.body.classList.contains('dark') ? 'rgba(102, 178, 255, 1)' : 'rgba(54, 162, 255, 1)';
            currentVoltageChart.update();
        }
        // Also update the comparison voltage chart if it exists
        if (comparisonVoltagePlotlyChart) {
            renderComparisonVoltageChart(); // Re-render to apply theme changes
        }
    }

    function updatePersonalizedFeedback() {
        if (experimentHistory.length < 3) {
            personalizedFeedbackEl.textContent = "Complete at least 3 experiments for personalized feedback.";
            return;
        }

        const lastThreeRuns = experimentHistory.slice(-3);
        let feedback = "Recent Trends:\n";

        // Analyze efficiency trends
        const efficiencies = lastThreeRuns.map(e => e.efficiency);
        if (efficiencies[0] < efficiencies[1] && efficiencies[1] < efficiencies[2]) {
            feedback += "  - String efficiency is consistently improving in your recent runs! Keep up the good work.\n";
        } else if (efficiencies[0] > efficiencies[1] && efficiencies[1] > efficiencies[2]) {
            feedback += "  - String efficiency is showing a downward trend in your recent runs. Consider adjusting parameters for better distribution.\n";
        }

        // Analyze k-value relationship
        const kValues = lastThreeRuns.map(e => e.k);
        if (kValues.some(k => k > 1.5)) {
            feedback += "  - You seem to be experimenting with higher k-values (Cs/Cm ratio). Remember, higher k can lead to lower string efficiency.\n";
        } else if (kValues.some(k => k < 0.2)) {
            feedback += "  - Exploring lower k-values can lead to more uniform voltage distribution and higher efficiency. Great approach!\n";
        }

        // Analyze voltage distribution uniformity (simple check)
        const maxVoltages = lastThreeRuns.map(e => e.maxDiscVoltage);
        const avgEfficiencies = lastThreeRuns.map(e => e.efficiency);
        const avgEfficiencyLastThree = avgEfficiencies.reduce((sum, eff) => sum + eff, 0) / avgEfficiencies.length;
        
        feedback += `  - Average efficiency over last 3 runs: ${avgEfficiencyLastThree.toFixed(1)}%.\n`;
        
        personalizedFeedbackEl.textContent = (feedback === "Recent Trends:\n") ? "No strong simple trends detected in the last 3 experiments." : feedback;
    }

    // --- Custom Modal for Alerts/Confirmations ---
    function showModal(message) {
        let modal = document.getElementById('customAlertModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'customAlertModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="document.getElementById('customAlertModal').style.display='none'" tabindex="0" role="button" aria-label="Close alert">&times;</span>
                    <p id="customAlertMessage"></p>
                    <button onclick="document.getElementById('customAlertModal').style.display='none'" class="primary-action-btn" tabindex="0">OK</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        document.getElementById('customAlertMessage').textContent = message;
        modal.style.display = 'block';
    }

    function showConfirmModal(message, onConfirm) {
        let modal = document.getElementById('customConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'customConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="document.getElementById('customConfirmModal').style.display='none'" tabindex="0" role="button" aria-label="Close confirmation">&times;</span>
                    <p id="customConfirmMessage"></p>
                    <button id="confirmYesBtn" class="action-btn" tabindex="0">Yes</button>
                    <button onclick="document.getElementById('customConfirmModal').style.display='none'" class="action-btn-delete" tabindex="0">No</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        document.getElementById('customConfirmMessage').textContent = message;
        const confirmYesBtn = document.getElementById('confirmYesBtn');
        confirmYesBtn.onclick = () => {
            onConfirm();
            modal.style.display = 'none';
        };
        modal.style.display = 'block';
    }


    // --- Tab Navigation ---
    function switchTab(tabName) {
        // Hide all tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
            panel.setAttribute('hidden', 'true');
        });

        // Deactivate all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });

        // Show the selected tab panel
        const selectedTabPanel = document.getElementById(tabName);
        if (selectedTabPanel) {
            selectedTabPanel.style.display = 'block';
            selectedTabPanel.classList.add('active');
            selectedTabPanel.removeAttribute('hidden');
        }

        // Activate the corresponding tab button
        const selectedTabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        if (selectedTabButton) {
            selectedTabButton.classList.add('active');
            selectedTabButton.setAttribute('aria-selected', 'true');
        }
        
        // Re-layout Plotly graphs if switching to analytics or comparison
        if (tabName === 'analyticsTab' || tabName === 'comparisonTab') {
            setTimeout(() => {
                Plotly.Plots.resize(document.getElementById('efficiencyVsKGraph'));
                Plotly.Plots.resize(document.getElementById('voltageTrendsGraph'));
                Plotly.Plots.resize(document.getElementById('efficiencyOverTimeGraph'));
                Plotly.Plots.resize(document.getElementById('userVsSystemEfficiencyGraph'));
                Plotly.Plots.resize(document.getElementById('userVsSystemDisc1VoltageGraph'));
                // Resize charts in comparison view too
                document.querySelectorAll('.comparison-item .chart-box').forEach(chartDiv => {
                    Plotly.Plots.resize(chartDiv);
                });
                // Also resize the new comparative voltage chart
                if (comparisonVoltagePlotlyChart) {
                    Plotly.Plots.resize(document.getElementById('comparisonVoltageChart'));
                }
            }, 100);
        }
    }
    // Initial tab load (Simulation Guide by default)
    switchTab('simulationTab');


    // --- Design Mode Functions ---
    function toggleDesignMode() {
        if (designModeContent.style.display === 'none') {
            designModeContent.style.display = 'block';
            toggleDesignModeBtn.textContent = '⚙️ Hide Design Mode';
        } else {
            designModeContent.style.display = 'none';
            toggleDesignModeBtn.textContent = '⚙️ Design Mode';
            designModeResult.textContent = ''; // Clear result when hiding
        }
    }

    function calculateRequiredDiscs() {
        const targetV = parseFloat(targetSystemVoltageInput.value);
        const maxVPerDisc = parseFloat(maxVoltagePerDiscInput.value);

        if (isNaN(targetV) || isNaN(maxVPerDisc) || targetV <= 0 || maxVPerDisc <= 0) {
            designModeResult.textContent = "Please enter valid positive numbers for target voltages.";
            designModeResult.style.color = '#e74c3c';
            return;
        }

        // Simplistic calculation: assumes uniform distribution for initial design
        const requiredDiscs = Math.ceil(targetV / maxVPerDisc);
        designModeResult.textContent = `Suggested Minimum Discs: ${requiredDiscs} (for ~${maxVPerDisc.toFixed(1)} kV per disc)`;
        designModeResult.style.color = '#27ae60';
    }


    // --- Comparison Mode Functions (for side-by-side view) ---
    function addForComparison(id) {
        const entry = experimentHistory.find(e => e.id === id);
        if (!entry) return;

        if (comparisonExperiments.length >= 2) {
            showModal("You can compare a maximum of 2 experiments in this view. Please remove one to add another.");
            return;
        }

        if (comparisonExperiments.some(exp => exp.id === id)) {
            showModal("This experiment is already added for side-by-side comparison.");
            return;
        }

        comparisonExperiments.push(entry);
        renderComparisonView();
        switchTab('comparisonTab'); // Switch to comparison tab
    }

    function removeComparisonItem(id) {
        comparisonExperiments = comparisonExperiments.filter(exp => exp.id !== id);
        renderComparisonView();
    }

    function renderComparisonView() {
        const comparisonContainer = document.getElementById('comparisonContainer'); // Get reference here
        comparisonContainer.innerHTML = ''; // Clear previous content

        if (comparisonExperiments.length === 0) {
            comparisonContainer.innerHTML = '<p style="text-align:center; color:#777;">No experiments selected for comparison. Add some from the History tab!</p>';
            return;
        }

        comparisonExperiments.forEach((exp, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'comparison-item';
            itemDiv.setAttribute('role', 'region');
            itemDiv.setAttribute('aria-labelledby', `comp-title-${exp.id}`);

            itemDiv.innerHTML = `
                <h3 id="comp-title-${exp.id}">Experiment ID: ${exp.id}</h3>
                <p><strong>Timestamp:</strong> ${exp.timestamp}</p>
                <p><strong>Parameters:</strong> n=${exp.params.n}, V=${exp.params.V} kV, Cs=${exp.params.Cs} nF, Cm=${exp.params.Cm} nF</p>
                <p><strong>k Ratio:</strong> ${exp.k}</p>
                <p><strong>System Efficiency:</strong> ${exp.efficiency}%</p>
                <p><strong>Max Disc Voltage:</strong> ${exp.maxDiscVoltage} kV</p>
                ${exp.userCalculatedEfficiency !== null ? `<p><strong>User Efficiency:</strong> ${exp.userCalculatedEfficiency}%</p>` : ''}
                ${exp.userCalculatedDisc1Voltage !== null ? `<p><strong>User Disc 1 Voltage:</strong> ${exp.userCalculatedDisc1Voltage} kV</p>` : ''}
                
                <h4>Voltage Distribution:</h4>
                <div id="comparisonDiscString-${exp.id}" class="comparison-disc-string"></div>
                
                <div id="comparisonChart-${exp.id}" class="chart-box" role="img" aria-label="Voltage distribution for experiment ${exp.id}"></div>
                <button class="comparison-remove-btn" onclick="removeComparisonItem(${exp.id})" tabindex="0" aria-label="Remove experiment ${exp.id} from comparison">Remove</button>
            `;
            comparisonContainer.appendChild(itemDiv);

            // Render disc string for comparison item
            const comparisonDiscStringDiv = document.getElementById(`comparisonDiscString-${exp.id}`);
            renderComparisonDiscString(exp.voltages, exp.params.n, comparisonDiscStringDiv, exp.discPuncturedStatus);


            // Render individual voltage distribution chart for comparison
            const chartDivId = `comparisonChart-${exp.id}`;
            const labels = Array.from({ length: exp.params.n }, (_, i) => `Disc ${i + 1}`);
            const data = [{
                x: labels,
                y: exp.voltages,
                type: 'bar',
                name: `Voltage (kV) for Run ${exp.id}`,
                marker: { color: document.body.classList.contains('dark') ? '#66b2ff' : '#3498db' }
            }];
            const layout = {
                title: `Voltage Distribution (Run ${exp.id})`,
                xaxis: { title: 'Disc Number (Line End)' },
                yaxis: { title: 'Voltage (kV)', rangemode: 'tozero' },
                height: 250, // Smaller height for comparison charts
                margin: { t: 40, b: 40, l: 40, r: 20 },
                ...getPlotlyLayoutDefaults()
            };
            Plotly.newPlot(chartDivId, data, layout, { responsive: true });
        });
    }

    // --- New: Comparative Voltage Distribution Chart (in Analytics) ---
    function populateCompareRunsSelect() {
        compareRunsSelect.innerHTML = ''; // Clear existing options
        if (experimentHistory.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No experiments logged yet';
            option.disabled = true;
            compareRunsSelect.appendChild(option);
            plotComparisonChartBtn.disabled = true;
            return;
        }
        plotComparisonChartBtn.disabled = false; // Enable button if history exists

        experimentHistory.forEach(entry => {
            const option = document.createElement('option');
            option.value = entry.id;
            option.textContent = `Run ${entry.id}: n=${entry.params.n}, V=${entry.params.V}kV, Eff=${entry.efficiency}%`;
            compareRunsSelect.appendChild(option);
        });
    }

    function renderComparisonVoltageChart() {
        const selectedIds = Array.from(compareRunsSelect.selectedOptions).map(option => parseInt(option.value));
        const selectedExperiments = experimentHistory.filter(exp => selectedIds.includes(exp.id));

        if (selectedExperiments.length === 0) {
            showModal("Please select at least one experiment to plot for comparison.");
            // Clear existing chart if no experiments are selected
            Plotly.purge('comparisonVoltageChart');
            comparisonVoltagePlotlyChart = null;
            return;
        }

        const traces = [];
        const colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
        ]; // More colors for multiple traces
        const darkColors = [
            '#66b2ff', '#ffaa66', '#85e085', '#ff9999', '#c299ff',
            '#a67c6b', '#ffb3e6', '#cccccc', '#e0e066', '#66ccff'
        ];
        const isDark = document.body.classList.contains('dark');

        selectedExperiments.forEach((exp, index) => {
            // Determine the maximum number of discs among selected experiments for consistent X-axis
            const maxN = Math.max(...selectedExperiments.map(e => e.params.n));
            const labels = Array.from({ length: maxN }, (_, i) => `Disc ${i + 1}`);
            
            // Pad voltages with nulls if n is smaller than maxN to ensure consistent x-axis
            const paddedVoltages = [...exp.voltages];
            while (paddedVoltages.length < maxN) {
                paddedVoltages.push(null); // Use null to represent missing data points
            }

            traces.push({
                x: labels,
                y: paddedVoltages,
                type: 'bar',
                name: `Run ${exp.id} (n=${exp.params.n}, Eff: ${exp.efficiency}%)`,
                marker: { color: isDark ? darkColors[index % darkColors.length] : colors[index % colors.length] },
                hoverinfo: 'name+y'
            });
        });

        const layout = {
            barmode: 'group', // Group bars for each disc for different experiments
            title: 'Comparative Voltage Distribution Across Experiments',
            xaxis: { title: 'Disc Number (from Line End)', automargin: true },
            yaxis: { title: 'Voltage (kV)', rangemode: 'tozero' },
            ...getPlotlyLayoutDefaults()
        };

        Plotly.newPlot('comparisonVoltageChart', traces, layout, { responsive: true }).then((gd) => {
            comparisonVoltagePlotlyChart = gd; // Store the chart instance
        });
    }

    // --- Fault Settings Modal Functions ---
    function openFaultSettingsModal() {
        // Populate modal inputs with current values from main inputs (or default if not set)
        modalFaultVoltageInput.value = parseFloat(defaultValues.faultVoltage);
        modalFaultDurationInput.value = parseFloat(defaultValues.faultDuration);
        modalFaultyDiscIndexInput.value = parseInt(defaultValues.faultyDiscIndex);
        
        // Ensure max value for faultyDiscIndex in modal is correct
        modalFaultyDiscIndexInput.max = parseInt(numDiscsInput.value);

        faultSettingsModal.style.display = 'block';
    }

    function saveFaultSettings() {
        // Update the defaultValues object with the values from the modal
        defaultValues.faultVoltage = parseFloat(modalFaultVoltageInput.value);
        defaultValues.faultDuration = parseFloat(modalFaultDurationInput.value);
        defaultValues.faultyDiscIndex = parseInt(modalFaultyDiscIndexInput.value);

        faultSettingsModal.style.display = 'none';
        showModal("Fault settings saved. These will apply to the next experiment run.");
    }

  