# Static Translation Feature

## Overview
This implementation adds support for multi-language (English/Hungarian) static text translation throughout the FiFe App.

## What was implemented

### 1. i18n Configuration
- Installed `i18next` and `react-i18next` packages
- Created i18n configuration file (`i18n.ts`)
- Set Hungarian (hu) as the default language
- Added fallback to Hungarian if translation is missing

### 2. Translation Files
Created JSON translation files in `locales/` directory:
- `locales/en/translation.json` - English translations
- `locales/hu/translation.json` - Hungarian translations

Translation structure includes:
- Landing page sections (hero, howItWorks, trust, about, banner, aboutMe)
- Profile edit page
- Common UI elements
- Navigation labels
- Settings

### 3. Redux State Management
- Created `languageReducer` to persist language preference
- Language state is stored in Redux and persisted via redux-persist
- Users' language choice is saved across app sessions

### 4. Language Switcher Component
Created `components/LanguageSwitcher.tsx` with two variants:
- **Button variant**: Shows current language (Magyar/English) as an outlined button
- **Icon variant**: Shows a translate icon button

The component displays a menu with:
- Magyar (Hungarian) option
- English option
- Checkmark indicator for the currently selected language

### 5. Integration Points

#### Landing Page (app/index.tsx)
- Language switcher added to header (icon variant)
- All static texts converted to use translation keys via `t()` function

#### Profile Settings (app/user/edit.tsx)
- Language switcher added as a new settings section (button variant)
- Form labels and messages translated

## How to Use

### For Users
1. **On Landing Page**: Click the translate icon in the top-left corner of the header
2. **In Profile Settings**: Scroll to the "Nyelv/Language" section and click the language button
3. Select desired language from the dropdown menu (Magyar or English)
4. The entire app will update immediately with the selected language
5. Language preference is saved and persists across sessions
