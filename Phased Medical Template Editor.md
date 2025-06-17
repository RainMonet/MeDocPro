# Medical Template Editor: Phased Implementation Plan

This document outlines a step-by-step approach to developing and integrating a medical documentation template editor. The plan is broken into logical phases, allowing for incremental development, testing, and deployment.

---
## **Phase 0: Project Setup & Foundation**

**Goal:** Prepare the development environment and establish the core database structure.

* **Task 1: Backend Setup**
    * **Action:** Install necessary Node.js packages.
        ```bash
        npm install express pg cors
        ```
    * **Details:** `express` for the API server, `pg` for the PostgreSQL client, and `cors` to handle cross-origin requests from your React frontend. Establish a basic Express server and a database connection file.

* **Task 2: Frontend Setup**
    * **Action:** Install Tiptap and its required dependencies in your React + Vite project.
        ```bash
        npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
        ```
    * **Details:** This provides the core Tiptap editor functionality and a starter kit with common extensions like bold and italics.

* **Task 3: Database Foundation**
    * **Action:** Manually create the master **`templates`** table in your PostgreSQL database. This table will store the definition of every template created by users.
    * **SQL Script:**
        ```sql
        CREATE TABLE templates (
            id SERIAL PRIMARY KEY,
            template_name VARCHAR(255) NOT NULL,
            data_table_name VARCHAR(255) UNIQUE NOT NULL,
            tiptap_content JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ```

---
## **Phase 1: Core Template Creation UI**

**Goal:** Allow a user to create a template in a rich-text editor, define placeholders, and save the template's structure.

* **Task 1 (Frontend): Build the Editor Component**
    * **Action:** Create a new React component, `TemplateEditor.jsx`.
    * **Details:** This component will house the Tiptap editor instance. Configure it with the `StarterKit` for basic text formatting.

* **Task 2 (Frontend): Implement Custom `Placeholder` Node**
    * **Action:** This is the most critical frontend task. Create a custom Tiptap extension for `{{placeholders}}`.
    * **Details:**
        * The node should be `inline` and `atom` (treated as a single, indivisible unit).
        * It should have one attribute: `name` (e.g., `patient_name`).
        * Its `renderHTML` method should output a styled `<span>` (e.g., `<span data-placeholder="patient_name">{{patient_name}}</span>`) to make it visually distinct.
        * Refer to the Tiptap documentation for creating custom nodes.

* **Task 3 (Frontend): Add Placeholder Insertion UI**
    * **Action:** Add an "Insert Placeholder" button to your editor's toolbar.
    * **Details:** This button should prompt the user for the placeholder name and then execute a Tiptap command to insert your custom `Placeholder` node at the cursor's position.

* **Task 4 (Backend): Create Template Storage Endpoint**
    * **Action:** Create the first API endpoint: **`POST /api/templates`**.
    * **Details:** In this phase, this endpoint will **only** save the template definition. It will not yet create the dynamic table.
        1.  It accepts `template_name` and `tiptap_content` (as JSON) in the request body.
        2.  It will perform an `INSERT` into the `templates` table. For now, you can generate a placeholder name for `data_table_name` (e.g., `temp_` + new ID). We will make this fully functional in the next phase.
        3.  It should return the newly created template object.

* **Task 5 (Frontend): Connect UI to Backend**
    * **Action:** Implement the "Save Template" button logic in `TemplateEditor.jsx`.
    * **Details:** On click, it should get the Tiptap content using `editor.getJSON()`, bundle it with the template name, and send it to your `POST /api/templates` endpoint.

**✅ Outcome:** A user can create a template, add placeholders, and save its definition. The dynamic table creation is *not yet implemented*.

---
## **Phase 2: Dynamic Table Generation**

**Goal:** Enhance the backend to automatically create a new PostgreSQL table whenever a new template is saved.

* **Task 1 (Backend): Augment the Template Creation Endpoint**
    * **Action:** Modify the `POST /api/templates` endpoint.
    * **Details:** After receiving the `tiptap_content`:
        1.  **Parse JSON:** Write a function to traverse the Tiptap JSON and extract a unique list of all `name` attributes from your `Placeholder` nodes.
        2.  **Sanitize Names:** Create a utility function to sanitize the template and placeholder names into safe table and column names (e.g., "Patient's Name" becomes `patients_name`). This is crucial for security.
        3.  **Generate SQL:** Dynamically construct a `CREATE TABLE` SQL string using the sanitized names.
        4.  **Execute SQL:** Use the `pg` client to execute the `CREATE TABLE` query.
        5.  **Update Master Table:** Modify the `INSERT` from Phase 1 to save the correct, sanitized `data_table_name` into the `templates` table.

**✅ Outcome:** When a user saves a new template, the backend now automatically creates a corresponding table in the database with columns that match the template's placeholders.

---
## **Phase 3: Data Entry & Storage**

**Goal:** Allow users to fill out a template for a specific patient and save the data.

* **Task 1 (Frontend): Create Dynamic Data Entry Form**
    * **Action:** Build a new component, `DataEntryForm.jsx`.
    * **Details:**
        1.  The component will fetch a specific template's `tiptap_content` from the backend.
        2.  It will parse this JSON to find all placeholders.
        3.  It will dynamically render an HTML `<form>` with a labeled `<input>` for each unique placeholder. The `name` attribute of each input should be the placeholder name (e.g., `patient_name`).

* **Task 2 (Backend): Create Data Storage Endpoint**
    * **Action:** Create a new dynamic endpoint: **`POST /api/records/:tableName`**.
    * **Details:**
        1.  The `:tableName` parameter will be the sanitized table name (e.g., `template_patient_intake`).
        2.  The request body will be a JSON object of the form data.
        3.  **CRITICAL:** Dynamically generate an `INSERT` statement using **parameterized queries** to prevent SQL injection. Do not simply concatenate strings from user input.

* **Task 3 (Frontend): Connect Form to Backend**
    * **Action:** Implement the `onSubmit` handler for your `DataEntryForm.jsx`.
    * **Details:** It should package the form data into a JSON object and `POST` it to the appropriate `/api/records/:tableName` endpoint.

**✅ Outcome:** Users can select a template, be presented with a matching form, fill it out, and have that data securely saved as a new row in the correct dynamic table.

---
## **Phase 4: Document Population & Rendering**

**Goal:** Enable users to view a final, completed document with placeholders replaced by actual patient data.

* **Task 1 (Backend): Create Data Retrieval Endpoints**
    * **Action:** Create `GET` endpoints to fetch the necessary data.
    * **Details:**
        * `GET /api/templates/:id`: Fetches a single template's definition.
        * `GET /api/records/:tableName/:recordId`: Fetches a single row of data from a dynamic table.

* **Task 2 (Frontend): Build the Document Viewer**
    * **Action:** Create a `DocumentViewer.jsx` component.
    * **Details:**
        1.  It will take a `templateId` and a `recordId` as props.
        2.  It will make two parallel API calls (e.g., using `Promise.all`): one to get the template structure and one to get the specific record's data.
        3.  Once both have returned, create a function to programmatically replace the `{{placeholder}}` text in the `tiptap_content` with the corresponding data values.
        4.  Render the final, populated content in a **read-only** Tiptap editor instance.

**✅ Outcome:** The application loop is complete. Users can create templates, fill them with data, and view the final documents.

---
## **Phase 5: Enhancements & Future Work**

**Goal:** Add features to improve usability, administration, and robustness.

* **Template Management:**
    * Implement **EDIT** and **DELETE** functionality for templates. Deleting a template should probably "soft delete" or archive the associated data table, not drop it immediately. Editing a template's placeholders would require an `ALTER TABLE` command on the backend, which adds complexity.
* **Advanced Placeholders:**
    * Extend the custom node to support data types (`date`, `number`, `dropdown`). This would change the input rendered in the data entry form (e.g., from `<input type="text">` to `<input type="date">`).
* **User Roles & Permissions:**
    * Integrate an authentication system to control who can create, edit, or view certain documents.
* **Search & Reporting:**
    * Implement a search feature to find records across different template tables.
* **Versioning:**
    * Add a versioning system for templates so that changes to a template don't invalidate older records.
