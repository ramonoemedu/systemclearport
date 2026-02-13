import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/Auth/RequireAuth';
import LoginPage from './components/Auth/LoginPage';
import HomePage from './components/Home/HomePage';
import UserPage from './components/Users/UserPage';
import EmployeeDataFormContainer from './components/EmployeeDataForm/EmployeeDataFormContainer';
import ReportPage from './components/Report/report';
import FormWordPage from './components/FormWord/FormWordPage';
import ChinaCustomsForm from './components/ChinaCustomsForm/ChinaCustomsForm';
import ImageNameExtractor from './components/ImageNameExtractor/ImageNameExtractor';
import CvConverter from './components/CvConverter/CvConverter';
import PdfConverterPage from './components/PdfConverter/PdfConverterPage';


export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/home" element={<HomePage />}>
          <Route path="users" element={<UserPage />} />
          <Route path="employeedataform" element={<EmployeeDataFormContainer />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="formword" element={<FormWordPage />} />
          <Route path="name-extractor" element={<ImageNameExtractor />} />
          <Route path="cv-converter" element={<CvConverter />} />
          <Route path="pdf-converter" element={<PdfConverterPage />} />
          <Route path="customs-form/:id" element={<ChinaCustomsForm />} /> {/* Fix: remove leading slash */}
          {/* Add more nested routes here */}
        </Route>
      </Route>
    </Routes>
  );
}