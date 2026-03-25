// // In pdf-generator.service.ts
// import { Injectable } from '@angular/core';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// @Injectable({
//   providedIn: 'root'
// })
// export class PdfGeneratorService {

//   async generateSearchCertificate(formData: any, registrarName: string = 'Registrar', registry?: string, county?: string): Promise<jsPDF> {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Get values from parameters or formData
//     const finalRegistry = registry || formData.registry || 'Default Registry';
//     const finalCounty = county || formData.county || 'Not specified';

//     // NO QR CODE GENERATION HERE - Remove all QR code code
//     doc.setFontSize(16);
//     doc.setTextColor(0, 0, 0);
//     doc.setFont('helvetica', 'bold');
//     doc.text('REPUBLIC OF KENYA', pageWidth / 2, 20, { align: 'center' });

//     doc.setFontSize(12);
//     doc.text('LAND REGISTRATION ACT (CAP 300)', pageWidth/2, 30, { align: 'center' });
//     doc.text('SECTION 38 - CERTIFICATE OF SEARCH', pageWidth/2, 37, { align: 'center' });

//     // Reference and Date
//     doc.setFontSize(10);
//     doc.setTextColor(100, 100, 100);
//     doc.text(`Search No: ${formData.referenceNumber}`, 20, 50);
//     doc.text(`Date: ${formData.searchDate}`, 150, 50);

//     // Add county and registry info
//     doc.setFontSize(10);
//     doc.setTextColor(100, 100, 100);
//     doc.text(`County: ${finalCounty}`, 20, 58);
//     doc.text(`Registry: ${finalRegistry}`, 150, 58);

//     // Applicant Details
//     autoTable(doc, {
//       startY: 70,
//       head: [['APPLICANT INFORMATION', '']],
//       body: [
//         ['Name', formData.applicantName || ''],
//         ['ID Number', formData.IdNumber || ''],
//         ['Email', formData.applicantEmail || ''],
//         ['Phone', formData.applicantPhone || '']
//       ],
//       theme: 'striped',
//       headStyles: { fillColor: [97, 59, 25], textColor: 255 },
//       styles: { fontSize: 10 }
//     });

//     // Property Details - Add county to property details
//     autoTable(doc, {
//       startY: (doc as any).lastAutoTable.finalY + 10,
//       head: [['PROPERTY DETAILS', '']],
//       body: [
//         ['Title Number', formData.parcelNumber || ''],
//         ['Registered Owner', formData.owner || 'Not specified'],
//         ['Land Size', formData.landSize || 'Not specified'],
//         ['Holding Type', formData.folio || 'Not specified'],
//         ['Rent Amount', formData.rent || 'Not specified'],
//         ['Term', formData.term || 'Not specified']
//       ],
//       theme: 'striped',
//       headStyles: { fillColor: [97, 59, 25], textColor: 255 },
//       styles: { fontSize: 10 }
//     });

//     // Encumbrances Section
//     if (formData.remarks || formData.inhibitions) {
//       autoTable(doc, {
//         startY: (doc as any).lastAutoTable.finalY + 10,
//         head: [['ENCUMBRANCES & RESTRICTIONS']],
//         body: [
//           [formData.remarks || 'None'],
//           [formData.inhibitions || 'No inhibitions recorded']
//         ],
//         theme: 'striped',
//         headStyles: { fillColor: [97, 59, 25], textColor: 255 },
//         styles: { fontSize: 10 }
//       });
//     }

//     // SIGNATURE SECTION
//     const signatureY = (doc as any).lastAutoTable?.finalY + 20 || 200;

//     // Add signature line
//     doc.setDrawColor(0, 0, 0);
//     doc.line(120, signatureY, 190, signatureY);

//     // Add signature text
//     doc.setFontSize(10);
//     doc.setTextColor(0, 0, 0);
//     doc.text('Registrar\'s Signature', 120, signatureY - 5);

//     // Add the actual signature if it exists
//     if (formData.signature) {
//       try {
//         if (formData.signature.startsWith('data:image')) {
//           doc.addImage(formData.signature, 'PNG', 120, signatureY - 20, 60, 15);
//         } else {
//           doc.text(formData.signature, 120, signatureY - 5);
//         }
//         console.log('✅ Signature added to PDF');
//       } catch (error) {
//         console.error('Error adding signature to PDF:', error);
//         doc.setFontSize(8);
//         doc.setTextColor(150, 150, 150);
//         doc.text('[Signature provided]', 120, signatureY - 5);
//       }
//     } else {
//       doc.setFontSize(8);
//       doc.setTextColor(150, 150, 150);
//       doc.text('[Signature will appear here]', 120, signatureY - 5);
//     }

//     // Registrar name and title
//     doc.setFontSize(10);
//     doc.setTextColor(0, 0, 0);
//     doc.text(registrarName, 120, signatureY + 5);

//     // Display registry and county on separate lines
//     doc.setFontSize(8);
//     doc.setTextColor(100, 100, 100);
//     doc.text(finalRegistry, 120, signatureY + 12);
//     doc.text(finalCounty, 120, signatureY + 19);  // ✅ Now on separate line

//     // SEAL/STAMP AREA

//     // VERIFICATION SECTION
//     const verificationY = signatureY + 35;  // Adjusted for extra line

//     doc.setFontSize(8);
//     doc.setTextColor(100, 100, 100);
//     doc.text('VERIFICATION:', 20, verificationY);
//     doc.text(`Verify certificate using reference number: ${formData.referenceNumber}`, 20, verificationY + 7);


//     // Footer
//     doc.setFontSize(8);
//     doc.setTextColor(150, 150, 150);
//     doc.text(
//       `Generated on ${new Date().toLocaleString()} | This is a computer generated document`,
//       pageWidth/2,
//       pageHeight - 5,
//       { align: 'center' }
//     );

//     return doc;
//   }
// }

// pdf-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor(private http: HttpClient) {}

  async generateSearchCertificate(formData: any, registrarName: string = 'Registrar', registry?: string, county?: string): Promise<jsPDF> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Get values from parameters or formData
    const finalRegistry = registry || formData.registry || 'Default Registry';
    const finalCounty = county || formData.county || 'Not specified';

    // ========== ADD COAT OF ARMS AT THE TOP ==========
    await this.addCoatOfArms(doc);

    // ========== HEADER TEXT ==========
    const coatOfArmsHeight = 30; // Height of coat of arms in mm
    const coatOfArmsY = 15; // Y position of coat of arms
    const textStartY = coatOfArmsY + coatOfArmsHeight + 5; // 5mm gap after coat of arms

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLIC OF KENYA', pageWidth / 2, textStartY, { align: 'center' });

    doc.setFontSize(12);
    doc.text('LAND REGISTRATION ACT (CAP 300)', pageWidth/2, textStartY + 10, { align: 'center' });
    doc.text('SECTION 38 - CERTIFICATE OF SEARCH', pageWidth/2, textStartY + 17, { align: 'center' });

    // Reference and Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Search No: ${formData.referenceNumber}`, 20, textStartY + 30);
    doc.text(`Date: ${formData.searchDate}`, 150, textStartY + 30);

    // Add county and registry info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`County: ${finalCounty}`, 20, textStartY + 38);
    doc.text(`Registry: ${finalRegistry}`, 150, textStartY + 38);


    // Applicant Details
    autoTable(doc, {
      startY: textStartY + 50,
      head: [['APPLICANT INFORMATION', '']],
      body: [
        ['Name', formData.applicantName || ''],
        ['ID Number', formData.IdNumber || ''],
        ['Email', formData.applicantEmail || ''],
        ['Phone', formData.applicantPhone || '']
      ],
      theme: 'striped',
      headStyles: { fillColor: [97, 59, 25], textColor: 255 },
      styles: { fontSize: 10 }
    });

    // Property Details
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['PROPERTY DETAILS', '']],
      body: [
        ['Title Number', formData.parcelNumber || ''],
        ['Registered Owner', formData.owner || 'Not specified'],
        ['Land Size', formData.landSize ? `${formData.landSize} Ha` : 'Not specified'],
        // ['Land Size', formData.landSize || 'Not specified'],
        ['Holding Type', formData.folio || 'Not specified'],
        ['Rent Amount', formData.rent || 'Not specified'],
        ['Term', formData.term || 'Not specified']
      ],
      theme: 'striped',
      headStyles: { fillColor: [97, 59, 25], textColor: 255 },
      styles: { fontSize: 10 }
    });

    // Encumbrances Section
    if (formData.remarks || formData.inhibitions) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['ENCUMBRANCES & RESTRICTIONS']],
        body: [
          [formData.remarks || 'None'],
          [formData.inhibitions || 'No inhibitions recorded']
        ],
        theme: 'striped',
        headStyles: { fillColor: [97, 59, 25], textColor: 255 },
        styles: { fontSize: 10 }
      });
    }

   // SIGNATURE SECTION - LEFT ALIGNED
const signatureY = (doc as any).lastAutoTable?.finalY + 20 || 200;

// Left position for signature block
const leftSignatureX = 20;
const signatureWidth = 70;

// Add signature line
doc.setDrawColor(0, 0, 0);
doc.line(leftSignatureX, signatureY, leftSignatureX + signatureWidth, signatureY);

// Add signature text
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text('Registrar\'s Signature', leftSignatureX, signatureY - 5);

// Add the actual signature if it exists
if (formData.signature) {
  try {
    if (formData.signature.startsWith('data:image')) {
      doc.addImage(formData.signature, 'PNG', leftSignatureX, signatureY - 20, 60, 15);
    } else {
      doc.text(formData.signature, leftSignatureX, signatureY - 5);
    }
    console.log('✅ Signature added to PDF');
  } catch (error) {
    console.error('Error adding signature to PDF:', error);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('[Signature provided]', leftSignatureX, signatureY - 5);
  }
} else {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('[Signature will appear here]', leftSignatureX, signatureY - 5);
}

// Registrar name and title
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text(registrarName, leftSignatureX, signatureY + 5);

// Display registry and county on separate lines
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('Land Registrar', leftSignatureX, signatureY + 12);
    // ========== ADD ARDHISASA LOGO (REPLACES SEAL) ==========
    //  await this.addArdhisasaLogo(doc, signatureY);

    // VERIFICATION SECTION
    const verificationY = signatureY + 50;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('VERIFICATION:', 20, verificationY);
    doc.text(`Use reference number: ${formData.referenceNumber}`, 20, verificationY + 7);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | This is a computer generated document`,
      pageWidth/2,
      pageHeight - 5,
      { align: 'center' }
    );

    return doc;
  }

  /**
   * Add Kenyan Coat of Arms at the top of the document
   */
  private async addCoatOfArms(doc: jsPDF): Promise<void> {
    try {
      // Load coat of arms from assets folder
      const coatOfArmsBlob = await firstValueFrom(
        this.http.get('assets/images/Coat_of_arms_of_Kenya__Official.png', {
          responseType: 'blob'
        })
      );

      const coatOfArmsBase64 = await this.blobToBase64(coatOfArmsBlob);

      // Add coat of arms (centered, small size)
      const pageWidth = doc.internal.pageSize.getWidth();
      const imageWidth = 30; // mm
      const imageHeight = 20; // mm
      const x = (pageWidth - imageWidth) / 2; // Center horizontally
      const y = 15; // Position from top

      doc.addImage(coatOfArmsBase64, 'WEBP', x, y, imageWidth, imageHeight);

      console.log('✅ Coat of Arms added to PDF');

    } catch (error) {
      console.error('Failed to load Coat of Arms:', error);
      // No fallback needed, just continue without the image
    }
  }

  /**
   * Add Ardhisasa logo to replace the seal area
   */
  private async addArdhisasaLogo(doc: jsPDF, signatureY: number): Promise<void> {
    try {
      // Load logo from assets folder
      const logoBlob = await firstValueFrom(
        this.http.get('assets/images/logo.png', { responseType: 'blob' })
      );

      const logoBase64 = await this.blobToBase64(logoBlob);

      // Add the logo (position and size optimized for seal replacement)
      // x: 20 (left margin), y: signatureY - 15 (position relative to signature)
      // width: 45mm, height: 28mm (maintains aspect ratio)
      doc.addImage(logoBase64, 'PNG', 20, signatureY - 15, 45, 28);

      // Add "Ardhisasa" text below the logo
      doc.setFontSize(7);
      doc.setTextColor(97, 59, 25); // #613B19 brown
      doc.text('Ardhisasa', 28, signatureY + 16);

      console.log('✅ Ardhisasa logo added successfully');

    } catch (error) {
      console.error('Failed to load Ardhisasa logo:', error);
      // Fallback to original seal if logo fails to load
      this.addFallbackSeal(doc, signatureY);
    }
  }

  /**
   * Fallback to original official seal if logo fails to load
   */
  private addFallbackSeal(doc: jsPDF, signatureY: number): void {
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(20, signatureY - 10, 40, 40, 3, 3);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('OFFICIAL', 25, signatureY + 5);
    doc.text('SEAL', 30, signatureY + 12);
    console.log('⚠️ Using fallback official seal');
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
