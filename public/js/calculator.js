import { config } from './config.js';


export function buildCalculatorSection(uiTranslations) {
    const content = `
        <h2>${uiTranslations.tokenCalculator}</h2>
        <p>${uiTranslations.tokenExplanation}</p>
        <div>
            <input type="text" id="input-field" placeholder="${uiTranslations.enterText}">
            <button id="calculate-button">${uiTranslations.calculateTokens}</button>
        </div>
        <div id="result-field"></div>
    `;
    return content;
}
export function setupCalculator(uiTranslations) {

        const calculateButton = document.getElementById('calculate-button');
        const inputField = document.getElementById('input-field');
        const resultField = document.getElementById('result-field');

        if (calculateButton) {
            calculateButton.addEventListener('click', async function() {
                const inputText = inputField.value;
                console.log('Input text:', inputText);
                try {
                    console.log('Fetching data from server...');
                    const response = await fetch(`${config.serverUrl}/assert-test?input=${encodeURIComponent(inputText)}`);
                    console.log('Response received');
                    
                    if (!response.ok) {
                        resultField.textContent = `Error: ${response.status} ${response.statusText}`;
                        console.log(`Error: ${response.status} ${response.statusText}`);
                        return;
                    }

                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const result = await response.json();
                        if (result.success && result.numTokens !== undefined) {
                            resultField.textContent = `${uiTranslations.numberOfTokens}: ${result.numTokens}`;
                            console.log('Tokens calculated successfully');
                        } else {
                            resultField.textContent = `Error: ${result.message || 'Unknown error'}`;
                            console.log('Error:', result.message);
                        }
                    } else {
                        resultField.textContent = 'Error: Server returned non-JSON response';
                        console.log('Error: Server returned non-JSON response');
                    }
                } catch (error) {
                    resultField.textContent = `Error: ${error.message}`;
                    console.log('Error:', error.message);
                }
            });
        } else {
            console.log('Calculate button not found');
        }
}
