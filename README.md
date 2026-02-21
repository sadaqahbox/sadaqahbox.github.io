# Sadaqah Box

<div align="center">
  <img src="public/logo.svg" alt="Sadaqah Box Logo" width="120" height="120">

  **Track Your Charity & Sadaqah Contributions**

  A modern, privacy-focused Progressive Web App for tracking your charitable giving (Sadaqah) with multi-currency support and gold value conversion.

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
  [![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020.svg)](https://workers.cloudflare.com/)
  [![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

  [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/sadaqahbox/sadaqahbox)
</div>

---

## 📖 Overview

Sadaqah Box helps Muslims track their charitable contributions (Sadaqah) in a modern, secure, and private way. The app converts all donations to gold grams for consistent tracking across different currencies, making it easy to see your total giving regardless of the currency used.

## 🌟 Our Intention

The Prophet Muhammad ﷺ said:

> "There is a sadaqah to be given for every joint of the human body every day the sun rises. To judge justly between two persons is regarded as sadaqah, and to help a man concerning his riding animal by helping him to ride it or by lifting his luggage on to it, is also regarded as sadaqah, and (saying) a good word is also sadaqah, and every step taken on one's way to offer the compulsory prayer (in the mosque) is also sadaqah and to remove a harmful thing from the way is also sadaqah." — *Sahih al-Bukhari 2989*

Giving sadaqah daily is a beautiful Sunnah, but modern life can make this challenging. We often intend to give charity every day, yet find ourselves too busy, without cash on hand, or simply forgetting.

**Sadaqah Box was created to solve this:**

- **Remember daily** — Set aside your intended sadaqah each day so you don't forget
- **Track your commitment** — See exactly how much you've promised to give
- **Fulfill your promise** — When ready, collect and distribute to those in need
- **Build consistency** — Make giving charity a regular habit without the daily friction

The reward for sadaqah comes when it actually reaches those in need. This tool helps you organize your giving so you can follow through on your daily commitment to charity.

### Key Features

- 📦 **Multiple Charity Boxes** - Create separate boxes for different causes, family members, or categories
- 💰 **Multi-Currency Support** - Track donations in any currency (fiat, crypto, or commodities)
- 🥇 **Gold Value Tracking** - All donations are converted to gold grams for consistent comparison and protection against inflation
- 📊 **Visual Analytics** - See your giving history with beautiful charts and statistics
- 🔒 **Privacy First** - Your data is encrypted and secure
- 📱 **Progressive Web App** - Install on any device, works offline
- 🔐 **Multiple Auth Methods** - Email/password, passkeys

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Node.js](https://nodejs.org/) >= 18 (for some tooling)
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sadaqahbox

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at `http://localhost:5173`

### Database Setup

```bash
# Generate database migrations
bun run db:generate

# Apply migrations locally
bun run migrate:local

# Apply migrations to production
bun run migrate:remote
```

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Motion |
| **Backend** | Hono, Cloudflare Workers, D1 Database |
| **Auth** | Better Auth with passkeys |
| **ORM** | Drizzle ORM |
| **Build** | Vite 6, PWA Plugin |
| **UI** | shadcn/ui, Radix UI, Huge Icons |

### Project Structure

```
sadaqahbox/
├── src/
│   ├── api/                 # Backend API (Hono)
│   │   ├── endpoints/       # Route handlers
│   │   ├── entities/        # Database entities
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── middleware/      # Auth, CSRF, rate limiting
│   │   └── schemas/         # Zod validation schemas
│   ├── components/          # React components
│   │   ├── app/            # App root
│   │   ├── auth/           # Authentication pages
│   │   ├── boxes/          # Box management
│   │   ├── dashboard/      # Main dashboard
│   │   ├── landing/        # Landing page
│   │   ├── layout/         # Header, navigation
│   │   ├── sadaqah/        # Sadaqah tracking
│   │   └── ui/             # UI primitives
│   ├── db/                  # Database schema
│   ├── auth/                # Auth configuration
│   ├── hooks/               # React hooks
│   └── lib/                 # Utilities
├── migrations/              # Database migrations
├── public/                  # Static assets
└── docs/                    # Documentation
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and technical decisions
- **[API Reference](docs/API.md)** - REST API endpoints and usage
- **[Database Schema](docs/DATABASE.md)** - Database models and relationships
- **[Development Guide](docs/DEVELOPMENT.md)** - Local development setup and workflows
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Deployment Modes](docs/DEPLOYMENT_MODES.md)** - Combined vs. Separated deployment options

---

## 🚀 Deployment

This project is configured for automated deployment via GitHub Actions:

1. **GitHub Pages**: Hosts the static frontend client
2. **Cloudflare Workers**: Hosts the API and D1 database

### GitHub Secrets Required

To enable automated deployment, set the following in your GitHub Repository Settings (**Settings > Secrets and variables > Actions**):

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (with Workers edit permissions)
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

For detailed instructions, see the **[Deployment Guide](docs/DEPLOYMENT.md)**.

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build locally |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run test` | Run tests |
| `bun run test:coverage` | Run tests with coverage |
| `bun run db:generate` | Generate database migrations |
| `bun run migrate:local` | Apply migrations locally |
| `bun run migrate:remote` | Apply migrations to production |
| `bun run studio:dev` | Open Drizzle Studio (local) |
| `bun run auth:generate` | Generate auth schema |

---

## 🌐 API Endpoints

The API is available at `/api/` with OpenAPI documentation at `/api/docs`.

### Core Resources

| Endpoint | Description |
|----------|-------------|
| `GET /api/boxes` | List all boxes |
| `POST /api/boxes` | Create a new box |
| `GET /api/boxes/:id` | Get box details |
| `PUT /api/boxes/:id` | Update box |
| `DELETE /api/boxes/:id` | Delete box |
| `POST /api/boxes/:id/collect` | Empty box (create collection) |
| `GET /api/boxes/:id/sadaqahs` | List sadaqahs in box |
| `POST /api/boxes/:id/sadaqahs` | Add sadaqah to box |
| `GET /api/currencies` | List available currencies |
| `GET /api/stats` | Get user statistics |

See the [API Reference](docs/API.md) for complete documentation.

---

## 🔐 Authentication

Sadaqah Box supports multiple authentication methods:

- **Email/Password** - Traditional authentication
- **Passkeys** - Passwordless authentication using WebAuthn

Authentication is handled by [Better Auth](https://better-auth.com/) with Cloudflare D1 and KV storage.

---

## 💱 Currency & Gold Conversion

All donations are tracked in gold grams (XAU) for consistent comparison:

1. When you add a sadaqah, the value is converted to USD using live exchange rates
2. The USD value is then converted to gold grams using the current gold price
3. Your total giving is displayed in gold grams, with optional conversion to your preferred currency

Supported currency types:
- **Fiat** - USD, EUR, TRY, GBP, etc.
- **Crypto** - BTC, ETH, etc.
- **Commodities** - Gold (XAU), Silver (XAG)

---

## 📱 Progressive Web App

Sadaqah Box is a PWA that can be installed on any device:

- **Offline Support** - Basic functionality works offline
- **Push Notifications** - Get reminders for regular giving
- **Home Screen** - Install on mobile and desktop

---

## 🤝 Contributing

This is currently a private project. Contributions are not accepted at this time.

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- [Better Auth](https://better-auth.com/) - Modern authentication
- [Hono](https://hono.dev/) - Fast web framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Cloudflare](https://cloudflare.com/) - Edge computing platform

---

<div align="center">
  Built with ❤️ for the Ummah
</div>
