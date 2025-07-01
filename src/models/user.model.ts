export interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export interface User {
    employee_code: string;
    fullName: string;
    phone: string;
    email: string;
    IDNumber: string;
    IDFrontImage: string;
    IDBackImage: string;
    IDFrontThumb: string;
    IDBackThumb: string;
    origin: number;
    currentAddress: string;
    dayOfBirth: string;
    graduatedFrom: number;
    position: number;
    salary: number;
    status: number;
    startDate: string;
    bankAccount: BankAccount[];
}
