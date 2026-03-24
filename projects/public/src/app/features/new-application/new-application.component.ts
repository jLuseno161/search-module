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
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-new-application',
  standalone: true,
  host: { 'ngSkipHydration': 'true' },
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
  @ViewChild('stepper') stepper!: MatStepper;

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

  //on Edit application
  isEditMode = false;
  applicationId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private searchService: SearchService,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {
    this.searchForm = this.fb.group({
      // search_type: ['PARCEL_SEARCH', Validators.required],
      purpose_of_search: ['', Validators.required],
      search_scope: ['ACTIVE', Validators.required],
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

    //check if application is in edit mode
    this.checkEditMode();
  }

  checkEditMode() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'edit') {
        this.isEditMode = true;
        this.applicationId = params['id'];

        const stateData =
          this.router.getCurrentNavigation()?.extras?.state?.['applicationData']
          || history.state.applicationData;

        console.log('STATE DATA:', stateData);

        if (stateData) {
          this.populateForm(stateData);
          // Wait for the view to render, then set the stepper to the second step (index 1)
          setTimeout(() => {
            if (this.stepper) {
              this.stepper.selectedIndex = 1;
            }
          });
        }
      }
    });
  }

  populateForm(data: any) {
    // 1. Patch search form fields
    this.searchForm.patchValue({
      county: data.county,
      registry: data.registry,
      purpose_of_search: data.purpose,
      search_scope: data.search_scope || 'ACTIVE',
    });

    // 2. Populate parcel table
    if (data.parcel_number) {
      this.parcels = [{
        id: 1,
        parcel_number: data.parcel_number
      }];
      this.parcelsDataSource.data = this.parcels;
      this.nextParcelId = 2;
    }

    // 3. Populate documents table
    if (data.ownership_document) {
      const docName = data.ownership_document.split('/').pop();
      this.documents = [{
        id: 1,
        name: docName,
        file: null,
        url: data.ownership_document // Store document URL for viewing

      }];
      this.documentsDataSource.data = this.documents;
      this.nextDocumentId = 2;
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

    //Rename doc with typed file name
    if (file && documentName) {
      const extension = file.name.split('.').pop();
      const renamedFile = new File([file], `${documentName}.${extension}`, { type: file.type });

      this.documents.push({
        id: this.nextDocumentId++,
        name: documentName,
        file: renamedFile
      });

      this.documentsDataSource.data = this.documents;
      this.documentsForm.get('document_name')?.reset();
      event.target.value = '';
    }
  }

  // viewDocument(document: Document) {
  //   if (document.file) {
  //     const fileURL = URL.createObjectURL(document.file);
  //     window.open(fileURL, '_blank');
  //   }
  // }
  viewDocument(document: Document) {
    if (document.file) {
      const fileURL = URL.createObjectURL(document.file);
      window.open(fileURL, '_blank');
    } else if (document.url) {
      window.open(document.url, '_blank');
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

      //check if in edit mode 
      const isEditMode = this.isEditMode;
      const title = isEditMode ? 'Resubmit Application?' : 'Are you sure?';
      const text = isEditMode
        ? 'Are you sure you want to resubmit this corrected application?'
        : 'Are you sure you want to submit your search application?';

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
          if (isEditMode) {
            this.updateApplication();
          } else {
            this.createApplication();
          }
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

  createApplication() {
    const applicationData = new FormData();

    applicationData.append('county', this.searchForm.value.county);
    applicationData.append('registry', this.searchForm.value.registry);
    applicationData.append('purpose', this.searchForm.value.purpose_of_search);
    applicationData.append('parcel_number', this.parcels[0]?.parcel_number || '');
    applicationData.append('search_scope', this.searchForm.value.search_scope);

    this.documents.forEach((doc) => {
      if (doc.file) {
        applicationData.append('ownership_document', doc.file, doc.file.name);
      }
    });

    this.searchService.createSearchApplication(applicationData).subscribe({
      next: (response: any) => {
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
        Swal.fire({
          title: 'Error!',
          text: 'Submission failed. Please try again.',
          icon: 'error',
          confirmButtonColor: '#8B4513'
        });
      }
    });
  }

  updateApplication() {
    const formData = new FormData();

    formData.append('county', this.searchForm.value.county);
    formData.append('registry', this.searchForm.value.registry);
    formData.append('purpose', this.searchForm.value.purpose_of_search);
    formData.append('parcel_number', this.parcels[0]?.parcel_number || '');
    formData.append('search_scope', this.searchForm.value.search_scope);
    formData.append('id', this.applicationId!);

    // Add only new documents (files that were uploaded)
    this.documents.forEach((doc) => {
      if (doc.file) {
        formData.append('ownership_document', doc.file, doc.file.name);
      }
    });

    this.searchService.updateApplication(this.applicationId!, formData).subscribe({
      next: (response: any) => {
        Swal.fire({
          title: 'Success!',
          text: 'Application updated and resubmitted successfully!',
          icon: 'success',
          confirmButtonColor: '#8B4513'
        }).then(() => {
          console.log('Application Updated Successfully', response);
          this.router.navigate(['/search-application']);
        });
      },
      error: (error: any) => {
        console.error('Application update failed', error);
        Swal.fire({
          title: 'Error!',
          text: 'Update failed. Please try again.',
          icon: 'error',
          confirmButtonColor: '#8B4513'
        });
      }
    });
  }
}