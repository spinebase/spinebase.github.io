# Project Plan: SpineBase Dynamic Explorer (v2.6)

## 1. Core Architecture
A single-page, mobile-first web application acting as a dynamic browser for a spine measurement database. This version utilizes a **Full-Manifest Headless CMS** approach: the `structure.json` file is the single source of truth for both hierarchy and item availability. All resource fetching is performed using **relative paths**.

## 2. Data Sources & Relative Path Strategy
The app assumes a co-located file structure where the HTML, JSON, and resource folders live in the same root directory.

* **`index.html` (The Shell):** Contains the persistent UI and CSS framework.
* **`app.js` (The Engine):** Contains all JavaScript logic and the search engine.
* **`about.html` (Standalone Content):** A dedicated HTML file for the "About Us" section.
* **Manifest (Local):** `./structure.json`. Defines the navigation hierarchy.

## 3. Local Development & Security
Modern browsers block `fetch()` requests when files are opened directly via the `file://` protocol. A local web server is required (e.g., `python3 -m http.server 8000`).

## 4. UI/UX & Layout Logic
* **Sticky Navigation:** The Header is locked to `position: sticky; top: 0;`.
* **Dynamic Search Bar:** When focused, the input expands to full width.
* **Empty State Suppression:** To prevent dead-end navigation, the UI automatically hides any Category or Modality button if the resulting leaf node (`content` array in `structure.json`) is empty or undefined.
* **Context-Aware Background:** The spine background is displayed exclusively on the root index (depth 0).
* **Clinical Reading Mode:** Toggles edge-to-edge reading with a pure white background on deep views.
* **Scroll Reset Protocol:** Ensures documents display from the beginning on content changes.

## 5. Navigation & History
* **State Management:** Uses a `stateStack` array to track navigation depth.
* **Browser Integration:** Uses the **HTML5 History API** for native "Back" button compatibility.

## 6. Folder Hierarchy Requirements
* **Structure:** Physical folder paths must match `structure.json`.
* **Leaf Content:** Subfolders must contain `index.html` and `thumbnail.png`.

## 7. Search Functionality (Fuzzy Match)
* **Index Generation:** Flattens the tree into a searchable array on initialization.
* **Fuzzy Matching Logic:** A dynamic Regex engine allows for typo-tolerant matching.
* **State Injection:** Clicking a result injects the parent hierarchy into the `stateStack` for proper breadcrumb flow.

## 8. Development Milestones
1. Shell Implementation.
2. Manifest & Indexing.
3. Dynamic Rendering (with empty-state logic).
4. Search Logic.
5. Content Injection & History Sync.
