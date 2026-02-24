# LifeFund 🚀

LifeFund is a modern, AI-powered financial management application designed to help users track their spending, set savings goals, and gain deep insights into their financial health. By leveraging real-time banking data and advanced AI categorization, LifeFund transforms complex transactions into actionable financial wisdom.

## ✨ Key Features

-   **📊 Comprehensive Dashboard**: A bird's-eye view of your finances, including real-time balances, expense charts, and upcoming budget alerts.
-   **🔌 Plaid Integration**: Seamlessly connect your bank accounts for automatic, secure transaction syncing.
-   **🤖 AI-Powered Insights**: Uses Google Gemini API to automatically categorize transactions, identify spending patterns, and provide personalized financial advice.
-   **💸 Smart Budgeting**: Set monthly limits for different categories and get notified before you overspend.
-   **🎯 Savings Goals**: Define clear objectives (like a "Emergency Fund" or "Dream Vacation") and track your progress with automatic round-ups.
-   **🎮 Gamification System**: Stay motivated with streaks and savings points as you hit your financial milestones.
-   **📑 Subscription Monitoring**: Automatically detect and manage recurring subscriptions to eliminate "vampire" expenses.
-   **🧾 Receipt Scanning**: (Coming Soon) Scan physical receipts to keep all your spending in one place.

## 🛠️ Tech Stack

-   **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
-   **Backend**: [Prisma ORM](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/)
-   **Banking API**: [Plaid](https://plaid.com/)
-   **AI Engine**: [Google Generative AI (Gemini)](https://ai.google.dev/)
-   **Languages**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

### Prerequisites

-   Node.js 20+
-   PostgreSQL database
-   Plaid Developer Account
-   Google Gemini API Key

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/lifefund.git
    cd lifefund
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add the following:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/lifefund"
    PLAID_CLIENT_ID="your_plaid_client_id"
    PLAID_SECRET="your_plaid_secret"
    PLAID_ENV="sandbox" # or development/production
    GOOGLE_GENAI_API_KEY="your_gemini_api_key"
    ```

4.  **Database Setup**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

-   `src/app`: Next.js App Router pages and layouts.
-   `src/components`: Reusable UI components.
-   `prisma/`: Database schema and migrations.
-   `scripts/`: Utility scripts for database fixing and bank simulation.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

