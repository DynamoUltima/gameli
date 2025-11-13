# Patient Management Features - Implementation Summary

## Overview
Added comprehensive user management features including delete functionality for all user types and a hospital card ID system for patients.

## Features Implemented

### 1. Hospital Card ID System
**Database Migration**: `20251113000000_add_hospital_card_id_to_profiles.sql`
- Added `hospital_card_id` field to the `profiles` table
- Field type: `VARCHAR(50)` with UNIQUE constraint
- Includes database index for faster lookups
- This is a physical card number given to patients on their first hospital visit
- Different from the database UUID

### 2. Delete Functionality
Added delete buttons for all user types in the User Management tab:

#### Admins
- Delete button in Actions column
- Confirmation dialog before deletion
- Removes user from `user_roles` table
- Preserves profile data for integrity

#### Doctors
- Delete button in Actions column
- Confirmation dialog before deletion
- Removes from both `user_roles` and `doctors` tables
- Automatically refreshes the doctors list

#### Patients
- Delete button in Actions column
- Confirmation dialog before deletion
- Removes user from `user_roles` table
- Automatically refreshes the patients list

### 3. Patient Card ID Management

#### Display Features
- New "Hospital Card ID" column in patient table
- Shows badge with card ID if assigned
- Shows "Not assigned" if no card ID set
- Card ID is searchable in the patient search bar

#### Edit Features
- Edit button opens a dialog to update card ID
- Dialog shows:
  - Input field for hospital card ID
  - Patient information summary (name, email, phone)
  - Helper text explaining the field
- Save/Cancel buttons with loading states
- Success/error notifications
- Auto-refresh after update

## UI Changes

### Administrators Tab
| Column | Description |
|--------|-------------|
| Name | Admin full name with avatar |
| Email | Admin email address |
| Phone | Phone number |
| Role | Badge showing "Admin" |
| **Actions** | Delete button (NEW) |

### Doctors Tab
| Column | Description |
|--------|-------------|
| Doctor | Doctor name |
| Specialty | Medical specialty |
| Contact | Email and phone |
| License | License number |
| Experience | Years of experience |
| Status | Available/Unavailable |
| **Actions** | Clock, Eye, Edit, Delete buttons (Delete is NEW) |

### Patients Tab
| Column | Description |
|--------|-------------|
| Patient | Patient name with avatar |
| **Hospital Card ID** | Physical card number (NEW) |
| Email | Patient email |
| Phone | Phone number |
| Gender | Gender badge |
| Registered | Registration date |
| **Actions** | Edit, View, Delete buttons (NEW) |

## Technical Details

### State Management
New state variables added:
- `patientUsers` - Array of patient data
- `loadingPatients` - Loading indicator
- `patientSearchQuery` - Search filter
- `editPatientOpen` - Edit dialog state
- `selectedPatient` - Currently selected patient
- `updatingPatient` - Update loading state
- `hospitalCardId` - Hospital card ID input value

### API Functions

#### `handleDeleteUser(userId, userType)`
- Parameters: User ID and type ('admin' | 'doctor' | 'patient')
- Shows confirmation dialog
- Deletes from `user_roles` table
- Deletes from `doctors` table if doctor
- Refreshes the appropriate list
- Shows success/error toast

#### `handleUpdatePatientCardId()`
- Updates `hospital_card_id` in profiles table
- Validates and trims input
- Refreshes patient list
- Shows success/error toast
- Closes dialog and resets state

### Data Fetching
Updated patient fetch to include:
- `hospital_card_id` field
- Ordered by creation date (newest first)
- Full profile information

### Search Enhancement
Patient search now includes:
- Name search
- Email search
- Phone search
- **Hospital Card ID search** (NEW)

## Usage Guide

### Assigning a Hospital Card ID
1. Navigate to User Management → Patients tab
2. Click the Edit button for a patient
3. Enter the hospital card ID (e.g., "HC-2025-001")
4. Click "Save Changes"
5. The card ID will appear in the patient table

### Deleting a User
1. Navigate to the appropriate tab (Admins/Doctors/Patients)
2. Click the delete button (trash icon) for the user
3. Confirm the deletion in the dialog
4. User will be removed from the system

## Security Notes
- User profiles and auth records are preserved for data integrity
- Only roles and relationships are deleted
- Confirmation required before deletion
- Toasts notify success/failure of operations
- Hospital Card IDs must be unique across all patients

## Future Enhancements
Possible additions:
- Bulk card ID assignment
- Card ID format validation
- Patient card printing functionality
- Card ID generation helper
- Audit trail for deletions
- Soft delete with restore option

