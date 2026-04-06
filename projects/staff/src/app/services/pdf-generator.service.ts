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

    // Get owners list - handle both array and single owner
    let ownersList: string[] = [];
    let proprietorText = 'Not specified';

    if (formData.owners && Array.isArray(formData.owners) && formData.owners.length > 0) {
      ownersList = formData.owners.filter((o: string) => o && o.trim());
      proprietorText = ownersList.length > 1 ? ownersList.join(' & ') : ownersList[0];
    } else if (formData.owner) {
      proprietorText = formData.owner;
      ownersList = [formData.owner];
    } else if (formData.proprietor) {
      proprietorText = formData.proprietor;
      ownersList = [formData.proprietor];
    }

    // Get holding type display text
    const holdingType = formData.holdingType || formData.folio || 'Not specified';
    const holdingTypeDisplay = this.getHoldingTypeDisplay(holdingType, ownersList.length);

    // ========== ADD COAT OF ARMS AT THE TOP ==========
    await this.addCoatOfArms(doc);

    // ========== HEADER TEXT ==========
    const coatOfArmsHeight = 30;
    const coatOfArmsY = 15;
    const textStartY = coatOfArmsY + coatOfArmsHeight + 5;

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
    doc.text(`Search No: ${formData.referenceNumber || 'N/A'}`, 20, textStartY + 30);
    doc.text(`Date: ${formData.searchDate || new Date().toISOString().split('T')[0]}`, 150, textStartY + 30);

    // Add county and registry info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`County: ${finalCounty}`, 20, textStartY + 38);
    doc.text(`Registry: ${finalRegistry}`, 150, textStartY + 38);

    // ========== APPLICANT DETAILS ==========
    autoTable(doc, {
      startY: textStartY + 50,
      head: [['APPLICANT INFORMATION', '']],
      body: [
        ['Name', formData.applicantName || ''],
        ['ID Number', formData.IdNumber || formData.applicantId || ''],
        ['Email', formData.applicantEmail || ''],
        ['Phone', formData.applicantPhone || '']
      ],
      theme: 'striped',
      headStyles: { fillColor: [97, 59, 25], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 20, right: 20 }
    });

    // ========== PROPERTY DETAILS ==========
    const propertyDetailsBody = [
      ['Title Number', formData.parcelNumber || ''],
      ['Registered Proprietor(s)', proprietorText],
      ['Land Size', formData.landSize ? `${formData.landSize} Ha` : 'Not specified'],
      ['Holding Type / Tenure', holdingTypeDisplay],
      ['Rent Amount', formData.rent || 'Not specified'],
      ['Term', formData.term || 'Not specified'],
      ['Nature of Title', formData.nature_of_title || 'Not specified']
    ];

    // If there are multiple owners, add a row showing all owners
    if (ownersList.length > 1) {
      propertyDetailsBody.splice(2, 0, ['All Owners', ownersList.join(', ')]);
    }

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['PROPERTY DETAILS', '']],
      body: propertyDetailsBody,
      theme: 'striped',
      headStyles: { fillColor: [97, 59, 25], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 20, right: 20 }
    });

    // ========== ENCUMBRANCES SECTION ==========
    const encumbrancesBody: Array<[string, string]> = [];

    // Helper function to split long text into multiple rows
    const addEncumbranceRows = (label: string, text: string | undefined | null, rows: Array<[string, string]>): void => {
      if (!text || !text.trim()) return;

      const maxCharsPerLine = 80;
      const trimmedText = text.trim();

      if (trimmedText.length <= maxCharsPerLine) {
        rows.push([label, trimmedText]);
      } else {
        const words = trimmedText.split(' ');
        let currentLine = '';
        let isFirstRow = true;

        words.forEach((word) => {
          const testLine = currentLine ? currentLine + ' ' + word : word;

          if (testLine.length <= maxCharsPerLine) {
            currentLine = testLine;
          } else {
            rows.push([isFirstRow ? label : '', currentLine]);
            currentLine = word;
            isFirstRow = false;
          }
        });

        if (currentLine) {
          rows.push(['', currentLine]);
        }
      }
    };

    // Add inhibitions
    addEncumbranceRows('Inhibitions/Cautions/Restrictions', formData.inhibitions, encumbrancesBody);

    // Add remarks
    addEncumbranceRows('Remarks/Encumbrances', formData.remarks, encumbrancesBody);

    // If nothing was added, show "None"
    if (encumbrancesBody.length === 0) {
      encumbrancesBody.push(['Remarks', 'None recorded']);
    }

    // Check if we need a new page for encumbrances
    const encumbrancesStartY = (doc as any).lastAutoTable.finalY + 10;
    if (encumbrancesStartY > pageHeight - 80) {
      doc.addPage();
      await this.addHeaderToNewPage(doc, formData, finalRegistry, finalCounty);
      (doc as any).lastAutoTable = { finalY: 30 };
    }

    // Add the encumbrances table with consistent styling
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['ENCUMBRANCES & RESTRICTIONS', '']],
      body: encumbrancesBody,
      theme: 'striped',
      headStyles: {
        fillColor: [97, 59, 25],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'top'
      },
      columnStyles: {
        0: {
          cellWidth: 45,
          fontStyle: 'bold',
          valign: 'top'
        },
        1: {
          cellWidth: 'auto',
          valign: 'top'
        }
      },
      margin: { left: 20, right: 20 }
    });

    // ========== SIGNATURE SECTION (ONLY ONE) ==========
   // ========== SIGNATURE SECTION (ONLY ONE) ==========
let signatureY = (doc as any).lastAutoTable?.finalY + 20 || 200;

if (signatureY > pageHeight - 60) {
  doc.addPage();
  signatureY = 40;
  await this.addHeaderToNewPage(doc, formData, finalRegistry, finalCounty);
}

const leftSignatureX = 20;
const signatureWidth = 70;

// Signature line
doc.setDrawColor(0, 0, 0);
doc.line(leftSignatureX, signatureY, leftSignatureX + signatureWidth, signatureY);

// Signature label
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text('Registrar\'s Signature', leftSignatureX, signatureY - 5);

// Signature content - EITHER actual signature OR placeholder, NOT BOTH
if (formData.signature && formData.signature !== '[Signature will appear here]') {
  try {
    if (formData.signature.startsWith('data:image')) {
      doc.addImage(formData.signature, 'PNG', leftSignatureX, signatureY - 20, 60, 15);
      console.log('✅ Signature image added to PDF');
    } else {
      doc.text(formData.signature, leftSignatureX, signatureY - 5);
      console.log('✅ Signature text added to PDF');
    }
  } catch (error) {
    console.error('Error adding signature to PDF:', error);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('[Signature failed to load]', leftSignatureX, signatureY - 5);
  }
} else {
  // Only show placeholder when there's NO signature
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('[Signature will appear here]', leftSignatureX, signatureY - 5);
}

// Registrar name and title
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text(registrarName, leftSignatureX, signatureY + 5);
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('Land Registrar', leftSignatureX, signatureY + 12);

    // ========== VERIFICATION & FOOTER ==========
    const verificationY = signatureY + 50;

    // Check if we need a new page for verification
    let finalVerificationY = verificationY;
    if (finalVerificationY > pageHeight - 30) {
      doc.addPage();
      finalVerificationY = 30;
      await this.addHeaderToNewPage(doc, formData, finalRegistry, finalCounty);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('VERIFICATION:', 20, finalVerificationY);
    doc.text(`Use reference number: ${formData.referenceNumber || 'N/A'}`, 20, finalVerificationY + 7);

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleString()} | This is a computer generated document | Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    return doc;
  }

  /**
   * Add header to new pages
   */
  private async addHeaderToNewPage(doc: jsPDF, formData: any, registry?: string, county?: string): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add small coat of arms for subsequent pages
    try {
      const coatOfArmsBlob = await firstValueFrom(
        this.http.get('assets/images/Coat_of_arms_of_Kenya__Official.png', {
          responseType: 'blob'
        })
      );
      const coatOfArmsBase64 = await this.blobToBase64(coatOfArmsBlob);
      const imageWidth = 20;
      const imageHeight = 13;
      const x = (pageWidth - imageWidth) / 2;
      doc.addImage(coatOfArmsBase64, 'WEBP', x, 10, imageWidth, imageHeight);
    } catch (error) {
      console.error('Failed to load Coat of Arms for header:', error);
    }

    // Add header text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(97, 59, 25);
    doc.text('CERTIFICATE OF SEARCH (CONTINUED)', pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Search No: ${formData.referenceNumber || 'N/A'}`, 20, 35);
    doc.text(`Date: ${formData.searchDate || new Date().toISOString().split('T')[0]}`, 150, 35);

    if (registry || county) {
      doc.text(`County: ${county || 'N/A'} | Registry: ${registry || 'N/A'}`, pageWidth / 2, 42, { align: 'center' });
    }
  }

  /**
   * Get formatted holding type display text
   */
  private getHoldingTypeDisplay(holdingType: string, ownerCount: number): string {
    const holdingTypeMap: { [key: string]: string } = {
      'Sole Ownership': 'Sole Ownership',
      'Joint Tenancy': 'Joint Tenancy',
      'Tenancy in Common': 'Tenancy in Common',
      'Company/Corporate Ownership': 'Corporate Ownership',
      'Trust Ownership': 'Trust Ownership',
      'Cooperative Society': 'Cooperative Society',
      'Government/Public Land': 'Government Land',
      'Leasehold': 'Leasehold',
      'Freehold': 'Freehold'
    };

    let displayText = holdingTypeMap[holdingType] || holdingType || 'Not specified';

    if (ownerCount > 1 && holdingType === 'Sole Ownership') {
      displayText = 'Joint Ownership';
    }

    return displayText;
  }

  /**
   * Add Kenyan Coat of Arms at the top of the document
   */
  private async addCoatOfArms(doc: jsPDF): Promise<void> {
    try {
      const coatOfArmsBlob = await firstValueFrom(
        this.http.get('assets/images/Coat_of_arms_of_Kenya__Official.png', {
          responseType: 'blob'
        })
      );

      const coatOfArmsBase64 = await this.blobToBase64(coatOfArmsBlob);
      const pageWidth = doc.internal.pageSize.getWidth();
      const imageWidth = 30;
      const imageHeight = 20;
      const x = (pageWidth - imageWidth) / 2;
      const y = 15;

      doc.addImage(coatOfArmsBase64, 'WEBP', x, y, imageWidth, imageHeight);
      console.log('✅ Coat of Arms added to PDF');

    } catch (error) {
      console.error('Failed to load Coat of Arms:', error);
    }
  }

  /**
   * Add Ardhisasa logo to replace the seal area
   */
  // private async addArdhisasaLogo(doc: jsPDF, signatureY: number): Promise<void> {
  //   try {
  //     const logoBlob = await firstValueFrom(
  //       this.http.get('assets/images/logo.png', { responseType: 'blob' })
  //     );

  //     const logoBase64 = await this.blobToBase64(logoBlob);
  //     doc.addImage(logoBase64, 'PNG', 20, signatureY - 15, 45, 28);

  //     doc.setFontSize(7);
  //     doc.setTextColor(97, 59, 25);
  //     doc.text('Ardhisasa', 28, signatureY + 16);

  //     console.log('✅ Ardhisasa logo added successfully');

  //   } catch (error) {
  //     console.error('Failed to load Ardhisasa logo:', error);
  //     this.addFallbackSeal(doc, signatureY);
  //   }
  // }

  /**
   * Fallback to original official seal if logo fails to load
   */
  // private addFallbackSeal(doc: jsPDF, signatureY: number): void {
  //   doc.setLineWidth(0.5);
  //   doc.setDrawColor(200, 200, 200);
  //   doc.roundedRect(20, signatureY - 10, 40, 40, 3, 3);
  //   doc.setFontSize(8);
  //   doc.setTextColor(150, 150, 150);
  //   doc.text('OFFICIAL', 25, signatureY + 5);
  //   doc.text('SEAL', 30, signatureY + 12);
  //   console.log('⚠️ Using fallback official seal');
  // }

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
