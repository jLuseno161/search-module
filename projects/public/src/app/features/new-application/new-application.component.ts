import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { NgxLoadingModule } from 'ngx-loading';
import { MatTableDataSource } from '@angular/material/table';
import { CountyRegistryData, Document, Faqs, Parcel } from '../../interfaces/search';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { SearchService } from '../../services/search.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-application',
  standalone: true,
  host: {
    'ngSkipHydration': 'true'
  },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatOptionModule,
    NgxLoadingModule,
  ],
  templateUrl: './new-application.component.html',
  styleUrl: './new-application.component.scss'
})
export class NewApplicationComponent {
  searchForm: FormGroup;
  parcelsForm: FormGroup;
  documentsForm: FormGroup;

  //user
  currentUser: any;

  parcels: Parcel[] = [];
  documents: Document[] = [];
  nextParcelId = 1;
  nextDocumentId = 1;

  // MatTableDataSource
  parcelsDataSource = new MatTableDataSource<Parcel>([]);
  documentsDataSource = new MatTableDataSource<Document>([]);

  // FAQ data
  faqs: Faqs[] = [];

  // Registry data
  countyRegistryData: CountyRegistryData[] = [];
  counties: string[] = [];
  filteredRegistries: string[] = []; //filtered registries based on county

  // Table columns
  parcelColumns: string[] = ['no', 'parcel', 'action'];
  documentColumns: string[] = ['no', 'document', 'action'];

  constructor(private fb: FormBuilder, private searchService: SearchService, private router: Router, private authService: AuthService) {
    this.searchForm = this.fb.group({
      // search_type: ['PARCEL_SEARCH', Validators.required],
      purpose_of_search: ['', Validators.required],
      // search_scope: ['ACTIVE', Validators.required],
      registry: ['ACTIVE', Validators.required],
      county: ['ACTIVE', Validators.required],

    });

    this.parcelsForm = this.fb.group({
      parcel_number: ['', Validators.required],
    });

    this.documentsForm = this.fb.group({
      document_name: [''],
      file: [null]
    });
  }

  ngOnInit() {
    this.faqs = this.searchService.getFaqs()

    this.countyRegistryData = this.searchService.getCountyData()
    this.counties = this.countyRegistryData.map(item => item.county);

    // Watch for county changes to update registries
    this.searchForm.get('county')?.valueChanges.subscribe(selectedCounty => {
      this.onCountyChange(selectedCounty);
    });

    //get current user
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user
    }
  }

  get parcelNumberControl() {
    return this.parcelsForm.get('parcel_number');
  }

  get purposeOfSearchControl() {
    return this.searchForm.get('purpose_of_search');
  }

  addParcel() {
    const parcelNumber = this.parcelNumberControl?.value;
    if (parcelNumber) {
      const newParcel: Parcel = {
        id: this.nextParcelId++,
        parcel_number: parcelNumber
      };

      this.parcels.push(newParcel);
      this.parcelsDataSource.data = this.parcels;
      this.parcelNumberControl?.reset();
    }
  }

  removeParcel(id: number) {
    this.parcels = this.parcels.filter(parcel => parcel.id !== id);
    this.parcelsDataSource.data = this.parcels; // Update the data source
  }

  onCountyChange(selectedCounty: string | null) {
    if (selectedCounty) {
      // Find the county data and get its registries
      const countyData = this.countyRegistryData.find(item => item.county === selectedCounty);
      this.filteredRegistries = countyData ? countyData.registries : [];

      // Reset registry selection when county changes
      this.searchForm.patchValue({ registry: '' });

      // Enable registry dropdown
      this.searchForm.get('registry')?.enable();
    }
    else {
      this.filteredRegistries = [];
      this.searchForm.patchValue({ registry: '' });
      this.searchForm.get('registry')?.disable();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const documentName = this.documentsForm.get('document_name')?.value;

    if (file && documentName) {
      const newDocument: Document = {
        id: this.nextDocumentId++,
        name: documentName,
        file: file
      };

      this.documents.push(newDocument);
      this.documentsDataSource.data = this.documents;
      this.documentsForm.get('document_name')?.reset();
      event.target.value = '';
    }
  }

  removeDocument(id: number) {
    this.documents = this.documents.filter(doc => doc.id !== id)
    this.documentsDataSource.data = this.documents
  }

  // toggleFAQ(index: number) {
  //   this.faqs.forEach((faq, i) => {
  //     faq.expanded = i === index ? !faq.expanded : false;
  //   });
  // }

  getScopeDescription(scope: string): string {
    return scope === 'ACTIVE'
      ? 'Particulars of the subsisting entries in the register of the above-mentioned parcel'
      : 'Particulars noted on the Property section / Proprietorship section / Encumbrance section / Power of attorney register / Registered documents register';
  }

  submitApplication() {
    // Check if form is valid
    if (this.searchForm.valid && this.parcels.length > 0) {
      // Confirmation dialog
      Swal.fire({
        title: 'Are you sure?',
        text: 'Are you sure you want to submit your search application?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#8B4513',
        cancelButtonColor: '#aeb5bbff',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          // Clicked "Yes" - proceed with submission
          const formData = {
            ...this.searchForm.value,
            purpose: this.searchForm.value.purpose_of_search,
            parcel_number: this.parcels[0]?.parcel_number || '',
          };
          delete formData.purpose_of_search;

          this.searchService.createSearchApplication(formData).subscribe({
            next: (response: any) => {
              // Success message
              Swal.fire({
                title: 'Success!',
                text: 'Application submitted successfully!',
                icon: 'success',
                confirmButtonColor: '#8B4513'
              }).then(() => {
                console.log('Application Submitted Successfully', response);
                this.router.navigate(['/search-application']);
              });
            },
            error: (error: any) => {
              console.error('Application creation failed', error);
              // Error message
              Swal.fire({
                title: 'Error!',
                text: 'Submission failed. Please try again.',
                icon: 'error',
                confirmButtonColor: '#8B4513'
              });
            }
          });
        }
      });
    } else {
      console.log('Form not valid');
      Swal.fire({
        title: 'Incomplete Form',
        text: 'Please complete all required fields and add at least one parcel.',
        icon: 'warning',
        confirmButtonColor: '#8B4513'
      });
    }
  }
}
