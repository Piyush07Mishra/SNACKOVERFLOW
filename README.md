# SNACKOVERFLOW (EmPay)

EmPay is a Smart Human Resource Management System built with Next.js and shadcn/ui.

## Key Features

- Employee dashboard and attendance tracking
- Directory and employee management
- Payroll overview and salary tracking (along with custom payroll logic)
- Time-off request management
- Authentication and user registration

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components
- MongoDB (via custom `lib/mongodb.ts`)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd SNACKOVERFLOW
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure environment variables:
   - Create a `.env` file with the necessary database and auth settings.
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open http://localhost:3000 in your browser.

## Project Structure

- `app/` – main application routes and pages
- `app/components/` – reusable UI components
- `app/dashboard/` – dashboard sub-pages and features
- `lib/` – database and utility helpers
- `public/` – static assets

## Notes

This project uses the `app` directory and modern Next.js features, with a component-driven UI and server-side routes for authentication and data actions.
