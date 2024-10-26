/**
 * Executes an array of async functions in parallel
 * @param {Function[]} functions Array of async functions
 * @return {Promise} Promise that resolves when all functions complete
 */
async function promiseAll(functions) {
    // Map each function to its execution promise
    const promises = functions.map(fn => fn());
    
    // Wait for all promises to resolve
    return Promise.all(promises);
}

// Example usage:
const promise1 = () => new Promise(resolve => setTimeout(() => resolve(1), 200));
const promise2 = () => new Promise(resolve => setTimeout(() => resolve(2), 100));
const promise3 = () => new Promise(resolve => setTimeout(() => resolve(3), 300));

// Test the implementation
promiseAll([promise1, promise2, promise3])
    .then(results => console.log('All promises resolved:', results))
    .catch(error => console.error('Error:', error));
