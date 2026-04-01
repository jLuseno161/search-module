import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CountyRegistryData, Faqs, Search } from '../interfaces/search';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) { }

  private faqData: Faqs[] = [{
    question: 'What is Search?',
    answer: 'It is an application made to find out the ownership details of a property, and other interests that have been registered on that property.',
    expanded: true
  },
  {
    question: 'What is power of attorney register?',
    answer: 'It is a record of attorneys who have rights to do certain/ all transactions involving a property on behalf of the owner (proprietor) of that property.',
    expanded: false
  },
  {
    question: 'What is registration of documents register?',
    answer: 'It is a record of interests & documents registered regarding a property.',
    expanded: false
  },
  {
    question: 'What is scope of search?',
    answer: 'It determines if only active entries or both active & inactive entries registered on a property are to be included in search results.',
    expanded: false
  },
  {
    question: 'Who are the actors?',
    answer: 'Recipients of the search results (maximum of 3 emails belonging to the recipients).',
    expanded: false
  },
  {
    question: 'What are the requirements?',
    answer: 'Registered Parcel number. Search details',
    expanded: false
  },
  {
    question: 'What are the charges?',
    answer: 'A charge of KSH.500 applies.',
    expanded: false
  }]

  private countyRegistryData: CountyRegistryData[] = [
    {
      county: 'Kajiado',
      registries: [
        'Kajiado Central',
        'Ngong',
      ]
    },
    {
      county: 'Baringo',
      registries: [
        'Kabarnet',
        'Eldama Ravine',
      ]
    },
    {
      county: 'Kisumu',
      registries: [
        'Kisumu East',
        'Nyando',
        'Seme'

      ]
    },
    {
      county: 'Nairobi',
      registries: [
        'Nairobi',
        'Central',
      ]
    },
    {
      county: 'Mombasa',
      registries: [
        'Mombasa Main',
        'Mombasa Island'
      ]
    },
  ]

  getFaqs(): Faqs[] {
    return this.faqData;
  }

  getCountyData(): CountyRegistryData[] {
    return this.countyRegistryData;
  }

  createSearchApplication(applicationData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/applications/create`, applicationData);
  }

  getPendingApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications?status=pending`);
  }

  // getApplications(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/applications`);
  // }

  getApplications(filteredStatus?: string): Observable<any> {
    const params: any = {};
    if (filteredStatus) {
      params.status = filteredStatus;
    }

    return this.http.get(`${this.apiUrl}/applications`, { params });
  }

  makePayment(applicationId: number, paymentData?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${applicationId}/pay`, paymentData);
  }

  downloadSearchResult(applicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificates/${applicationId}`);
  }

  getApplicationById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications/${id}`);
  }

  updateApplication(id: string, data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/applications/${id}/edit-returned`, data);
  }

  // verifyApplication(reference: string): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/applications/all`, {
  //     params: { reference }
  //   });
  // }

  verifyApplication(reference: string): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/applications/all`).pipe(
      map(applications => {
        // Log all completed applications
        const completedApps = applications.filter(app => app.status === 'completed');
        console.log('All Completed Applications:', completedApps);

        // Find the specific one by reference
        const found = completedApps.find(app =>
          app.reference_number === reference ||
          app.application_number === reference
        );
        // console.log('Searching for reference:', reference);
        return found || null;
      }),
      catchError(error => {
        console.error('Error fetching applications:', error);
        return of(null);
      })
    );
  }
}