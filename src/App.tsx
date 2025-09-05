import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import HomePage from './components/Home/HomePage';
import UserPage from './components/Users/UserPage';
import EmployeeDataFormContainer from './components/EmployeeDataForm/EmployeeDataFormContainer';
import ReportPage from './components/Report/report';
import FormWordPage from './components/FormWord/FormWordPage';


export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />}>
        <Route path="users" element={<UserPage />} />
        <Route path="employeedataform" element={<EmployeeDataFormContainer />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="formword" element={<FormWordPage />} />

        {/* Add more nested routes here */}
      </Route>
    </Routes>
  );
}