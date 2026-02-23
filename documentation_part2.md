# BuildMate - Construction Material Management System
## Project Documentation - Part 2

### 4. Implementation Details

#### 4.1 Folder Structure
The project follows a modular structure organized by concerns (features, services, state, and UI):

*   `app/`: Contains the Expo Router screen definitions.
    *   `(auth)/`: Authentication screens (Login).
    *   `(admin)/`: Administrator-specific dashboards and inventory management.
    *   `(customer)/`: Customer shopping and order tracking screens.
    *   `(driver)/`: Driver delivery assignment and status updates.
*   `services/`: Business logic layer interacting with Supabase.
    *   `authService.ts`: Handles user registration and session management.
    *   `productService.ts`: CRUD operations for materials and stock updates.
    *   `orderService.ts`: Order creation and status tracking logic.
*   `store/`: Zustand state management stores.
    *   `authStore.ts`, `productStore.ts`, `orderStore.ts`, `cartStore.ts`.
*   `components/`: Reusable UI elements (Buttons, Cards, Modals).
*   `context/`: React Context providers (e.g., AuthContext).

#### 4.2 Core Service Implementation
The service layer serves as an abstraction between the UI and the backend database.

**Example: Product Service (`productService.ts`)**
This service encapsulates all logic related to material management. It uses the Supabase client to perform queries:
*   `getAllProducts()`: Retrieves the full catalog, ordered by latest additions.
*   `updateStock()`: Atomic updates to inventory levels when an order is placed.
*   `uploadProductImage()`: Handles binary file uploads to Supabase Storage for product thumbnails.

**Example: Order Service (`orderService.ts`)**
Manages the lifecycle of an order:
*   `createOrder()`: A multi-step process that inserts data into both `orders` and `order_items` tables.
*   `subscribeToOrders()`: Utilizes Supabase Real-time to push updates to the Admin/Driver apps whenever a status changes.

#### 4.3 Real-time Synchronization
One of BuildMate's core features is live updates. By subscribing to PostgreSQL's replication log via Supabase, the application achieves sub-second synchronization:
1.  **Customer** places an order.
2.  **Admin** dashboard updates instantly without a refresh.
3.  **Driver** receives a push notification/UI update for a new assignment.

---

### 5. User Interface (UI) Design

#### 5.1 Design Philosophy
BuildMate utilizes a professional, construction-themed aesthetic:
*   **Color Palette:** Bold orange (#FF6B00) for primary actions, suggesting safety and industry; dark grays and whites for clean readability.
*   **Typography:** Modern sans-serif fonts for clarity on mobile screens.
*   **Icons:** Material-based iconography for intuitive navigation (e.g., shopping cart, truck for deliveries).

#### 5.2 Key Screens Walkthrough

**A. Authentication Screen:**
A clean, minimal login interface providing role-based entry. Upon successful login, the `AuthContext` determines the user's role and redirects them to the appropriate layout.

**B. Customer Home Screen:**
Presents products in a categorized list. Each item shows its name, availability, and unit price. A floating cart button provides quick access to the checkout flow.

**C. Admin Inventory Screen:**
A data-heavy interface allowing administrators to:
*   Quickly scan stock levels.
*   Edit product details via a modal.
*   View high-resolution images of materials.

**D. Checkout and Payment:**
A step-by-step process where customers confirm their delivery address (using `expo-location` for precision) and select payment methods (e.g., Cash on Delivery).

---

### 6. Testing and Validation

#### 6.1 Unit Testing
Core business logic in `services/` and `utils/` is targeted for unit testing.
*   **Mocking Supabase:** Ensuring services behave correctly even when the database is offline.
*   **Store Validation:** Testing that Zustand actions correctly transition state (e.g., adding an item to the cart increases the count).

#### 6.2 User Acceptance Testing (UAT)
Before deployment, the system underwent UAT focusing on three personas:
1.  **Contractors (Customers):** Verified that the ordering process is fast and location-accurate.
2.  **Store Managers (Admins):** Ensured stock updates are reliable and reflected in the dashboard.
3.  **Delivery Staff (Drivers):** Validated that navigation and status updates are easy to use in the field.
