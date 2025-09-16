import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDocumentData } from './ChinaCustomsFormData';
import './ChinaCustomsForm.css';

interface FormData {
  invoice: string;
  blNumber: string;
  coNumber: string;
  packingList: string;
  units: string;
  weight: string;
  fobValue: string;
  vatNumber: string;
}

const ChinaCustomsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    invoice: '',
    blNumber: '',
    coNumber: '',
    packingList: '',
    units: '',
    weight: '',
    fobValue: '',
    vatNumber: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) {
          setError('No document ID provided');
          setLoading(false);
          return;
        }

        const data = await fetchDocumentData(id);
        if (data) {
          setFormData({
            invoice: data["Inv"] || '',
            blNumber: data["B/L No"] || '',
            coNumber: data["CO"] || '02251072600000246',
            packingList: data["PKL"] || 'SMIL202507082324-P-C',
            units: data["Quantity"] || '12 UNITS',
            weight: data["GW"] || '19,860 KGS',
            fobValue: data["FOB"] || '1,343,736 CNY',
            vatNumber: data["VAT"] || ''
          });
        }
      } catch (err) {
        console.error("Error loading document data:", err);
        setError('Failed to load document data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading document data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="china-customs-form">
      {/* Print button */}
      <div className="print-controls">
        <button onClick={() => window.print()}>Print Document</button>
      </div>

      {/* The form content */}
      <div className="document-container">
        <div className="header">
          <h1 className="company-name">...........MOTORS (CAMBODIA) CO., LTD</h1>
          <p className="company-address">
            NO. …................................................., CAMBODIA<br />
            VAT: {formData.vatNumber}, TEL: +…........................
          </p>
        </div>

        <div className="document-number">
          <p>លេខៈ <span className="accent-text">TF/25174CO</span></p>
        </div>

        <div className="recipient">
          <p className="recipient-title">សូមគោរពជូន<br />
            ឯកឧត្តមរដ្ឋមន្ត្រីប្រតិភូអមនាយករដ្ឋមន្រ្តី<br />
            អគ្គនាយកនៃអគ្គនាយកដ្ឋានគយ និងរដ្ឋាករកម្ពុជា<br />
          </p>
        </div>

        <div className="subject-section">
          <p><strong>កម្មវត្ថុ៖</strong> សំណើសុំការអនុញ្ញាតនាំចូលទំនិញពីប្រទេសចិនដោយបង់ពន្ឋតាមអត្រាពន្ឋអនុគ្រោះក្រោមកិច្ចព្រមព្រៀងពាណិជ្ជកម្មសេរីអាស៊ាន-ចិន (ACFTA)។</p>
        </div>

        <div className="reference-section">
          <p><strong>យោង៖</strong> - អនុក្រឹត្យលេខ ៣៧ អនក្រ.បកចុះថៃ្ងទី ០៦ ខែ មិនា ឆ្នាំ ២០១៩ ។</p>
          <p>- លិខិតលេខ ០៧៧៩/២០ អគរ ចុះថ្ងៃទី ១៩ ខែ មិនា ឆ្នា ២០២០ របស់អគ្គនាយកដ្ឋានគយ និងរដ្ឋាករកម្ពុជា ។</p>
          <p>- CERTIFICATE OF ORIGINAL No: <span className="accent-text">{formData.coNumber}</span> ចុះ ថ្ងៃទី ០៥ ខែ សីហា ឆ្នាំ​ ២០២៥</p>
          <p>- INVOICE No: <span className="accent-text">{formData.invoice}</span> ចុះ ថ្ងៃទី ២១ ខែ កក្កដា ឆ្នាំ​ ២០២៥</p>
          <p>- PACKING LIST No: <span className="accent-text">{formData.packingList}</span> ចុះ ថ្ងៃទី 21 ខែ កក្កដា ឆ្នាំ​ ២០២៥</p>
          <p>- B/L No: <span className="accent-text">{formData.blNumber}</span> ចុះ ថ្ងៃទី ២៣ ខែ កក្កដា ឆ្នាំ​ ២០២៥</p>
          <p>- VAT No: <span className="accent-text">{formData.vatNumber}</span> ចុះ ថៃ្ងទី ២២ ខែ មករា ឆ្នាំ ២០១៦</p>
        </div>

        <div className="body-text">
          <p>តបតាមកម្មវត្ថុ និងយោងខាងលើ ខ្ញុំបាទតំណាងអោយក្រុមហ៊ុន<span className="accent-text">..............MOTORS (CAMBODIA) CO., LTD</span>សូមគោរពស្នើសុំឯកឧត្តមរដ្ឋមន្ត្រីប្រតិភូមេត្តាអនុញ្ញាតិអោយអនុវត្តអត្រាពន្ឋអនុគ្រោះក្រោមកិច្ចព្រមព្រៀងពាណិជ្ជកម្មសេរីអាស៊ាន-ចិន (ACFTA-CO FORM E) ដូចយោងខាងលើចំពោះការនាំចូល:</p>
          <p>- មុខទំនិញរថយន្តថ្មី ដូចមានលំអិតក្នុងតារាងភ្ជាប់ជាមួយ</p>
          <p>- សរុបចំនួន <span className="accent-text">{formData.units}</span> ទម្ងន់សរុប <span className="accent-text">{formData.weight}</span> តម្លៃសរុប <span className="accent-text">FOB: {formData.fobValue}</span></p>
          <p>- ផលិតនៅប្រទេសចិននាំចូលមកកម្ពុជាតាម <span className="accent-text">មាត់ច្រកកំពង់ផែអន្តរជាតិភ្នំពេញ (បញ្ចេញទំនិញនៅមាត់ច្រកភណ្ឌាគារគយមានដែនកំណត់សុវណ្ណភូមិ)</span></p>
        </div>

        <div className="declaration">
          <p>ខ្ញុំបាទសូមធានាអះអាងថារាល់ការប្រកាសនិងឯកសារគាំទ្រខាងលើសុទ្ធសឹងជាពត៌មាននិងជាឯកសារត្រឹមត្រូវនិងពិតប្រាកដ។ក្នុងករណីរកឃើញថាពត៌មាននិងឯកសារទាំងនេះមានការក្លែងបន្លំខុសពីការពិតខ្ញុំបាទតំណាងអោយក្រុមហ៊ុន<span className="accent-text">..................MOTORS (CAMBODIA) CO., LTD</span> សូមទទួលពិន័យនិងទោសទណ្ឌផ្សេងទៀតតាមបញ្ញត្តិច្បាប់ជាធរមាន។</p>
          <p>អាស្រ័យដូចបានជំរាបជូនខាងលើសូមឯកឧត្តមរដ្ឋមន្ត្រីប្រតិភូមេត្តាពិនិត្យនិងសំរេចដោយក្តីអនុគ្រោះ ។</p>
          <p>សូមឯកឧត្តមរដ្ឋមន្ត្រីប្រតិភូមេត្តាទទួលនូវការគោរពដ៏ខ្ពង់ខ្ពស់បំផុតអំពីខ្ញុំបាទ។</p>
        </div>

       <div className="signature-section">
  <p className="date-line">
    រាជធានីភ្នំពេញ ថ្ងៃ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    ខែ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    ឆ្នាំ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;​ ព.ស២៥៦
  </p>
  <p className="date-line">
    ត្រូវនឹងថ្ងៃទី&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    ខែ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    ឆ្នាំ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  </p>
  <p className="signature-title">ជ.ប្រធានក្រុមហ៊ុន</p>
  <p className="signature-title">ហត្ថលេខា​ និងត្រា</p>
  <p className="signature-name">.........................................</p>
</div>
      </div>
    </div>
  );
};

export default ChinaCustomsForm;