import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CountyRegistryData, Faqs, Search } from '../interfaces/search';
import { environment } from '../../environments/environment';

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
      county: 'Nairobi',
      registries: [
        'Nairobi Central Registry',
        'Nairobi West Registry',
        'Nairobi South Registry'
      ]
    },
    {
      county: 'Mombasa',
      registries: [
        'Mombasa Main Registry',
        'Mombasa Island Registry'
      ]
    },
    {
      county: 'Kisumu',
      registries: [
        'Kisumu Central Registry',
        'Kisumu Lake Registry'
      ]
    },
    {
      county: 'Nakuru',
      registries: [
        'Nakuru Town Registry',
        'Naivasha Registry',
        'Molo Registry'
      ]
    },
    {
      county: 'Eldoret',
      registries: [
        'Eldoret Main Registry'
      ]
    },
    {
      county: 'Thika',
      registries: [
        'Thika Registry'
      ]
    },
    {
      county: 'Kitale',
      registries: [
        'Kitale Registry'
      ]
    },
    {
      county: 'Malindi',
      registries: [
        'Malindi Registry'
      ]
    },
    {
      county: 'Garissa',
      registries: [
        'Garissa Registry'
      ]
    },
    {
      county: 'Kisii',
      registries: [
        'Kisii Registry'
      ]
    }
  ]

  getFaqs(): Faqs[] {
    return this.faqData;
  }

  getCountyData(): CountyRegistryData[] {
    return this.countyRegistryData;
  }

  createSearchApplication(applicationData: Search): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/applications/create`, applicationData);
  }

  getApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications`);
  }

  makePayment(applicationId: number, paymentData?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${applicationId}/pay`, paymentData);
  }

  downloadSearchResult(applicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificates/${applicationId}`);
  }
}