# Database Schema Documentation

This document contains comprehensive schema definitions for the SNACKOVERFLOW (EmPay) HR Management System.

## Table of Contents

- [User Schema](#user-schema)
- [Attendance Schema](#attendance-schema)
- [Leave Schema](#leave-schema)
- [Payroll Schema](#payroll-schema)
- [Notification Schema](#notification-schema)
- [Schema Relationships](#schema-relationships)
- [Index Strategy](#index-strategy)
- [Examples](#examples)

---

## User Schema

**File:** `/lib/models/User.ts`

### Overview
The User schema stores comprehensive employee information including personal details, job information, salary structure, and permissions.

### Schema Definition

```typescript
interface User {
  // Basic Information
  name: string;                    // Employee full name (2-50 chars)
  email: string;                   // Unique email address (max 100 chars)
  employeeId: string;              // Unique employee ID (max 20 chars, uppercase)
  password: string;                // Hashed password (8-128 chars, never returned in queries)
  role: 'Admin' | 'Employee' | 'HR_Officer' | 'Payroll_Officer'; // User role
  
  // Resume Information
  jobPosition: string;             // Job title/position
  mobileNumber: string;            // Contact number
  company: string;                 // Company name
  department: string;             // Department name
  manager: string;                 // Manager name
  location: string;                // Work location
  
  // Personal Information
  dateOfBirth: Date;               // Date of birth
  residingAddress: string;          // Home address
  nationality: string;             // Nationality
  personalEmail: string;           // Personal email address
  gender: 'Male' | 'Female' | 'Other' | ''; // Gender
  maritalStatus: string;           // Marital status
  joiningDate: Date;               // Employment start date
  
  // Salary Information
  wageType: 'Fixed' | 'Variable';  // Wage calculation type
  basicSalary: number;             // Base salary amount
  
  // Salary Components (Array)
  salaryComponents: [{
    name: string;                  // Component name (e.g., "HRA", "Bonus")
    computationType: 'Fixed' | 'Percentage'; // Calculation method
    value: number;                 // Amount or percentage
    calculatedValue: number;       // Auto-calculated final value
    basisComponent: string;        // Reference component for percentage calculations
  }];
  
  // Salary Configuration
  salaryConfig: {
    pfRate: number;                // PF deduction rate (default: 12%)
    professionalTax: number;       // Professional tax amount (default: 200)
  };
  
  // Bank Details
  bankDetails: {
    bankName: string;               // Bank name
    accountNumber: string;         // Bank account number
    ifscCode: string;               // IFSC code
    branchName: string;            // Bank branch name
    panNo: string;                 // PAN number
    uanNo: string;                 // UAN number
  };
  
  // Administrative Permissions
  adminPermissions: {
    canApproveLeaves: boolean;     // Can approve leave requests
    canApprovePay: boolean;        // Can approve payroll
    canManageUsers: boolean;       // Can manage user accounts
    canViewReports: boolean;      // Can view reports
  };
  
  // File Attachments
  profileImage: string;            // Profile image URL/path
  documents: [{
    id: string;                    // Document unique identifier
    name: string;                  // Document display name
    type: 'resume' | 'certificate' | 'identity' | 'other'; // Document type
    filePath: string;              // File storage path
    fileName: string;              // Original filename
    fileSize: number;              // File size in bytes
    mimeType: string;              // MIME type
    uploadedAt: Date;              // Upload timestamp
  }];
  
  // Timestamps
  createdAt: Date;                 // Account creation date
  updatedAt: Date;                 // Last update date
}
```

### Validation Rules
- **name**: Required, 2-50 characters, trimmed
- **email**: Required, unique, lowercase, max 100 characters
- **employeeId**: Unique, uppercase, max 20 characters
- **password**: Required, 8-128 characters, never returned in queries
- **dateOfBirth**: Must be a valid date
- **salaryComponents**: Array of salary breakdown components

### Indexes
- `email` (unique)
- `employeeId` (unique)
- `role` (for role-based queries)
- `department` (for department filtering)
- `joiningDate` (descending for recent hires)
- Text search index on: `name`, `email`, `employeeId`, `jobPosition`

---

## Attendance Schema

**File:** `/lib/models/Attendance.ts`

### Overview
The Attendance schema tracks daily attendance records including check-in/check-out times, breaks, and working hours.

### Schema Definition

```typescript
interface Attendance {
  user: ObjectId;                  // Reference to User (required)
  date: string;                    // Date in YYYY-MM-DD format (required)
  status: 'Present' | 'Absent' | 'Half_Day' | 'Leave'; // Attendance status
  
  // Time Tracking
  checkIn: Date;                   // Check-in timestamp (cannot be future)
  checkOut: Date;                  // Check-out timestamp (must be after checkIn)
  
  // Break Management
  breaks: [{
    start: Date;                   // Break start time (required)
    end: Date;                     // Break end time (must be after start)
  }];
  
  // Calculations
  totalWorkingHours: number;       // Total working hours (0-24)
  
  // Additional Information
  notes: string;                   // Attendance notes (max 500 chars)
  timerStartTime: Date;            // Real-time tracking start
  lastBreakStart: Date;            // Last break start time
  employeeId: string;              // Employee ID (uppercase, max 20 chars)
  
  // Timestamps
  createdAt: Date;                 // Record creation date
  updatedAt: Date;                 // Last update date
}
```

### Validation Rules
- **date**: Required, must match YYYY-MM-DD format
- **checkIn**: Cannot be in the future
- **checkOut**: Must be after checkIn time
- **breaks[].start**: Required for each break
- **breaks[].end**: Must be after break start
- **totalWorkingHours**: 0-24 hours range

### Indexes
- `{ user: 1, date: 1 }` (unique) - Prevents duplicate attendance
- `date` (descending) - For date-based queries
- `status` - For status filtering
- `{ user: 1, status: 1 }` - For user status queries
- `{ user: 1, date: -1 }` - For user attendance history
- `{ date: -1, status: 1 }` - For monthly reports

---

## Leave Schema

**File:** `/lib/models/Leave.ts`

### Overview
The Leave schema manages employee leave requests including type, duration, status, and approval information.

### Schema Definition

```typescript
interface Leave {
  user: ObjectId;                  // Reference to User (required)
  type: 'Sick' | 'Casual' | 'Earned' | 'Unpaid'; // Leave type (required)
  startDate: Date;                 // Leave start date (required)
  endDate: Date;                   // Leave end date (required)
  status: 'Pending' | 'Approved' | 'Rejected'; // Leave status (default: Pending)
  reason: string;                  // Leave reason (required)
  approvedBy: ObjectId;             // Reference to User who approved
  createdAt: Date;                 // Request creation date
  updatedAt: Date;                 // Last update date
}
```

### Validation Rules
- **type**: Required, must be one of the defined leave types
- **startDate**: Required, must be a valid date
- **endDate**: Required, must be a valid date
- **reason**: Required, leave justification
- **approvedBy**: Optional, populated when leave is approved

### Relationships
- `user`: References the employee requesting leave
- `approvedBy`: References the admin/HR who approved the leave

---

## Payroll Schema

**File:** `/lib/models/Payroll.ts`

### Overview
The Payroll schema manages monthly payroll calculations including earnings, deductions, and payment status.

### Schema Definition

```typescript
interface Payroll {
  user: ObjectId;                  // Reference to User (required)
  month: string;                   // Month in YYYY-MM format (required)
  basicSalary: number;              // Base salary amount (required)
  payableDays: number;             // Number of payable days (required)
  unpaidLeaves: number;             // Count of unpaid leave days (default: 0)
  totalWorkingHours: number;       // Total hours worked in month (default: 0)
  overtimeHours: number;           // Overtime hours (default: 0)
  overtimePay: number;             // Overtime compensation (default: 0)
  pfDeduction: number;             // PF deduction amount (required)
  professionalTax: number;         // Professional tax amount (required)
  totalEarnings: number;           // Total earnings amount (required)
  totalDeductions: number;         // Total deductions amount (required)
  netSalary: number;               // Net salary after deductions (required)
  status: 'Pending' | 'Processed' | 'Paid'; // Payroll status (default: Pending)
  createdAt: Date;                 // Record creation date
  updatedAt: Date;                 // Last update date
}
```

### Validation Rules
- **user**: Required, references employee
- **month**: Required, must be in YYYY-MM format
- **basicSalary**: Required, positive number
- **payableDays**: Required, positive number
- **pfDeduction**: Required, calculated as 12% of basic salary
- **professionalTax**: Required, fixed amount
- **netSalary**: Required, calculated as totalEarnings - totalDeductions

### Indexes
- `{ user: 1, month: 1 }` (unique) - Prevents duplicate payroll records

---

## Notification Schema

**File:** `/lib/models/Notification.ts`

### Overview
The Notification schema manages user notifications including push notifications, read status, and expiration.

### Schema Definition

```typescript
interface Notification {
  user: ObjectId;                  // Reference to User (required)
  title: string;                   // Notification title (max 100 chars, required)
  message: string;                 // Notification message (max 500 chars, required)
  type: 'attendance' | 'leave' | 'payroll' | 'system' | 'reminder' | 'approval'; // Notification type (required)
  priority: 'low' | 'medium' | 'high' | 'urgent'; // Priority level (default: medium)
  isRead: boolean;                 // Read status (default: false)
  actionUrl: string;               // URL for notification action
  actionText: string;              // Action button text
  metadata: object;                // Additional notification data
  expiresAt: Date;                // Auto-expiration date
  pushSent: boolean;               // Push notification sent status (default: false)
  pushSubscription: object;        // Push subscription details
  createdAt: Date;                 // Creation date
  updatedAt: Date;                 // Last update date
}
```

### Validation Rules
- **title**: Required, max 100 characters
- **message**: Required, max 500 characters
- **type**: Required, must be one of defined types
- **priority**: Default 'medium', affects display order

### Indexes
- `{ user: 1, isRead: 1 }` - For user notification queries
- `{ user: 1, createdAt: -1 }` - For user notification history
- `{ type: 1, priority: 1 }` - For type and priority filtering
- `{ expiresAt: 1 }` (TTL) - Auto-delete expired notifications

---

## Schema Relationships

### Relationship Diagram

```
User (1) ──→ (N) Attendance
User (1) ──→ (N) Leave
User (1) ──→ (N) Payroll
User (1) ──→ (N) Notification
User (1) ──→ (N) Leave.approvedBy
```

### Relationship Details

#### User → Attendance
- **Type**: One-to-Many
- **Foreign Key**: `Attendance.user` references `User._id`
- **Constraints**: Unique on `{ user, date }`
- **Usage**: Daily attendance records per employee

#### User → Leave
- **Type**: One-to-Many
- **Foreign Key**: `Leave.user` references `User._id`
- **Usage**: Leave requests submitted by employees

#### User → Payroll
- **Type**: One-to-Many
- **Foreign Key**: `Payroll.user` references `User._id`
- **Constraints**: Unique on `{ user, month }`
- **Usage**: Monthly payroll records per employee

#### User → Notification
- **Type**: One-to-Many
- **Foreign Key**: `Notification.user` references `User._id`
- **Usage**: User-specific notifications

#### User → Leave.approvedBy
- **Type**: Self-reference (User → User)
- **Foreign Key**: `Leave.approvedBy` references `User._id`
- **Usage**: Tracks which user approved leave requests

---

## Index Strategy

### Performance Optimization

#### User Collection Indexes
```javascript
// Unique constraints
{ email: 1 } (unique)
{ employeeId: 1 } (unique)

// Query optimization
{ role: 1 }
{ department: 1 }
{ joiningDate: -1 }

// Text search
{ name: "text", email: "text", employeeId: "text", jobPosition: "text" }
```

#### Attendance Collection Indexes
```javascript
// Unique constraint
{ user: 1, date: 1 } (unique)

// Common queries
{ date: -1 }
{ status: 1 }
{ user: 1, status: 1 }
{ user: 1, date: -1 }
{ date: -1, status: 1 }
```

#### Payroll Collection Indexes
```javascript
// Unique constraint
{ user: 1, month: 1 } (unique)
```

#### Notification Collection Indexes
```javascript
// User queries
{ user: 1, isRead: 1 }
{ user: 1, createdAt: -1 }

// Type and priority
{ type: 1, priority: 1 }

// Auto-expiration (TTL)
{ expiresAt: 1 } (expireAfterSeconds: 0)
```

---

## Examples

### User Document Example

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "employeeId": "EMP001",
  "role": "Employee",
  "jobPosition": "Software Engineer",
  "department": "Engineering",
  "basicSalary": 80000,
  "salaryComponents": [
    {
      "name": "HRA",
      "computationType": "Percentage",
      "value": 40,
      "calculatedValue": 32000,
      "basisComponent": "Basic"
    }
  ],
  "salaryConfig": {
    "pfRate": 12,
    "professionalTax": 200
  },
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Attendance Document Example

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439011",
  "date": "2024-01-15",
  "status": "Present",
  "checkIn": "2024-01-15T09:00:00.000Z",
  "checkOut": "2024-01-15T18:00:00.000Z",
  "breaks": [
    {
      "start": "2024-01-15T13:00:00.000Z",
      "end": "2024-01-15T14:00:00.000Z"
    }
  ],
  "totalWorkingHours": 8,
  "employeeId": "EMP001",
  "createdAt": "2024-01-15T09:00:00.000Z",
  "updatedAt": "2024-01-15T18:00:00.000Z"
}
```

### Leave Document Example

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "user": "507f1f77bcf86cd799439011",
  "type": "Sick",
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-21T00:00:00.000Z",
  "status": "Approved",
  "reason": "Medical appointment and recovery",
  "approvedBy": "507f1f77bcf86cd799439014",
  "createdAt": "2024-01-19T10:00:00.000Z",
  "updatedAt": "2024-01-20T09:00:00.000Z"
}
```

### Payroll Document Example

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "user": "507f1f77bcf86cd799439011",
  "month": "2024-01",
  "basicSalary": 80000,
  "payableDays": 22,
  "unpaidLeaves": 0,
  "totalWorkingHours": 176,
  "overtimeHours": 8,
  "overtimePay": 4000,
  "pfDeduction": 9600,
  "professionalTax": 200,
  "totalEarnings": 116000,
  "totalDeductions": 9800,
  "netSalary": 106200,
  "status": "Processed",
  "createdAt": "2024-01-31T00:00:00.000Z",
  "updatedAt": "2024-01-31T00:00:00.000Z"
}
```

### Notification Document Example

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "user": "507f1f77bcf86cd799439011",
  "title": "Check-in Successful",
  "message": "You have successfully checked in at 09:00 AM",
  "type": "attendance",
  "priority": "medium",
  "isRead": false,
  "actionUrl": "/dashboard/attendance",
  "actionText": "View Attendance",
  "metadata": {
    "checkInTime": "2024-01-15T09:00:00.000Z"
  },
  "pushSent": true,
  "createdAt": "2024-01-15T09:00:00.000Z",
  "updatedAt": "2024-01-15T09:00:00.000Z"
}
```

---

## Usage Notes

### Common Query Patterns

#### Get User with Attendance
```javascript
const userWithAttendance = await User.findById(userId)
  .populate({
    path: 'attendance',
    match: { date: { $gte: startDate, $lte: endDate } }
  });
```

#### Get Monthly Payroll
```javascript
const monthlyPayroll = await Payroll.find({
  user: userId,
  month: { $gte: startMonth, $lte: endMonth }
}).sort({ month: -1 });
```

#### Get Unread Notifications
```javascript
const unreadNotifications = await Notification.find({
  user: userId,
  isRead: false
}).sort({ priority: -1, createdAt: -1 });
```

### Data Integrity

1. **Cascading Deletes**: When a user is deleted, related records should be cleaned up
2. **Business Rules**: 
   - Check-out time must be after check-in
   - Leave end date must be after start date
   - Payroll calculations must balance (earnings - deductions = net salary)
3. **Audit Trail**: All schemas include `createdAt` and `updatedAt` timestamps

### Performance Considerations

1. **Indexes**: All frequently queried fields are indexed
2. **Pagination**: Large datasets should use pagination
3. **Caching**: Static data like user roles can be cached
4. **Archiving**: Old attendance and notification records can be archived

---

*This documentation covers all database schemas for the EmPay HR Management System. For specific implementation details, refer to the individual model files in `/lib/models/`.*
