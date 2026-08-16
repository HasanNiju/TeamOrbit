# Employee Reporting System
## Product Requirements Document (PRD)

**Version:** 1.1  
**Timezone:** Asia/Dhaka (Bangladesh Standard Time, UTC+6)  
**Frontend language:** Bangla by default, English optional  
**Backend language:** English only  
**Architecture:** Two modules — Employee Frontend + Admin Backend

---

# 1. Product Overview

The Employee Reporting System is an internal web application for Marketing Officers to submit work reports and monitor their submission statistics.

The system has two separate modules:

1. **Frontend / Employee App**
   - Used by Marketing Officers.
   - Mobile-first.
   - Bangla by default.
   - Extremely simple and form-oriented.
   - Exactly three primary sections: Submission, Stats, Profile.

2. **Backend / Management Panel**
   - Used by Team Leaders (Admin) and Managers (Super Admin).
   - English only.
   - Used for submissions, employee management, filtering, assignments and Excel exports.

The most important principle is **simplicity**. The target employees may not be very familiar with technology, so the employee frontend must feel like a straightforward mobile form rather than a complex dashboard.

---

# 2. Roles

| Role | Frontend | Backend | Submit Reports | View Own Stats | View Reports | Create Employee | Create Admin |
|---|---|---|---|---|---|---|---|
| Marketing Officer | Yes | No | Yes | Yes | Own data only | No | No |
| Team Leader / Admin | No | Yes | No | N/A | Assigned employees only | Yes | No |
| Manager / Super Admin | No | Yes | No | N/A | All employees | Yes | Yes |

## 2.1 Marketing Officer

Marketing Officers use only the employee frontend.

They can:

- Log in.
- Submit multiple reports per day.
- View today's, weekly, monthly and total submission counts.
- View their rank.
- View and edit permitted profile information.
- Change frontend language between Bangla and English.
- See their assigned Team Leader.
- See their assigned Manager.

They cannot:

- Access the backend.
- View other employees' reports.
- Create users.
- Change their Employee ID.
- Change their role.
- Change their Team Leader or Manager.
- Change their calculated rank or submission totals.

## 2.2 Team Leader / Admin

Admins use only the backend.

They can:

- View their dashboard.
- View submissions belonging to assigned employees.
- Search submissions.
- Filter submissions.
- View submission details.
- Export reports to Excel.
- Create Marketing Officer accounts.
- View/manage their assigned employees.

They cannot:

- View another Team Leader's employees.
- View unrestricted system-wide reports.
- Create Admin accounts.
- Create Super Admin accounts.

## 2.3 Manager / Super Admin

Super Admin has unrestricted management access.

They can:

- View all submissions.
- Search and filter all submissions.
- View all employees.
- Create Marketing Officers.
- Create Team Leaders/Admins.
- Assign employees to Team Leaders.
- Assign Team Leaders to Managers.
- Export all reports.
- Export individual employee reports.
- Manage user status and assignments.

---

# MODULE A — EMPLOYEE FRONTEND

# 3. Frontend Goals

The employee frontend should be:

- Mobile-first.
- Extremely easy to understand.
- Minimal.
- Fast.
- Responsive.
- Bangla-first.
- Form-oriented.
- Suitable for users with limited technical experience.

Do not create unnecessary dashboards, menus or complicated analytics.

The employee experience has exactly three primary sections:

1. **Submission**
2. **Stats**
3. **Profile**

---

# 4. Frontend Navigation

On mobile, use a fixed bottom navigation bar.

```text
┌─────────────────────────────────────┐
│                                     │
│           PAGE CONTENT              │
│                                     │
├────────────┬────────────┬───────────┤
│  Submit    │   Stats    │  Profile  │
│     +      │     📊     │     👤    │
└────────────┴────────────┴───────────┘
```

Requirements:

- Large touch targets.
- Clear active state.
- Simple icons.
- No hamburger menu for the three main sections.
- Content must have enough bottom padding so the fixed navigation never covers it.

On desktop/tablet, the same three-section structure should remain. The navigation may be visually adapted, but information architecture must not change.

---

# 5. Employee Login

Keep login simple.

```text
Employee ID
Password

[ Login ]
```

After successful login:

```text
/app/submission
```

The employee must never be redirected to the admin panel.

---

# 6. Submission Section

This is the default landing page after login.

Example Bangla header:

```text
আজকের রিপোর্ট

১৭ আগস্ট ২০২৬
রিপোর্ট জমা দেওয়ার সময়:
সকাল ৮:০০ — রাত ৮:০০
```

Display:

- Current Bangladesh date.
- Current submission availability.
- Employee name.

---

# 7. Submission Form

The form contains:

## Name

Bangla label:

**নাম**

Type: text.

Prefer automatically pre-filling the logged-in employee's name.

## Designation

Bangla:

**পদবী**

Type: text.

Prefer automatically loading from profile.

## Address

Bangla:

**ঠিকানা**

Type: multiline textarea.

## Mobile

Bangla:

**মোবাইল নম্বর**

Type: telephone.

Support Bangladesh-friendly formats such as:

```text
01XXXXXXXXX
+8801XXXXXXXXX
```

## Opinion / Remarks

Bangla:

**মতামত / মন্তব্য**

Type: multiline textarea.

Example placeholder:

```text
আজকের কাজ, অভিজ্ঞতা বা গুরুত্বপূর্ণ বিষয় লিখুন...
```

---

# 8. Multiple Reports Per Day

## Critical Business Rule

**An employee can submit multiple reports during the same day.**

There is **no daily submission limit**.

For example:

```text
09:10 AM → Report 1
11:35 AM → Report 2
02:20 PM → Report 3
05:45 PM → Report 4
07:50 PM → Report 5
```

All five submissions are valid.

Do NOT implement:

```text
one employee + one date = one submission
```

Do NOT create a unique constraint based on:

```text
employee_user_id + submission_date
```

Every report must be stored as a separate submission record.

---

# 9. Submission Button

Large mobile-friendly button:

**রিপোর্ট জমা দিন**

On submission:

1. Validate fields.
2. Prevent accidental double-clicks while the request is processing.
3. Send the request to the backend.
4. Backend validates the submission time.
5. Backend creates a new submission.
6. Show success confirmation.
7. Clear the report-specific form fields.
8. Keep the employee on the Submission page.
9. Allow another report to be submitted immediately.

Success message:

```text
রিপোর্ট সফলভাবে জমা হয়েছে।
```

The form must NOT become permanently disabled after one successful submission.

---

# 10. Submission Time Window

Reports can be submitted only between:

**8:00 AM and 8:00 PM Bangladesh time.**

Timezone:

```text
Asia/Dhaka
```

Server-side validation is mandatory.

The browser's local clock must not be trusted.

Recommended logic:

```text
08:00:00 <= current Bangladesh time < 20:00:00
```

Therefore:

- 7:59 AM → Closed
- 8:00 AM → Open
- 12:00 PM → Open
- 7:59 PM → Open
- 8:00 PM → Closed
- 9:00 PM → Closed

## Before 8 AM

Disable the form and display:

```text
রিপোর্ট জমা এখনো শুরু হয়নি।

আজকের রিপোর্ট জমা শুরু হবে:
সকাল ৮:০০ টায়
```

## After 8 PM

Display:

```text
আজকের রিপোর্ট জমা দেওয়ার সময় শেষ।

রিপোর্ট জমা আবার শুরু হবে:
আগামীকাল সকাল ৮:০০ টায়
```

---

# 11. Submission Validation

Required:

- Name.
- Designation.
- Address.
- Mobile.
- Opinion/Remarks.

Both frontend and backend must validate.

Backend validation is authoritative.

---

# 12. Stats Section

The second navigation item is **Stats**.

Display:

### Today

```text
আজ
5
রিপোর্ট
```

### This Week

```text
এই সপ্তাহ
23
রিপোর্ট
```

### This Month

```text
এই মাস
87
রিপোর্ট
```

### Total

```text
মোট
342
রিপোর্ট
```

Because multiple reports per day are allowed, each individual report increments these counts.

Example:

If an employee submits 5 reports today:

```text
Today = 5
```

not 1.

---

# 13. Rank

Rank is based on total number of submissions.

Example:

```text
Employee A — 342 submissions — #1
Employee B — 318 submissions — #2
Employee C — 291 submissions — #3
```

Rank should automatically update when new submissions are created.

Rank should be calculated among active Marketing Officers.

Recommended database logic:

```text
RANK() OVER (
  ORDER BY total_submissions DESC
)
```

Equal submission totals can share the same rank.

Do not let employees manually edit their rank.

---

# 14. Profile Section

The third navigation item is **Profile**.

Display:

- Profile photo.
- Name.
- Employee ID.
- Designation.
- Zone.
- Mobile.
- Address.
- Total submissions.
- Rank.
- Team Leader.
- Manager.
- Language setting.

Example:

```text
Profile

[ Photo ]

Name
Rahim Ahmed

Employee ID
EMP-001

Designation
Marketing Officer

Zone
Dhaka North

Total Submissions
342

Rank
#12

Team Leader
Team Leader Name

Manager
Manager Name
```

---

# 15. Profile Editing

Employee can edit permitted personal information.

Recommended editable fields:

- Name.
- Mobile.
- Address.
- Profile photo.
- Zone, if business rules permit.

System-controlled fields:

- Employee ID.
- Role.
- Total submissions.
- Rank.
- Team Leader.
- Manager.

---

# 16. Language

Default:

**Bangla**

Inside Profile:

```text
ভাষা

বাংলা
English
```

Store the preference per user:

```text
language = bn
```

or:

```text
language = en
```

Use translation files rather than hard-coding translations throughout components.

Recommended:

```text
/locales/bn.json
/locales/en.json
```

Backend remains English-only.

---

# 17. Frontend Responsive Requirements

Must work properly on:

```text
320 × 568
360 × 800
375 × 812
390 × 844
412 × 915
430 × 932
768 × 1024
1366 × 768
1920 × 1080
```

Prioritize mobile.

Use:

- Large inputs.
- Large buttons.
- Comfortable spacing.
- Readable typography.
- Sticky/fixed bottom navigation.
- No horizontally overflowing forms.

---

# 18. Frontend Visual Design

Direction:

**Clean + Minimal + Friendly + Modern**

Avoid:

- Excessive gradients.
- Glassmorphism.
- Heavy shadows.
- Dense dashboards.
- Excessive animations.
- Tiny buttons.
- Tiny text.
- Complex charts.

Use:

- Light background.
- Neutral surfaces.
- One primary brand color.
- Clear success/error states.
- Moderate border radius.
- Strong visual hierarchy.

---

# 19. Frontend Error States

Use friendly Bangla messages.

Examples:

```text
অনুগ্রহ করে নাম লিখুন।
```

```text
মোবাইল নম্বরটি সঠিক নয়।
```

```text
এই মুহূর্তে রিপোর্ট জমা দেওয়ার সময় নয়।
```

```text
ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।
আবার চেষ্টা করুন।
```

Do not show technical backend errors to employees.

---

# 20. Frontend Loading States

Use lightweight loading indicators.

Submission:

```text
জমা হচ্ছে...
```

After success:

```text
রিপোর্ট সফলভাবে জমা হয়েছে।
```

Do not show success until the server confirms the submission.

---

# MODULE B — BACKEND / MANAGEMENT PANEL

# 21. Backend Goals

Backend is for Team Leaders and Managers.

Language:

**English only.**

Design:

- Minimal.
- Professional.
- Aesthetic.
- Data-focused.
- Responsive.
- Fast.

---

# 22. Backend Navigation

## Admin

```text
Dashboard
Submissions
Employees
Exports
Account
Logout
```

## Super Admin

```text
Dashboard
Submissions
Employees
Team Leaders
Admins
Exports
Account
Logout
```

---

# 23. Backend Dashboard

Super Admin sees organization-wide metrics.

Suggested cards:

```text
Total Employees
Total Team Leaders
Today's Submissions
This Week
This Month
```

Admin sees metrics only for assigned employees.

Example:

```text
Total Employees
48

Today's Reports
39

This Week
216

This Month
821
```

---

# 24. Submission Management

Main backend screen should be a searchable and filterable submission list.

Table columns:

| Employee ID | Name | Designation | Date | Time | Actions |
|---|---|---|---|---|---|

Every report is a separate row.

Example:

| Employee ID | Name | Designation | Date | Time | Actions |
|---|---|---|---|---|---|
| EMP-001 | Rahim | Marketing Officer | 17 Aug 2026 | 09:10 | View |
| EMP-001 | Rahim | Marketing Officer | 17 Aug 2026 | 11:35 | View |
| EMP-001 | Rahim | Marketing Officer | 17 Aug 2026 | 14:20 | View |
| EMP-002 | Karim | Marketing Officer | 17 Aug 2026 | 10:15 | View |

---

# 25. Submission Detail

Clicking View should open a detail page, modal or drawer.

Display:

```text
Submission Details

Employee ID
EMP-001

Name
Rahim Ahmed

Designation
Marketing Officer

Date
17 August 2026

Submitted
10:42 AM

Address
Mirpur, Dhaka

Mobile
01XXXXXXXXX

Opinion / Remarks
Visited 12 clients today...
```

---

# 26. Search

Search submissions by:

- Employee ID.
- Employee name.
- Mobile.
- Designation.

Use server-side search for scalability.

Debounce frontend search around 250–400ms.

---

# 27. Filters

## Date

```text
Today
Yesterday
This Week
This Month
Custom Date Range
```

## Employee

Searchable dropdown:

```text
All Employees
Employee A
Employee B
Employee C
```

## Team Leader

Available to Super Admin:

```text
All Team Leaders
Team Leader A
Team Leader B
```

Admin only sees their assigned employees.

---

# 28. Submission Sorting

Support:

- Newest first.
- Oldest first.
- Name A–Z.
- Name Z–A.

Default:

**Newest submissions first.**

---

# 29. Pagination

Submission lists must be paginated.

Recommended:

```text
20–50 submissions per page
```

Support:

```text
page
limit
search
sort
filters
```

Do not load thousands of reports into the browser simultaneously.

---

# 30. Excel Export

Backend must support `.xlsx` exports.

## Super Admin

Can export:

- All reports.
- Filtered reports.
- Individual employee reports.
- Team Leader reports.
- Date ranges.

## Admin

Can export:

- Reports belonging to assigned employees.
- Filtered assigned reports.
- Individual assigned employee reports.

Marketing Officers have no export access.

---

# 31. Excel Columns

Recommended:

```text
Employee ID
Employee Name
Designation
Zone
Date
Submission Time
Address
Mobile
Opinion / Remarks
Team Leader
Manager
```

Use readable column widths.

Example filenames:

```text
employee-reports-2026-08-17.xlsx
```

Individual:

```text
EMP-001-reports-2026-08-17.xlsx
```

---

# 32. Employee Management

Backend Employees page:

| Employee ID | Name | Zone | Team Leader | Status | Actions |
|---|---|---|---|---|---|

Status:

```text
Active
Inactive
```

---

# 33. Create Marketing Officer

Admin and Super Admin can create Marketing Officers.

Fields:

```text
Name
Employee ID
Designation
Mobile
Zone
Address
Team Leader
Manager
Login credential
Status
```

Admin:

- Team Leader should default to the logged-in Admin.
- Admin cannot assign users to another Admin.

Super Admin:

- Can choose Team Leader.
- Can choose Manager.

Do not include educational information.

---

# 34. Create Team Leader

Only Super Admin.

Fields:

```text
Name
Admin ID / Employee ID
Mobile
Zone
Login credential
Manager
Status
```

Super Admin can then assign Marketing Officers to the Team Leader.

---

# 35. Assignment Hierarchy

Recommended structure:

```text
Manager / Super Admin
        │
        ├── Team Leader A
        │      ├── Employee 001
        │      ├── Employee 002
        │      └── Employee 003
        │
        ├── Team Leader B
        │      ├── Employee 004
        │      └── Employee 005
        │
        └── Team Leader C
               └── Employee 006
```

The hierarchy must be enforced at API/database level.

Frontend hiding is not sufficient.

---

# 36. Permission Model

## Marketing Officer

Can access:

```text
Own profile
Own statistics
Own submissions
Create own submissions
```

Cannot access:

```text
/admin/*
Other employee data
```

## Admin

Can access:

```text
Assigned employees
Assigned submissions
Assigned statistics
Assigned exports
```

Cannot access:

```text
Another Admin's employees
Unassigned employees
Global system reports
Admin creation
```

## Super Admin

Can access everything.

---

# 37. Backend Authentication

Use secure authentication.

Requirements:

- Password hashing.
- Secure session/cookie or equivalent secure token strategy.
- Logout.
- Session expiration.
- Rate limiting.
- Password reset.
- No plaintext passwords.

---

# 38. Database

Recommended:

**PostgreSQL**

Core entities:

```text
users
roles
submissions
team_assignments
audit_logs
```

---

# 39. User Schema

Suggested:

```text
users
-----
id
employee_id
name
email_or_username
password_hash
role
designation
mobile
address
zone
profile_photo_url
team_leader_id
manager_id
language
status
created_at
updated_at
```

Roles:

```text
MARKETING_OFFICER
ADMIN
SUPER_ADMIN
```

---

# 40. Submission Schema

Suggested:

```text
submissions
-----------
id
employee_user_id
employee_id
name_snapshot
designation_snapshot
address
mobile
opinion
submission_date
submitted_at
created_at
updated_at
```

Snapshots of employee name/designation are recommended so historical submissions remain accurate if profile information later changes.

---

# 41. Important Submission Database Rule

There must be **NO unique constraint** like:

```text
UNIQUE(employee_user_id, submission_date)
```

because multiple reports per employee per day are valid.

The only requirement is that every submission has a unique submission ID.

Example:

```text
EMP-001
17 Aug 2026
09:10
Report A

EMP-001
17 Aug 2026
11:35
Report B

EMP-001
17 Aug 2026
14:20
Report C
```

All must exist independently.

---

# 42. Statistics Logic

## Today

Count all submissions where the submission date is today's Bangladesh date.

Example:

```text
Employee submitted 5 reports today
Today = 5
```

## This Week

Recommended Bangladesh business week:

**Saturday → Friday**

This should be documented/configurable.

## This Month

Count all submissions in the current Bangladesh calendar month.

## Total

Count all valid submissions for that employee.

---

# 43. Rank Logic

Rank active Marketing Officers by:

```text
Total submission count DESC
```

Recommended:

```text
RANK() OVER (
  ORDER BY total_submissions DESC
)
```

If two employees have 100 reports, both can have the same rank.

---

# 44. Server-Side Submission Time Logic

When:

```text
POST /api/submissions
```

is received:

1. Authenticate user.
2. Confirm role is Marketing Officer.
3. Get current server time.
4. Convert/use `Asia/Dhaka`.
5. Check submission window.
6. Validate input.
7. Create a NEW submission.
8. Store server-generated timestamp.
9. Return success.

Do not trust:

```text
clientDate
clientTime
browser timezone
employee ID supplied by client
```

The employee identity must come from the authenticated session.

---

# 45. API Structure

Exact implementation can vary, but maintain clear separation.

## Authentication

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
```

## Employee

```text
GET   /api/me
PATCH /api/me
GET   /api/me/stats
GET   /api/me/submissions
POST  /api/submissions
```

## Admin

```text
GET  /api/admin/submissions
GET  /api/admin/submissions/:id
GET  /api/admin/employees
POST /api/admin/employees
GET  /api/admin/employees/:id
GET  /api/admin/employees/:id/submissions
GET  /api/admin/export
```

## Super Admin

```text
GET   /api/super-admin/users
POST  /api/super-admin/users
PATCH /api/super-admin/users/:id
POST  /api/super-admin/admins
GET   /api/super-admin/team-leaders
PATCH /api/super-admin/assignments
GET   /api/super-admin/submissions
GET   /api/super-admin/export
```

---

# 46. API Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Human readable error",
  "code": "ERROR_CODE"
}
```

Use appropriate HTTP status codes.

---

# 47. Security

Implement:

- Password hashing.
- Authentication middleware.
- Role-based authorization.
- Server-side permission checks.
- Input validation.
- SQL injection protection.
- XSS protection.
- CSRF protection where applicable.
- Secure cookies.
- Rate limiting.
- Secure profile photo upload.
- File type validation.
- File size limits.
- Audit logs.

Most importantly, permissions must be enforced at the API/database layer.

---

# 48. Audit Logs

Recommended actions to log:

```text
Admin created employee
Super Admin created Admin
Super Admin changed employee assignment
Super Admin changed user status
Admin updated permitted employee information
```

Audit fields:

```text
actor
action
target
timestamp
metadata
```

---

# 49. Profile Photo

Optional.

Allowed:

```text
JPEG
PNG
WebP
```

Recommended maximum:

```text
2–5 MB
```

Resize/compress uploads.

Never accept executable files.

---

# 50. Date & Time

Store timestamps in UTC where practical.

Convert to:

```text
Asia/Dhaka
```

for:

- Submission window.
- Daily stats.
- Weekly stats.
- Monthly stats.
- Rank-related reporting.
- UI display.

Bangla frontend may use Bangla numerals/date formatting.

Backend uses English dates.

---

# 51. Backend Responsive Design

Backend should primarily be desktop-friendly but still work on mobile/tablet.

Desktop:

- Sidebar.
- Top header.
- Data tables.
- Filters.

Mobile:

- Collapsible navigation.
- Horizontally scrollable tables or card-based submission rows.
- Large filter controls.
- Touch-friendly actions.

---

# 52. Recommended Technology

Claude may choose an equivalent stack, but recommended:

## Frontend

For the employee app:

```text
HTML5
CSS3
JavaScript
```

A lightweight framework such as React is acceptable if it does not make the app unnecessarily complex.

## Backend

```text
Node.js
Express.js
```

or Fastify.

## Database

```text
PostgreSQL
```

## Excel

```text
ExcelJS
```

or equivalent XLSX library.

---

# 53. Project Structure

Suggested:

```text
employee-reporting-system/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── locales/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── config/
│   └── migrations/
│
├── admin/
│   ├── dashboard/
│   ├── submissions/
│   ├── employees/
│   └── exports/
│
└── README.md
```

---

# 54. Recommended Routes

## Employee

```text
/login
/app/submission
/app/stats
/app/profile
```

## Backend

```text
/admin/login
/admin/dashboard
/admin/submissions
/admin/employees
/admin/employees/:id
/admin/team-leaders
/admin/admins
/admin/exports
/admin/account
```

---

# 55. Important UX Separation

Do not mix employee and management interfaces.

Employee:

```text
Submission | Stats | Profile
```

Admin:

```text
Dashboard
Submissions
Employees
Exports
Account
```

Super Admin additionally gets:

```text
Team Leaders
Admins
```

---

# 56. Pagination and Indexing

Recommended database indexes:

```text
employee_user_id
employee_id
submission_date
submitted_at
team_leader_id
manager_id
status
```

Composite indexes where useful:

```text
(employee_user_id, submission_date)
(team_leader_id, submission_date)
```

These are indexes, NOT uniqueness constraints.

---

# 57. Offline Behavior

Do not support offline submission in MVP.

The server must verify:

- Authentication.
- Submission time.
- User identity.
- Validity.

If internet is unavailable:

```text
ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।
আবার চেষ্টা করুন।
```

Never show successful submission until the backend confirms it.

---

# 58. Recommended Development Phases

## Phase 1 — Foundation

- Project setup.
- PostgreSQL.
- Database schema.
- Authentication.
- Roles.
- Permission middleware.
- User hierarchy.

## Phase 2 — Employee Frontend

- Login.
- Bangla UI.
- English switch.
- Submission form.
- Multiple daily submissions.
- Time restriction.
- Profile.
- Stats.
- Rank.
- Mobile bottom navigation.

## Phase 3 — Admin Backend

- Admin login.
- Dashboard.
- Submission list.
- Search.
- Filters.
- Submission details.
- Employee management.
- Create employee.
- Excel export.

## Phase 4 — Super Admin

- All submissions.
- All employees.
- Admin management.
- Team Leader management.
- Assignments.
- System-wide exports.

## Phase 5 — Security and QA

- Permission testing.
- Authentication testing.
- Submission window testing.
- Multiple-submission testing.
- Validation.
- Rate limiting.
- Audit logs.
- Responsive testing.

---

# 59. Testing Requirements

## Authentication

Test:

- Valid login.
- Invalid login.
- Inactive account.
- Logout.
- Unauthorized route access.

## Submission

Test:

- Valid submission.
- Missing fields.
- Invalid mobile.
- Multiple submissions on the same day.
- Submission before 8 AM.
- Submission exactly at 8 AM.
- Submission during allowed hours.
- Submission exactly at 8 PM.
- Submission after 8 PM.
- Repeated button clicks.
- Network failure.

Important:

```text
Multiple submissions from the same employee on the same date MUST succeed.
```

## Permissions

Marketing Officer:

- Cannot access `/admin/*`.
- Cannot view other employees.

Admin:

- Can only view assigned employees.
- Cannot access another Admin's employees.
- Cannot create Admin.

Super Admin:

- Can access all employees.
- Can access all submissions.
- Can create Admins.
- Can create employees.
- Can manage assignments.

## Export

Test:

- All reports.
- Individual employee.
- Date range.
- Team Leader filter.
- Combined filters.
- Empty results.
- Large datasets.
- Correct columns.
- Correct dates and times.

---

# 60. Definition of Done

The application is complete when:

- Marketing Officers can log in from mobile.
- Employee frontend defaults to Bangla.
- English can be selected from Profile.
- There are exactly three primary employee sections.
- Submission form is simple and mobile-friendly.
- Employees can submit **multiple reports per day**.
- There is no one-report-per-day restriction.
- Reports are accepted only from 8:00 AM until before 8:00 PM Bangladesh time.
- Submission hours are enforced server-side.
- Every submission is stored as an independent record.
- Employees can see today's, weekly, monthly and total submission counts.
- Every valid submission contributes to statistics.
- Rank is calculated automatically from total submissions.
- Employees can edit allowed profile information.
- Admin can only see reports from assigned employees.
- Super Admin can see all reports.
- Admin can create Marketing Officers.
- Super Admin can create Marketing Officers and Admins.
- Super Admin can assign employees to Team Leaders.
- Backend supports search.
- Backend supports filters.
- Backend displays submission details.
- Backend supports filtered Excel export.
- Backend supports individual employee Excel export.
- Unauthorized API access is blocked.
- UI is responsive.
- Sensitive credentials are protected.
- Database has appropriate indexes.
- Multiple submissions from the same employee on the same day work correctly.
- No duplicate-prevention logic incorrectly blocks legitimate reports.

---

# 61. Final Claude Build Instruction

Build this system as a production-quality internal reporting application.

Prioritize:

1. **Simplicity**
2. **Mobile usability**
3. **Correct role permissions**
4. **Reliable server-side time validation**
5. **Multiple reports per employee per day**
6. **Accurate statistics**
7. **Accurate ranking**
8. **Clean management UI**
9. **Excel reporting**
10. **Security**

Do not add unnecessary features.

The employee experience should feel like:

```text
LOGIN
  ↓
SUBMISSION
  ↓
Fill report
  ↓
Submit
  ↓
Success
  ↓
Submit another report whenever needed
```

The management experience should feel like:

```text
ADMIN LOGIN
  ↓
DASHBOARD
  ↓
SUBMISSIONS
  ↓
Search / Filter
  ↓
View report
  ↓
Export Excel
```

The fundamental reporting rule is:

> **One employee may submit unlimited reports during the allowed 8:00 AM–8:00 PM Bangladesh time window. Every submission is an independent report and contributes to the employee's statistics and ranking.**
