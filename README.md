# ValdirCar Mobile App

## Overview
ValdirCar is a mobile application for auto repair and maintenance management, allowing users to manage their vehicles, schedule service appointments, and access maintenance plans.

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- Expo CLI

### Installation
1. Clone the repository
2. Install dependencies
```bash
npm install
# or
yarn install
```

### Setting Up Supabase Integration

The app uses Supabase for authentication and data storage. Follow these steps to set up your Supabase project:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. In the Supabase dashboard, get your project URL and anon key from Settings > API
4. Create the following tables in your Supabase project:

#### `profiles` Table
- `id` (uuid, primary key) - References auth.users.id
- `name` (text)
- `email` (text)
- `carBrand` (text)
- `carModel` (text)
- `carColor` (text)
- `carYear` (text)
- `licensePlate` (text)
- `carPhoto` (text)
- `address` (text)
- `phone` (text)
- `location` (text)
- `selectedPlan` (text)
- `registrationComplete` (boolean)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

#### `service_orders` Table
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id)
- `title` (text)
- `description` (text)
- `date` (date)
- `created_at` (timestamp with time zone)

#### Storage Setup
1. Create a bucket named `car-photos` for storing vehicle images
2. Set the bucket to public (or configure appropriate permissions)

### Environment Setup
Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Alternatively, you can add these directly to your `app.config.js` file.

### Running the App
```bash
npx expo start
```

## Project Structure
- `app/` - Main application code
  - `(auth)/` - Authentication screens
  - `(tabs)/` - Main app tabs
- `store/` - State management using Zustand
- `lib/` - Utility functions and integrations
- `assets/` - Images and resources

## Authentication Flow
1. Users register with email/password
2. After registration, users complete vehicle registration form
3. Once vehicle details are entered, users can access the full application

## Features
- User authentication
- Vehicle registration and management
- Service appointment scheduling
- Maintenance plans
- Service history 