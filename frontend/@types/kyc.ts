export interface KYCDetails {
    principalId: string;
    userType: 'validator' | 'collector' | 'regular';
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthday: string;
    address: string;
    nationality: string;
    gender: string;
    occupation: string;
    photo?: File;
    bankDetails?: {
      gcash: string;
      paymaya: string;
      bpi: {
        accountNumber: string;
        accountName: string;
      };
    };
  }