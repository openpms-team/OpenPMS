---
title: SEF/SIBA Compliance
description: Automatic XML and DAT file generation for Portuguese authorities
---

## Overview

Portuguese short-term rental operators (Alojamento Local) must report guest data to two authorities: **SEF** (immigration police) and **SIBA** (civil protection). OpenPMS automates both.

## SEF — Boletim de Alojamento

### What is required

Within **3 business days** of guest check-in, operators must submit a bulletin (Boletim de Alojamento) to SEF containing identification details for every guest.

### How OpenPMS handles it

1. Guest data is collected during the [check-in process](/features/checkin/)
2. OpenPMS generates the XML file in the format required by SEF's system
3. The deadline is calculated automatically (excluding weekends and Portuguese public holidays)
4. A dashboard shows pending, submitted, and overdue bulletins
5. Submit directly from OpenPMS or download the XML to upload manually

### Data included

- Guest full name, date of birth, nationality
- Document type, number, and issuing country
- Check-in and check-out dates
- Property RNAL number and address

## SIBA — Comunicacao de Alojamento

### What is required

Guest data must also be reported to SIBA (Autoridade Nacional de Emergencia e Protecao Civil) for civil protection purposes.

### How OpenPMS handles it

1. The same guest data collected at check-in is used
2. OpenPMS generates a `.DAT` file in the legacy format required by SIBA
3. Download the file and upload it to SIBA's portal

## Deadline Alerts

The system sends notifications when a submission deadline is approaching (1 day before) and when it has been missed. The compliance dashboard provides a clear overview of all pending obligations.
