# Spot City Solve

A modern web application for reporting and tracking civic issues in cities. Empower citizens to report problems like road damage, sanitation issues, lighting problems, graffiti, and more, while providing city administrators with tools to manage and resolve these issues efficiently.

## 🚀 Features

### For Citizens

- **Easy Issue Reporting**: Report civic issues with detailed descriptions and photo uploads
- **Photo Verification**: Automatic image verification using Google Vision API to ensure photos match the reported issue
- **Interactive Maps**: Visual issue tracking with Google Maps integration
- **Real-time Updates**: Track the status of your reported issues
- **User Authentication**: Secure login/signup with email verification
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

### For Administrators

- **Admin Dashboard**: Comprehensive dashboard for managing all reported issues
- **Issue Management**: Update issue status, assign priorities, and track resolution progress
- **Filtering & Search**: Advanced filtering by category, status, location, and date
- **Data Analytics**: Insights into common issues and resolution times
- **User Management**: Manage user accounts and permissions

### Technical Features

- **AI-Powered Verification**: Google Vision API integration for intelligent photo validation
- **Real-time Notifications**: Instant updates on issue status changes
- **Geolocation Support**: Automatic location detection and manual location selection
- **Offline Support**: Basic functionality works without internet connection
- **Accessibility**: WCAG compliant design for inclusive user experience

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **Maps**: Google Maps API
- **AI/ML**: Google Vision API for image analysis
- **Deployment**: Vercel/Netlify (recommended)
- **Package Manager**: Bun

## 📋 Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager
- GitHub account (for deployment)
- Google Cloud account (for Maps and Vision APIs)
- Supabase account

## 🚀 Getting Started

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/spot-city-solve.git
   cd spot-city-solve
   ```

2. **Install dependencies**

   ```bash
   # Using npm
   npm install

   # Or using bun (recommended)
   bun install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:

   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

   # Google APIs
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_GOOGLE_MAP_ID=your_google_maps_map_id
   ```

4. **Supabase Setup**

   - Create a new project on [Supabase](https://supabase.com)
   - Run the migrations in `supabase/migrations/` to set up the database
   - Configure authentication settings
   - Add the Vision API key to Supabase Edge Functions secrets

5. **Google APIs Setup**

   - Enable Google Maps JavaScript API and Places API
   - Enable Google Vision API
   - Create API keys and restrict them appropriately
   - Create a Map ID for advanced map features

6. **Start the development server**

   ```bash
   # Using npm
   npm run dev

   # Or using bun
   bun run dev
   ```

7. **Open your browser**

   Navigate to `http://localhost:5173` to see the application.

## 📁 Project Structure

```
spot-city-solve/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── admin/         # Admin-specific components
│   │   ├── auth/          # Authentication components
│   │   ├── issues/        # Issue-related components
│   │   ├── layout/        # Layout components
│   │   ├── maps/          # Map components
│   │   └── ui/            # Base UI components (shadcn/ui)
│   ├── contexts/          # React contexts for state management
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # External service integrations
│   ├── lib/               # Utility functions and configurations
│   ├── pages/             # Page components
│   └── services/          # API service functions
├── supabase/
│   ├── functions/         # Edge functions
│   └── migrations/        # Database migrations
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` / `bun run dev` - Start development server
- `npm run build` / `bun run build` - Build for production
- `npm run preview` / `bun run preview` - Preview production build
- `npm run lint` / `bun run lint` - Run ESLint

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build` or `bun run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### Manual Deployment

1. Build the project: `npm run build`
2. Upload the `dist` folder to your hosting provider
3. Configure environment variables on your server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)
- Maps powered by [Google Maps](https://developers.google.com/maps)
- AI features using [Google Vision API](https://cloud.google.com/vision)

## 📞 Support

For support, email support@spotcitysolve.com or join our Discord community.
