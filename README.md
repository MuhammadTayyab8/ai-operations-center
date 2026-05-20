# 🌌 NexusForge: Autonomous AI Operations Center
### *Operational Intelligence & Multi-Agent Decisions for Premium Watch Retail in Pakistan*

[![FastAPI Backend](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React Native Expo](https://img.shields.io/badge/React_Native_Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![Google GenAI SDK](https://img.shields.io/badge/Google_GenAI_SDK-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://adk.dev)
[![Firebase Firestore](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![UV Package Manager](https://img.shields.io/badge/UV_Manager-FF5722?style=for-the-badge&logo=python&logoColor=white)](https://github.com/astral-sh/uv)

---

## 📋 System Overview

**NexusForge** is an advanced, autonomous AI Operations Center designed specifically for a watch retail business operating across **Karachi**, **Lahore**, and **Islamabad**. 

Unlike standard ERP systems containing simple reporting dashboards or standalone chatbots, **NexusForge** operates as an autonomous **Mission Control Center**. It visualizes the entire cognitive loop of an AI system executing business-critical adjustments to live Firestore databases.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│   UNSTRUCTURED  │       │  MULTI-AGENT    │       │   INTERACTIVE   │       │   MUTATED DB     │
│      INPUT      │ ────> │  COGNITIVE LOOP │ ────> │  HUMAN-IN-THE-  │ ────> │  STATE CHANGES   │
│ (News/CSVs/PDF) │       │   (Google ADK)  │       │  LOOP APPROVAL  │       │  (Firestore/BI)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └──────────────────┘
```

> [!IMPORTANT]
> **Judges Key Highlight**: The core engineering focus of NexusForge is proving the clean propagation of data from **Unstructured Context Understanding ──> Structured Anomaly Detection ──> Quantitative Action Evaluation ──> Human Gatekeeping ──> Safe DB Transaction Execution**.

---

## 🛠️ The Technology Stack

NexusForge leverages a cutting-edge technical architecture optimized for performance, scalability, and developer velocity.

```mermaid
graph TD
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef server fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef ai fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef db fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;

    subgraph Client ["Client (React Native Expo)"]
        UI["📱 UI Components (NativeWind / Tailwind)"]:::client
        State["🔄 Zustand State Management"]:::client
        Cache["⚡ TanStack Query & Axios"]:::client
    end

    subgraph Backend ["Backend Service (FastAPI)"]
        API["⚡ FastAPI Routes"]:::server
        SSE["📡 SSE Real-Time Logger"]:::server
        Pandas["📊 Pandas & NumPy Analytics"]:::server
    end

    subgraph Intelligence ["AI Orchestration"]
        ADK["🔧 Google GenAI SDK (ADK)"]:::ai
        Model["🧠 Gemini-2.5-Flash (Reasoning Engine)"]:::ai
    end

    subgraph Database ["Persistence Layer"]
        Firestore["🔥 Google Cloud Firestore"]:::db
    end

    UI --> Cache
    Cache --> API
    API --> SSE
    API --> Pandas
    Pandas --> ADK
    ADK --> Model
    Model --> ADK
    API --> Firestore
    ADK --> Firestore

```

### Backend & Infrastructure
*   **Virtual Environment & Package Manager**: [Astral UV](https://github.com/astral-sh/uv) (Incredibly fast workspace setup, sub-second locking).
*   **Web Framework**: **FastAPI** (Python 3.12, asynchronous routing, native Pydantic v2 schemas).
*   **AI Orchestration**: **Google GenAI SDK** interacting with the powerful **Gemini 2.5 Flash** model (enables strict JSON output schemas, sub-second reasoning response, and contextual safety filters).
*   **Data Science Engine**: **Pandas & NumPy** (acts as the semantic aggregator, calculating variances and inventory anomalies to feed the LLM cleanly).

### Frontend / Client
*   **Client Core**: **React Native Expo** (iOS/Android cross-platform application).
*   **Design Framework**: **NativeWind / Tailwind CSS** styled strictly with NexusForge’s enterprise-grade color tokens.
*   **State & Networking**: **Zustand** (lightweight client state) and **TanStack Query** (caching and remote server mutations sync).
*   **Real-time Streaming**: **Server-Sent Events (SSE)** receiver for live visual updates during multi-agent thinking phases.

---

## 📡 Live Workflow Tracing & SSE Progression

When an unstructured input is supplied (e.g., pasting news of a fuel price surge or uploading a sales report), a **Server-Sent Events (SSE)** stream is established. The frontend renders this live trace in real-time, showing judges exactly how the agent works under the hood.

### Tracing Pipeline States

```
[1. Parsing Report] ──> [2. Understanding Context] ──> [3. Detecting Anomalies] ──> [4. Generating Insights] ──> [5. Creating Decisions] ──> [6. Paused for Approval] ──> [7. Executing Mutation] ──> [8. State Updated]
```

*   **`Parsing report...`**: Deconstructs raw files (CSV/Excel/TXT) using backend parsers into readable tabular representations.
*   **`Understanding business context...`**: Passes classification signals to the Intake Agent.
*   **`Detecting anomalies...`**: Invokes domain read-tools to check inventory variances and sales thresholds.
*   **`Generating insights...`**: The Insight Agent processes data variances and constructs business impact evidence.
*   **`Creating recommendations...`**: The Decision Agent determines pricing, campaigns, inventory, or logistical shifts.
*   **`Waiting for approval...` / `Workflow paused`**: Halts execution, passing a structured schema payload to the mobile screen approval modal.
*   **`Executing actions...`**: After human interaction (Approval), triggers the database mutation transaction.
*   **`Workflow completed`**: Pushes final event closing the stream and showing the visual state comparison cards.

---

## 🧠 Multi-Agent Architecture (Google ADK & Gemini)

LLMs are reasoning engines, not spreadsheet calculators. NexusForge enforces a strict multi-agent boundary where agents interact with pre-processed structured payloads through Pandas aggregates, maintaining **Guardrails** and operational boundaries.

```
                     ┌──────────────────────────────────────┐
                     │          Unstructured Input          │
                     └──────────────────┬───────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────┐
                     │          1. INTAKE AGENT             │
                     │  - Runs Guardrail Exception Checks   │
                     │  - Classifies Domain and Intent      │
                     │  - Extracts Cities & Products        │
                     └──────────────────┬───────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────┐
                     │          2. INSIGHT AGENT            │
                     │  - Runs Pandas Aggregation / Tools   │
                     │  - Identifies Region/Stock Anomalies │
                     │  - Generates Metric Evidence Diff    │
                     └──────────────────┬───────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────┐
                     │          3. DECISION AGENT           │
                     │  - Evaluates Optimal Business Steps  │
                     │  - Attaches Confidence & Risk Weight │
                     │  - Formulates Parameterized Actions  │
                     └──────────────────┬───────────────────┘
                                        │
                               [ Human Approval Gate ]
                                        │ (Approved)
                                        ▼
                     ┌──────────────────────────────────────┐
                     │         4. EXECUTION AGENT           │
                     │  - Fires Firestore Mutators          │
                     │  - Publishes Regional Notifications  │
                     │  - Completes Workflow Log            │
                     └──────────────────────────────────────┘
```

### 1. Intake Agent (`app/agents/intake.py`)
Classifies incoming tasks into domain types (`sales` | `inventory` | `pricing` | `external_news` | `general`) and extracts variables.
*   **Guardrails**: Protects against system prompt extraction, general chit-chat, and malicious queries. Passes a `GuardrailException` immediately if violated.
*   **Strict Return Schema**: `IntakeClassification` Pydantic model.

### 2. Insight Agent (`app/agents/insight.py`)
Analyzes real-time database inputs fetched by specialized read-tools.
*   **No Raw Data Injection**: Large CSVs or records are filtered via Pandas/NumPy. Only calculated metrics (e.g. Lahore Sales down 24%) are fed into the LLM.
*   **Strict Return Schema**: `InsightResult` Pydantic model containing `understanding` metadata, `key_insight`, before/after `evidence` points, `affected_entities`, and `risk_level`.

### 3. Decision Agent (`app/agents/decision.py`)
Recommends the single most impactful business action with calculated probabilities.
*   **Action Choices**: `create_campaign` (Marketing coupon), `update_price` (Price optimization), `update_delivery_fee` (Logistics cost adjust), `redistribute_inventory` (Supply chain shifts), or `create_notification`.
*   **Parameters**: Attaches specific variables (e.g., target discount, target cities) in `details`.
*   **Strict Return Schema**: `DecisionAction` Pydantic model containing `action_type`, `justification`, `expected_impact`, `confidence` (0.0 to 1.0), and `risk` ('Low' | 'Medium' | 'High').

### 4. Execution Agent (`app/agents/execution.py`)
Triggered only upon explicit human signature (approval).
*   **Database Mutation**: Automatically calls transaction-safe helper tools (`business_tools.py`) to edit live Firestore configurations, add campaigns, or redistribute stock levels across cities.
*   **Strict Return Log**: Captures success/failure parameters returned from DB tools and persists them inside the workflow's document block as an `action_log`.

---

## 🔥 NoSQL Database Schema Design (Firestore)

NexusForge stores data dynamically across **Google Cloud Firestore**. The NoSQL layout maps directly to the operational constraints of the Watch Retail business model:

### 1. `products` (Collection)
Maintains product information and regional inventory levels.
```json
{
  "id": "prod_rolex_submariner_101",
  "name": "Rolex Submariner Date",
  "sku": "RLX-SUB-101",
  "category": "Luxury Watches",
  "base_price": 450000.0,
  "ai_updated_at": "2026-05-19T20:25:49Z",
  "inventory": [
    {
      "city": "Karachi",
      "quantity": 18,
      "low_stock_threshold": 5
    },
    {
      "city": "Lahore",
      "quantity": 3,
      "low_stock_threshold": 5
    },
    {
      "city": "Islamabad",
      "quantity": 12,
      "low_stock_threshold": 5
    }
  ]
}
```

### 2. `sales` (Collection)
Stores operational invoice transaction documents. Contains embedded items rather than joins.
```json
{
  "id": "invoice_sales_99342",
  "customer_id": "cust_8213",
  "customer_name": "Muhammad Tayyab",
  "customer_email": "tayyab@example.com",
  "customer_phone": "03001234567",
  "type": "Online Delivery",
  "discount_applied": 1500.0,
  "city": "Lahore",
  "total_amount": 448700.0,
  "created_at": "2026-05-19T18:14:22Z",
  "delivery_address": "DHA Phase 5, Block L, Lahore",
  "items": [
    {
      "id": "invoice_sales_99342_prod_rolex_submariner_101",
      "sale_id": "invoice_sales_99342",
      "product_id": "prod_rolex_submariner_101",
      "quantity": 1,
      "unit_price": 450000.0
    }
  ]
}
```

### 3. `campaigns` (Collection)
Marketing campaigns generated autonomously by the Decision agent.
```json
{
  "id": "camp_lahore_surge_rebound",
  "name": "Lahore Recovery Boost",
  "coupon_code": "LAHORE15",
  "discount_percent": 15.0,
  "region": "Lahore",
  "projected_impact": "Recover 8-15% Lahore revenue through localized incentives.",
  "ai_generated": true,
  "is_active": true,
  "created_at": "2026-05-19T20:25:49Z"
}
```

### 4. `settings` (Collection) -> `delivery` (Document)
System-wide variables updated dynamically during news-driven logistics surges.
```json
{
  "default_delivery_fee": 350.0,
  "city": "Global",
  "updated_at": "2026-05-19T20:25:49Z"
}
```

### 5. `notifications` (Collection)
Broadcasting messages dispatched across regions upon pricing or inventory alerts.
```json
{
  "id": "notif_inv_alert_991",
  "message": "AI Action: Dispatched 5 Rolex Submariner Date units from Islamabad to Lahore due to stock deficit.",
  "city": "Lahore",
  "created_at": "2026-05-19T20:25:49Z",
  "is_read": false,
  "ai_generated": true
}
```

### 6. `workflows` (Collection)
The core tracking ledger. Maps the entire agent cognitive trace, structured outputs, approvals, and mutations.
```json
{
  "id": "workflow_9932a_883f",
  "trigger_source": "Category: sales_risk\nUser Note: Analyze Lahore sales decline\nExtracted File Content: [Tabular CSV Data representing Lahore sales...]",
  "category": "sales_risk",
  "status": "executed",
  "created_at": "2026-05-19T20:25:49Z",
  "context_data": {
    "insight": {
      "understanding": {
        "source": "Production DB",
        "scope": "Region: Lahore",
        "time_range": "Last 30 Days",
        "records_analyzed": "14,592 Rows",
        "signals": ["High price resistance", "Walk-in revenue drops"]
      },
      "key_insight": "Lahore luxury watch sales have declined by 24% over the last week due to price resistance.",
      "evidence": [
        {
          "label": "Lahore Sales",
          "before": "₨1,800,000",
          "after": "₨1,368,000",
          "trend": "down"
        }
      ],
      "affected_entities": [
        {
          "name": "Rolex Submariner Date",
          "impact": "↓ 24%"
        }
      ],
      "risk_level": "High",
      "business_impact": "PKR 432,000 monthly projected run-rate loss."
    },
    "decision": {
      "action_type": "create_campaign",
      "details": {
        "name": "Lahore Recovery Boost",
        "coupon_code": "LAHORE15",
        "discount_percent": 15.0,
        "region": "Lahore",
        "product_name": null,
        "new_price": null,
        "new_fee": null,
        "city": null,
        "from_city": null,
        "to_city": null,
        "quantity": null,
        "message": null
      },
      "justification": "Mitigate drop by introducing a localized discount campaign specifically targeting Lahore customers.",
      "expected_impact": "Recover 8-15% Lahore revenue within 2 weeks",
      "confidence": 0.85,
      "risk": "Low"
    }
  },
  "action_log": {
    "action_category": "create_campaign",
    "log_message": "✓ Campaign created: 'Lahore Recovery Boost' (LAHORE15) — 15% off for Lahore"
  }
}
```

---

## 📱 Operational App Flow & Navigation

NexusForge features a premium, responsive React Native frontend mimicking a high-end enterprise SaaS client.

```
       ┌───────────────────────────────────────────────────────────────┐
       │                       DASHBOARD (BI)                          │
       │  (Overall sales, active alerts, regional graphs, live ticker) │
       └──────────────┬─────────────────────────────────┬──────────────┘
                      │                                 │
                      ▼                                 ▼
       ┌───────────────────────────────┐ ┌─────────────────────────────┐
       │   PRODUCTS & PRICING (POS)    │ │   CAMPAIGNS MANAGEMENT      │
       │  (Product list, regional stock, │ │  (List of active promotions, │
       │   AI dynamic pricing badges)  │ │   AI-generated campaigns)   │
       └───────────────────────────────┘ └─────────────────────────────┘
                      ▲                                 ▲
                      │                                 │
       ┌──────────────┴─────────────────────────────────┴──────────────┐
       │                    OPERATIONS CENTER                          │
       │  - Unstructured Input triggers (Paste News, Upload CSV/Excel) │
       │  - Live SSE Progress Logger Panel (Mental model visual representation) │
       │  - Decision Recommendation Card (Details, expected impact, confidence)│
       │  - Interactive Approval Modal Gate (Approve / Reject triggers) │
       │  - State Comparison Cards (Before/After parameters side-by-side)│
       └───────────────────────────────────────────────────────────────┘
```

1.  **Dashboard Screen**: High-level telemetry displaying total revenues, order trends, regional performance charts, low-stock visual meters, and recent AI actions feed.
2.  **Operations Center Screen**: The core sandbox. Here you feed news articles or upload transaction files. You see the live log ticker streaming down, followed by interactive approval actions.
3.  **Products & Pricing Screen**: Detailed list of watches with a visual indication of quantities in Karachi, Lahore, and Islamabad, featuring glowing "AI-Updated" badges for recently altered prices.
4.  **Campaigns Screen**: A directory of active promotional codes. Judges can see active coupon status and toggle promotions directly.
5.  **Sales POS Screen**: Create mock manual or walk-in orders. Adding sales automatically deducts Firestore stock quantities and triggers real-time dashboard calculations.
6.  **Reports Screen**: Exports tabular records to PDF or Excel formats for internal recordkeeping.

---

## 🚀 Step-by-Step Demo Scenarios (For Judges)

We have curated three concrete scenarios for judges to see the system operating at peak autonomous efficiency.

### 🎭 Scenario 1: Lahore Sales Anomaly & Automated Campaign
1.  Navigate to **Operations Center**.
2.  Upload the mock Excel file or select **Sales Risk Detection** category and paste this note:
    > "Lahore branch walk-in metrics show severe decline. Customers complaining about pricing changes due to local inflation. Rolex line is barely moving."
3.  Click **Trigger AI Pipeline**.
4.  **Watch the Live Trace**: Observe the SSE stream parsing DB metrics (`get_sales_summary`), calculating the Karachi vs Lahore variance, and analyzing product velocity.
5.  **Review the AI Insights**: See the Insight card highlighting **High Risk Level** and the Pydantic evidence comparison showing Lahore sales drops.
6.  **Review the Proposed Decision**: The agent recommends creating a campaign: **"Lahore Recovery Boost" (`LAHORE15`)** with 15% discount for the Lahore region.
7.  **Click Approve**: The modal closes, database updates, and a `Workflow completed` status fires.
8.  **Verify**: Navigate to **Campaigns Screen** to see `LAHORE15` active, and observe the live **Dashboard** campaign counter increment.

### ⛽ Scenario 2: Karachi Fuel Surges & Logistics Adjustments
1.  Select **Analyze External News** workflow category.
2.  Paste this news headline directly:
    > "OGRA announces immediate PKR 35 per liter increase in petrol and high-speed diesel prices nationwide. Courier and third-party logistics firms implement a 25% surge charge across urban delivery routes."
3.  Click **Trigger AI Pipeline**.
4.  **The Reasoning**: The Intake Agent identifies the fuel price keyword, routes it to the `external_news` domain, and fetches global delivery fee configurations (`get_delivery_fee`).
5.  **The Decision**: Recommends increasing the default delivery fee from **₨200 to ₨260** to prevent revenue margins erosion.
6.  **Approve the Change**: See the before/after state card: **₨200 ──> ₨260**.
7.  **Verify**: Go to the Sales Screen, create an **Online Delivery** order, and notice the delivery fee dynamically factors in the new ₨260 pricing.

### 📦 Scenario 3: Rolex Deficit & Supply Chain Redistribution
1.  Select **Inventory Analysis** category.
2.  Paste this prompt:
    > "Critical inventory shortage of Rolex Submariner in Lahore branch. Stock is sitting at only 3 units. Karachi has overstock of 18 units."
3.  Click **Trigger AI Pipeline**.
4.  **The Reasoning**: The Insight Agent processes regional products inventory, detects Lahore is below the low-stock threshold (5), while Karachi is sitting on overstock.
5.  **The Decision**: Recommends redistributing **5 units** of "Rolex Submariner Date" from **Karachi to Lahore**.
6.  **Approve**: The Execution Agent adjusts the nested array in Firestore for `prod_rolex_submariner_101`.
7.  **Verify**: Navigate to the **Products Screen** and view the regional quantities. Karachi drops from 18 to 13; Lahore increments from 3 to 8!

---

## 🛠️ Local Environment Quick Start

Get NexusForge running locally on your computer in under 3 minutes.

### Prerequisites
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)
*   [Astral UV Package Manager](https://github.com/astral-sh/uv) (Highly Recommended)
*   Google Gemini API Key
*   Google Firebase Service Account Credentials

### 1. Backend Setup
```bash
# Clone the repository
cd backend

# Create your .env file
copy .env.example .env
```

Ensure your `.env` contains the required keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0B..."
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

Start the FastAPI application:
```bash
# Install dependencies and start server with uv
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs)*.

### 2. Mobile Client Setup
```bash
cd ../mobile-app

# Install client packages
npm install

# Configure backend API address in src/services/api.ts or .env (if applicable)
# For real device testing, replace localhost with your local network IP

# Launch expo bundler
npx expo start -c
```
*Press `a` to run on an Android Emulator, `i` for iOS Simulator, or scan the QR code to run on a physical phone via the Expo Go app.*

---

## 🏛️ Operational Boundaries & Security Guardrails
To ensure robustness during the live hackathon presentation, NexusForge implements rigorous system boundaries:
*   **Topic Enforcement**: Any user input unrelated to retail, inventory, watch business operations, or logistics is gracefully classified as `general` or blocked by the safety layer, returning a helpful notification rather than causing pipeline exceptions.
*   **Rate Limits & Mock Overflows**: Large CSV uploads are handled dynamically by Python parsing and chunks generation, protecting Gemini context limits and optimizing performance.
*   **Transaction Gates**: Write-actions are never committed automatically, ensuring safe operations with zero risk of database corruption.

---

*Developed with ❤️ by Pakistan's AI Innovators for the AISeekho Hackathon.*
