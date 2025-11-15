export type Result<T> = {
  memberFiles: never[];
  isSuccess: boolean;
  value?: T;
  error?: string;
};

export type MemberFileDto = {
  id: string;
  fileName: string;
  filePath: string;
  fileDescription?: string;
  contentType: string;
}


export type Member = {
id?: string;
    firstName: string
    middleName: string
    lastName: string
    email: string
    registerDate: string
    phoneNumber: string
    isActive: boolean
    isAdmin: boolean

    userName?: string
    password?: string
    displayName?: string
    bio?: string

    addresses?: Address[]
    familyMembers?: FamilyMember[]
    memberFiles?: MemberFile[]
    payments?: Payment[]
    incidents?: Incident[]
  }

  export type File ={
   
                FileName?: string,
                FileDescription?: string,
                FilePath?: string,
                ContentType?: string,
  }

 

export type Address = {
  id: string
  street: string
  city: string
  state: string
  country: string
  zipCode: string
}
export type Incident = {
  id: string
  incidentType: string
  incidentDescription: string
  paymentDate: string
  incidentDate: string
  eventNumber: string

}

export type FamilyMember = {
  id: string
  memberFamilyFirstName: string
  memberFamilyMiddleName: string
  memberFamilyLastName: string
  relationship: string
}

interface MemberFile {
  id: string;
  fileName: string;
  fileType: string;
  base64FileData: string;
}


export const paymentMethods: string[] = [
  'Cash',
  'CreditCard',
  'BankTransfer',
  'Check',
  'ReceiptAttached', // match enum exactly
];

export const paymentRecurringType: string[] = [
  'Annual',
  'Monthly',
  'Quarterly',
  'Incident',
  'Membership',
  'Miscellaneous', // match enum exactly
];

export type Payment = {
  id: string
  paymentAmount: number
  paymentDate: string
  paymentType: string
  paymentRecurringType: string
}

export type Incident = {
  id: string
  incidentDate: string
  paymentDate: string
  eventNumber: number
}

export type User = {
  username: string;
  token: string;
  email: string;
}