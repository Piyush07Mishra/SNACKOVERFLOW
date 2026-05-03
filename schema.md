# SNACKOVERFLOW Application Schema

This document describes the MongoDB/Mongoose schema for the HRMS application.
It covers the main data models, field types, relationships, unique constraints, and indexes.

---

## 1. Company

### Collection: `companies`

Fields:
- `name` (String, required)
- `companyCode` (String, required, unique, uppercase, trimmed)
- `logoUrl` (String)
- `email` (String, required, unique)
- `phone` (String, optional, regex validated)
- `address` (String, max 300 chars)
- `industry` (String)
- `size` (String, enum: `1-10`, `11-50`, `51-200`, `201-500`, `500+`)
- `isActive` (Boolean, default `true`)
- timestamps: `createdAt`, `updatedAt`

Notes:
- `companyCode` is used for employee ID generation and tenant scoping.
- Email is globally unique across companies.

---

## 2. User

### Collection: `users`

Fields:
- `companyId` (ObjectId, ref `Company`, required)
- `firstName` (String, required)
- `lastName` (String, required)
- `name` (String)
- `email` (String, required)
- `employeeId` (String, sparse unique per company)
- `password` (String, required)
- `role` (String enum: `Admin`, `Employee`, `HR_Officer`, `Payroll_Officer`, default `Employee`)

Work profile:
- `jobPosition` (String)
- `mobileNumber` (String)
- `company` (String)
- `department` (String)
- `manager` (String)
- `location` (String)

Private profile:
- `dateOfBirth` (Date)
- `residingAddress` (String)
- `nationality` (String)
- `personalEmail` (String)
- `gender` (String enum: `Male`, `Female`, `Other`, ``)
- `maritalStatus` (String)
- `joiningDate` (Date, required)

Salary profile:
- `wageType` (String enum: `Fixed`, `Variable`, default `Fixed`)
- `basicSalary` (Number, default `0`)
- `salaryComponents` (Array of embedded salary component objects)
- `salaryConfig`:
  - `pfRate` (Number, default `12`)
  - `professionalTax` (Number, default `200`)

Bank details:
- `bankDetails.bankName` (String)
- `bankDetails.accountNumber` (String)
- `bankDetails.ifscCode` (String)
- `bankDetails.branchName` (String)
- `bankDetails.panNo` (String)
- `bankDetails.uanNo` (String)

Admin permissions:
- `adminPermissions.canApproveLeaves` (Boolean)
- `adminPermissions.canApprovePay` (Boolean)
- `adminPermissions.canManageUsers` (Boolean)
- `adminPermissions.canViewReports` (Boolean)

Indexes:
- `{ companyId: 1, employeeId: 1 }` unique sparse
- `{ companyId: 1, email: 1 }` unique
- `{ role: 1 }`
- `{ department: 1 }`
- `{ joiningDate: -1 }`
- Text indexes on `name`, `email`, `employeeId`, `jobPosition`

Notes:
- `employeeId` is unique only within a company.
- `name` is maintained by application logic and not by a Mongoose hook in this schema.

---

## 3. Counter

### Collection: `counters`

Fields:
- `companyId` (ObjectId, ref `Company`, required)
- `year` (Number, required)
- `sequence` (Number, default `0`)

Indexes:
- `{ companyId: 1, year: 1 }` unique

Notes:
- Used for deterministic, tenant-scoped sequence generation such as employee IDs.

---

## 4. Attendance

### Collection: `attendances`

Fields:
- `companyId` (ObjectId, ref `Company`, required)
- `employeeId` (String, denormalized)
- `user` (ObjectId, ref `User`, required)
- `date` (String, required, format `YYYY-MM-DD`)
- `status` (String enum: `Present`, `Absent`, `Half_Day`, default `Present`)
- `checkIn` (Date)
- `checkOut` (Date)
- `timerStartTime` (Date)
- `breaks` (Array of objects with `start` and `end` Date fields)
- `notes` (String, default `''`)
- `totalWorkingHours` (Number, default `0`)
- timestamps: `createdAt`, `updatedAt`

Indexes:
- `{ user: 1, date: 1 }` unique
- `{ companyId: 1, date: 1 }`

Notes:
- The unique user/date index ensures one attendance record per employee per day.
- `companyId` and `employeeId` are denormalized for faster reporting.

---

## 5. AttendanceSession

### Collection: `attendancesessions`

Fields:
- `companyId` (ObjectId, ref `Company`, required)
- `employeeId` (String, required)
- `userId` (ObjectId, ref `User`, required)
- `checkInTime` (Date, required)
- `checkOutTime` (Date, default `null`)
- `checkInLocation` (embedded location object)
- `checkOutLocation` (embedded location object, default `null`)
- `status` (String enum: `ACTIVE`, `COMPLETED`, default `ACTIVE`)
- timestamps: `createdAt`, `updatedAt`

Embedded `LocationSchema`:
- `lat` (Number, required)
- `lng` (Number, required)
- `accuracy` (Number, default `null`)

Indexes:
- Unique partial index: `{ companyId: 1, employeeId: 1, status: 1 }` with `partialFilterExpression: { status: 'ACTIVE' }`
- `{ companyId: 1, employeeId: 1, createdAt: -1 }`

Notes:
- Only one active session per employee is allowed inside a company.
- Attendance sessions track live check-in/check-out workflow and GPS location.

---

## 6. Leave

### Collection: `leaves`

Fields:
- `companyId` (ObjectId, ref `Company`, required)
- `employeeId` (String)
- `user` (ObjectId, ref `User`, required)
- `type` (String enum: `Sick`, `Casual`, `Earned`, `Unpaid`, required)
- `startDate` (Date, required)
- `endDate` (Date, required)
- `status` (String enum: `Pending`, `Approved`, `Rejected`, default `Pending`)
- `reason` (String, required)
- `approvedBy` (ObjectId, ref `User`)
- timestamps: `createdAt`, `updatedAt`

Indexes:
- `{ companyId: 1, status: 1 }`

Notes:
- Used for leave request workflows and approval reporting.

---

## 7. Payroll

### Collection: `payrolls`

Fields:
- `companyId` (ObjectId, ref `Company`, required)
- `employeeId` (String)
- `user` (ObjectId, ref `User`, required)
- `month` (String, required, format `YYYY-MM`)
- `basicSalary` (Number, required)
- `payableDays` (Number, required)
- `unpaidLeaves` (Number, default `0`)
- `pfDeduction` (Number, required)
- `professionalTax` (Number, required)
- `totalEarnings` (Number, required)
- `totalDeductions` (Number, required)
- `netSalary` (Number, required)
- `status` (String enum: `Pending`, `Processed`, `Paid`, default `Pending`)
- timestamps: `createdAt`, `updatedAt`

Indexes:
- `{ user: 1, month: 1 }` unique
- `{ companyId: 1, month: 1 }`

Notes:
- One payroll record per user per month is enforced by a unique index.
- Payroll records are tenant-scoped by `companyId`.

---

## Relationships Summary

- `User.companyId` -> `Company._id`
- `Attendance.companyId` -> `Company._id`
- `Attendance.user` -> `User._id`
- `AttendanceSession.companyId` -> `Company._id`
- `AttendanceSession.userId` -> `User._id`
- `Leave.companyId` -> `Company._id`
- `Leave.user` -> `User._id`
- `Payroll.companyId` -> `Company._id`
- `Payroll.user` -> `User._id`

## Tenant and Business Rules

- Most collections include `companyId` to enforce tenant isolation.
- Attendance records are unique per user per day.
- Active attendance sessions are unique per company and employee.
- Payroll is unique per user per month.
- `employeeId` is denormalized across attendance, leave, payroll, and session records for reporting and join avoidance.

---

## Notes on Attendance Flow

- `Attendance` stores the daily summary record used for reporting.
- `AttendanceSession` tracks live check-in/out sessions and GPS validation.
- `Attendance.status` values influence "Present Today" and reporting counts.
- `AttendanceSession` status transitions from `ACTIVE` to `COMPLETED` on checkout.

---

## File Location

- `schema.md` is stored in the repository root for quick reference.
