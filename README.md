# systemclearport
# React Firebase App

This project is a React application that connects to Firebase and provides user authentication, data management, and document generation functionalities. 

## Features

- User authentication with Firebase
- Home page for logged-in users
- Portal for creating, importing, and exporting data
- Download outcomes as PDF or Word documents using templates

## Project Structure

```
react-firebase-app
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── Auth
│   │   │   └── LoginPage.tsx
│   │   ├── Home
│   │   │   └── HomePage.tsx
│   │   ├── Portal
│   │   │   ├── PortalPage.tsx
│   │   │   ├── CreateDataForm.tsx
│   │   │   ├── ImportData.tsx
│   │   │   ├── ExportData.tsx
│   │   │   └── OutcomeDetails.tsx
│   │   └── templates
│   │       ├── PdfTemplate.tsx
│   │       └── WordTemplate.tsx
│   ├── firebase
│   │   └── config.ts
│   ├── utils
│   │   ├── pdfGenerator.ts
│   │   └── wordGenerator.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── types
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd react-firebase-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Set up Firebase:
   - Create a Firebase project in the Firebase console.
   - Add your Firebase configuration in `src/firebase/config.ts`.

5. Start the development server:
   ```
   npm start
   ```

## Usage

- Navigate to the login page to authenticate users.
- Once logged in, users can access the home page and the portal for data management.
- Users can create new data entries, import data, and export data in PDF or Word formats.
- Download outcomes using the provided templates.

## License

This project is licensed under the MIT License.
