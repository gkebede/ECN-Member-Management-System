
import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import type { Member, MemberFileDto, Result, User } from "../types";
import createMem from "./helper";
import { router } from "../../router/Routes";


axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://localhost:5000/api";

//axios.defaults.baseURL =  import.meta.env.VITE_API_URL;   //  'https://localhost:5000/api'; --  //https://localhost:5000/api/members
//axios.defaults.baseURL =  "https://localhost:5000/api";
const responseBody = <T>(response: AxiosResponse<T>) => response.data;

axios.interceptors.request.use( config => {
    const token = localStorage.getItem('jwt');
    console.log("Request interceptor - Token exists:", !!token);
    if(token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Authorization header set:", config.headers.Authorization?.substring(0, 20) + "...");
    } else {
        console.warn("No token found or no headers object");
    }
    return config;
}, (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
});


const agentFormData = {
  // regular JSON POST
  post: <T>(url: string, body: unknown, config?: AxiosRequestConfig) =>
    axios.post<T>(url, body, config).then(responseBody),

  // new FormData POST
  postFormData: <T>(url: string, body: FormData, config?: AxiosRequestConfig) =>
    axios
      .post<T>(url, body, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(config?.headers || {}),
        },
      })
      .then(responseBody),
};

axios.interceptors.response.use(async response => {
  //  await sleep(1000); // simulate delay
    return response; // resolve
}, (error: AxiosError) => {
  console.log("Axios response error interceptor:", error);
  
  if (!error.response) {
    console.error("No response received - network error or CORS issue");
    return Promise.reject(error);
  }
  
    const { data, status, config } = error.response as AxiosResponse;

    switch (status) {
        case 400:
            // Only redirect to not-found for specific resource not found errors
            if (config.method === 'get' && data.errors?.id) {
                console.log("Resource not found:", data.errors);
                // Only navigate if it's a specific resource (like /members/{id})
                if (config.url?.includes('/members/') && config.url.split('/').length > 3) {
                    router.navigate('/not-found');
                }
            }

            if (data.errors) {
                const modalStateError: string[] = [];
                for (const key in data.errors) {
                    if (data.errors[key]) modalStateError.push(data.errors[key]);
                }
                throw modalStateError.flat();
            }
            break;
        case 401:
            console.error("401 Unauthorized - Token may be invalid or expired");
            console.error("Request URL:", config?.url);
            console.error("Request headers:", config?.headers);
            localStorage.removeItem('jwt');
            // Only navigate if not already on login page
            if (window.location.pathname !== '/login') {
                router.navigate('/login');
            }
            break;
        case 403:
            console.error("403 Forbidden - Access denied");
            break;
        case 404:
            // Only redirect to not-found for specific resource requests, not for list endpoints
            console.error("404 Not Found - Endpoint:", config.url);
            console.error("Full request config:", config);
            // Don't redirect for API list endpoints - let the component handle the error
            if (config.method === 'get' && config.url && 
                !config.url.includes('/members') && 
                !config.url.includes('/account')) {
                console.error("404 - Navigating to not-found for:", config.url);
                router.navigate('/not-found');
            } else {
                console.error("404 - API endpoint not found, not redirecting:", config.url);
            }
            break;
        case 500:
            console.error("500 Server Error");
            // store.commonStore.setServerError(data);
            // Don't navigate to server-error if route doesn't exist
            break;
    }

    return Promise.reject(error);
});




const requests = {
  get: <T>(url: string) => axios.get<T>(url).then(responseBody),
  post: <T>(url: string, body: unknown, config?: AxiosRequestConfig) =>
    axios.post<T>(url, body, config).then(responseBody),
  postPdf: <T>(url: string) => axios.post<T>(url).then(responseBody),
  put: <T>(url: string, body: unknown, config?: AxiosRequestConfig) =>
    axios.put<T>(url, body, config).then(responseBody),
  delete: <T>(url: string) => axios.delete<T>(url).then(responseBody),
};



const Members = {
    // API returns Member[] directly (HandleResult unwraps Result<Member[]>)
    list: () => requests.get<Member[]>('/members'),
    details: (id: string) => requests.get<Result<Member>>(`/members/${id}`),
    create: (member: Member, files: File[] = []) => createMem(member, files),
    update: (member: Member) => {
        // Ensure all nested lists are included in the update request
        const updatePayload = {
            ...member,
            addresses: member.addresses ?? [],
            familyMembers: member.familyMembers ?? [],
            payments: (member.payments ?? []).map(p => {
                const amount = p.paymentAmount ?? 0;
                console.log(`agent.Members.update - Payment ${p.id}: paymentAmount=${p.paymentAmount}, sending amount=${amount}`);
                return {
                    id: p.id ?? '',
                    amount: amount, // Backend expects "amount" not "paymentAmount"
                    paymentDate: p.paymentDate ?? '',
                    paymentType: p.paymentType ?? '',
                    paymentRecurringType: p.paymentRecurringType ?? '',
                };
            }),
            incidents: (member.incidents ?? []).map(i => {
                // paymentDate is the source of truth - it's what the user enters in the form
                // Always use paymentDate for both fields, unless it's empty/MinValue, then use incidentDate
                const paymentDate = i.paymentDate ?? '';
                const incidentDate = i.incidentDate ?? '';
                
                // Use paymentDate if it's valid (not empty, not MinValue)
                const validPaymentDate = paymentDate && 
                    paymentDate !== '' && 
                    paymentDate !== '0001-01-01' && 
                    paymentDate !== '1970-01-01';
                
                // Use incidentDate as fallback only if paymentDate is invalid
                const finalDate = validPaymentDate ? paymentDate : (incidentDate && incidentDate !== '0001-01-01' && incidentDate !== '1970-01-01' ? incidentDate : '');
                
                return {
                    id: i.id ?? '',
                    incidentType: i.incidentType ?? '',
                    incidentDescription: i.incidentDescription ?? '',
                    paymentDate: finalDate, // Always send paymentDate (source of truth)
                    incidentDate: finalDate, // Also send incidentDate with same value for backend compatibility
                    eventNumber: typeof i.eventNumber === 'string' ? parseInt(i.eventNumber) || 0 : (i.eventNumber ?? 0),
                };
            }),
            memberFiles: member.memberFiles ?? [],
        };
        console.log("Update payload:", JSON.stringify(updatePayload, null, 2));
        return requests.put<Result<Member>>(`/members/${member?.id}`, updatePayload);
    },
    delete: (id: string) => requests.delete<Result<void>>(`/members/${id}`),
    uploadFiles: (memberId: string, files: File[], fileDescription?: string) => uploads(memberId, files, fileDescription),
    getFiles: (memberId: string): Promise<MemberFileDto[]> =>
        requests.get<Result<MemberFileDto[]>>(`/members/files/${memberId}`)
            .then(response => response.value ?? []),
    getFile: (memberId: string): Promise<MemberFileDto> =>
        requests.get<Result<MemberFileDto>>(`/members/file/${memberId}`)
            .then(response => response.value!),
}






const MemberAddresses = {

    // list: () => requests.get<Address[]>(`/addresses`),
    // details: (id: string) => requests.get<Address>(`/addresses/${id}`),
   // create: (address: Address) => requests.post<void>(`/addresses/`, address),
    // update: (activity: AddressFormValues) => requests.put<void>(`/addresses/${activity.id}`, activity),
   // update: (address: Address) => requests.put<void>(`/addresses/${address.id}`, address),
    delete: (id: string) => requests.delete(`/addresses/${id}`),
}
const Account = {
    login: (credentials: { username: string; password: string }) => 
        requests.post<User>('/account/login', credentials),
    current: () => requests.get<User>('/account/current'),
}



// Upload files to a member
const uploads = (memberId: string, files: File[], fileDescription?: string) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });

  if (fileDescription) {
    formData.append("fileDescription", fileDescription);
  }

  return axios.post(`/members/uploads/${memberId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};



const agent = {
    request: requests,
    Members,
    Account,
    MemberAddresses,
    agentFormData,
    uploads
}

export default agent;



