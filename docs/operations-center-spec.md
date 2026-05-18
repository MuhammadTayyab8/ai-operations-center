# **operations-center-spec.md**

# **AI Operations Center — Product Specification**

## **Goal**

Build the most impressive and believable screen in the application.

This screen is the core of the product.

The experience should feel like:

An intelligent AI business operator managing a real watch retail business.

This is NOT:

* CRUD screen  
* chatbot  
* generic analytics dashboard  
* terminal logs

This IS:

* autonomous operational system  
* business reasoning engine  
* decision making interface  
* execution simulator  
* workflow visualization system

The system must visibly demonstrate:

Input → Understanding → Insight → Decision → Approval → Execution → State Change

---

# **Business In A Nutshell**

Business Type:  
Watch Retail Business

Cities:

* Karachi  
* Lahore  
* Islamabad

Currency:  
PKR

Business Workflow:

* Products are created  
* Sales happen  
* Campaigns affect sales  
* Inventory decreases  
* Dashboard reflects live data

AI sits on top of business operations.

AI acts like:

Operations Manager \+ Retail Analyst \+ Pricing Analyst

AI answers:

1. What happened?  
2. Why does it matter?  
3. What should we do?  
4. Can I execute?  
5. What changed after execution?

---

# **Main User Questions**

The system must answer business questions like:

* Why are Lahore sales falling?  
* Which products are at inventory risk?  
* Which items should be repriced?  
* Which city is underperforming?  
* Should we launch a campaign?  
* Did external news impact business operations?  
* Should delivery fee change?

---

# **Screen Objective**

The screen helps a business owner:

1. analyze business problems  
2. upload reports/news  
3. understand insights  
4. approve AI actions  
5. simulate execution  
6. see resulting changes

---

# **Core Workflow Categories**

Only 4 categories exist.

Do NOT add more.

## **1\. Sales Risk Detection**

Question:

Is business performance declining?

Looks at:

* city sales  
* revenue decline  
* declining products  
* weak trends

Possible outcomes:

* campaign recommendation  
* regional action  
* pricing recommendation

---

## **2\. Inventory Analysis**

Question:

Are stock problems happening?

Looks at:

* low stock  
* overstock  
* dead stock  
* regional shortages

Possible outcomes:

* redistribute inventory  
* reorder recommendation  
* stock warnings

---

## **3\. Pricing Optimization**

Question:

Are prices wrong?

Looks at:

* demand trends  
* inventory levels  
* product performance

Possible outcomes:

* increase price  
* decrease price

---

## **4\. External News Analysis**

Question:

Is outside world affecting business?

Looks at:

* fuel price news  
* logistics problems  
* import/export news

Possible outcomes:

* delivery fee change  
* customer notification  
* campaign adjustment

---

# **User Flow**

Step 1:  
User opens Operations Center.

Step 2:  
User optionally selects category.

If category not selected:  
AI auto-detects workflow type.

Examples:

Input:  
"Fuel prices increased in Pakistan"

Auto-selected:  
External News Analysis

Input:  
sales\_report.csv

Auto-selected:  
Sales Risk Detection

---

Step 3:  
User enters input.

Input methods:

* text  
* CSV  
* Excel  
* PDF  
* image

---

Step 4:  
AI workflow starts.

User sees beautiful progress timeline.

NOT TERMINAL LOGS.

Must feel polished.

---

Step 5:  
AI generates insight.

Example:

Insight:  
Lahore sales dropped 25%.

Impact:  
Regional revenue decline risk.

---

Step 6:  
AI generates actions.

Example:

Launch Lahore15 campaign.

Buttons:  
Approve / Reject

---

Step 7:  
After approval.

Execution happens.

---

Step 8:  
System state changes shown.

Example:

Before:  
Rolex Black \= PKR 20,000

After:  
PKR 21,000

Campaign:  
Created

Dashboard:  
Updated

---

# **UX REQUIREMENTS**

The screen must feel:

* premium  
* modern  
* intelligent  
* polished  
* enterprise grade

Inspiration:

* Linear  
* Stripe  
* Notion AI  
* Retool

Light theme only.

Primary color:  
\#2563EB

Avoid:

* clutter  
* dense tables  
* terminal logs  
* developer UI

---

# **Screen Layout**

1. Header

Title:  
AI Operations Center

Subtitle:  
Monitor business risks, analyze reports, and execute AI-driven operational actions.

---

2. Category Selector

4 modern cards:

* Sales Risk Detection  
* Inventory Analysis  
* Pricing Optimization  
* External News Analysis

Selection optional.

Selected state required.

---

3. Input Card

Contains:

* multiline text box  
* upload attachment button  
* selected file preview  
* analyze button

Placeholder examples:  
"Paste report or business issue"

Examples:  
"Fuel prices increased in Pakistan"  
"Analyze Lahore sales decline"

---

4. Live Workflow Timeline (MOST IMPORTANT)

This should look AMAZING.

NOT raw logs.

Use:

* timeline UI  
* cards  
* icons  
* animations  
* progress state

Example steps:

✓ Upload received  
✓ Parsing CSV report  
✓ Detecting sales decline  
✓ Identifying inventory risks  
✓ Generating recommendations  
✓ Waiting approval  
✓ Executing workflow  
✓ Completed

Each step:

* timestamp  
* success/loading/error state  
* expandable details

Must feel premium.

---

5. Insight Card

Show:

Insight:  
Lahore sales dropped 25%.

Why It Matters:  
Revenue risk increasing.

Impact:  
Luxury segment demand weakening.

---

6. Recommended Actions

Beautiful cards.

Example:

Launch Lahore15 campaign

Reason:  
Regional sales decline.

Expected impact:  
Recover 8–15% sales.

Buttons:  
Approve | Reject

Example:

Increase Rolex Black price by 5%

Buttons:  
Approve | Reject

---

7. Outcome Section

Before vs After comparison.

Examples:

Before:  
Delivery fee \= 250 PKR

After:  
350 PKR

OR

Before:  
Rolex Black \= 20,000

After:  
21,000

Show:

* campaign created  
* inventory updated  
* dashboard refreshed

---

# **DATA PROCESSING RULES**

IMPORTANT.

CSV/Excel:

NEVER send raw file to AI.

Must use:

* pandas  
* numpy

First:

1. parse file  
2. clean data  
3. aggregate trends  
4. detect anomalies  
5. create structured JSON

Then send summarized context to agent.

Example:

{  
"city": "Lahore",  
"sales\_drop": 25,  
"declining\_products": \[  
"Rolex Black",  
"Casio Silver"  
\],  
"inventory\_risk": true  
}

---

PDF Processing:

Extract text first.

Then identify operational signals.

---

Image Processing:

OCR or Gemini vision.

Convert to text.

Then structured business context.

---

# **Delivery Fee Rule**

No real shipping integration.

Store:

default\_delivery\_fee

AI may recommend changes.

Example:

Fuel price increase  
→ suggest fee increase

---

# **12 Example Workflows**

Example 1

Input:  
Lahore monthly sales

Month 1: 200K  
Month 2: 150K

Expected Output:

Insight:  
Sales dropped 25%.

Action:  
Launch Lahore15 campaign.

Outcome:  
Campaign created.

---

Example 2

Input:  
Fuel prices increased.

Expected Output:

Insight:  
Delivery cost risk.

Action:  
Increase delivery fee.

Outcome:  
Fee updated.

---

Example 3

Input:  
Karachi inventory

Rolex Black \= 2 units

Expected Output:

Insight:  
Stockout risk.

Action:  
Redistribute stock.

Outcome:  
Inventory updated.

---

Example 4

Input:  
Dead stock detected.

Expected Output:

Action:  
Launch clearance discount.

---

Example 5

Input:  
Fast-selling product.

Expected Output:

Action:  
Increase price by 5%.

---

Example 6

Input:  
Overstock in Lahore.

Expected Output:

Action:  
Move stock to Karachi.

---

Example 7

Input:  
Luxury watches declining.

Expected Output:

Action:  
Campaign for premium buyers.

---

Example 8

Input:  
Casio Silver underperforming.

Expected Output:

Action:  
Reduce price by 7%.

---

Example 9

Input:  
External import restrictions.

Expected Output:

Action:  
Increase inventory buffer.

---

Example 10

Input:  
Regional sales spike.

Expected Output:

Action:  
Increase inventory allocation.

---

Example 11

Input:  
Online delivery orders increased.

Expected Output:

Action:  
Delivery optimization recommendation.

---

Example 12

Input:  
Campaign ineffective.

Expected Output:

Action:  
Recommend campaign adjustment.

---

# **FINAL REQUIREMENT**

Implement this screen exactly.

Prioritize:

* UX quality  
* AI workflow clarity  
* believable business behavior  
* premium workflow timeline  
* approval flow  
* state change visualization

This screen should become:

the strongest demo moment of the hackathon

