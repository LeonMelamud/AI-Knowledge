/**
 * Executes an array of async functions in parallel
 * @param {Function[]} functions Array of async functions
 * @return {Promise} Promise that resolves when all functions complete or rejects with first error
 */
async function promiseAll(functions) {
    try {
        // Map each function to its execution promise
        const promises = functions.map(fn => fn());
        
        // Wait for all promises to resolve
        return await Promise.all(promises);
    } catch (error) {
        // Reject with the first error encountered
        throw error;
    }
}

// Example usage with both success and error cases:
const promise1 = () => new Promise(resolve => setTimeout(() => resolve(1), 200));
const promise2 = () => new Promise((resolve, reject) => setTimeout(() => reject('Error in promise 2'), 100));
const promise3 = () => new Promise(resolve => setTimeout(() => resolve(3), 300));

// Test success case
console.log('Testing success case:');
promiseAll([promise1, promise3])
    .then(results => console.log('All promises resolved:', results))
    .catch(error => console.error('Error:', error));

// Test failure case
console.log('\nTesting failure case:');
promiseAll([promise1, promise2, promise3])
    .then(results => console.log('All promises resolved:', results))
    .catch(error => console.error('Error:', error));
