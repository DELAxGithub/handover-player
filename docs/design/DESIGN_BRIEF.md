# Design Brief: Handover Player

## 1. Project Overview & Context
**Handover Player** is a professional video review tool designed to minimize friction in the feedback loop between video editors and clients. Think of it as **"GigaFile for Video Professionals"** combined with the precision of an NLE (Non-Linear Editing) system.

The core value proposition is **"Gather primary feedback continuously and return to editing immediately."**

### Key Characteristics
- **Minimal Friction**: No login required for viewers. Direct Dropbox links. NLE-like shortcuts (JKL).
- **High Precision**: Frame-accurate playback.
- **Strong Exit**: Direct export of markers/comments to Premiere Pro and DaVinci Resolve.

## 2. Design Philosophy
**"Invisible & Professional"**
The UI should never compete with the content (video). It must feel solid, reliable, and professional, like industry-standard tools (DaVinci Resolve, Premiere Pro).

*   **Dark Mode Only**: To ensure accurate color perception of video content.
*   **Monotone Color Palette**: Avoid arbitrary colors. Use shades of Zinc/Grey.
*   **High Contrast & Legibility**: Critical for timecodes and comments.
*   **"Pro" Feel**: Dense information density where needed, but clean navigation.

## 3. Scope of Work (New Features)
We have an existing MVP (Video Player, Commenting, Basic Export). We need designs for the **Phase 2 (Security & Project Management)** and **Phase 2.5 (Monetization)** features.

The goal is to transition from a single-link tool to a **Project-based Platform** without losing the "login-free" simplicity for end-users.

### A. New "Project Dashboard" (Home Screen)
A simple, list-based dashboard for creators to manage their active review links.
*   **List View**: Needs to show about 10-20 active projects.
    *   Columns: Title, Source (Video Filename), Status (Active/Expired), Expiration Date, Comment Count, Last Activity.
*   **Status Indicators**: 
    *   `Active`: Green/White text.
    *   `Expiring Soon`: Yellow/Warning icon (appears when <48h remaining).
    *   `Expired`: Red/Muted text.
*   **Primary Actions**: 
    1.  **"New Project"**: Prominent button.
    2.  **"Copy Link"**: Quick action on each row.
    3.  **"Extend"**: Quick action for expiring items.
    4.  **"Settings"**: Gear icon for project details.

### B. Project Settings Modal
A centralized modal to manage the security and lifecycle of a specific project.
*   **Passcode Protection (Add-on)**: 
    *   Toggle Switch (Default: Off).
    *   **State: Off**: Show a "Enable Passcode ($3)" button or link.
    *   **State: On**: Show the 6-digit passcode and a "Regenerate" button.
*   **Expiration Management**:
    *   Display: "Expires on [Date] (X days remaining)".
    *   **Extension Options**: Buttons to "Extend +7 Days ($2)" and "Extend +30 Days ($5)".
*   **Project Info**: Read-only display of Source URL and Project ID.

### C. Monetization Experience (Micro-transactions)
We are introducing a "Lite-style" monetization model (Pay-as-you-go). The design should feel frictionless, similar to unlocking a feature in a mobile game, not a heavy enterprise checkout.
*   **Payment Trigger Modal**: 
    *   Appears when user clicks "Enable Passcode", "Extend Expiration", or "Export" (2nd time onwards).
    *   Content: Feature Name, Price, "Pay with Credit Card" button (Stripe style).
    *   *Note: Keep it simple. No complex cart, just direct purchase confirmation.*

### D. Viewer Experience (Security Screens)
Screens that a viewer sees when accessing a protected or expired link. **These must look polished and trustworthy.**
*   **Passcode Entry Screen**: 
    *   Centered card on a dark background.
    *   Project Title (if not hidden).
    *   Input field for 6-digit code.
    *   "Unlock" button.
*   **Expired Screen**: 
    *   Message: "This review link has expired."
    *   Secondary text: "Please contact the project owner to request an extension."
    *   CTA for Owner: "Are you the owner? Extend now."

## 4. Current Design System (Guidelines)
Please strictly adhere to our existing variable-based system (Tailwind CSS based).

*   **Backgrounds**: `bg-zinc-950` (#09090b - Main), `bg-zinc-900` (#18181b - Panels)
*   **Accents**: `bg-indigo-600` (Primary Actions)
*   **Typography**: Inter (UI), JetBrains Mono (Timecode/Data)
*   **Icons**: Lucide React / simple strokes.

## 5. Deliverables & Format (Strict Requirements)
Since we are implementing this directly into code, the Figma file must be clean and structured for developer handoff.

### Deliverables
1.  **Project Dashboard (Desktop)**: The main list view with various states (Active, Expiring, Expired).
2.  **Settings Modal**: Exploring the toggle states (Passcode Off/On) and Extension options.
3.  **Payment Prompt**: A reusable modal for the payment step.
4.  **Viewer Screens**: Passcode Entry & Expired Landing page.
5.  **Mobile View**: A quick mockup of how the Dashboard looks on mobile (stacked list).

### Figma File Requirements
*   **Auto Layout**: **MUST** use Auto Layout for all containers, lists, and buttons. We need to see the intended padding and responsiveness.
*   **Components**: Use Components for repeated elements (List rows, Buttons, Inputs).
*   **Styles**: Use Figma Styles for Colors and Typography (e.g., "Zinc-900", "Text-Small").
*   **Layer Naming**: Please name layers meaningfully (e.g., "Project Row", "Status Badge") - do not leave as "Frame 123".
*   **Export**: Provide the `.fig` file.

## 6. References / Moodboard
*   **Tone**: Linear, DaVinci Resolve, Frame.io
*   **Simplicity**: GigaFile, WeTransfer
