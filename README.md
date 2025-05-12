# Zero Waste - Free Item Exchange Platform

Zero Waste is a web application that encourages environmental sustainability by facilitating the free exchange of unwanted items. The platform uses an interactive map interface to display available items, allowing users to find and claim items in their vicinity.

## Features

- **Interactive Map**: Browse available items on a map interface
- **User Authentication**: Secure account creation and login
- **Item Management**: Upload, edit, and manage item listings
- **Messaging System**: Communicate with item owners or recipients
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Technology Stack

- **Frontend**: Next.js (with App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with SQLite (can be easily migrated to PostgreSQL, MySQL, etc.)
- **Authentication**: NextAuth.js
- **Mapping**: Leaflet for interactive maps
- **Styling**: Tailwind CSS for responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/zero-waste.git
   cd zero-waste
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Initialize the database:
   ```
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
/
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── src/
    ├── app/              # Next.js App Router pages
    │   ├── api/          # API routes for backend functionality
    │   ├── items/        # Item-related pages
    │   ├── messages/     # Messaging system
    │   └── about/        # Information pages
    ├── components/       # Reusable React components
    └── lib/              # Utility functions and shared logic
```

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- This project was created as a demonstration of how technology can promote sustainability and community building.
- Thanks to all the open source libraries and frameworks that made this project possible.

## Setup Instructions

To get authentication (login/signup) working:

1. Create a `.env` file in the root directory with the following content:
   ```
   # Database
   DATABASE_URL="file:./dev.db"

   # Authentication  
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here" # Generate: openssl rand -base64 32
   ```

2. Replace `your-secret-key-here` with a proper secret (use `openssl rand -base64 32` to generate one)

3. Set up the database:
   ```
   npx prisma db push
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Technologies Used

- Next.js with TypeScript
- Prisma (SQLite database)
- NextAuth for authentication
- Leaflet for maps
- TailwindCSS for styling
