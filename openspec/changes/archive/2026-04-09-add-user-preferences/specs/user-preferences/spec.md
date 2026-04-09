## ADDED Requirements

### Requirement: User can change their UI theme
The system SHALL allow authenticated users to switch between light, dark, and system themes. The selected theme SHALL be persisted to the user's account and applied on all subsequent sessions across devices.

#### Scenario: User selects dark theme
- **WHEN** an authenticated user selects "Dark" from the theme toggle in the user menu
- **THEN** the UI immediately switches to dark mode
- **THEN** the preference is saved to the user's account in the background

#### Scenario: User selects system theme
- **WHEN** an authenticated user selects "System" from the theme toggle
- **THEN** the UI matches the OS-level dark/light preference
- **THEN** the preference is saved to the user's account in the background

#### Scenario: Theme persists across devices
- **WHEN** a user with a saved theme preference logs in on a different device
- **THEN** their saved theme is applied on load

#### Scenario: Default theme for new users
- **WHEN** a new user logs in for the first time
- **THEN** the "System" theme is applied (OS preference is followed)

### Requirement: User can change their display language
The system SHALL allow authenticated users to switch between supported languages (English, French). The selected language SHALL be persisted to the user's account and applied on all subsequent sessions.

#### Scenario: User switches to English
- **WHEN** an authenticated user selects "EN" from the language switcher in the user menu
- **THEN** all UI strings immediately render in English
- **THEN** the preference is saved to the user's account in the background

#### Scenario: User switches to French
- **WHEN** an authenticated user selects "FR" from the language switcher
- **THEN** all UI strings immediately render in French
- **THEN** the preference is saved to the user's account in the background

#### Scenario: Language persists across devices
- **WHEN** a user with a saved language preference logs in on a different device
- **THEN** their saved language is applied on load

#### Scenario: Default language for new users
- **WHEN** a new user logs in for the first time and has no saved locale
- **THEN** the browser's detected language is used, falling back to French

### Requirement: Preference updates are optimistic
The system SHALL apply preference changes to the UI immediately without waiting for the backend to confirm, and SHALL sync the new value to the backend in the background.

#### Scenario: Optimistic theme update
- **WHEN** a user changes their theme
- **THEN** the theme changes instantly in the UI
- **THEN** the backend is updated asynchronously without blocking the UI

#### Scenario: Optimistic language update
- **WHEN** a user changes their language
- **THEN** the UI language changes instantly
- **THEN** the backend is updated asynchronously without blocking the UI
