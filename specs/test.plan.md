# Wedding App - Backoffice E2E Test Plan

## Application Overview

Backoffice E2E test plan for a wedding invitation management SaaS. The app has 3 subscription tiers (FREE, BASIC, COMPANY) that gate features. Every test suite runs against all 3 Playwright projects (free, basic, company) — use test.info().project.name to branch on tier-specific assertions. Global setup (tests/e2e/global-setup.ts) creates one fresh user per tier before each run and tears them down after.

Navigation: Desktop uses a two-column sidebar (EventSwitcher 72px + NavigationSidebar 0-256px, both hidden on mobile) and a mobile drawer (visible less than lg). Both use aria-label="Menú principal" on their nav elements. NavigationSidebar defaults to expanded (isExpanded=true). The 8 menu items are: Dashboard, Invitaciones, Scanner QR, Check-ins, Estructura, Theming, Configuraciones, Miembros (COMPANY only).

Structure page: Active sections have 3 icon-only action buttons — aria-label="Configurar" (Settings icon, navigates to /structure/[key]), aria-label="Ocultar"/"Mostrar" (Eye/EyeOff toggle), aria-label="Eliminar" (Trash). Catalog "Agregar" buttons are opacity-0 overlays requiring click({ force: true }). Section key navigates to /backoffice/structure/{key} (e.g. "rsvp", "hero", "ceremony").

Public invitation flow: Token URL is /r/{InvitationToken.id}. TokenProcessor processes it and redirects to / (guest invitation page). Tests for this suite require global-setup.ts to be extended: create one test invitation per event, one InvitationToken per invitation, and persist the token IDs in credentials.json under invitationToken key.

Collaborator join flow: URL is /join/{inviteLink.token}. Tests for the full acceptance flow (Suite 16 test 2) require global-setup.ts to create an invite link for the COMPANY event and persist the token.

Important patterns:
- HeroUI Table renders twice: desktop (hidden md:block) and mobile (block md:hidden). Scope grid locators with exact:true.
- Opacity-0 overlay buttons require click({ force: true }).
- Radio/checkbox inputs require click({ force: true }) to bypass pointer interception.
- Rate limits are cleared in beforeAll for login tests.
- Logout test uses empty storageState to avoid invalidating project auth state.

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

### 2. Sign-Up

**Seed:** `specs/seed.spec.ts`

#### 2.1. should display sign-up form with all required fields

**File:** `specs/authentication/should-display-signup-form.spec.ts`

**Steps:**
  1. Navigate to /sign-up (the (auth)/sign-up route, URL is /sign-up)
    - expect: Sign-up form is visible
  2. Inspect the form fields
    - expect: Name field is present
    - expect: Email field is present
    - expect: Password field is present
    - expect: Confirm password field is present
    - expect: Submit button is present
  3. Fill in the password field with a value shorter than 10 characters
    - expect: Password validation error is shown (min 10 chars, requires uppercase, lowercase, number, special char)

### 3. Dashboard

**Seed:** `specs/seed.spec.ts`

#### 3.1. should display stats cards on the dashboard

**File:** `specs/dashboard/should-display-stats-cards.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: Page title 'Dashboard' is visible
    - expect: Four stat cards are visible: 'Total Invitaciones', 'Han Respondido', 'Total Invitados', 'No Asistirán'
  2. Inspect the 'Total Invitados' stat card for a FREE tier user
    - expect: For the 'free' project: the card shows 'de 5 máx.' indicating the guest limit
    - expect: For 'basic' and 'company' projects: no guest limit is shown

#### 3.2. should show quick actions and allow navigating to invitations

**File:** `specs/dashboard/should-show-quick-actions.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: 'Acciones Rápidas' section is visible
    - expect: 'Gestionar Invitaciones' link is present
    - expect: 'Exportar Confirmados' button is present
  2. Click the 'Gestionar Invitaciones' link
    - expect: Browser navigates to /backoffice/invitations

#### 3.3. should show the correct tier badge in the sidebar

**File:** `specs/dashboard/should-show-tier-badge.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: The sidebar is visible
  2. Inspect the tier badge displayed below the event name in the sidebar
    - expect: For the 'free' project: badge shows 'Gratis'
    - expect: For the 'basic' project: badge shows 'Basic'
    - expect: For the 'company' project: badge shows 'Company'

### 4. Invitations Management

**Seed:** `specs/seed.spec.ts`

#### 4.1. should display the invitations table

**File:** `specs/invitations/should-display-invitations-table.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations
    - expect: Heading 'Gestión de Invitaciones' is visible
    - expect: Table with columns INVITADO, TELÉFONO, ESTADO, CONFIRMADOS, MÁX. INVITADOS, FECHA RESPUESTA, ACCIONES is visible
    - expect: 'Crear Invitación' button is visible

#### 4.2. should create a new invitation

**File:** `specs/invitations/should-create-new-invitation.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations
    - expect: 'Crear Invitación' button is visible
  2. Click 'Crear Invitación' button
    - expect: A form or modal opens to create an invitation
  3. Fill in the guest name and any required fields, then submit
    - expect: The new invitation appears in the invitations table
    - expect: Total Invitaciones counter increments

#### 4.3. should block creating an invitation that exceeds the FREE tier guest limit

**File:** `specs/invitations/should-block-invitation-over-free-limit.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations
    - expect: Invitations page is visible
  2. Open 'Crear Invitación' modal and inspect the guest usage indicator
    - expect: For 'free' project: modal shows 'Invitaciones usadas' indicator with 'X/5' format indicating the guest cap
    - expect: For 'basic' and 'company' projects: no usage indicator is shown

#### 4.4. should search invitations by name

**File:** `specs/invitations/should-search-invitations-by-name.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations and create an invitation with a unique name
    - expect: Search textbox 'Buscar por nombre o apodo...' is visible
  2. Type the guest name into the search field and wait for debounce
    - expect: Table filters to show only the matching invitation
  3. Clear the search field
    - expect: All invitations are shown again

#### 4.5. should delete an invitation

**File:** `specs/invitations/should-delete-invitation.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations and create an invitation
    - expect: At least one row is visible in the desktop table (hidden md:block, scoped with exact:true)
  2. Click the delete action button (aria-label='Eliminar', last button) on the first invitation row
    - expect: A confirmation dialog appears
  3. Confirm the deletion
    - expect: The invitation row is removed from the table

#### 4.6. should open invitation detail modal with QR tokens

**File:** `specs/invitations/should-display-invitation-detail-modal.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations and create an invitation in beforeAll
    - expect: Invitation row is visible in the desktop table
  2. Note the invitation ID from the row, then navigate to /backoffice/invitations/{id} to trigger the intercepting modal route
    - expect: A modal opens showing the invitation detail
  3. Inspect the modal content
    - expect: Guest name is displayed in the modal
    - expect: Token list (TokensTable) is shown with at least one token row
    - expect: An edit button is visible inside the modal

#### 4.7. should edit an invitation

**File:** `specs/invitations/should-edit-invitation.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations and create an invitation in beforeAll
    - expect: Invitation row is visible in the desktop table
  2. Click the edit action button (second icon button in the row actions) on the created invitation row
    - expect: 'Editar Invitación' modal opens with fields pre-filled: 'Nombre del Invitado', 'Apodo', 'Teléfono', 'Máximo de Invitados'
  3. Change the 'Nombre del Invitado' to a new unique name, then click 'Actualizar Invitación'
    - expect: Modal closes
    - expect: The invitation row in the desktop table now shows the updated guest name

#### 4.8. should revoke and reactivate a token in the invitation detail modal

**File:** `specs/invitations/should-revoke-and-reactivate-token.spec.ts`

**Steps:**
  1. Navigate to /backoffice/invitations/{id} (where id is created in beforeAll) to open the detail modal
    - expect: Modal opens with at least one token row in the TokensTable
    - expect: An active token row shows a 'Revocar token' icon button (Ban icon, warning color)
  2. Click the 'Revocar token' button on the first active token
    - expect: The token row updates to show a 'Reactivar token' icon button (RotateCcw icon, success color) instead
  3. Click the 'Reactivar token' button on the same token
    - expect: The token row reverts to showing the 'Revocar token' button (active state restored)

### 5. Settings

**Seed:** `specs/seed.spec.ts`

#### 5.1. should display and save configuration settings

**File:** `specs/settings/should-display-and-save-settings.spec.ts`

**Steps:**
  1. Navigate to /backoffice/settings
    - expect: 'Configuraciones' heading is visible
    - expect: Fields visible: 'URL de Subida de Fotos', 'Fecha y Hora de la Boda', 'Días de Recordatorio RSVP', 'Estrategia de Check-In' combobox
    - expect: 'Guardar Cambios' button is visible
  2. Change the 'Días de Recordatorio RSVP' spinner value to 35
    - expect: Spinner shows value 35
  3. Click 'Guardar Cambios'
    - expect: No red error text appears
    - expect: Settings are persisted (reload the page and verify the value is still 35)

#### 5.2. should delete the event via the Danger Zone

**File:** `specs/settings/should-delete-event.spec.ts`

**Steps:**
  1. Navigate to /backoffice/settings (using a disposable test user created in beforeAll — do NOT use the shared project auth state)
    - expect: 'Zona de Peligro' or 'Eliminar Evento' section is visible at the bottom of the settings page
    - expect: 'Eliminar Evento' danger button (Trash2 icon, bordered danger variant) is visible
  2. Click 'Eliminar Evento'
    - expect: A confirmation modal opens with header 'Confirmar Eliminación' and an input to type the event name
    - expect: The 'Eliminar Permanentemente' button is disabled while the input is empty or mismatched
  3. Type the event name in the confirmation input, then click 'Eliminar Permanentemente'
    - expect: The button shows loading state ('Eliminando...')
    - expect: Browser navigates to /backoffice or /backoffice/no-events after deletion

### 6. Structure (Secciones)

**Seed:** `specs/seed.spec.ts`

#### 6.1. should display available and active sections

**File:** `specs/structure/should-display-sections.spec.ts`

**Steps:**
  1. Navigate to /backoffice/structure
    - expect: 'Componentes Disponibles' heading is visible
    - expect: Catalog buttons with 'Agregar' prefix are visible (e.g., 'Agregar Separador', 'Agregar Alojamiento')

#### 6.2. should add a new section from available components

**File:** `specs/structure/should-add-new-section.spec.ts`

**Steps:**
  1. Navigate to /backoffice/structure
    - expect: 'Componentes Disponibles' panel is visible with 'Agregar' buttons
  2. Force-click (click with force:true) the first 'Agregar ...' button (opacity-0 overlay button revealed on group-hover)
    - expect: For 'basic' and 'company' projects: a new section appears in the 'Secciones de la Invitación' list
    - expect: For 'free' project: an upgrade prompt is shown since FREE tier cannot customize sections

#### 6.3. should toggle a section's visibility

**File:** `specs/structure/should-toggle-section-visibility.spec.ts`

**Steps:**
  1. Navigate to /backoffice/structure and ensure at least one section has a visibility toggle button
    - expect: 'Secciones de la Invitación' panel shows sections with icon-only 'Ocultar' or 'Mostrar' buttons (aria-label)
  2. Click the first visibility toggle button (aria-label='Ocultar' or aria-label='Mostrar')
    - expect: The button's aria-label toggles between 'Ocultar' and 'Mostrar'

#### 6.4. should open section editor when clicking the settings button

**File:** `specs/structure/should-open-section-editor.spec.ts`

**Steps:**
  1. Navigate to /backoffice/structure
    - expect: 'Secciones de la Invitación' panel shows at least one active section with a 'Configurar' icon button (aria-label='Configurar', Settings icon)
  2. Click the aria-label='Configurar' button on the first active section
    - expect: Browser navigates to /backoffice/structure/{key} (e.g. /backoffice/structure/rsvp)
    - expect: Section editor page loads with a heading matching the section name
    - expect: 'Guardar Cambios' button is visible

#### 6.5. should save section settings in the section editor

**File:** `specs/structure/should-save-section-settings.spec.ts`

**Steps:**
  1. Navigate to /backoffice/structure and click the 'Configurar' button on the first active section (use 'basic' or 'company' project)
    - expect: Section editor page loads at /backoffice/structure/{key}
  2. Modify any visible text field or toggle in the section settings form (e.g. change a title or description field)
    - expect: The form field reflects the new value
  3. Click 'Guardar Cambios'
    - expect: No error toast appears
    - expect: Success feedback is shown (toast or button state)
    - expect: Reload the page and verify the changed value is still present

#### 6.6. should delete an active section

**File:** `specs/structure/should-delete-section.spec.ts`

**Steps:**
  1. Navigate to /backoffice/structure and add a new section in beforeAll (use 'basic' or 'company' project, force-click an 'Agregar ...' button)
    - expect: The new section appears in the 'Secciones de la Invitación' list with an aria-label='Eliminar' (Trash icon) button
  2. Click the aria-label='Eliminar' button on the newly added section
    - expect: A confirmation dialog appears (or the section is removed directly)
  3. Confirm deletion if prompted
    - expect: The section row is removed from the 'Secciones de la Invitación' list

### 7. Theming

**Seed:** `specs/seed.spec.ts`

#### 7.1. should display available themes and allow selection

**File:** `specs/theming/should-display-and-select-theme.spec.ts`

**Steps:**
  1. Navigate to /backoffice/theming
    - expect: Heading 'Theming' is visible
    - expect: Radio group 'Selecciona un tema' shows themes: Clásico, Cálido, Verde Pastel, Mocha, Personalizado
  2. Force-click the 'Cálido' radio option (radio inputs require click({ force: true }) due to pointer interception)
    - expect: 'Cálido' radio is selected
    - expect: 'Guardar Cambios' button becomes enabled

#### 7.2. should show the custom color picker when Personalizado theme is selected

**File:** `specs/theming/should-display-custom-theme-picker.spec.ts`

**Steps:**
  1. Navigate to /backoffice/theming
    - expect: Radio group with theme options is visible
  2. Force-click the 'Personalizado' radio option
    - expect: 'Personalizado' radio is selected
    - expect: A color picker section appears below the radio group showing 5 color swatches (Fondo de página, Texto principal, Color principal, Fondo de sección, Acento decorativo)
  3. Click the 'Fondo de página' swatch button (aria-label='Cambiar Fondo de página')
    - expect: A floating color picker (HexColorPicker) appears with a hex input below it
    - expect: Changing the hex input to a valid 6-character hex value updates the swatch color preview

### 8. Tier Enforcement - Collaborators

**Seed:** `specs/seed.spec.ts`

#### 8.1. should gate collaborators page by COMPANY tier

**File:** `specs/tier-enforcement/should-gate-collaborators-by-company-tier.spec.ts`

**Steps:**
  1. Navigate to /backoffice/collaborators
    - expect: Page loads without error
  2. Inspect the page content
    - expect: For 'free' and 'basic' projects: an upgrade prompt or blocked message is shown, the collaborator management UI is not accessible
    - expect: For 'company' project: 'Miembros Actuales' section and 'Links de Invitación' section are visible

#### 8.2. should show Miembros menu item only for COMPANY tier

**File:** `specs/tier-enforcement/should-show-members-menu-by-tier.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: Sidebar is visible with nav aria-label='Menú principal'
  2. Inspect the 'Menú principal' navigation for the 'Miembros' link
    - expect: For 'company' project: 'Miembros' link is visible and enabled
    - expect: For 'free' and 'basic' projects: 'Miembros' link is not visible (COMPANY-only item filtered out)

### 9. Tier Enforcement - Event Creation

**Seed:** `specs/seed.spec.ts`

#### 9.1. should block creating a second event for FREE and BASIC tiers

**File:** `specs/tier-enforcement/should-block-second-event-for-non-company.spec.ts`

**Steps:**
  1. Navigate to /backoffice/dashboard
    - expect: Dashboard is visible with the sidebar
  2. Inspect the EventSwitcher sidebar (desktop, aria-label='Crear nuevo evento' button) for the presence of the create event button
    - expect: For 'company' project: 'Crear nuevo evento' icon button is visible in the EventSwitcher (left 72px column)
    - expect: For 'free' and 'basic' projects: 'Crear nuevo evento' button is NOT present (not rendered, as tier check prevents it)

### 10. Check-ins

**Seed:** `specs/seed.spec.ts`

#### 10.1. should display check-ins page with stats cards and empty list

**File:** `specs/check-ins/should-display-check-ins-page.spec.ts`

**Steps:**
  1. Navigate to /backoffice/check-ins
    - expect: 'Check-ins' heading (h1) is visible
    - expect: 'Registro de ingresos al evento' subtitle is visible
  2. Inspect the stats cards section
    - expect: Four stat cards are visible: 'Invitados ingresados', 'Check-ins realizados', 'Ocupación (X/Y)' with percentage, 'Excesos de capacidad'
  3. Inspect the 'Últimos Check-ins' card
    - expect: 'Últimos Check-ins' heading (h2) is visible
    - expect: Empty state message 'Aún no hay check-ins registrados' is shown (no check-ins exist yet for fresh test users)

### 11. Scanner QR

**Seed:** `specs/seed.spec.ts`

#### 11.1. should display scanner page with header and instructions

**File:** `specs/scanner/should-display-scanner-page.spec.ts`

**Steps:**
  1. Navigate to /backoffice/scanner
    - expect: 'Scanner QR' heading (h1) is visible
    - expect: 'Escanea los códigos QR de las invitaciones para registrar el ingreso al evento' subtitle is visible
  2. Inspect the instructions section
    - expect: '¿Cómo funciona?' heading (h2) is visible
    - expect: 4 numbered steps are listed: step 1 mentions 'Activar Scanner', step 2 mentions 'Apunta la cámara', step 3 mentions 'Verifica los datos', step 4 mentions 'registra el check-in automáticamente'
    - expect: Offline mode info box mentioning 'Modo offline' is visible

### 12. Error Page

**Seed:** `specs/seed.spec.ts`

#### 12.1. should display correct error UI for each error message type

**File:** `specs/error/should-display-error-page.spec.ts`

**Steps:**
  1. Navigate to /error?message=token-invalido (use storageState: undefined — no auth needed)
    - expect: Error card is visible
    - expect: Error title or description mentions 'inválido' or 'expirado'
    - expect: An icon is shown (XCircle, danger color)
  2. Navigate to /error?message=token-ya-usado
    - expect: Error card is visible with a different message indicating the link was already used
  3. Navigate to /error?message=necesita-invitacion
    - expect: Error card is visible with a message indicating the user needs an invitation
  4. Navigate to /error?message=rate-limit-exceeded
    - expect: Error card is visible with a rate limit message

### 13. Public Invitation Flow

**Seed:** `specs/seed.spec.ts`

#### 13.1. should redirect invalid token to error page

**File:** `specs/invitation/should-redirect-invalid-token.spec.ts`

**Steps:**
  1. Navigate to /r/invalid-token-that-does-not-exist (use storageState: undefined — no auth needed)
    - expect: HeartLoader spinner is shown briefly while TokenProcessor validates the token
  2. Wait for redirect
    - expect: Browser navigates to /error?message=token-invalido (or similar error URL)
    - expect: Error page is shown with an invalid link message

#### 13.2. should process valid token and display the public invitation page

**File:** `specs/invitation/should-display-public-invitation.spec.ts`

**Steps:**
  1. Read the invitation token from credentials.json (global-setup must create one test invitation + InvitationToken per event and persist the token.id). Navigate to /r/{invitationToken} with storageState: undefined
    - expect: HeartLoader spinner is shown while processing
    - expect: Browser redirects to / (public invitation page)
  2. Inspect the public invitation page sections
    - expect: At least one section is visible (e.g. Hero section with couple names or wedding date)
    - expect: RSVP form or confirmation section is visible with a 'Confirmar' or RSVP button
  3. Inspect the QR code section (Código QR)
    - expect: QR code image or canvas element is visible

### 14. Collaborator Join Flow

**Seed:** `specs/seed.spec.ts`

#### 14.1. should show error for an invalid collaborator invite link

**File:** `specs/collaborators/should-reject-invalid-invite-link.spec.ts`

**Steps:**
  1. Navigate to /join/completely-invalid-token (use storageState: undefined — no auth needed)
    - expect: Page loads without crashing
  2. Inspect the page content
    - expect: An error message or card is shown indicating the invite link is invalid or has expired (getInviteLinkInfo returns failure)

#### 14.2. should display join page for unauthenticated user with a valid invite link

**File:** `specs/collaborators/should-display-join-page.spec.ts`

**Steps:**
  1. Using the COMPANY project: create an invite link via the /backoffice/collaborators page (or use global-setup to persist an invite link token). Navigate to /join/{inviteLinkToken} with storageState: undefined
    - expect: Page loads showing the event name
  2. Inspect the join page content for an unauthenticated user
    - expect: Event name is visible on the page
    - expect: 'Iniciar Sesión' and/or 'Crear Cuenta' buttons are visible (JoinEventClient shows login/signup options when not authenticated)

#### 14.3. should auto-accept invite and redirect to dashboard for an authenticated user

**File:** `specs/collaborators/should-auto-accept-invite-for-authenticated-user.spec.ts`

**Steps:**
  1. Using the COMPANY project: ensure a valid invite link token is available from global-setup (persisted in credentials.json). Use the storageState of a second test user (created in global-setup specifically for this test — a user who is NOT already a collaborator on the event)
  2. Navigate to /join/{inviteLinkToken} with that second user's storageState
    - expect: Page server-side detects the authenticated session, calls acceptInviteLink automatically
    - expect: Browser redirects to /backoffice/dashboard (no manual action required)
    - expect: Dashboard is visible, confirming the user now has access to the COMPANY event

### 15. Collaborators Management

**Seed:** `specs/seed.spec.ts`

#### 15.1. should generate an invite link for a collaborator (COMPANY only)

**File:** `specs/collaborators/should-generate-invite-link.spec.ts`

**Steps:**
  1. Navigate to /backoffice/collaborators (using the 'company' project)
    - expect: 'Links de Invitación' section is visible
    - expect: 'Generar Link' button (Plus icon) is visible
  2. Click 'Generar Link'
    - expect: A modal opens (InviteCollaboratorModal) to configure the invite link (role/permissions, expiry, max uses)
  3. Submit the modal with default settings
    - expect: Modal closes
    - expect: A new row appears in the invite links table with a copy button (Copy icon)
    - expect: Clicking the copy button changes the icon to a checkmark (Check icon) briefly

#### 15.2. should remove a collaborator (COMPANY only)

**File:** `specs/collaborators/should-remove-collaborator.spec.ts`

**Steps:**
  1. Navigate to /backoffice/collaborators (using the 'company' project). Ensure at least one collaborator exists in the 'Miembros Actuales' table (added via global-setup or a prior step)
    - expect: Collaborator row is visible with aria-label='Revocar acceso' (Trash2 icon, danger color) button
  2. Click the aria-label='Revocar acceso' button on the collaborator row
    - expect: A native confirm dialog appears asking for confirmation
  3. Confirm the dialog
    - expect: The collaborator row is removed from the 'Miembros Actuales' table

### 16. No Events Page

**Seed:** `specs/seed.spec.ts`

#### 16.1. should display the no-events page when the user has no events

**File:** `specs/dashboard/should-display-no-events-page.spec.ts`

**Steps:**
  1. Use a disposable authenticated user (created in beforeAll) who has no events associated. Navigate to /backoffice/no-events using that user's storageState
    - expect: Page does not redirect away (user has no events)
    - expect: Heading '¡Ups! Parece que no tienes ningún evento creado' is visible
    - expect: 'Crear Mi Primer Evento' button (CalendarPlus icon) is visible
  2. Inspect the feature list on the page
    - expect: At least one feature bullet point is visible (e.g. 'Gestiona invitaciones y grupos de invitados')
  3. Click 'Crear Mi Primer Evento'
    - expect: Browser navigates away from /backoffice/no-events (redirects to /backoffice or event creation flow)
