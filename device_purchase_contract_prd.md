# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Device Purchase Contract Management System  
**Type:** Internal business web application  
**Purpose:** Digitize the process of buying used electronic devices from customers by collecting customer data, device details, photos, signatures, and confirmations; generating a PDF purchase contract; saving all records; and enabling fast search and retrieval.

This product is intended for shops and businesses that purchase used phones, tablets, laptops, desktops, smartwatches, gaming consoles, and other electronics.

---

## 2. Problem Statement

Businesses that buy used devices often rely on paper contracts, manual notes, and scattered photos. This creates several operational problems:

- Slow contract creation
- Lost or incomplete records
- Difficulty finding old contracts
- Weak proof of ownership and condition
- No structured storage for photos, signatures, and PDFs
- Risk of disputes related to stolen devices or account locks

This system solves those issues by centralizing the entire device purchase workflow in one simple dashboard.

---

## 3. Goals

The product should:

- Let staff create a purchase contract quickly
- Capture customer identity and contact information
- Record device details and condition
- Upload required photos and optional supporting images
- Capture a digital signature on screen
- Collect ownership and lock-removal confirmations
- Automatically generate a downloadable PDF contract
- Save everything in the database
- Allow searching and opening past contracts easily
- Show a lightweight dashboard with today’s activity

---

## 4. Scope

### In Scope
- User login
- Create new purchase contract
- Customer data entry
- Device data entry
- Photo uploads
- Digital signature capture
- Ownership and lock confirmation checkboxes
- Automatic PDF generation
- Contract storage in database
- Search page and filters
- Dashboard summary metrics
- Contract status management
- PDF download and contract viewing

### Out of Scope
- AI chatbot
- Repair management
- Inventory management
- Accounting/export modules
- Multi-shop support
- WhatsApp integration
- Complex reporting
- Advanced permission system
- Customer-facing portal

---

## 5. Target Users

### Primary Users
- Shop employees who create contracts
- Sales staff who handle buyback transactions
- Store managers who review contracts and daily totals

### Secondary Users
- Business owners who need audit records and dispute protection
- Admin users who manage the application

---

## 6. Core Use Case

A customer brings in a used device and wants to sell it. A staff member opens the dashboard, creates a contract, enters customer and device details, uploads photos, collects confirmations and a signature, then saves the record. The system stores everything and generates a PDF contract that can be downloaded later.

---

## 7. Recommended Tech Stack

### Frontend
- **Next.js** for the web interface
- **React** for component-based UI
- **Tailwind CSS** for styling
- **Signature Pad library** for digital signature capture
- **React Hook Form** for form handling
- **Zod** or **Yup** for validation

### Backend
- **Node.js** with **Express.js**
- REST API architecture
- **Multer** for file uploads
- **JWT** for authentication
- **bcrypt** for password hashing
- **pdfkit** or a similar server-side PDF library

### Database
- **PostgreSQL** or **MySQL**
- ORM: **Prisma** or **Sequelize**

### Storage
- Local server storage for MVP
- Folder structure by contract number
- Store uploaded files, signature PNG, and generated PDF on disk

### Deployment
- Backend deployed on a Node.js-capable server
- Database on managed PostgreSQL/MySQL or local server for MVP
- Storage on the same server for MVP

---

## 8. Functional Requirements

## 8.1 Authentication

### Features
- User login
- Optional registration for initial setup
- Protected routes for authenticated users

### Rules
- Passwords must be hashed
- Unauthorized users cannot access contract data
- All core pages require login

---

## 8.2 Dashboard

### Dashboard Must Show
- Button: Create New Contract
- Search field
- Recent contracts
- Contracts created today
- Total purchase value today

### Dashboard Purpose
- Give staff a fast overview of daily work
- Provide direct access to contract creation and search

---

## 8.3 Create New Purchase Contract

### Required Customer Fields
- Full name
- Address
- Phone number
- ID card / passport photo upload

### Optional Customer Fields
- Email address
- Date of birth
- ID document number

### Required Device Fields
- Device type
- Brand
- Model
- IMEI or serial number
- Device condition
- Purchase price
- Payment method

### Recommended Device Fields
- Storage capacity
- Color
- Accessories included
- Battery health
- Visible damage notes
- Internal notes

### Device Type Options
- Smartphone
- Tablet
- Laptop
- Desktop PC
- Smartwatch
- Gaming console
- Other

### Device Condition Options
- Like new
- Very good
- Good
- Used
- Defective

### Payment Method Options
- Cash
- Bank transfer
- Card
- Other

---

## 8.4 Security / Lock Confirmation

The contract form must include the following checkboxes:
- Customer confirms ownership of the device
- Customer confirms the device is not stolen
- iCloud lock removed
- Google lock removed
- Samsung / Microsoft / other account lock removed
- Device has been factory reset

These confirmations must be stored in the database and shown in the generated PDF.

---

## 8.5 Photo Uploads

### Supported Uploads
- ID card / passport photo
- Device front photo
- Device back photo
- IMEI / serial number photo
- Damage photos (optional)
- Accessories photo (optional)

### Rules
- Simple file upload is enough for MVP
- Camera capture from mobile/tablet is preferred but not required
- Photos must be linked to the correct contract record
- File paths must be stored in the database

---

## 8.6 Digital Signature

### Requirements
- Customer signs on screen using a signature pad
- Signature can be cleared and signed again before saving
- Signature must be saved as PNG
- Signature must be inserted into the PDF
- Signature must be linked to the contract record

---

## 8.7 Automatic PDF Generation

After the contract is saved, the backend must generate a PDF purchase contract automatically.

### PDF Must Include
- Shop name
- Shop address
- Contract number
- Date and time
- Customer data
- Device data
- IMEI / serial number
- Device condition
- Purchase price
- Payment method
- Ownership confirmation text
- Lock removal confirmations
- Customer signature
- Uploaded photos, if possible

### PDF Rules
- PDF must be downloadable
- PDF path must be stored in the database
- PDF must match the saved contract data

---

## 8.8 Contract Storage

Each contract must be stored with:
- Customer data
- Device data
- Uploaded file paths
- Signature path
- PDF path
- Contract number
- Date and time
- Contract status

### Contract Status Values
- Draft
- Completed
- Cancelled

### Rules
- Completed contracts should not be edited normally
- Cancelled contracts should remain visible for record keeping
- Draft contracts can be edited before completion

---

## 8.9 Search Function

### Search Filters
- Customer name
- Phone number
- IMEI
- Serial number
- Device model
- Contract number
- Date

### Search Results Must Show
- Contract number
- Customer name
- Device model
- IMEI / serial number
- Purchase price
- Date
- Open PDF button
- Download PDF button

### Rules
- Search should be fast and simple
- Search should support partial matching where useful

---

## 9. Data Model

## 9.1 Users Table
- id
- name
- email
- password_hash
- created_at

## 9.2 Contracts Table
- id
- contract_number
- customer_name
- customer_address
- customer_phone
- customer_email
- customer_date_of_birth
- id_document_number
- device_type
- brand
- model
- imei
- serial_number
- storage
- color
- condition
- accessories
- battery_health
- damage_notes
- internal_notes
- purchase_price
- payment_method
- ownership_confirmed
- not_stolen_confirmed
- icloud_removed
- google_lock_removed
- other_lock_removed
- factory_reset_confirmed
- signature_path
- pdf_path
- status
- created_at
- updated_at

## 9.3 Contract Files Table
- id
- contract_id
- file_type
- file_path
- created_at

### Supported File Types
- id_front
- id_back
- device_front
- device_back
- imei_photo
- damage_photo
- accessories_photo
- other

---

## 10. Backend API Modules

### Auth Module
- Login
- Logout if needed
- Get current user

### Contract Module
- Create contract
- Update draft contract
- View contract details
- Change contract status
- List recent contracts

### File Upload Module
- Upload identity and device photos
- Store file metadata

### Signature Module
- Save signature image
- Attach signature to contract

### PDF Module
- Generate PDF from contract data
- Save PDF path
- Serve PDF for download

### Search Module
- Filter contracts by multiple search fields

### Dashboard Module
- Today’s contract count
- Today’s purchase total
- Recent contracts list

---

## 11. Project Flow

### 11.1 New Contract Flow
1. User logs in
2. User opens dashboard
3. User clicks Create New Contract
4. User enters customer data
5. User enters device data
6. User uploads photos
7. User marks confirmations
8. Customer signs on screen
9. User saves the contract
10. Backend stores data in database
11. Backend stores files and signature
12. Backend generates PDF
13. Contract status becomes Completed
14. Contract becomes searchable and downloadable

### 11.2 Search Flow
1. User opens dashboard or search page
2. User searches by name, IMEI, phone, model, contract number, or date
3. Backend returns matching contracts
4. User opens a record
5. User views or downloads the PDF

### 11.3 Edit Flow
1. Draft contract can be edited
2. Completed contract is read-only by default
3. Cancelled contract remains stored for history

---

## 12. Folder Structure Suggestion

### Backend
```text
src/
├── config/
├── controllers/
├── routes/
├── services/
├── middlewares/
├── validators/
├── models/
├── uploads/
├── pdf/
├── utils/
└── app.js
```

### Storage Structure
```text
/storage/contracts/2026-0001/
├── contract.pdf
├── signature.png
├── id_front.jpg
├── id_back.jpg
├── device_front.jpg
├── device_back.jpg
├── imei_photo.jpg
└── accessories_photo.jpg
```

---

## 13. Validation Rules

- Full name, address, phone number, device type, brand, model, IMEI/serial, condition, purchase price, and payment method are required
- Purchase price must be numeric and greater than zero
- At least one of IMEI or serial number must be present
- Signature must be captured before final completion
- PDF generation should only happen after required data is saved
- Uploaded files must be validated for allowed file types and size

---

## 14. Business Rules

- Each contract must have a unique contract number
- Contract number should be readable and sequential
- Completed contracts should not be casually edited
- Contract data should be immutable after completion unless admin override exists later
- PDF must match the saved contract exactly
- Uploaded photos and signature must remain tied to the same contract

---

## 15. Non-Functional Requirements

### Performance
- Contract creation should feel fast and responsive
- Search should return results quickly
- PDF generation should complete shortly after saving

### Security
- Login protection required
- Stored passwords must be hashed
- File paths and PDFs should not be publicly editable
- Access to contracts should be authenticated

### Reliability
- Files, signature, and PDF must persist safely
- Data should not be lost after refresh or restart

### Usability
- Simple form layout
- Clear section grouping
- Easy search and contract opening
- Clean dashboard with minimal clutter

---

## 16. Acceptance Criteria

The project is complete when:
- A user can log in
- A user can create a purchase contract
- Customer and device data can be saved
- Photos can be uploaded
- A signature can be captured and stored
- A PDF is generated automatically
- The contract is saved in the database
- Contracts can be searched later
- PDFs can be downloaded
- Recent contracts and daily stats appear on the dashboard

---

## 17. Suggested Build Order

1. Set up database and backend project structure
2. Build authentication
3. Build contract creation endpoint
4. Add file upload handling
5. Add signature handling
6. Add PDF generation
7. Add search APIs
8. Add dashboard summary APIs
9. Add validation and business rules
10. Test end-to-end workflow

---

## 18. Summary

This product is a simple internal system for device buyback businesses. Its main job is to capture contract data, photos, and signatures; generate a legal PDF contract; store everything safely; and make old contracts searchable. It is intentionally small in scope and focused only on the core workflow needed for buying used devices.

