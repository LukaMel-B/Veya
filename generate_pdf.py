import subprocess
import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TravelNest - Finalized App Wireframe & Specification Document</title>
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 12mm 10mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    color: #1c1c1e;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 9.5pt;
    line-height: 1.4;
  }

  .page {
    page-break-after: always;
    position: relative;
    min-height: 275mm;
    padding-bottom: 10mm;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #007AFF;
    padding-bottom: 6px;
    margin-bottom: 14px;
  }

  .header-bar .doc-title {
    font-size: 11pt;
    font-weight: 800;
    color: #007AFF;
    letter-spacing: -0.3px;
  }

  .header-bar .doc-subtitle {
    font-size: 8pt;
    color: #8e8e93;
    font-weight: 500;
  }

  .footer-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e5e5ea;
    padding-top: 4px;
    font-size: 7.5pt;
    color: #8e8e93;
  }

  /* Cover Page Styling */
  .cover-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 260mm;
    padding: 20mm 10mm;
  }

  .cover-title-badge {
    display: inline-block;
    background-color: rgba(0, 122, 255, 0.1);
    color: #007AFF;
    font-weight: 700;
    font-size: 9pt;
    padding: 4px 12px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 16px;
  }

  .cover-main-title {
    font-size: 28pt;
    font-weight: 900;
    color: #000000;
    line-height: 1.1;
    margin: 0 0 12px 0;
    letter-spacing: -0.8px;
  }

  .cover-subtitle {
    font-size: 13pt;
    color: #3a3a3c;
    line-height: 1.4;
    margin: 0 0 30px 0;
    font-weight: 400;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    background: #f2f2f7;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 30px;
    border: 1px solid #e5e5ea;
  }

  .meta-item label {
    display: block;
    font-size: 7.5pt;
    color: #8e8e93;
    text-transform: uppercase;
    font-weight: 600;
  }

  .meta-item span {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1c1c1e;
  }

  .feature-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .pill {
    background: #ffffff;
    border: 1px solid #d1d1d6;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 8pt;
    font-weight: 600;
    color: #007AFF;
  }

  /* Section Titles */
  h2.section-title {
    font-size: 14pt;
    font-weight: 800;
    color: #000000;
    margin: 0 0 10px 0;
    border-bottom: 1.5px solid #1c1c1e;
    padding-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3.subsection-title {
    font-size: 11pt;
    font-weight: 700;
    color: #007AFF;
    margin: 12px 0 6px 0;
  }

  /* Spec Layout Grid */
  .wireframe-spec-grid {
    display: grid;
    grid-template-columns: 245px 1fr;
    gap: 16px;
    align-items: start;
    margin-top: 8px;
  }

  /* iPhone Wireframe Mockup Container */
  .phone-frame {
    width: 245px;
    height: 505px;
    background: #ffffff;
    border: 3px solid #2c2c2e;
    border-radius: 36px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .phone-notch {
    width: 90px;
    height: 16px;
    background: #2c2c2e;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    z-index: 100;
  }

  .phone-status-bar {
    height: 24px;
    padding: 4px 14px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 6.5pt;
    font-weight: 700;
    color: #1c1c1e;
    margin-top: 2px;
  }

  .phone-content {
    flex: 1;
    overflow-y: hidden;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #f2f2f7;
  }

  .phone-nav-bar {
    height: 38px;
    background: rgba(255,255,255,0.92);
    border-top: 0.5px solid #c6c6c8;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 4px;
  }

  .nav-tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 5.5pt;
    color: #8e8e93;
    gap: 1px;
  }

  .nav-tab-item.active {
    color: #007AFF;
    font-weight: 700;
  }

  .nav-tab-icon {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: currentColor;
    opacity: 0.85;
  }

  .phone-fab {
    position: absolute;
    bottom: 46px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 100px;
    background: #007AFF;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14pt;
    font-weight: 400;
    box-shadow: 0 4px 10px rgba(0,122,255,0.4);
    z-index: 90;
  }

  /* Spec Documentation Box */
  .spec-box {
    background: #ffffff;
    border: 1px solid #e5e5ea;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 8.5pt;
  }

  .spec-box h4 {
    margin: 0 0 6px 0;
    font-size: 9.5pt;
    color: #007AFF;
    border-bottom: 1px solid #e5e5ea;
    padding-bottom: 3px;
  }

  .spec-list {
    margin: 0;
    padding-left: 14px;
  }

  .spec-list li {
    margin-bottom: 4px;
    line-height: 1.35;
  }

  .spec-tag {
    display: inline-block;
    background: #e5e5ea;
    color: #3a3a3c;
    font-size: 7pt;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 4px;
  }

  /* Table styling */
  table.custom-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-top: 8px;
  }

  table.custom-table th, table.custom-table td {
    border: 1px solid #d1d1d6;
    padding: 5px 8px;
    text-align: left;
  }

  table.custom-table th {
    background: #f2f2f7;
    font-weight: 700;
    color: #1c1c1e;
  }

  /* Wireframe Component Elements inside Phone */
  .wf-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 6px;
    border: 0.5px solid #d1d1d6;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .wf-hero {
    height: 70px;
    background: linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%);
    border-radius: 8px;
    padding: 6px;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .wf-badge {
    font-size: 5pt;
    background: rgba(255,255,255,0.25);
    padding: 2px 5px;
    border-radius: 100px;
    color: #ffffff;
    font-weight: 700;
    display: inline-block;
  }

  .wf-badge-primary {
    background: #007AFF;
    color: #ffffff;
  }

  .wf-badge-success {
    background: #34C759;
    color: #ffffff;
  }

  .wf-badge-warning {
    background: #FF9500;
    color: #ffffff;
  }

  .wf-btn {
    background: #007AFF;
    color: #ffffff;
    font-size: 6pt;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 5px;
    text-align: center;
    display: inline-block;
  }

  .wf-btn-secondary {
    background: #e5e5ea;
    color: #1c1c1e;
  }

  .wf-segmented {
    display: flex;
    background: #e3e3e8;
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
  }

  .wf-segment {
    flex: 1;
    text-align: center;
    font-size: 5.5pt;
    padding: 3px 0;
    border-radius: 4px;
    color: #3a3a3c;
  }

  .wf-segment.active {
    background: #ffffff;
    color: #000000;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  .wf-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 0.5px solid #e5e5ea;
  }

  .wf-row:last-child {
    border-bottom: none;
  }

  .wf-text-title {
    font-size: 7pt;
    font-weight: 700;
    color: #1c1c1e;
  }

  .wf-text-sub {
    font-size: 5.5pt;
    color: #8e8e93;
  }

  .wf-input {
    width: 100%;
    background: #ffffff;
    border: 1px solid #c6c6c8;
    border-radius: 5px;
    padding: 4px 6px;
    font-size: 6pt;
    color: #1c1c1e;
    margin-top: 2px;
  }

  .wf-modal-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: 150;
    display: flex;
    align-items: flex-end;
  }

  .wf-modal-sheet {
    width: 100%;
    background: #ffffff;
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
</head>
<body>

<!-- PAGE 1: COVER PAGE -->
<div class="page">
  <div class="cover-container">
    <div>
      <div class="cover-title-badge">Local-First Private Travel Workspace</div>
      <h1 class="cover-main-title">TravelNest</h1>
      <div class="cover-subtitle">
        Finalized Application Wireframe & System Specification Document<br>
        <span style="font-size: 10pt; color: #8e8e93;">Complete Screen-by-Screen UI/UX Architecture & Feature Evolution</span>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <label>Target Platform</label>
          <span>Android & iOS Progressive Web App (PWA)</span>
        </div>
        <div class="meta-item">
          <label>Version & Status</label>
          <span>v1.0.0 Finalized & Complete</span>
        </div>
        <div class="meta-item">
          <label>Data Engine</label>
          <span>Dexie.js (IndexedDB) + OPFS Blobs</span>
        </div>
        <div class="meta-item">
          <label>UI Framework</label>
          <span>iOS Cupertino Design Tokens & React 19</span>
        </div>
        <div class="meta-item">
          <label>Document Date</label>
          <span>October 10, 2026</span>
        </div>
        <div class="meta-item">
          <label>Lead Author / Team</label>
          <span>Luha Saniyya & Antigravity AI Team</span>
        </div>
      </div>

      <h3 class="subsection-title">Core Modules & Finalized Capability Overview</h3>
      <div class="feature-pills">
        <div class="pill">✓ Global Collection Inbox</div>
        <div class="pill">✓ Context-Aware Home Dashboard</div>
        <div class="pill">✓ Multi-Trip Management Hub</div>
        <div class="pill">✓ Drag-and-Drop Itinerary Builder</div>
        <div class="pill">✓ Overlap Conflict Advisory Engine</div>
        <div class="pill">✓ Planned vs Actual Budget Donut</div>
        <div class="pill">✓ Equal & Custom Group Settlement Engine</div>
        <div class="pill">✓ Bookings Manager & PDF Linker</div>
        <div class="pill">✓ Interactive Leaflet Spatial Map</div>
        <div class="pill">✓ Packing Checklists & Prep Templates</div>
        <div class="pill">✓ Document Vault (Passports/Tickets)</div>
        <div class="pill">✓ Formatted WhatsApp Share Engine</div>
        <div class="pill">✓ JSON + Blob Backup/Restore ZIP</div>
      </div>
    </div>

    <div style="border-top: 1px solid #e5e5ea; padding-top: 12px; font-size: 8pt; color: #8e8e93; display: flex; justify-content: space-between;">
      <span>TravelNest Architecture Documentation</span>
      <span>Confidential & Private Personal Application</span>
    </div>
  </div>
</div>

<!-- PAGE 2: EXECUTIVE SUMMARY & INITIAL VS FINALIZED REVISION MATRIX -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">1. Initial Stage vs Finalized App Evolution</span>
  </div>

  <h2 class="section-title">1. Initial Stage vs. Finalized App Evolution</h2>

  <p>
    TravelNest evolved from an initial concept addressing travel data fragmentation into a fully-realized, offline-first personal workspace. The initial stage specified lightweight CRUD actions and basic text formatting. The finalized application delivers an iOS Cupertino-inspired workspace equipped with 14 comprehensive UI views, an offline Leaflet interactive map, full multi-currency group expense settlement, drag-and-drop chronological timeline editing, and binary attachment vaults.
  </p>

  <h3 class="subsection-title">Revision & Upgrade Matrix</h3>
  <table class="custom-table">
    <thead>
      <tr>
        <th style="width: 20%;">Module / Feature</th>
        <th style="width: 38%;">Initial Stage Requirement (PRD Draft)</th>
        <th style="width: 42%;">Finalized App Implementation & UI Updates</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>UI Design System</strong></td>
        <td>Generic mobile responsive layouts with basic Tailwind utilities.</td>
        <td><strong>iOS Cupertino Design Engine:</strong> SF font stack, glassmorphism bottom nav bar, inset grouped card containers, segmented controls, modal sheets, and status countdown badges.</td>
      </tr>
      <tr>
        <td><strong>Home Dashboard</strong></td>
        <td>Basic trip overview card and static link list.</td>
        <td><strong>Context-Aware Workspace:</strong> Dynamic next-trip countdown card, global outlay budget metrics, packing progress percentage gauge, and saved inbox quick preview.</td>
      </tr>
      <tr>
        <td><strong>Itinerary Module</strong></td>
        <td>Simple vertical list of activities.</td>
        <td><strong>Interactive Chronological Timeline:</strong> Multi-day pill tab bar, custom activity icons, drag-and-drop order editing, and <em>Overlap Conflict Advisory System (⚠️ badge)</em>.</td>
      </tr>
      <tr>
        <td><strong>Budget & Money</strong></td>
        <td>Total expense calculator with single currency.</td>
        <td><strong>3-Tier Financial Ledger:</strong> Planned Budget vs Committed Bookings vs Actual Expenses. Multi-currency stored exchange rates, and <em>Group Expense Splitter with Settle Up ledger</em>.</td>
      </tr>
      <tr>
        <td><strong>Bookings & Docs</strong></td>
        <td>Text confirmation notes.</td>
        <td><strong>Integrated Reservations & Document Vault:</strong> Filterable flight/hotel cards, PNR tracking, payment statuses, and offline binary Blob/OPFS file attachment viewer (PDF/PNG).</td>
      </tr>
      <tr>
        <td><strong>Map Experience</strong></td>
        <td>Static pin list or map embedded in tab.</td>
        <td><strong>Spatial Leaflet Interactive Map:</strong> Custom marker pins (Places, Itinerary stops, Hotels), layer filtering, lat/lng popups, and quick "Add to Itinerary" / maps launcher.</td>
      </tr>
      <tr>
        <td><strong>Sharing & Export</strong></td>
        <td>Plain text clipboard copy.</td>
        <td><strong>WhatsApp Formatting Engine & Web Share API:</strong> Privacy controls (hide document IDs/costs), custom markdown generator (*bold*, emoji headers), and native share invocation.</td>
      </tr>
      <tr>
        <td><strong>Backup & Security</strong></td>
        <td>JSON data export string.</td>
        <td><strong>Full Blob ZIP Backup Engine:</strong> Export/import single `.travelnest` zip archive containing IndexedDB database tables and `/attachments` binary files with transactional rollback.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="subsection-title">Connected Architecture Overview</h3>
  <div class="spec-box" style="margin-top: 8px;">
    <h4>Data Integrity & Single Source of Truth</h4>
    <p style="margin: 0; line-height: 1.4;">
      Data in TravelNest is strictly normalized around the <strong>Place</strong> entity. A saved place created in the Global Collection can be attached to an Itinerary Event, referenced in a Hotel Booking, displayed on the Leaflet Map, and linked to an Expense record without duplicating underlying data.
    </p>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 2</span>
  </div>
</div>

<!-- PAGE 3: SCREEN 1 - HOME DASHBOARD WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Home Dashboard</span>
  </div>

  <h2 class="section-title">Screen 1: Home Dashboard (`HomeView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
          <div>
            <div style="font-size: 8pt; font-weight: 800; color: #1c1c1e;">Travel Workspace ✨</div>
            <div style="font-size: 5pt; color: #8e8e93;">Local-first private workspace</div>
          </div>
        </div>

        <!-- Hero Card -->
        <div class="wf-hero">
          <div style="display: flex; justify-content: space-between;">
            <span class="wf-badge wf-badge-primary">⏳ 14 Days Away</span>
            <span class="wf-badge">UPCOMING</span>
          </div>
          <div>
            <div style="font-size: 8.5pt; font-weight: 800;">Kyoto Cherry Blossom</div>
            <div style="font-size: 5.5pt; opacity: 0.9;">📍 Kyoto, Japan • 📅 Mar 25</div>
          </div>
        </div>

        <!-- Budget Banner under Hero -->
        <div class="wf-card" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 5pt; color: #8e8e93;">Planned Budget</div>
            <div style="font-size: 7.5pt; font-weight: 800; color: #007AFF;">₹1,50,000</div>
          </div>
          <div class="wf-btn">Open Trip ›</div>
        </div>

        <!-- Quick Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <div class="wf-card">
            <div style="font-size: 5pt; color: #8e8e93;">Total Outlay</div>
            <div style="font-size: 8pt; font-weight: 800;">₹1,07,000</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">of ₹1,50,000 planned</div>
          </div>
          <div class="wf-card">
            <div style="font-size: 5pt; color: #8e8e93;">Packing Progress</div>
            <div style="font-size: 8pt; font-weight: 800; color: #34C759;">85%</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">17/20 items packed</div>
          </div>
        </div>

        <!-- Saved Inbox Section -->
        <div class="wf-card" style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="font-size: 6pt; font-weight: 700; color: #007AFF;">🔖 Saved Inbox (2)</div>
            <div style="font-size: 5pt; color: #007AFF;">View All ›</div>
          </div>

          <div class="wf-row">
            <div>
              <span class="wf-badge" style="background: #e5e5ea; color: #3a3a3c;">PLACE</span>
              <div class="wf-text-title" style="display: inline-block; margin-left: 2px;">Fushimi Inari Taisha</div>
              <div class="wf-text-sub">Torii gate path early morning hike</div>
            </div>
            <span style="font-size: 6pt; color: #c7c7cc;">›</span>
          </div>

          <div class="wf-row">
            <div>
              <span class="wf-badge" style="background: #e5e5ea; color: #3a3a3c;">LINK</span>
              <div class="wf-text-title" style="display: inline-block; margin-left: 2px;">Gion Tea Ceremony</div>
              <div class="wf-text-sub">https://tokyocheapo.com/tea</div>
            </div>
            <span style="font-size: 6pt; color: #c7c7cc;">›</span>
          </div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Header</span> Contextual greeting with "Travel Workspace" title & sub-label.</li>
        <li><span class="spec-tag">Featured Card</span> Automatically scans IndexedDB for the nearest active trip by <code>startDate</code>. Displays cover photo, status tag (Planning/Upcoming/Ongoing), destination, and live countdown calculation (<code>⏳ N Days Away</code>).</li>
        <li><span class="spec-tag">Planned Budget</span> Banner showcasing total planned expenditure for the trip with one-tap "Open Trip" navigation trigger.</li>
        <li><span class="spec-tag">Metrics Grid</span> Displays total committed outlay across all active trips (independent expenses + bookings) and overall packing checklist completion percentage bar.</li>
        <li><span class="spec-tag">Saved Inbox</span> Inset grouped preview of unassigned collection items captured from external links or quick notes with single-tap trip assignment.</li>
        <li><span class="spec-tag">FAB</span> Persistent floating action button triggering the global Quick Capture bottom sheet modal.</li>
      </ul>

      <h4 style="margin-top: 10px;">Interactions & States</h4>
      <ul class="spec-list">
        <li><strong>Empty State:</strong> Displays "No Trips Scheduled" with an immediate "+ Create First Trip" primary action button.</li>
        <li><strong>Tap Open Trip:</strong> Sets <code>activeTripId</code> in AppContext and switches active tab to <code>trips</code>.</li>
        <li><strong>Tap Inbox Row:</strong> Navigates to Global Collection for tag management or trip assignment.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 3</span>
  </div>
</div>

<!-- PAGE 4: SCREEN 2 - MY TRIPS HUB WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — My Trips Hub</span>
  </div>

  <h2 class="section-title">Screen 2: My Trips Hub (`TripsView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Header with view toggle -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
          <div style="font-size: 9pt; font-weight: 800; color: #1c1c1e;">My Trips (3)</div>
          <div class="wf-btn" style="padding: 2px 6px; font-size: 5.5pt;">+ New Trip</div>
        </div>

        <!-- Filter Chips -->
        <div style="display: flex; gap: 3px; overflow-x: hidden;">
          <span class="wf-badge wf-badge-primary">All</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Planning</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Upcoming</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Ongoing</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Completed</span>
        </div>

        <!-- Trip Card 1 -->
        <div class="wf-card" style="padding: 0; overflow: hidden;">
          <div class="wf-hero" style="height: 55px;">
            <div style="display: flex; justify-content: space-between;">
              <span class="wf-badge wf-badge-primary">UPCOMING</span>
              <span style="font-size: 5pt;">⏳ 14 Days</span>
            </div>
            <div>
              <div style="font-size: 7.5pt; font-weight: 800;">Kyoto Cherry Blossom Tour</div>
              <div style="font-size: 5pt; opacity: 0.9;">📍 Kyoto, Tokyo • Mar 25 - Apr 04</div>
            </div>
          </div>
          <div style="padding: 5px 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="wf-text-sub">Budget: </span>
              <span class="wf-text-title" style="color:#007AFF;">₹1,50,000</span>
              <span class="wf-text-sub"> • 👥 2 Travelers</span>
            </div>
            <span style="font-size: 6pt; color: #007AFF; font-weight:700;">Open ›</span>
          </div>
        </div>

        <!-- Trip Card 2 -->
        <div class="wf-card" style="padding: 0; overflow: hidden;">
          <div class="wf-hero" style="height: 55px; background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);">
            <div style="display: flex; justify-content: space-between;">
              <span class="wf-badge wf-badge-warning">PLANNING</span>
              <span style="font-size: 5pt;">⏳ 45 Days</span>
            </div>
            <div>
              <div style="font-size: 7.5pt; font-weight: 800;">Goa Beach & Heritage Break</div>
              <div style="font-size: 5pt; opacity: 0.9;">📍 Goa, India • Nov 10 - Nov 15</div>
            </div>
          </div>
          <div style="padding: 5px 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="wf-text-sub">Budget: </span>
              <span class="wf-text-title" style="color:#007AFF;">₹45,000</span>
              <span class="wf-text-sub"> • 👥 4 Travelers</span>
            </div>
            <span style="font-size: 6pt; color: #007AFF; font-weight:700;">Open ›</span>
          </div>
        </div>

        <!-- Trip Card 3 -->
        <div class="wf-card" style="padding: 0; overflow: hidden;">
          <div class="wf-hero" style="height: 50px; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);">
            <div style="display: flex; justify-content: space-between;">
              <span class="wf-badge" style="background:#8e8e93;">COMPLETED</span>
              <span style="font-size: 5pt;">Finished</span>
            </div>
            <div>
              <div style="font-size: 7.5pt; font-weight: 800;">Swiss Alps Summer Trek</div>
              <div style="font-size: 5pt; opacity: 0.9;">📍 Zermatt, Switzerland</div>
            </div>
          </div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">View Toggle</span> Supports Segmented Grid View vs. Single Column List View for trip cards.</li>
        <li><span class="spec-tag">Status Filters</span> Horizontal filter bar allowing instant filtering by trip status: <em>All, Planning, Upcoming, Ongoing, Completed, Archived</em>.</li>
        <li><span class="spec-tag">Trip Cards</span> Displays custom cover photo, trip name, target destinations, date range, live departure countdown badge, budget allocation, and total registered travelers.</li>
        <li><span class="spec-tag">Create Trip CTA</span> Top-right header button and FAB both open the <code>EditTripModal</code> for adding new trips.</li>
      </ul>

      <h4 style="margin-top: 10px;">Data Model & Cascading Logic</h4>
      <ul class="spec-list">
        <li><strong>IndexedDB Entity:</strong> Queries <code>db.trips</code> table ordered by <code>startDate</code>.</li>
        <li><strong>Cascading Navigation:</strong> Tapping any trip card sets <code>activeTripId</code> and opens the <code>TripDetailView</code> workspace.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 4</span>
  </div>
</div>

<!-- PAGE 5: SCREEN 3 - CREATE / EDIT TRIP MODAL WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Create & Edit Trip Modal</span>
  </div>

  <h2 class="section-title">Screen 3: Create & Edit Trip Modal (`EditTripModal.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup with Sheet -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content" style="opacity: 0.3;">
        <div class="wf-card" style="height: 100px;"></div>
      </div>

      <!-- Modal Sheet Overlay -->
      <div class="wf-modal-overlay">
        <div class="wf-modal-sheet" style="height: 420px; overflow-y: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 0.5px solid #e5e5ea; padding-bottom: 4px;">
            <span style="font-size: 7.5pt; font-weight: 800;">Edit Trip Details</span>
            <span style="font-size: 6pt; color: #8e8e93;">Cancel</span>
          </div>

          <div style="display: flex; flexDirection: column; gap: 4px;">
            <div>
              <span class="wf-text-sub">Trip Title *</span>
              <input class="wf-input" value="Kyoto Cherry Blossom Tour" />
            </div>

            <div>
              <span class="wf-text-sub">Destinations *</span>
              <input class="wf-input" value="Kyoto, Tokyo, Osaka" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div>
                <span class="wf-text-sub">Start Date</span>
                <input class="wf-input" value="2026-03-25" />
              </div>
              <div>
                <span class="wf-text-sub">End Date</span>
                <input class="wf-input" value="2026-04-04" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 4px;">
              <div>
                <span class="wf-text-sub">Currency</span>
                <select class="wf-input"><option>INR (₹)</option></select>
              </div>
              <div>
                <span class="wf-text-sub">Planned Budget</span>
                <input class="wf-input" value="150000" />
              </div>
            </div>

            <div>
              <span class="wf-text-sub">Travelers (for Expense Splits)</span>
              <input class="wf-input" value="Me, Sarah, Alex" />
            </div>

            <div>
              <span class="wf-text-sub">Cover Image URL</span>
              <input class="wf-input" value="https://images.unsplash.com/photo-kyoto..." />
            </div>
          </div>

          <div class="wf-btn" style="margin-top: 6px; padding: 6px;">Save Changes</div>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Cupertino Sheet</span> Bottom sheet modal rendered inside React portal with dark backdrop dimming.</li>
        <li><span class="spec-tag">Form Fields</span> Supports Trip Title, Destination List, Start/End Dates, Cover Photo Image URL, Default Currency dropdown (INR, USD, EUR, GBP, JPY), Planned Target Budget, and Traveler Names.</li>
        <li><span class="spec-tag">Traveler List Parser</span> Formats comma-separated names into a clean traveler array used across group expense settlements.</li>
      </ul>

      <h4 style="margin-top: 10px;">Validation & Relative Date Shift Rules</h4>
      <ul class="spec-list">
        <li><strong>Date Range Validation:</strong> Ensures <code>endDate</code> cannot precede <code>startDate</code>.</li>
        <li><strong>Relative Itinerary Shifting:</strong> If trip start date is edited, the system prompts the user whether to automatically shift all scheduled itinerary events by the exact day delta, maintaining day offsets (Day 1, Day 2).</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 5</span>
  </div>
</div>

<!-- PAGE 6: SCREEN 4 - TRIP WORKSPACE OVERVIEW SUB-VIEW WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Trip Workspace Overview</span>
  </div>

  <h2 class="section-title">Screen 4: Trip Workspace Overview Sub-View (`TripDetailView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Top Back Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 6pt; color: #007AFF; font-weight: 700;">‹ My Trips</span>
          <span class="wf-btn-secondary" style="font-size: 5pt; padding: 2px 5px;">Edit Trip</span>
        </div>

        <!-- Trip Hero Banner -->
        <div class="wf-hero" style="height: 65px;">
          <div style="display: flex; justify-content: space-between;">
            <span class="wf-badge wf-badge-primary">⏳ 14 Days Away</span>
            <span class="wf-badge">UPCOMING</span>
          </div>
          <div>
            <div style="font-size: 8pt; font-weight: 800;">Kyoto Cherry Blossom Tour</div>
            <div style="font-size: 5pt; opacity: 0.9;">📍 Kyoto, Japan • Mar 25 - Apr 04</div>
          </div>
        </div>

        <!-- 8-Tab Segmented Sub-Nav -->
        <div class="wf-segmented" style="overflow-x: hidden;">
          <div class="wf-segment active">Overview</div>
          <div class="wf-segment">Itinerary(8)</div>
          <div class="wf-segment">Budget(5)</div>
          <div class="wf-segment">Bookings(3)</div>
          <div class="wf-segment">Essentials(12)</div>
        </div>

        <!-- Quick Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;">
          <div class="wf-card" style="text-align: center; padding: 4px;">
            <div style="font-size: 7.5pt; font-weight: 800; color: #007AFF;">8</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">Schedule</div>
          </div>
          <div class="wf-card" style="text-align: center; padding: 4px;">
            <div style="font-size: 7.5pt; font-weight: 800; color: #007AFF;">3</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">Bookings</div>
          </div>
          <div class="wf-card" style="text-align: center; padding: 4px;">
            <div style="font-size: 7.5pt; font-weight: 800; color: #34C759;">12/15</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">Packed</div>
          </div>
        </div>

        <!-- Trip Details & Travelers -->
        <div class="wf-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="font-size: 6pt; font-weight: 700;">Trip Details</div>
            <span style="font-size: 5pt; color: #007AFF;">Edit</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div style="background: #f2f2f7; padding: 4px; border-radius: 4px;">
              <div style="font-size: 4.5pt; color: #8e8e93;">Planned Budget</div>
              <div style="font-size: 7pt; font-weight: 800; color: #007AFF;">₹1,50,000</div>
            </div>
            <div style="background: #f2f2f7; padding: 4px; border-radius: 4px;">
              <div style="font-size: 4.5pt; color: #8e8e93;">Travelers (3)</div>
              <div style="font-size: 5.5pt; font-weight: 700;">Me, Sarah, Alex</div>
            </div>
          </div>
        </div>

        <!-- Inset Grouped Quick Actions -->
        <div class="wf-card">
          <div style="font-size: 5.5pt; font-weight: 700; color: #8e8e93; margin-bottom: 2px;">QUICK ACTIONS</div>
          <div class="wf-row">
            <span class="wf-text-title">+ Capture Note, Place or Expense</span>
            <span style="font-size: 6pt; color: #c7c7cc;">›</span>
          </div>
          <div class="wf-row">
            <span class="wf-text-title">🗓 Add Day-by-Day Activity</span>
            <span style="font-size: 6pt; color: #c7c7cc;">›</span>
          </div>
          <div class="wf-row">
            <span class="wf-text-title">📱 Generate WhatsApp Schedule</span>
            <span style="font-size: 6pt; color: #c7c7cc;">›</span>
          </div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Sub-Nav Control</span> 8-tab Cupertino Segmented Sub-Navigation bar with dynamic item count badges: <em>Overview, Itinerary, Budget, Bookings, Essentials, Map, Docs, WhatsApp</em>.</li>
        <li><span class="spec-tag">Hero Header</span> Compact visual banner featuring live status badges and trip metadata.</li>
        <li><span class="spec-tag">Quick Metrics</span> Interactive summary metric cards linking directly to Itinerary, Bookings, and Essentials modules.</li>
        <li><span class="spec-tag">Traveler Summary</span> Highlights budget setup and registered group companions for debt splits.</li>
        <li><span class="spec-tag">Inset Quick Actions</span> Grouped iOS list rows with instant triggers for capture, activity logging, and WhatsApp summary generation.</li>
      </ul>

      <h4 style="margin-top: 10px;">Live Query Integration</h4>
      <ul class="spec-list">
        <li><strong>Dexie Hooks:</strong> Utilizes <code>useLiveQuery</code> on <code>db.itineraryEvents</code>, <code>db.bookings</code>, <code>db.expenses</code>, and <code>db.essentials</code> for real-time reactivity.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 6</span>
  </div>
</div>

<!-- PAGE 7: SCREEN 5 - ITINERARY BUILDER & DAY TIMELINE WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Itinerary Builder</span>
  </div>

  <h2 class="section-title">Screen 5: Itinerary Builder & Timeline (`ItineraryView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Day Selector Pill Carousel -->
        <div style="display: flex; gap: 3px; overflow-x: hidden; padding-bottom: 2px;">
          <span class="wf-badge wf-badge-primary">Day 1 • Mar 25</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Day 2 • Mar 26</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Day 3 • Mar 27</span>
        </div>

        <!-- Overlap Conflict Warning Banner -->
        <div class="wf-card" style="background: rgba(255, 149, 0, 0.12); border: 1px solid #FF9500; padding: 4px 6px;">
          <div style="font-size: 5.5pt; font-weight: 800; color: #d97706; display: flex; align-items: center; gap: 2px;">
            ⚠️ Overlap Advisory: Flight JL708 lands at 14:00, Hotel check-in set for 13:30.
          </div>
        </div>

        <!-- Timeline Items -->
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <!-- Event 1 -->
          <div class="wf-card" style="display: flex; gap: 6px; align-items: center;">
            <div style="font-size: 5.5pt; font-weight: 800; color: #007AFF; width: 32px;">09:30 AM</div>
            <div style="flex: 1;">
              <div class="wf-text-title">🛫 Flight JL708 Departure</div>
              <div class="wf-text-sub">KIX Airport • Terminal 1</div>
            </div>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Flight</span>
          </div>

          <!-- Event 2 (Conflict) -->
          <div class="wf-card" style="display: flex; gap: 6px; align-items: center; border-left: 3px solid #FF9500;">
            <div style="font-size: 5.5pt; font-weight: 800; color: #FF9500; width: 32px;">01:30 PM</div>
            <div style="flex: 1;">
              <div class="wf-text-title">🏨 Hotel Gracery Check-in</div>
              <div class="wf-text-sub">Kyoto Sanjo • Conf #8849</div>
            </div>
            <span class="wf-badge wf-badge-warning">Conflict</span>
          </div>

          <!-- Event 3 -->
          <div class="wf-card" style="display: flex; gap: 6px; align-items: center;">
            <div style="font-size: 5.5pt; font-weight: 800; color: #007AFF; width: 32px;">05:00 PM</div>
            <div style="flex: 1;">
              <div class="wf-text-title">🍜 Gion Ramen Dinner</div>
              <div class="wf-text-sub">Reservation for 3 people</div>
            </div>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Food</span>
          </div>

          <!-- Event 4 -->
          <div class="wf-card" style="display: flex; gap: 6px; align-items: center;">
            <div style="font-size: 5.5pt; font-weight: 800; color: #007AFF; width: 32px;">07:30 PM</div>
            <div style="flex: 1;">
              <div class="wf-text-title">⛩️ Yasaka Shrine Evening Stroll</div>
              <div class="wf-text-sub">Lantern lighting ceremony</div>
            </div>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Sight</span>
          </div>
        </div>

        <div class="wf-btn" style="width: 100%; margin-top: 4px; padding: 4px;">+ Add Activity Event</div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Day Selector</span> Horizontal pill carousel displaying relative trip days (Day 1, Day 2...) paired with exact dates.</li>
        <li><span class="spec-tag">Vertical Timeline</span> Time-ordered event list cards with category badges (Flight, Hotel, Food, Sightseeing, Transport, Note).</li>
        <li><span class="spec-tag">Conflict Advisory</span> Scans event start/end times within the day timeline. If <code>Event B Start Time &lt; Event A End Time</code>, renders a ⚠️ warning banner and amber border highlight.</li>
        <li><span class="spec-tag">Drag & Reorder</span> Allows manual drag ordering of activities within a day timeline.</li>
      </ul>

      <h4 style="margin-top: 10px;">Conflict Detection Logic</h4>
      <pre style="background:#f2f2f7; padding: 6px; border-radius: 4px; font-size: 7.5pt; margin: 4px 0;">
if (eventB.startTime &lt; eventA.endTime) {
  triggerConflictBadge("⚠️ Time Overlap Warning");
}</pre>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 7</span>
  </div>
</div>

<!-- PAGE 8: SCREEN 6 - BUDGET & GROUP SPLIT SETTLEMENT WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Budget & Settlements</span>
  </div>

  <h2 class="section-title">Screen 6: Budget & Group Split Settlements (`BudgetView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Segmented Mode Switch -->
        <div class="wf-segmented">
          <div class="wf-segment active">Expenses & Budget</div>
          <div class="wf-segment">Group Settlement</div>
        </div>

        <!-- Budget Donut / Outlay Card -->
        <div class="wf-card" style="text-align: center; padding: 6px;">
          <div style="font-size: 5pt; color: #8e8e93;">TOTAL OUTLAY VS PLANNED</div>
          <div style="font-size: 10pt; font-weight: 800; color: #007AFF;">₹1,07,000 / ₹1,50,000</div>
          <!-- Progress Bar -->
          <div style="height: 6px; background: #e5e5ea; border-radius: 100px; margin: 4px 0; overflow: hidden;">
            <div style="width: 71%; height: 100%; background: #007AFF;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 4.5pt; color: #8e8e93;">
            <span>Bookings: ₹65,000</span>
            <span>Expenses: ₹42,000</span>
            <span>Remaining: ₹43,000</span>
          </div>
        </div>

        <!-- Group Split Ledger -->
        <div class="wf-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="font-size: 6pt; font-weight: 700;">Group Balances (3 Travelers)</div>
            <span class="wf-badge wf-badge-success">Settle Up</span>
          </div>

          <div class="wf-row">
            <div>
              <div class="wf-text-title">Sarah paid ₹12,000 for Dinner</div>
              <div class="wf-text-sub">Split equally (₹4,000 each)</div>
            </div>
            <span style="font-size: 6.5pt; font-weight: 700; color: #FF3B30;">You owe ₹4,000</span>
          </div>

          <div class="wf-row">
            <div>
              <div class="wf-text-title">You paid ₹15,000 for Bullet Train</div>
              <div class="wf-text-sub">Split equally (₹5,000 each)</div>
            </div>
            <span style="font-size: 6.5pt; font-weight: 700; color: #34C759;">Alex owes ₹5,000</span>
          </div>
        </div>

        <!-- Expense Log -->
        <div class="wf-card">
          <div style="font-size: 5.5pt; font-weight: 700; color: #8e8e93; margin-bottom: 2px;">RECENT EXPENSES</div>
          <div class="wf-row">
            <div>
              <div class="wf-text-title">Shinkansen Express Ticket</div>
              <div class="wf-text-sub">Transport • Linked to Booking #2</div>
            </div>
            <span style="font-size: 6.5pt; font-weight: 800;">₹15,000</span>
          </div>
          <div class="wf-row">
            <div>
              <div class="wf-text-title">Kichi Kichi Omurice</div>
              <div class="wf-text-sub">Food & Dining • Paid by Sarah</div>
            </div>
            <span style="font-size: 6.5pt; font-weight: 800;">₹4,200</span>
          </div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Segmented View</span> Toggles between Expense Log & Category Breakdown vs. Group Debt Settlement Ledger.</li>
        <li><span class="spec-tag">Outlay Gauge</span> Displays Total Planned Budget vs. Outlay (Committed Bookings + Independent Expenses) with a color progress bar.</li>
        <li><span class="spec-tag">Double-Counting Prevention</span> If an expense is linked to a booking (e.g. payment towards booking), it subtracts from booking outstanding without double-counting towards total outlay.</li>
        <li><span class="spec-tag">Group Debt Calculator</span> Computes who paid, who owes whom, equal or custom splits, and provides a "Settle Up" action to clear debts.</li>
      </ul>

      <h4 style="margin-top: 10px;">Calculation Logic</h4>
      <pre style="background:#f2f2f7; padding: 6px; border-radius: 4px; font-size: 7.5pt; margin: 4px 0;">
TotalOutlay = Sum(IndependentExpenses) + Sum(Bookings);
// Linked expenses subtract from booking outstanding balance</pre>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 8</span>
  </div>
</div>

<!-- PAGE 9: SCREEN 7 - BOOKINGS MANAGER WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Bookings Manager</span>
  </div>

  <h2 class="section-title">Screen 7: Bookings Manager (`BookingsView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Type Filter Chips -->
        <div style="display: flex; gap: 3px; overflow-x: hidden;">
          <span class="wf-badge wf-badge-primary">All (3)</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Flights</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Hotels</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Trains</span>
        </div>

        <!-- Booking Card 1: Flight -->
        <div class="wf-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span class="wf-badge wf-badge-primary">FLIGHT</span>
            <span class="wf-badge wf-badge-success">PAID</span>
          </div>
          <div class="wf-text-title">Japan Airlines JL708</div>
          <div class="wf-text-sub">DEL ➔ KIX • PNR: <strong>JL-884920</strong></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 0.5px solid #e5e5ea; padding-top: 4px;">
            <div style="font-size: 6pt; font-weight: 800; color: #007AFF;">Cost: ₹45,000</div>
            <div class="wf-btn-secondary" style="font-size: 5pt; padding: 2px 4px;">📄 Ticket PDF</div>
          </div>
        </div>

        <!-- Booking Card 2: Hotel -->
        <div class="wf-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span class="wf-badge" style="background:#5856D6; color:#fff;">HOTEL</span>
            <span class="wf-badge wf-badge-warning">PARTIAL</span>
          </div>
          <div class="wf-text-title">Hotel Gracery Kyoto Sanjo</div>
          <div class="wf-text-sub">Check-in: Mar 25 • Conf #HG-9912</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 0.5px solid #e5e5ea; padding-top: 4px;">
            <div style="font-size: 6pt; font-weight: 800; color: #007AFF;">Cost: ₹35,000</div>
            <div class="wf-btn-secondary" style="font-size: 5pt; padding: 2px 4px;">📄 Voucher PDF</div>
          </div>
        </div>

        <!-- Booking Card 3: Train -->
        <div class="wf-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span class="wf-badge" style="background:#FF9500; color:#fff;">TRAIN</span>
            <span class="wf-badge wf-badge-success">PAID</span>
          </div>
          <div class="wf-text-title">Shinkansen Nozomi Express</div>
          <div class="wf-text-sub">Kyoto ➔ Tokyo • Car 4, Seat 12A</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 0.5px solid #e5e5ea; padding-top: 4px;">
            <div style="font-size: 6pt; font-weight: 800; color: #007AFF;">Cost: ₹15,000</div>
            <div class="wf-btn-secondary" style="font-size: 5pt; padding: 2px 4px;">View Details</div>
          </div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Category Filters</span> Filter reservation cards by category: <em>All, Flights, Hotels, Trains, Rental Cars, Experiences</em>.</li>
        <li><span class="spec-tag">Reservation Cards</span> Displays provider name, confirmation number (PNR), check-in/out dates, seat numbers, total cost, and payment status pill (Paid, Partial, Pending).</li>
        <li><span class="spec-tag">Document Launcher</span> Direct shortcut button on booking cards that opens attached binary PDF tickets or hotel vouchers stored in the Document Vault.</li>
      </ul>

      <h4 style="margin-top: 10px;">Data Model</h4>
      <ul class="spec-list">
        <li><strong>IndexedDB Entity:</strong> <code>db.bookings</code> table linked to <code>tripId</code> with optional binary document relations.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 9</span>
  </div>
</div>

<!-- PAGE 10: SCREEN 8 - ESSENTIALS & PACKING CHECKLIST WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Essentials & Packing</span>
  </div>

  <h2 class="section-title">Screen 8: Essentials & Packing (`EssentialsView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Sub-segmented control -->
        <div class="wf-segmented">
          <div class="wf-segment active">Packing Checklist</div>
          <div class="wf-segment">Prep Tasks</div>
        </div>

        <!-- Packing Progress Gauge -->
        <div class="wf-card" style="padding: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 5.5pt; font-weight: 700;">
            <span>Packing Completion</span>
            <span style="color: #34C759;">85% (17/20)</span>
          </div>
          <div style="height: 5px; background: #e5e5ea; border-radius: 100px; margin-top: 3px; overflow: hidden;">
            <div style="width: 85%; height: 100%; background: #34C759;"></div>
          </div>
        </div>

        <!-- Category Filters -->
        <div style="display: flex; gap: 3px; overflow-x: hidden;">
          <span class="wf-badge wf-badge-primary">All</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Clothing</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Electronics</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Docs</span>
        </div>

        <!-- Checklist Items -->
        <div class="wf-card">
          <div class="wf-row">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #34C759; font-weight: 800; font-size: 8pt;">✓</span>
              <div>
                <div class="wf-text-title" style="text-decoration: line-through; color: #8e8e93;">Passport & Japan Visa</div>
                <div class="wf-text-sub">Category: Documents • Priority: High</div>
              </div>
            </div>
            <span class="wf-badge wf-badge-primary">Qty: 1</span>
          </div>

          <div class="wf-row">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #34C759; font-weight: 800; font-size: 8pt;">✓</span>
              <div>
                <div class="wf-text-title" style="text-decoration: line-through; color: #8e8e93;">Universal Power Adapter</div>
                <div class="wf-text-sub">Category: Electronics</div>
              </div>
            </div>
            <span class="wf-badge wf-badge-primary">Qty: 2</span>
          </div>

          <div class="wf-row">
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 10px; height: 10px; border: 1px solid #c6c6c8; border-radius: 2px;"></div>
              <div>
                <div class="wf-text-title">Comfortable Walking Shoes</div>
                <div class="wf-text-sub">Category: Clothing</div>
              </div>
            </div>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Qty: 1</span>
          </div>
        </div>

        <!-- Preset Template Loader -->
        <div class="wf-btn-secondary" style="font-size: 5.5pt; text-align: center; padding: 4px;">
          ⚡ Load Pre-built Packing Template (Beach / Hiking / International)
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Sub-segmented Control</span> Toggles between Packing Checklist and Departure Prep Tasks.</li>
        <li><span class="spec-tag">Category Pills</span> Filter checklist by Clothing, Electronics, Toiletries, Documents, Medicine, Misc.</li>
        <li><span class="spec-tag">Interactive Checkboxes</span> One-tap toggle automatically recalculates packing completion percentage.</li>
        <li><span class="spec-tag">Preset Templates</span> One-click dropdown to instantly populate checklists with pre-loaded travel templates (Beach, Hiking, International, Winter).</li>
      </ul>

      <h4 style="margin-top: 10px;">Data Model</h4>
      <ul class="spec-list">
        <li><strong>IndexedDB Entity:</strong> <code>db.essentials</code> table with <code>packed</code> boolean state and <code>category</code> indexing.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 10</span>
  </div>
</div>

<!-- PAGE 11: SCREEN 9 - INTERACTIVE MAP VIEW WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Interactive Map View</span>
  </div>

  <h2 class="section-title">Screen 9: Interactive Map View (`MapView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content" style="padding: 0; position: relative;">
        <!-- Leaflet Map Container Background -->
        <div style="width: 100%; height: 100%; background: #e0ece4; position: relative; overflow: hidden;">
          <!-- Map Grid Lines / Tiles simulation -->
          <div style="position: absolute; top:0; left:0; right:0; bottom:0; opacity: 0.15; background-image: radial-gradient(#000 1px, transparent 1px); background-size: 16px 16px;"></div>

          <!-- Top Filter Header overlay -->
          <div style="position: absolute; top: 26px; left: 8px; right: 8px; z-index: 50; display: flex; gap: 3px; background: rgba(255,255,255,0.9); padding: 4px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <span class="wf-badge wf-badge-primary">All Pins</span>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Places</span>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Itinerary</span>
            <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Hotels</span>
          </div>

          <!-- Pin 1: Hotel (Purple) -->
          <div style="position: absolute; top: 110px; left: 60px; z-index: 40; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #5856D6; color: #fff; font-size: 5pt; font-weight: 800; padding: 2px 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏨 Hotel Gracery</div>
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #5856D6;"></div>
          </div>

          <!-- Pin 2: Active Selected Spot (Blue) -->
          <div style="position: absolute; top: 180px; left: 120px; z-index: 45; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #007AFF; color: #fff; font-size: 5pt; font-weight: 800; padding: 2px 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">⛩️ Fushimi Inari</div>
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #007AFF;"></div>
          </div>

          <!-- Selected Place Card Overlay at bottom -->
          <div style="position: absolute; bottom: 44px; left: 8px; right: 8px; z-index: 60; background: #ffffff; border-radius: 10px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 7.5pt; font-weight: 800;">Fushimi Inari Taisha</div>
                <div style="font-size: 5.5pt; color: #8e8e93;">Fushimi Ward, Kyoto • 4.8 ★</div>
              </div>
              <span class="wf-badge wf-badge-primary">SAVED</span>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 4px;">
              <div class="wf-btn" style="flex: 1; padding: 3px;">+ Add to Itinerary</div>
              <div class="wf-btn-secondary" style="font-size: 5pt; padding: 3px;">🗺 Open Maps</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Leaflet Engine</span> OpenStreetMap tiles rendered via Leaflet.js with cached tile support for offline viewing.</li>
        <li><span class="spec-tag">Custom Pins</span> Color-coded visual pin markers: <em>Blue = Saved Place, Green = Scheduled Itinerary Stop, Purple = Hotel Reservation</em>.</li>
        <li><span class="spec-tag">Popup Card</span> Tapping any map pin slides up a detailed place card showing title, notes, and instant triggers to schedule in itinerary or launch external navigation (Google Maps / Apple Maps).</li>
      </ul>

      <h4 style="margin-top: 10px;">Spatial Query</h4>
      <ul class="spec-list">
        <li><strong>IndexedDB Query:</strong> Retrieves lat/lng coordinates across <code>db.places</code> and <code>db.itineraryEvents</code>.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 11</span>
  </div>
</div>

<!-- PAGE 12: SCREEN 10 - DOCUMENT VAULT WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Document Vault</span>
  </div>

  <h2 class="section-title">Screen 10: Document Vault (`DocumentsView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 8.5pt; font-weight: 800;">Document Vault (4)</div>
          <div class="wf-btn" style="padding: 2px 6px; font-size: 5.5pt;">+ Upload</div>
        </div>

        <!-- Search Bar -->
        <input class="wf-input" placeholder="🔍 Search passports, visas, tickets..." />

        <!-- Category Tags -->
        <div style="display: flex; gap: 3px; overflow-x: hidden;">
          <span class="wf-badge wf-badge-primary">All</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Passports</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Tickets</span>
          <span class="wf-badge" style="background:#e5e5ea; color:#3a3a3c;">Vouchers</span>
        </div>

        <!-- Document Cards Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <!-- Doc 1 -->
          <div class="wf-card" style="text-align: center; padding: 6px;">
            <div style="height: 36px; background: #e5e5ea; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14pt;">📄</div>
            <div style="font-size: 6pt; font-weight: 700; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Passport_Luha.pdf</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">1.2 MB • Passport</div>
            <div class="wf-btn-secondary" style="font-size: 4.5pt; margin-top: 3px; padding: 2px;">View File</div>
          </div>

          <!-- Doc 2 -->
          <div class="wf-card" style="text-align: center; padding: 6px;">
            <div style="height: 36px; background: #e5e5ea; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14pt;">✈️</div>
            <div style="font-size: 6pt; font-weight: 700; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">JAL_Ticket_JL708.pdf</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">850 KB • Ticket</div>
            <div class="wf-btn-secondary" style="font-size: 4.5pt; margin-top: 3px; padding: 2px;">View File</div>
          </div>

          <!-- Doc 3 -->
          <div class="wf-card" style="text-align: center; padding: 6px;">
            <div style="height: 36px; background: #e5e5ea; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14pt;">🏨</div>
            <div style="font-size: 6pt; font-weight: 700; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Hotel_Voucher.pdf</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">420 KB • Voucher</div>
            <div class="wf-btn-secondary" style="font-size: 4.5pt; margin-top: 3px; padding: 2px;">View File</div>
          </div>

          <!-- Doc 4 -->
          <div class="wf-card" style="text-align: center; padding: 6px;">
            <div style="height: 36px; background: #e5e5ea; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14pt;">🏥</div>
            <div style="font-size: 6pt; font-weight: 700; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Travel_Insurance.pdf</div>
            <div style="font-size: 4.5pt; color: #8e8e93;">1.8 MB • Insurance</div>
            <div class="wf-btn-secondary" style="font-size: 4.5pt; margin-top: 3px; padding: 2px;">View File</div>
          </div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Binary Vault</span> Stores original document binaries (PDF, PNG, JPG) in IndexedDB Blobs / OPFS with offline access.</li>
        <li><span class="spec-tag">Grid & Cards</span> Displays file thumbnails, file size, MIME type badges, category tags, and instant full-screen preview modal.</li>
        <li><span class="spec-tag">Upload Picker</span> Native file picker integration with client-side 5MB size limit validation.</li>
      </ul>

      <h4 style="margin-top: 10px;">Security & Storage</h4>
      <ul class="spec-list">
        <li><strong>Local Isolation:</strong> Zero document transmission to cloud; files stay strictly isolated on device storage.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 12</span>
  </div>
</div>

<!-- PAGE 13: SCREEN 11 - WHATSAPP & COMPANION SHARE WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — WhatsApp Sharing</span>
  </div>

  <h2 class="section-title">Screen 11: WhatsApp Companion Share (`ShareView.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span>9:41</span>
        <span>􀋦 􀙇 􀛨</span>
      </div>

      <div class="phone-content">
        <div style="font-size: 8.5pt; font-weight: 800;">WhatsApp Export Generator</div>

        <!-- Format Selector -->
        <div class="wf-segmented">
          <div class="wf-segment active">Full Itinerary</div>
          <div class="wf-segment">Day 1 Schedule</div>
          <div class="wf-segment">Bookings</div>
        </div>

        <!-- Privacy Toggles -->
        <div class="wf-card">
          <div style="font-size: 5.5pt; font-weight: 700; color: #8e8e93; margin-bottom: 2px;">PRIVACY CONTROLS</div>
          <div class="wf-row">
            <span class="wf-text-title">Hide Costs & Expenses</span>
            <span style="font-size: 6pt; color: #34C759; font-weight:800;">[ON]</span>
          </div>
          <div class="wf-row">
            <span class="wf-text-title">Hide Booking Reference IDs</span>
            <span style="font-size: 6pt; color: #34C759; font-weight:800;">[ON]</span>
          </div>
        </div>

        <!-- Live Text Preview -->
        <div class="wf-card" style="background: #eef9f2; border: 1px solid #25D366; flex: 1;">
          <div style="font-size: 5pt; font-weight: 800; color: #075E54; margin-bottom: 2px;">LIVE WHATSAPP TEXT PREVIEW</div>
          <div style="font-family: monospace; font-size: 5pt; color: #1c1c1e; white-space: pre-wrap; line-height: 1.3;">
*🌸 Kyoto Cherry Blossom Tour*
📅 Mar 25 - Apr 04

*Day 1 (Mar 25)*
• 🛫 09:30 - Flight JL708
• 🏨 13:30 - Check-in Hotel Gracery
• 🍜 17:00 - Gion Ramen Dinner
          </div>
        </div>

        <div style="display: flex; gap: 4px; margin-top: 4px;">
          <div class="wf-btn" style="flex: 1; background: #25D366; padding: 5px;">📱 Share via WhatsApp</div>
          <div class="wf-btn-secondary" style="padding: 5px; font-size: 5.5pt;">📋 Copy Text</div>
        </div>
      </div>

      <div class="phone-fab">+</div>

      <!-- Bottom Nav Bar -->
      <div class="phone-nav-bar">
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Home</span>
        </div>
        <div class="nav-tab-item active">
          <div class="nav-tab-icon"></div>
          <span>Trips</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Inbox</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Map</span>
        </div>
        <div class="nav-tab-item">
          <div class="nav-tab-icon"></div>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Text Formatter</span> Generates clean plain text formatted with WhatsApp markdown (*bold titles*, _italics_, bullet emojis).</li>
        <li><span class="spec-tag">Privacy Options</span> Explicit opt-in toggles to strip sensitive booking reference numbers, private notes, or financial costs before sharing.</li>
        <li><span class="spec-tag">Web Share API</span> Invokes native Android/iOS share sheet directly targeting WhatsApp, Telegram, or SMS with fallback to clipboard copy.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 13</span>
  </div>
</div>

<!-- PAGE 14: SCREEN 12 & 13 - COLLECTION & SETTINGS WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Collection & Settings</span>
  </div>

  <h2 class="section-title">Screens 12 & 13: Collection Inbox & Settings Views</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup: Collection -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar"><span>9:41</span><span>􀋦 􀙇 􀛨</span></div>

      <div class="phone-content">
        <div style="font-size: 8.5pt; font-weight: 800;">Global Collection Inbox</div>
        <input class="wf-input" placeholder="🔍 Search saved spots & links..." />

        <div class="wf-card">
          <div class="wf-row">
            <div>
              <span class="wf-badge wf-badge-primary">PLACE</span>
              <div class="wf-text-title" style="display: inline-block;">Arashiyama Bamboo Grove</div>
              <div class="wf-text-sub">Unassigned • Saved from Instagram reel</div>
            </div>
            <div class="wf-btn" style="font-size: 4.5pt; padding: 2px 4px;">Assign</div>
          </div>

          <div class="wf-row">
            <div>
              <span class="wf-badge" style="background:#5856D6; color:#fff;">LINK</span>
              <div class="wf-text-title" style="display: inline-block;">Tenryu-ji Temple Guide</div>
              <div class="wf-text-sub">https://japan-guide.com/e/e3912.html</div>
            </div>
            <div class="wf-btn" style="font-size: 4.5pt; padding: 2px 4px;">Assign</div>
          </div>
        </div>
      </div>
      <div class="phone-nav-bar"><div class="nav-tab-item active"><span>Inbox</span></div></div>
    </div>

    <!-- Phone Mockup: Settings -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar"><span>9:41</span><span>􀋦 􀙇 􀛨</span></div>

      <div class="phone-content">
        <div style="font-size: 8.5pt; font-weight: 800;">Settings & Backup</div>

        <div class="wf-card">
          <div style="font-size: 5.5pt; font-weight: 700; color: #8e8e93;">LOCAL STORAGE</div>
          <div class="wf-row">
            <span class="wf-text-title">Storage Used</span>
            <span class="wf-text-sub">4.8 MB (IndexedDB)</span>
          </div>
        </div>

        <div class="wf-card">
          <div style="font-size: 5.5pt; font-weight: 700; color: #8e8e93;">BACKUP & RESTORE</div>
          <div class="wf-btn" style="width: 100%; padding: 4px; margin-bottom: 3px;">📦 Export Full Backup (.travelnest ZIP)</div>
          <div class="wf-btn-secondary" style="font-size: 5.5pt; text-align: center; padding: 4px;">📥 Import & Restore Backup</div>
        </div>

        <div class="wf-card">
          <div class="wf-row">
            <span class="wf-text-title" style="color: #FF3B30;">Clear All Local Data</span>
            <span style="font-size: 6pt; color: #c7c7cc;">›</span>
          </div>
        </div>
      </div>
      <div class="phone-nav-bar"><div class="nav-tab-item active"><span>Settings</span></div></div>
    </div>
  </div>

  <div class="spec-box" style="margin-top: 10px;">
    <h4>Backup Engine Architecture</h4>
    <p style="margin: 0; font-size: 8pt; line-height: 1.35;">
      The <code>SettingsView</code> backup utility leverages <strong>JSZip</strong> to construct a single compressed <code>.travelnest</code> archive containing <code>database.json</code> (complete IndexedDB entity dumps) and an <code>/attachments</code> directory holding binary blobs. On restoration, the engine validates schema integrity before executing a clean transactional rewrite.
    </p>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 14</span>
  </div>
</div>

<!-- PAGE 15: SCREEN 14 - QUICK ADD BOTTOM SHEET MODAL WIREFRAME -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">2. Screen Wireframes — Global Quick Add Modal</span>
  </div>

  <h2 class="section-title">Screen 14: Global Quick Add Sheet (`QuickAddModal.tsx`)</h2>

  <div class="wireframe-spec-grid">
    <!-- Phone Mockup with Quick Add Sheet -->
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status-bar"><span>9:41</span><span>􀋦 􀙇 􀛨</span></div>

      <div class="phone-content" style="opacity: 0.25;">
        <div class="wf-card" style="height: 150px;"></div>
      </div>

      <!-- Quick Add Sheet Overlay -->
      <div class="wf-modal-overlay">
        <div class="wf-modal-sheet" style="height: 320px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 0.5px solid #e5e5ea; padding-bottom: 4px;">
            <span style="font-size: 7.5pt; font-weight: 800;">Quick Capture</span>
            <span style="font-size: 6pt; color: #8e8e93;">Cancel</span>
          </div>

          <!-- Type Selector Pills -->
          <div class="wf-segmented">
            <div class="wf-segment active">📍 Place</div>
            <div class="wf-segment">🔗 Link</div>
            <div class="wf-segment">📝 Note</div>
            <div class="wf-segment">💸 Expense</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            <div>
              <span class="wf-text-sub">Title or Spot Name *</span>
              <input class="wf-input" value="Kiyomizu-dera Temple" placeholder="Auto-focused input..." />
            </div>

            <div>
              <span class="wf-text-sub">Target Trip Assignment</span>
              <select class="wf-input"><option>Kyoto Cherry Blossom (Current)</option><option>Global Saved Inbox</option></select>
            </div>

            <div>
              <span class="wf-text-sub">Source URL / Address</span>
              <input class="wf-input" value="1-294 Kiyomizu, Higashiyama Ward, Kyoto" />
            </div>

            <div>
              <span class="wf-text-sub">Personal Notes</span>
              <input class="wf-input" placeholder="Best visited during sunset..." />
            </div>
          </div>

          <div class="wf-btn" style="margin-top: 6px; padding: 6px;">Save to Collection</div>
        </div>
      </div>
    </div>

    <!-- Spec Panel -->
    <div class="spec-box">
      <h4>UI & Component Specifications</h4>
      <ul class="spec-list">
        <li><span class="spec-tag">Frictionless Capture</span> Opens from any screen within &lt; 3 interactions via persistent FAB.</li>
        <li><span class="spec-tag">Type Pills</span> Type selector pills: <em>Place, Link, Note, Expense</em>.</li>
        <li><span class="spec-tag">Auto-Focus</span> Primary title field receives auto-focus upon modal open.</li>
        <li><span class="spec-tag">Smart Assignment</span> Pre-selects current active trip context if triggered inside a trip workspace; otherwise defaults to Global Inbox.</li>
      </ul>
    </div>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 15</span>
  </div>
</div>

<!-- PAGE 16: SYSTEM CALCULATION LOGIC & ALGORITHMS -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">3. Key Business Logic & System Calculation Matrix</span>
  </div>

  <h2 class="section-title">3. Key Business Logic & System Calculation Matrix</h2>

  <h3 class="subsection-title">1. Budget Double-Counting Prevention Algorithm</h3>
  <div class="spec-box">
    <p style="margin:0 0 6px 0;">
      To ensure the financial ledger accurate tracks commitments without duplicate counting:
    </p>
    <pre style="background:#f2f2f7; padding: 8px; border-radius: 6px; font-size: 8pt; margin:0;">
TotalOutlay = Sum(IndependentExpenses) + Sum(Bookings.cost)

// Double-Counting Prevention Rule:
If (Expense.bookingId != Null) {
  Booking.outstanding = Booking.cost - Expense.amount;
  // Expense is NOT added to TotalOutlay again since Booking.cost is already counted.
}</pre>
  </div>

  <h3 class="subsection-title">2. Group Expense Settlement Minimization Algorithm</h3>
  <div class="spec-box">
    <p style="margin:0 0 6px 0;">
      Calculates individual balances across N travelers for equal or custom splits:
    </p>
    <pre style="background:#f2f2f7; padding: 8px; border-radius: 6px; font-size: 8pt; margin:0;">
For each Expense E in Trip:
  Payer = E.paidBy;
  SharePerPerson = E.amount / E.travelers.length;
  For each Person P in E.travelers:
    If (P != Payer) {
      DebtMatrix[P][Payer] += SharePerPerson;
    }

// Net balance calculation simplifies bilateral debts to minimize payments.</pre>
  </div>

  <h3 class="subsection-title">3. Itinerary Overlap Advisory Algorithm</h3>
  <div class="spec-box">
    <p style="margin:0 0 6px 0;">
      Detects temporal conflicts between itinerary events within a day timeline:
    </p>
    <pre style="background:#f2f2f7; padding: 8px; border-radius: 6px; font-size: 8pt; margin:0;">
Sort events by startTime;
For i = 0 to events.length - 2:
  Curr = events[i];
  Next = events[i+1];
  If (Next.startTime < Curr.endTime) {
    FlagConflict(Curr, Next, "⚠️ Overlap: " + Next.title + " starts before " + Curr.title + " ends");
  }</pre>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 16</span>
  </div>
</div>

<!-- PAGE 17: DELIVERABLES SUMMARY & FINAL VERIFICATION -->
<div class="page">
  <div class="header-bar">
    <span class="doc-title">TravelNest Wireframe Document</span>
    <span class="doc-subtitle">4. Final Verification & Completion Summary</span>
  </div>

  <h2 class="section-title">4. Deliverables & Final Verification Summary</h2>

  <p>
    The finalized TravelNest codebase completely implements all requirements specified in the PRD and user feedback. Below is the final verification checklist confirming complete execution:
  </p>

  <table class="custom-table">
    <thead>
      <tr>
        <th>Requirement ID</th>
        <th>Module & Description</th>
        <th>Status</th>
        <th>Implementation Verification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>FR-COL-001</strong></td>
        <td>Quick capture unassigned inbox items</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>Implemented in <code>QuickAddModal</code> & <code>CollectionView</code> with 3-tap capture flow.</td>
      </tr>
      <tr>
        <td><strong>FR-ITN-001</strong></td>
        <td>Manual itinerary ordering</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>Timeline supports drag-and-drop re-ordering in <code>ItineraryView</code>.</td>
      </tr>
      <tr>
        <td><strong>FR-ITN-002</strong></td>
        <td>Conflict Advisory Warning</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>⚠️ Overlap detection engine flags temporal collisions on timeline cards.</td>
      </tr>
      <tr>
        <td><strong>FR-BUD-001</strong></td>
        <td>Distinct budget states</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>Calculates Planned vs Committed vs Actual without double counting linked bookings.</td>
      </tr>
      <tr>
        <td><strong>FR-BUD-002</strong></td>
        <td>Group splits & settlement</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>Equal and custom expense splits with automated "Settle Up" balance calculation.</td>
      </tr>
      <tr>
        <td><strong>FR-MAP-001</strong></td>
        <td>Spatial Leaflet map integration</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>Leaflet.js interactive map with color-coded custom markers for places & hotels.</td>
      </tr>
      <tr>
        <td><strong>FR-BKP-001</strong></td>
        <td>Full JSON + Blob Backup ZIP</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>JSZip export/import utility creating single <code>.travelnest</code> archive.</td>
      </tr>
      <tr>
        <td><strong>FR-SHR-001</strong></td>
        <td>WhatsApp Plain Text Sharing</td>
        <td><span class="wf-badge wf-badge-success">VERIFIED</span></td>
        <td>Formats Markdown text with Web Share API and privacy toggles.</td>
      </tr>
    </tbody>
  </table>

  <div class="spec-box" style="margin-top: 16px; text-align: center; padding: 16px;">
    <h3 style="margin:0 0 6px 0; color: #34C759; font-size: 13pt;">🎉 Finalized Wireframe Specification Complete</h3>
    <p style="margin: 0; font-size: 9pt; color: #3a3a3c;">
      All 14 application views, modals, and underlying system functions have been documented and visually mapped into this finalized specification document.
    </p>
  </div>

  <div class="footer-bar">
    <span>TravelNest Finalized Specification</span>
    <span>Page 17</span>
  </div>
</div>

</body>
</html>
"""

html_filename = "wireframe_document.html"
pdf_filename = "TravelNest_Finalized_App_Wireframe_Document.pdf"

with open(html_filename, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generated successfully: {html_filename}")

chrome_cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--user-data-dir=/tmp/chrome-user-data",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_filename}",
    html_filename
]

res = subprocess.run(chrome_cmd, capture_output=True, text=True)
print("Chrome stdout:", res.stdout)
print("Chrome stderr:", res.stderr)

if os.path.exists(pdf_filename):
    size = os.path.getsize(pdf_filename)
    print(f"SUCCESS: Generated PDF '{pdf_filename}' ({size} bytes)")
else:
    print("FAILED to generate PDF")
