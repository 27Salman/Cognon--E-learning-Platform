export const validatePassword = (password) => {
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

export const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '' };
    
    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
  
    strength = Object.values(checks).filter(Boolean).length;
    
    const strengthMap = {
        0: { strength: 0, text: 'Very Weak', color: 'red' },
        1: { strength: 20, text: 'Weak', color: 'orange' },
        2: { strength: 40, text: 'Fair', color: 'yellow' },
        3: { strength: 60, text: 'Good', color: 'blue' },
        4: { strength: 80, text: 'Strong', color: 'green' },
        5: { strength: 100, text: 'Very Strong', color: 'green' }
    };
    
    return strengthMap[strength];
};