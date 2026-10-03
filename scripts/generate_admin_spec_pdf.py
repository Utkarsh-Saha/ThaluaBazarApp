import os
import sys
from playwright.sync_api import sync_playwright

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Thaluwa Bazar — Admin Panel Specification</title>
<style>
  @page {
    size: A4;
    margin: 10mm 12mm 10mm 12mm;
  }
  
  * {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    line-height: 1.35;
    font-size: 8.8pt;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
  }

  .page-container {
    height: 275mm;
    max-height: 275mm;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
  }

  .page-container:last-child {
    page-break-after: avoid;
  }

  .page-content {
    flex: 1;
  }

  /* Header / Title Banner */
  .doc-header {
    border-bottom: 2px solid #0d5c3a;
    padding-bottom: 5px;
    margin-bottom: 8px;
  }

  .doc-title {
    font-size: 15pt;
    font-weight: 800;
    color: #0d5c3a;
    letter-spacing: -0.3px;
    margin: 0 0 2px 0;
    text-transform: uppercase;
  }

  .doc-subtitle {
    font-size: 9.2pt;
    font-weight: 600;
    color: #475569;
    margin: 0;
  }

  .doc-tagline {
    font-size: 7.5pt;
    font-weight: 500;
    color: #64748b;
    margin-top: 1px;
  }

  /* Section Headings */
  h2 {
    color: #0f172a;
    font-size: 9.8pt;
    font-weight: 800;
    margin: 7px 0 4px 0;
    border-left: 3px solid #0d5c3a;
    padding-left: 6px;
  }

  p {
    margin: 0 0 5px 0;
    text-align: justify;
  }

  /* 2-Column Grid Layout */
  .grid-2 {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
  }

  .col {
    flex: 1;
  }

  /* Cards & Callouts */
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
    margin-bottom: 4px;
  }

  .card-title {
    font-size: 8.5pt;
    font-weight: 700;
    color: #0d5c3a;
    margin-bottom: 2px;
  }

  .card ul {
    margin: 0;
    padding-left: 14px;
  }

  .card li {
    margin-bottom: 1.5px;
    font-size: 8.2pt;
  }

  .highlight-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 3px solid #16a34a;
    border-radius: 4px;
    padding: 5px 8px;
    margin: 5px 0;
    font-size: 8.2pt;
  }

  .highlight-box strong {
    color: #166534;
  }

  .alert-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 3px solid #d97706;
    border-radius: 4px;
    padding: 5px 8px;
    margin: 5px 0;
    font-size: 8.2pt;
  }

  .alert-box strong {
    color: #92400e;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 5px 0 6px 0;
    font-size: 8.2pt;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 3.5px 6px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 8.2pt;
  }

  tr:nth-child(even) td {
    background-color: #fafbfc;
  }

  /* Badges & Tags */
  .badge {
    display: inline-block;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 700;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .badge-green { background: #dcfce7; color: #166534; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-purple { background: #f3e8ff; color: #6b21a8; }
  .badge-red { background: #fee2e2; color: #991b1b; }

  /* Code / Monospace */
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 7.8pt;
    background: #f1f5f9;
    padding: 1px 3px;
    border-radius: 3px;
    color: #0f172a;
  }

  /* Workflow Steps */
  .step-flow {
    display: flex;
    gap: 6px;
    margin: 5px 0 6px 0;
  }

  .step-item {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-top: 2.5px solid #0d5c3a;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 7.6pt;
  }

  .step-num {
    font-weight: 800;
    color: #0d5c3a;
    margin-bottom: 1px;
    font-size: 7.2pt;
  }

  .step-title {
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1px;
    font-size: 8pt;
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    font-size: 7.2pt;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 3px;
    margin-top: 4px;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page-container">
    <div class="page-content">
      <div class="doc-header">
        <div class="doc-title">THALUWA BAZAR — Admin Panel Specification</div>
        <div class="doc-subtitle">Enterprise Platform Operations, KYC Verification, Order Moderation & Financial Settlement Architecture</div>
        <div class="doc-tagline">Mission-Critical Governance Engine for Assam's Hyperlocal Rural-Urban Marketplace Startup (Darrang Pilot)</div>
      </div>

      <h2>1. Platform Governance Vision & Admin Panel Scope</h2>
      <p>
        Thaluwa Bazar connects rural Self-Help Groups (SHGs), organic farmers, handloom artisans, and fishermen across Assam directly with urban buyers. While buyer and seller mobile clients prioritize frictionless ordering, the <strong>Admin & Moderation Infrastructure</strong> acts as the central authority—ensuring producer authenticity, financial clarity, order dispute resolution, and regulatory compliance.
      </p>

      <div class="grid-2">
        <div class="col card">
          <div class="card-title">🛡️ Core Administrative Pillars</div>
          <ul>
            <li><strong>Producer Authenticity:</strong> Rapid audit and verified badge awards for SHG collectives, weavers, and organic growers.</li>
            <li><strong>Weekly Haat Hub Control:</strong> Schedule configuration for bi-weekly rural haats (Mangaldai, Sipajhar, Kharupetia).</li>
            <li><strong>Order Dispute Moderation:</strong> Real-time oversight on state transitions with administrative overrides.</li>
            <li><strong>Financial Settlement:</strong> Reconciling Cash-on-Delivery (COD) with direct UPI/bank payouts.</li>
          </ul>
        </div>
        <div class="col card">
          <div class="card-title">👥 Administrative Role Hierarchy</div>
          <ul>
            <li><strong>Super Administrator:</strong> System configuration, batch financial disbursal, and platform analytics.</li>
            <li><strong>District Moderator:</strong> KYC verification of local SHGs, listing quality control, and dispute resolution.</li>
            <li><strong>Haat Coordinator:</strong> Physical market attendance, stall check-in, and COD cash aggregation.</li>
            <li><strong>Automated Guard Engine:</strong> Background processes computing GMV, stock levels, and push triggers.</li>
          </ul>
        </div>
      </div>

      <h2>2. Technology Stack & Security Architecture</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 22%;">Layer</th>
            <th style="width: 38%;">Technologies & Libraries</th>
            <th style="width: 40%;">Administrative Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Mobile Ops Client</strong></td>
            <td>React Native, Expo SDK 52, Expo Router (<code>src/app/admin/index.tsx</code>), Lucide Icons, Haptics</td>
            <td>Field-ready mobile dashboard for district moderators visiting rural SHG clusters and weekly haats.</td>
          </tr>
          <tr>
            <td><strong>API & Logic Engine</strong></td>
            <td>Node.js 20+, Express, TypeScript, <code>authMiddleware.ts</code>, <code>adminController.ts</code></td>
            <td>Executes multi-table aggregations, verification transitions, and automated push notifications.</td>
          </tr>
          <tr>
            <td><strong>Database & RLS</strong></td>
            <td>Supabase PostgreSQL with PostGIS, Service Role Key (<code>supabaseAdmin</code>)</td>
            <td>Privileged data layer bypassing tenant RLS for cross-district analytics, KYC updates, and audit logs.</td>
          </tr>
          <tr>
            <td><strong>Real-Time Alerts</strong></td>
            <td>Expo Push Notification Service + <code>public.notifications</code> (Bilingual: Assamese/English)</td>
            <td>Instant push alerts to seller mobile devices upon KYC verification or order intervention.</td>
          </tr>
        </tbody>
      </table>

      <div class="highlight-box">
        <strong>🔒 Startup Security Directive:</strong> Field moderators cannot perform administrative mutations via client-side Supabase keys. All admin operations (approvals, rejections, fee adjustments) must route through the authenticated Node.js backend using validated JWT tokens and role verification (<code>users.role IN ('admin', 'moderator')</code>).
      </div>

      <h2>3. Live Metrics & Operational Analytics Aggregation</h2>
      <p>
        The Admin Dashboard renders a real-time <strong>2x2 Executive KPI Grid</strong> calculated via parallel non-blocking queries on the Node.js backend (<code>Promise.all</code>) against Supabase:
      </p>

      <div class="step-flow">
        <div class="step-item">
          <div class="step-num">METRIC 1</div>
          <div class="step-title">👥 Total Users</div>
          <div><code>SELECT count(*) FROM users</code>. Monitors platform user growth.</div>
        </div>
        <div class="step-item">
          <div class="step-num">METRIC 2</div>
          <div class="step-title">🏬 Verified vs Pending</div>
          <div>Breaks down <code>seller_profiles</code> into active vs unreviewed queue.</div>
        </div>
        <div class="step-item">
          <div class="step-num">METRIC 3</div>
          <div class="step-title">🛍️ Total Orders</div>
          <div>Tracks total transaction volume and active fulfillment states.</div>
        </div>
        <div class="step-item">
          <div class="step-num">METRIC 4</div>
          <div class="step-title">₹ Platform GMV</div>
          <div>Sum of <code>orders.total</code> for completed sales formatted in ₹ (e.g. ₹2,45,680).</div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Thaluwa Bazar — Admin Panel & Platform Operations Specification</span>
      <span>Page 1 of 3</span>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page-container">
    <div class="page-content">
      <div class="doc-header">
        <div class="doc-title">THALUWA BAZAR — Admin Panel Specification</div>
        <div class="doc-subtitle">Section 4, 5 & 6: Administrative Data Model, KYC Lifecycle & Financial Settlement</div>
      </div>

      <h2>4. Administrative Database Architecture (PostgreSQL / Supabase)</h2>
      <p>
        The administrative data model extends the core transactional schema with verification states, audit logs, and payout records:
      </p>

      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Table Name</th>
            <th style="width: 42%;">Administrative Fields & Constraints</th>
            <th style="width: 38%;">Governance Function</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>public.users</code></td>
            <td><code>id, phone, role ('buyer'|'seller'|'moderator'|'admin'), verified, expo_push_token, language</code></td>
            <td>Enforces RBAC access guards and holds push notification tokens for admin broadcasts.</td>
          </tr>
          <tr>
            <td><code>public.seller_profiles</code></td>
            <td><code>id, user_id, business_name, shg_code, seller_type, verification_status, bank_details, verified_at</code></td>
            <td>Maintains KYC lifecycle (<code>pending</code> ➔ <code>under_review</code> ➔ <code>verified</code> | <code>rejected</code>).</td>
          </tr>
          <tr>
            <td><code>public.orders</code></td>
            <td><code>id, buyer_id, seller_id, total, status, dispute_status, override_by, commission_fee, created_at</code></td>
            <td>Global ledger enabling administrative overrides (e.g., cancelling stuck orders, issuing refunds).</td>
          </tr>
          <tr>
            <td><code>public.seller_payouts</code></td>
            <td><code>id, seller_id, amount, status ('pending'|'processed'|'failed'), utr_ref, disbursed_at</code></td>
            <td>Tracks weekly bank/UPI disbursements to rural SHG cooperative accounts.</td>
          </tr>
          <tr>
            <td><code>public.haat_markets</code></td>
            <td><code>id, name_en, name_as, district, market_day, geom, is_active, coordinator_id</code></td>
            <td>Controls schedule and location coordinates for weekly rural market aggregation points.</td>
          </tr>
          <tr>
            <td><code>public.audit_logs</code></td>
            <td><code>id, actor_id, action, target_table, target_id, changes_json, ip_address, created_at</code></td>
            <td>Immutable audit log capturing all moderator interventions and KYC decisions.</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Critical Workflow: Seller KYC & SHG Verification Pipeline</h2>
      <p>
        To protect buyers from counterfeit goods and preserve Assamese craft authenticity, all sellers undergo an administrative verification pipeline before receiving the <em>Verified Seller Badge</em> (প্ৰমাণিত বিক্ৰেতা):
      </p>

      <div class="card" style="background: #ffffff; border: 1.5px solid #0d5c3a; padding: 5px 8px;">
        <div style="font-weight: 800; color: #0d5c3a; margin-bottom: 3px; font-size: 8.5pt;">
          🔄 KYC Verification State Machine & Automated Notification Lifecycle:
        </div>
        <div style="font-family: ui-monospace, monospace; font-size: 7.8pt; line-height: 1.4; color: #0f172a;">
          [Seller Submits SHG Code/ID] ➔ <span class="badge badge-amber">pending</span> 
          ➔ [Moderator Inspects Registry] ➔ <span class="badge badge-blue">under_review</span> 
          ➔ [Admin Decision] ➔ <span class="badge badge-green">verified</span> OR <span class="badge badge-red">rejected</span>
        </div>
      </div>

      <div class="step-flow">
        <div class="step-item">
          <div class="step-num">STEP 1</div>
          <div class="step-title">Queue Ingestion</div>
          <div>App queries <code>GET /api/v1/admin/pending-sellers</code>. Fetches unverified seller profiles joined with user details.</div>
        </div>
        <div class="step-item">
          <div class="step-num">STEP 2</div>
          <div class="step-title">Document Audit</div>
          <div>Moderator validates SHG Code (e.g. <code>AS-MRG-SHG-2024</code>) against State Rural Livelihood Mission records.</div>
        </div>
        <div class="step-item">
          <div class="step-num">STEP 3</div>
          <div class="step-title">Atomic DB Update</div>
          <div>Calls <code>POST /api/v1/admin/sellers/:id/status</code> with status: <code>'verified'</code>. Sets <code>users.verified = true</code>.</div>
        </div>
        <div class="step-item">
          <div class="step-num">STEP 4</div>
          <div class="step-title">Bilingual Push Alert</div>
          <div>Dispatches Expo Push + in-app notification in Assamese: <em>"🎉 বিক্ৰেতা প্ৰফাইল প্ৰমাণিত হৈছে!"</em></div>
        </div>
      </div>

      <h2>6. Financial Settlement & Commission Reconciliation Engine</h2>
      <p>
        Thaluwa Bazar operates on a low-commission rural enablement model (0% commission for direct SHG farmers; 3–5% for commercial aggregators). The Admin panel manages the settlement lifecycle:
      </p>

      <div class="grid-2">
        <div class="col card">
          <div class="card-title">💵 Cash-on-Delivery (COD) Reconciliation</div>
          <p style="font-size: 7.8pt; margin: 0;">
            When orders are delivered at haats or doorsteps, COD collections are logged by Haat Coordinators. The system offsets cash collected against the seller’s digital balance before weekly payouts.
          </p>
        </div>
        <div class="col card">
          <div class="card-title">🏦 Batch NEFT/UPI Disbursal</div>
          <p style="font-size: 7.8pt; margin: 0;">
            Every Monday, the backend generates an automated payout ledger for all <code>COMPLETED</code> orders. Admins trigger batch bank transfers with UTR logging into <code>seller_payouts</code>.
          </p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Thaluwa Bazar — Admin Panel & Platform Operations Specification</span>
      <span>Page 2 of 3</span>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page-container">
    <div class="page-content">
      <div class="doc-header">
        <div class="doc-title">THALUWA BAZAR — Admin Panel Specification</div>
        <div class="doc-subtitle">Section 7, 8 & 9: API Reference, Mobile Interface & Execution Roadmap</div>
      </div>

      <h2>7. RESTful Admin API Specifications</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Endpoint & Method</th>
            <th style="width: 14%;">Auth Level</th>
            <th style="width: 31%;">Request Body / Params</th>
            <th style="width: 30%;">Response Structure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET /api/v1/admin/stats</code></td>
            <td><span class="badge badge-purple">Admin/Mod</span></td>
            <td>None</td>
            <td><code>{ totalUsers, totalSellers, verifiedSellers, pendingSellers, totalOrders, totalGmv, formattedGmv }</code></td>
          </tr>
          <tr>
            <td><code>GET /api/v1/admin/pending-sellers</code></td>
            <td><span class="badge badge-purple">Admin/Mod</span></td>
            <td>Query: <code>limit, district</code></td>
            <td><code>{ success: true, count: N, pending_sellers: [ { id, business_name, shg_code, users: {...} } ] }</code></td>
          </tr>
          <tr>
            <td><code>POST /api/v1/admin/sellers/:id/status</code></td>
            <td><span class="badge badge-purple">Admin/Mod</span></td>
            <td><code>{ status: 'verified'|'rejected', remarks: '...' }</code></td>
            <td><code>{ success: true, seller_profile: {...} }</code> + triggers push alert to seller device.</td>
          </tr>
          <tr>
            <td><code>GET /api/v1/admin/orders</code></td>
            <td><span class="badge badge-purple">Admin/Mod</span></td>
            <td>Query: <code>limit=100, status, district</code></td>
            <td><code>{ success: true, count: N, orders: [ { id, order_number, buyer_name, total, status, items: [...] } ] }</code></td>
          </tr>
          <tr>
            <td><code>POST /api/v1/admin/orders/:id/override</code></td>
            <td><span class="badge badge-purple">Admin Only</span></td>
            <td><code>{ new_status, reason, refund_amount }</code></td>
            <td><code>{ success: true, updated_order: {...}, audit_id }</code></td>
          </tr>
          <tr>
            <td><code>GET /api/v1/admin/haats/schedule</code></td>
            <td><span class="badge badge-blue">Public/Mod</span></td>
            <td>Query: <code>district, active_only</code></td>
            <td><code>{ success: true, haats: [ { id, name_as, name_en, district, market_day, coordinator } ] }</code></td>
          </tr>
        </tbody>
      </table>

      <h2>8. Mobile Admin Interface Architecture (Expo Router)</h2>
      <div class="grid-2">
        <div class="col card">
          <div class="card-title">📱 Native Screen Hierarchy</div>
          <ul>
            <li><code>src/app/admin/index.tsx</code>: Main Dashboard (2x2 KPI grid, pending seller swipe-to-approve, top revenue leaders, recent order stream).</li>
            <li><code>src/app/admin/seller-detail.tsx</code>: Deep-dive view with SHG registration photo preview, UPI ID verification, and rejection modal.</li>
            <li><code>src/app/admin/orders.tsx</code>: Live order management filterable by status (REQUESTED, ACCEPTED, READY, COMPLETED).</li>
          </ul>
        </div>
        <div class="col card">
          <div class="card-title">⚡ UX & Native Performance Highlights</div>
          <ul>
            <li><strong>Haptic Feedback:</strong> <code>expo-haptics</code> triggers distinct vibration signatures for successful KYC approvals vs. rejections.</li>
            <li><strong>Pull-to-Refresh:</strong> <code>RefreshControl</code> enables instant pull down to synchronize live stats and pending queues.</li>
            <li><strong>Bilingual Fallback:</strong> Assamese & English string translations via <code>LanguageContext</code> for localized field operations.</li>
          </ul>
        </div>
      </div>

      <h2>9. Phased Admin Rollout & Engineering Roadmap</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 14%;">Phase</th>
            <th style="width: 32%;">Target Deliverable</th>
            <th style="width: 38%;">Key Architectural Components</th>
            <th style="width: 16%;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Phase 1</strong></td>
            <td>Mobile Admin Dashboard & Live Stats</td>
            <td>React Native 2x2 grid, Node.js <code>/admin/stats</code> endpoint, Supabase count aggregations.</td>
            <td><span class="badge badge-green">COMPLETED</span></td>
          </tr>
          <tr>
            <td><strong>Phase 2</strong></td>
            <td>KYC Verification & Push Alerts</td>
            <td>Pending seller queue, approval mutation, bilingual Expo Push Notification dispatch.</td>
            <td><span class="badge badge-green">COMPLETED</span></td>
          </tr>
          <tr>
            <td><strong>Phase 3</strong></td>
            <td>Order Moderation & Haat Schedules</td>
            <td>Global orders ledger, status intervention overrides, weekly market hub activation.</td>
            <td><span class="badge badge-amber">IN PROGRESS</span></td>
          </tr>
          <tr>
            <td><strong>Phase 4</strong></td>
            <td>Automated SHG Batch Payouts</td>
            <td>RazorpayX / Cashfree Payouts API integration for automated bank disbursals.</td>
            <td><span class="badge badge-blue">PLANNED</span></td>
          </tr>
          <tr>
            <td><strong>Phase 5</strong></td>
            <td>Web Ops Portal for District Officials</td>
            <td>Vite/React Desktop dashboard for Darrang district agricultural officers and co-op supervisors.</td>
            <td><span class="badge badge-blue">PLANNED</span></td>
          </tr>
        </tbody>
      </table>

      <div class="alert-box">
        <strong>📌 Production Deployment Note:</strong> When deploying backend to cloud production (Render / Railway / AWS), ensure <code>SUPABASE_SERVICE_ROLE_KEY</code> and <code>EXPO_ACCESS_TOKEN</code> are secured in environment secret managers. Restrict admin routes with strict IP rate limiting (100 reqs/min per IP).
      </div>
    </div>

    <div class="page-footer">
      <span>Thaluwa Bazar — Admin Panel & Platform Operations Specification</span>
      <span>Page 3 of 3</span>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    output_pdf = "U:/SHGC/Thaluwa Bazar Admin Panel Specification.pdf"
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html_template, wait_until="networkidle")
        
        page.pdf(
            path=output_pdf,
            format="A4",
            print_background=True,
            margin={"top": "8mm", "bottom": "8mm", "left": "10mm", "right": "10mm"},
            display_header_footer=False
        )
        browser.close()

    print(f"Successfully generated PDF at: {output_pdf}")
    print(f"File size: {os.path.getsize(output_pdf)} bytes")

if __name__ == "__main__":
    generate_pdf()
