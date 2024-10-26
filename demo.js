// Function to count to 100 and add 2 every 3 steps
function specialCount() {
    let num = 0;
    let stepCount = 0;
    
    while (num <= 100) {
        console.log(num);
        
        stepCount++;
        if (stepCount === 3) {
            num += 2;  // Add 2 every third step
            stepCount = 0;  // Reset step counter
        }
        num++;
    }
}

// Run the counting function
specialCount();
