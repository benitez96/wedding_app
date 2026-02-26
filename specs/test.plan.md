# Wedding App - Backoffice E2E Test Plan

## Application Overview

Backoffice E2E test plan for a wedding invitation management SaaS. The app has 3 subscription tiers (FREE, BASIC, COMPANY) that gate features. Every test suite runs against all 3 Playwright projects (free, basic, company) — use test.info().project.name to branch on tier-specific assertions. Global setup (tests/e2e/global-setup.ts) creates one fresh user per tier before each run and tears them down after.

## Test Scenarios

### 1. Authentication

**Seed:** `specs/seed.spec.ts`

#### 1.1. should login with valid credentials and redirect to dashboard

**File:** `specs/authentication/should-login-with-valid-credentials.spec.ts`

**Steps:**
  1. Navigate to /backoffice/login
    - expect: Login page is shown with email and password fields and the 'Iniciar Sesión' button
  2. Fill input[name='email'] with a valid test email and input[name='password'] with the correct password, then click 'Iniciar Sesión'
    - expect: Browser navigates to /backoffice/dashboard
    - expect: Sidebar shows the event name and the user's tier badge (Gratis / Basic / Company)

#### 1.2. should show error with invalid credentials

**File:** `specs/authentication/should-show-error-with-invalid-credentials.spec.ts`

**Steps:**
  1. Navigate to /backoffice/login
    - expect: Login form is visible
  2. Fill input[name='email'] with 'wrong@email.com' and input[name='password'] with 'wrongpassword', then click 'Iniciar Sesión'
    - expect: An error message is displayed on the page
    - expect: URL stays on /backoffice/login

#### 1.3. should logout and redirect to login page

**File:** `specs/authentication/should-logout-and-redirect.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard (authenticated via storageState)
    - expect: Dashboard is visible with the sidebar
  2. Click the 'Cerrar Sesión' button in the sidebar
    - expect: Browser navigates to /backoffice/login or the home page
    - expect: Sidebar is no longer visible

### 2. Dashboard

**Seed:** `specs/seed.spec.ts`

#### 2.1. should display stats cards on the dashboard

**File:** `specs/dashboard/should-display-stats-cards.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: Page title 'Dashboard' is visible
    - expect: Four stat cards are visible: 'Total Invitaciones', 'Han Respondido', 'Total Invitados', 'No Asistirán'
  2. Inspect the 'Total Invitados' stat card for a FREE tier user
    - expect: For the 'free' project: the card shows 'de 5 máx.' indicating the guest limit
    - expect: For 'basic' and 'company' projects: no guest limit is shown

#### 2.2. should show quick actions and allow exporting confirmed guests

**File:** `specs/dashboard/should-show-quick-actions.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: 'Acciones Rápidas' section is visible
    - expect: 'Gestionar Invitaciones' link is present
    - expect: 'Exportar Confirmados' button is present
  2. Click the 'Gestionar Invitaciones' link
    - expect: Browser navigates to /backoffice/invitations

#### 2.3. should show the correct tier badge in the sidebar

**File:** `specs/dashboard/should-show-tier-badge.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: The sidebar is visible
  2. Inspect the tier badge displayed below the event name in the sidebar
    - expect: For the 'free' project: badge shows 'Gratis'
    - expect: For the 'basic' project: badge shows 'Basic'
    - expect: For the 'company' project: badge shows 'Company'

### 3. Invitations Management

**Seed:** `specs/seed.spec.ts`

#### 3.1. should display the invitations table

**File:** `specs/invitations/should-display-invitations-table.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations
    - expect: Heading 'Gestión de Invitaciones' is visible
    - expect: Table with columns INVITADO, TELÉFONO, ESTADO, CONFIRMADOS, MÁX. INVITADOS, FECHA RESPUESTA, ACCIONES is visible
    - expect: 'Crear Invitación' button is visible

#### 3.2. should create a new invitation

**File:** `specs/invitations/should-create-new-invitation.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations
    - expect: 'Crear Invitación' button is visible
  2. Click 'Crear Invitación' button
    - expect: A form or modal opens to create an invitation
  3. Fill in the guest name and any required fields, then submit
    - expect: The new invitation appears in the invitations table
    - expect: Total Invitaciones counter increments

#### 3.3. should block creating a 6th invitation for FREE tier

**File:** `specs/invitations/should-block-invitation-over-free-limit.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations (as FREE tier user)
    - expect: Invitations page is visible
  2. Create 5 invitations (each with maxGuests=1) to hit the FREE tier limit of 5 guests, then attempt to create a 6th
    - expect: For 'free' project: an error message is shown indicating the guest limit has been reached ('El plan FREE permite hasta 5 invitados por evento')
    - expect: For 'basic' and 'company' projects: the 6th invitation is created successfully

#### 3.4. should search invitations by name

**File:** `specs/invitations/should-search-invitations-by-name.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations (with at least one invitation in the table)
    - expect: Search textbox 'Buscar por nombre o apodo...' is visible
  2. Type a guest name into the search field
    - expect: Table filters to show only matching invitations
  3. Clear the search field
    - expect: All invitations are shown again

#### 3.5. should delete an invitation

**File:** `specs/invitations/should-delete-invitation.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations (with at least one invitation)
    - expect: At least one row is visible in the table
  2. Click the delete action button (trash icon) on the first invitation row
    - expect: A confirmation dialog or toast appears
  3. Confirm the deletion
    - expect: The invitation row is removed from the table
    - expect: Total Invitaciones counter decrements

### 4. Tier Enforcement - Collaborators

**Seed:** `specs/seed.spec.ts`

#### 4.1. should gate collaborators page by COMPANY tier

**File:** `specs/tier-enforcement/should-gate-collaborators-by-company-tier.spec.ts`

**Steps:**
  1. Navigate to /backoffice/collaborators
    - expect: Page loads
  2. Inspect the page content
    - expect: For 'free' and 'basic' projects: an upgrade prompt or blocked message is shown, the collaborator management UI is not accessible
    - expect: For 'company' project: 'Miembros' heading and 'Links de Invitación' section are visible

#### 4.2. should show Miembros menu item only for COMPANY tier

**File:** `specs/tier-enforcement/should-show-members-menu-by-tier.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: Sidebar is visible with navigation links
  2. Inspect the sidebar navigation for the 'Miembros' link
    - expect: For 'company' project: 'Miembros' link is visible and enabled
    - expect: For 'free' and 'basic' projects: 'Miembros' link is either hidden or shown with a lock/upgrade indicator

### 5. Tier Enforcement - Event Creation

**Seed:** `specs/seed.spec.ts`

#### 5.1. should block creating a second event for FREE and BASIC tiers

**File:** `specs/tier-enforcement/should-block-second-event-for-non-company.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: Dashboard is visible with the sidebar
  2. Click the 'Crear nuevo evento' button in the sidebar
    - expect: For 'free' and 'basic' projects: an error or upgrade prompt is shown indicating the event limit has been reached (1 event max)
    - expect: For 'company' project: a create event form or modal appears

### 6. Structure (Secciones)

**Seed:** `specs/seed.spec.ts`

#### 6.1. should display available and active sections

**File:** `specs/structure/should-display-sections.spec.ts`

**Steps:**
  1. Navigate to /backoffice/estructura
    - expect: 'Estructura' heading is visible
    - expect: 'Componentes Disponibles' panel is visible with section options (Alojamiento, Separador, Dress Code, etc.)
    - expect: 'Secciones de la Invitación' panel shows currently active sections (Hero, Fecha y Countdown, Ceremonia, Celebración, Confirmación RSVP, Código QR)

#### 6.2. should add a new section from available components

**File:** `specs/structure/should-add-new-section.spec.ts`

**Steps:**
  1. Navigate to /backoffice/estructura
    - expect: 'Agregar Separador' button is visible in the available components panel
  2. Click the 'Agregar Separador' button
    - expect: For 'basic' and 'company' projects: a new 'Separador' section appears in the 'Secciones de la Invitación' list
    - expect: For 'free' project: an upgrade prompt is shown since FREE tier cannot customize sections

#### 6.3. should toggle a section visibility

**File:** `specs/structure/should-toggle-section-visibility.spec.ts`

**Steps:**
  1. Navigate to /backoffice/estructura (as BASIC or COMPANY user)
    - expect: Active sections list is visible with toggle/hide buttons
  2. Click the 'Ocultar' button on an active section (e.g., 'Ceremonia')
    - expect: The section is hidden (button changes to 'Mostrar' or section is greyed out)
  3. Click 'Mostrar' to re-enable the section
    - expect: The section is visible again

### 7. Theming

**Seed:** `specs/seed.spec.ts`

#### 7.1. should display available themes and allow selection

**File:** `specs/theming/should-display-and-select-theme.spec.ts`

**Steps:**
  1. Navigate to /backoffice/theming
    - expect: 'Theming' heading is visible
    - expect: Radio group 'Selecciona un tema' shows themes: Clásico, Cálido, Verde Pastel, Mocha, Personalizado
  2. Click the 'Clásico' radio option
    - expect: 'Clásico' radio is selected
    - expect: 'Guardar Cambios' button becomes enabled
  3. Click 'Guardar Cambios'
    - expect: A success confirmation is shown
    - expect: 'Guardar Cambios' button returns to disabled state

### 8. Settings

**Seed:** `specs/seed.spec.ts`

#### 8.1. should display and save configuration settings

**File:** `specs/settings/should-display-and-save-settings.spec.ts`

**Steps:**
  1. Navigate to /backoffice/settings
    - expect: 'Configuraciones' heading is visible
    - expect: Fields visible: 'URL de Subida de Fotos', 'Fecha y Hora de la Boda', 'Días de Recordatorio RSVP', 'Estrategia de Check-In' combobox
    - expect: 'Guardar Cambios' button is visible
  2. Change the 'Días de Recordatorio RSVP' spinner value to 30
    - expect: Spinner shows value 30
  3. Click 'Guardar Cambios'
    - expect: A success message or toast is shown
    - expect: Settings are persisted (reload the page and verify the value is still 30)
