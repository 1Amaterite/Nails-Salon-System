# Testing Guide: Nails & Lashes Lane System

This guide outlines manual verification procedures and test cases to validate the security, routing, and functionality of the Nails Salon system.

---

## 1. Initial Test Setup & Seeding

Before performing tests, seed the database with initial branch, service, and user data:
1. Start the application servers using `npm run dev`.
2. Open `http://localhost:5173`.
3. If the database is empty, click **"Seed Initial Data"** in the top admin controls, or execute a `POST` request to `http://localhost:5001/api/seed-initial-data`.

Seeding automatically registers two credentials:
- **Owner Account**: Username `owner` | Passcode `owner123`
- **Admin Account**: Username `admin` | Passcode `admin123`

---

## 2. Test Suite Checklists

### Test Case 1: Route Guards & Direct URL Access
- **Preconditions**: Ensure `sessionStorage` is empty (run `sessionStorage.clear()` in browser dev console).
- **Procedure**:
  1. Manually type `http://localhost:5173/admin` or `http://localhost:5173/owner` in the browser address bar.
  2. Press enter.
- **Expected Result**: You must be redirected to `http://localhost:5173/login` immediately without seeing the dashboard.

### Test Case 2: Unified Management Portal
- **Procedure**:
  1. Click **"Management Portal"** in the public footer or visit `http://localhost:5173/login`.
  2. Type a invalid username/password. Confirm that the validation error displays.
  3. Type `admin` and `admin123`. Verify that it redirects to `/admin` and loads the Admin Space.
  4. Log out, return to `/login`, and type `owner` and `owner123`. Verify that it redirects to `/owner` and loads the Owner Space.
  5. While logged in as `owner`, manually navigate to `http://localhost:5173/admin`. Verify that you can access it (since owners have full administrator privileges).

### Test Case 3: Employee Search & Filters
- **Procedure**:
  1. Access the **"Employees & Shifts"** tab inside either the Admin or Owner dashboard.
  2. In the search input, type a partial name (e.g. `Sara` or `Owner`).
  3. Type a role (e.g. `STAFF` or `ADMIN`).
- **Expected Result**: The cards grid filters immediately to matching profiles. Clearing the input restores the full team list.

### Test Case 4: Employee Modification & Role Boundaries
- **Procedure**:
  1. Log in as `admin`.
  2. Try editing the `owner` profile card. The Edit and Delete icons must be hidden since admins cannot modify owner details.
  3. Edit a staff profile (e.g. `Sara Technician`). Toggle their availability checkbox (Active/Inactive), change phone numbers, and save. Verify the update shows on their card.
  4. Log out and sign in as `owner`.
  5. Edit the `admin` card. Verify that you can alter their manager credentials.

### Test Case 5: Database Constraint Deletion Safety
- **Procedure**:
  1. Locate `Sara Technician` in the employees list.
  2. Click the Delete icon and confirm the alert pop-up.
- **Expected Result**: The operation must fail, displaying a warning notification: *"Cannot delete this employee because they have transaction or appointment records. Please set them to inactive instead."* This verifies database integrity constraints.
