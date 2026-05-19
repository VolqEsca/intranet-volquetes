// src/utils/validators.ts
export const validateDNI_NIE = (document: string): boolean => {
    const clean = document.toUpperCase().trim();
    
    // DNI: 8 dígitos + letra
    if (/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
      const number = parseInt(clean.substring(0, 8));
      const letter = clean.charAt(8);
      const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
      return validLetters.charAt(number % 23) === letter;
    }
    
    // NIE: X/Y/Z + 7 dígitos + letra  
    if (/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
      const niePrefix = clean.charAt(0);
      const number = parseInt((niePrefix === 'X' ? '0' : niePrefix === 'Y' ? '1' : '2') + clean.substring(1, 8));
      const letter = clean.charAt(8);
      const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
      return validLetters.charAt(number % 23) === letter;
    }
    
    return false;
  };
  
  export const validateIBAN = (iban: string): boolean => {
    const clean = iban.replace(/\s/g, '').toUpperCase();
    
    if (!/^ES[0-9]{22}$/.test(clean)) return false;
    
    // Algoritmo módulo 97 ISO 13616
    const rearranged = clean.substring(4) + clean.substring(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, (char) => 
      (char.charCodeAt(0) - 55).toString()
    );
    
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    
    return remainder === 1;
  };
  
  // Formato IBAN según tu especificación: ESXX XXXX XXXX XXXX XXXX XXXX
  export const formatIBAN = (iban: string): string => {
    if (!iban) return '';
    const clean = iban.replace(/\s/g, '').toUpperCase();
    if (clean.length !== 24 || !clean.startsWith('ES')) return iban;
    
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };
  
  export const normalizeIBAN = (iban: string): string => {
    return iban.replace(/\s/g, '').toUpperCase();
  };
  