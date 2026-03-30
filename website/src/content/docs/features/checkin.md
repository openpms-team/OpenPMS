---
title: Guest Check-In
description: Self-service check-in portal with OCR and SEF compliance
---

## Overview

OpenPMS provides a mobile-friendly guest check-in portal. Guests receive a unique link before arrival and complete the process on their phone. No app download required.

## 4-Step Wizard

### Step 1: Guest Details

The guest confirms or enters their personal information: full name, date of birth, nationality, and contact details. If the booking came from a channel, fields are pre-filled.

### Step 2: Document Scan

Guests photograph their ID card or passport using their phone camera. The built-in OCR extracts:

- Document number
- Full name
- Date of birth
- Nationality
- Expiry date

The extracted data is verified against Step 1 entries. Mismatches are flagged for manual review.

### Step 3: Additional Guests

If the reservation includes more than one guest, each additional guest completes their own details and document scan. Portuguese law (SEF) requires identification of all guests.

### Step 4: Confirmation

The guest reviews all information, accepts the house rules, and signs digitally. A confirmation screen displays property access instructions (door codes, directions, WiFi).

## SEF Compliance

All guest data collected during check-in feeds directly into the SEF bulletin generator. The system calculates the 3-business-day submission deadline automatically.

## Manager Dashboard

Managers see a real-time check-in status board showing which guests have completed, partially completed, or not started the process. Reminder messages can be triggered manually or automatically.
