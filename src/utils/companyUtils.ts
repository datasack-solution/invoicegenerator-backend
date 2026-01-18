// Company-specific utility functions

export const isNeosoftCompany = (companyId: string): boolean => {
  return companyId?.toLowerCase() === 'neosoft';
};

export const isBlueBinariesCompany = (companyId: string): boolean => {
  return companyId?.toLowerCase() === 'bluebinaries';
};

export const getCompanyType = (companyId: string): 'neosoft' | 'bluebinaries' | 'unknown' => {
  if (isNeosoftCompany(companyId)) return 'neosoft';
  if (isBlueBinariesCompany(companyId)) return 'bluebinaries';
  return 'unknown';
};

// Validation helpers for company-specific requirements
export const validateNeosoftEmployee = (payload: any): string[] => {
  const errors: string[] = [];
  
  if (!payload.name) errors.push("Name is required");
  if (!payload.iqamaNo) errors.push("Iqama number is required");
  if (!payload.joiningDate) errors.push("Joining date is required");
  if (!payload.fromDate) errors.push("From date is required");
  if (!payload.toDate) errors.push("To date is required");
  if (payload.serviceCharge === undefined || payload.serviceCharge === null) {
    errors.push("Service charge is required for Neosoft");
  }
  
  return errors;
};

export const validateBlueBinariesEmployee = (payload: any): string[] => {
  const errors: string[] = [];
  
  if (!payload.name) errors.push("Name is required");
  if (!payload.iqamaNo) errors.push("Iqama number is required");
  if (!payload.joiningDate) errors.push("Joining date is required");
  if (!payload.fromDate) errors.push("From date is required");
  if (!payload.toDate) errors.push("To date is required");
  
  // Required salary fields for BlueBinaries
  if (payload.basic === undefined || payload.basic === null || payload.basic <= 0) {
    errors.push("Basic salary is required and must be positive");
  }
  if (payload.housing === undefined || payload.housing === null || payload.housing < 0) {
    errors.push("Housing allowance is required and must be non-negative");
  }
  if (payload.transport === undefined || payload.transport === null || payload.transport < 0) {
    errors.push("Transport allowance is required and must be non-negative");
  }
  
  return errors;
};