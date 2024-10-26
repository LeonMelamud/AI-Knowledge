/**
 * Determines if a number is a palindrome
 * @param {number} x The number to check
 * @return {boolean} True if x is a palindrome, false otherwise
 */
function isPalindrome(x) {
    // Convert to string for easy comparison
    const str = x.toString();
    
    // Compare characters from start and end moving inward
    let left = 0;
    let right = str.length - 1;
    
    while (left < right) {
        if (str[left] !== str[right]) {
            return false;
        }
        left++;
        right--;
    }
    
    return true;
}

// Test cases
console.log('121 is palindrome:', isPalindrome(121));    // true
console.log('-121 is palindrome:', isPalindrome(-121));  // false
console.log('10 is palindrome:', isPalindrome(10));      // false
console.log('12321 is palindrome:', isPalindrome(12321)); // true
