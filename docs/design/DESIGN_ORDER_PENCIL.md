# Design Order for Pencil Designer

**Date**: January 26, 2026
**Project**: Handover Player
**File**: `pencil-welcome-desktop.pen`
**Target Frame**: **Step 3 Frame** (`CzlXB`) - Currently empty

---

## Overview

We need UI designs for Phase 2 security features. Please create the following screens inside the **Step 3 Frame** using the existing design system components.

---

## Deliverables

### 1. Passcode Entry Screen

**Purpose**: Viewers must enter a 6-digit passcode to access protected projects.

**Requirements**:
- 6-digit OTP input field (use `M5Mgn`: Input OTP Group)
- "Enter" / "Submit" button (use `ZETEA`: Button/Default)
- Error state: "Incorrect passcode" message (use `YZjRF`: Alert/Error)
- Lockout state: "Too many attempts. Try again in 30 seconds." with countdown
- Project title displayed at top (optional branding area)
- Dark mode theme

**Layout suggestion**:
- Centered modal style (use `5JUG0`: Modal/Center as reference)
- Clean, minimal, focused on the input

---

### 2. Expired Project Lock Screen

**Purpose**: Shown when a project's expiration date has passed.

**Requirements**:
- Project title prominently displayed
- Status badge: "Expired" (use `it00G`: Label/Secondary or `YZjRF`: Alert/Error styling)
- Comment count display: "X comments archived"
- Primary CTA button: "Extend Access" (use `ZGI9Z`: Button/Large/Default)
- Secondary text: "This project expired on [date]"
- Dark mode theme

**Layout suggestion**:
- Full-screen centered card (use `ERkuB`: Card as container)
- Subtle lock icon or visual indicator

---

### 3. ShareModal Extension - Expiration Settings

**Purpose**: Allow project owners to set/change expiration date.

**Requirements**:
- Expiration preset selector with options:
  - 3 days
  - 7 days (default)
  - 14 days
  - 30 days
  - 60 days
  - 100 days
- Use dropdown/select component (use `XhJWF`: Select Group/Default)
- Current expiration date display
- Warning banner for projects expiring soon (use `vbyqV`: Alert/Warning)
  - "Expires in 48 hours" / "Expires in 24 hours" / "Expires today"

**Layout suggestion**:
- Add as a new section in existing ShareModal design
- Below the passcode toggle section

---

## Design System Reference

### Colors (Dark Mode)
| Token | Value |
|-------|-------|
| `--background` | `#09090b` |
| `--foreground` | `#FAFAFA` |
| `--card` | `#18181b` |
| `--primary` | `#FF8400` |
| `--destructive` | `#EF4444` |
| `--muted-foreground` | `#A1A1AA` |
| `--border` | `#27272a` |

### Fonts
- Primary: `Inter`
- Secondary: `JetBrains Mono`

### Recommended Components
| Component | ID | Use Case |
|-----------|-----|----------|
| Input OTP Group | `M5Mgn` | Passcode input |
| Button/Default | `ZETEA` | Submit actions |
| Button/Large/Default | `ZGI9Z` | Primary CTAs |
| Alert/Error | `YZjRF` | Error messages |
| Alert/Warning | `vbyqV` | Expiration warnings |
| Label/Secondary | `it00G` | Status badges |
| Card | `ERkuB` | Container |
| Modal/Center | `5JUG0` | Centered dialogs |
| Select Group | `XhJWF` | Dropdown selection |

---

## Frame Details

**Step 3 Frame** (`CzlXB`):
- Position: x: 3747, y: -1531
- Size: 1440 x 900px
- Theme: Dark mode
- Background: `$--background`

Please organize the 3 screens within this frame (can be arranged horizontally or as you see fit).

---

## Deadline

**January 31, 2026**

---

## Questions?

Please reach out if you need any clarification on requirements or access to additional design resources.

Thank you!
