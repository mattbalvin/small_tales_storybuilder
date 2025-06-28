# Small Tales Story Builder

A comprehensive interactive storybook authoring platform built with Svelte, Tailwind CSS, and Supabase. Create engaging stories with multimedia elements, branching narratives, and synchronized audio narration.

## Features

### 🎨 Visual Story Editor
- **WYSIWYG Editor**: Drag-and-drop interface for creating story pages
- **Dual Orientation Support**: Design for both landscape (16:9) and portrait (9:16) formats
- **Safety Zone Overlays**: Visual guides for optimal content placement
- **Multimedia Elements**: Add text, images, and audio with full customization

### 📚 Content Management
- **Story Organization**: Create, edit, and manage multiple stories
- **Media Library**: Centralized asset management with tagging and search
- **Version Control**: Track changes and maintain story history
- **Export Options**: Generate web embeds, EPUB, and PDF formats

### 🔐 User Authentication
- **Secure Authentication**: Email/password registration and login
- **Role-Based Access**: Admin, Author, and Reader permissions
- **Profile Management**: User accounts with customizable profiles
- **Session Management**: Secure JWT-based authentication

### 📱 Cross-Platform
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Mobile Export**: Expo React Native companion app
- **Progressive Web App**: Installable web application

### 🎵 Audio Integration
- **Narration Support**: Synchronized audio playback with text highlighting
- **Per-Word Timing**: Precise word-level synchronization
- **Multiple Audio Formats**: Support for various audio file types

### 📊 Analytics
- **Reader Engagement**: Track reading time, interaction points
- **Story Performance**: Comprehensive analytics dashboard
- **User Behavior**: Understanding how readers engage with content

## Tech Stack

### Frontend
- **Svelte 4**: Reactive UI framework
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Consistent component library
- **TypeScript**: Type-safe development

### Backend
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Robust database with RLS
- **Real-time subscriptions**: Live data updates
- **File Storage**: Secure media asset management

### Mobile
- **Expo React Native**: Cross-platform mobile development
- **Shared Design System**: Consistent UI across platforms

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git
- Supabase CLI (for edge functions and advanced features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd small-tales-story-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create a `.env` file based on `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Update the environment variables with your Supabase credentials

4. **Authenticate with Supabase CLI (Required for Edge Functions)**
   - Install the Supabase CLI if not already installed:
     ```bash
     npm install -g supabase
     ```
   - Login to your Supabase account:
     ```bash
     supabase login
     ```
   - Link your project (replace `your-project-ref` with your actual project reference):
     ```bash
     supabase link --project-ref your-project-ref
     ```
   - **Note**: Your project reference can be found in your Supabase dashboard URL: `https://supabase.com/dashboard/project/[PROJECT-REF]`

5. **Initialize the database**
   - Run the migration file in your Supabase SQL editor:
     ```sql
     -- Copy and execute the contents of supabase/migrations/create_initial_schema.sql
     ```
   - Or use the Supabase CLI to apply migrations:
     ```bash
     supabase db push
     ```

6. **Deploy Edge Functions (Optional)**
   - Deploy all edge functions:
     ```bash
     supabase functions deploy
     ```
   - Or deploy individual functions:
     ```bash
     supabase functions deploy import-media
     supabase functions deploy generate-audio
     supabase functions deploy generate-image
     supabase functions deploy generate-narration
     ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Open your browser to `http://localhost:5173`
   - Create an account to start building stories

### Mobile App Setup

1. **Navigate to the mobile directory**
   ```bash
   cd expo
   ```

2. **Install Expo CLI (if not already installed)**
   ```bash
   npm install -g @expo/cli
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the Expo development server**
   ```bash
   npm start
   ```

5. **Run on device**
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal or browser

## Project Structure

```
small-tales-story-builder/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/         # Authentication forms
│   │   │   ├── editor/       # Story editor components
│   │   │   ├── media/        # Media library components
│   │   │   └── ui/           # Base UI components
│   │   ├── stores/           # Svelte stores for state management
│   │   ├── types/            # TypeScript type definitions
│   │   ├── config/           # Configuration files
│   │   └── utils.ts          # Utility functions
│   ├── routes/               # SvelteKit routes
│   │   ├── auth/            # Authentication pages
│   │   ├── editor/          # Story editor
│   │   └── media/           # Media library
│   └── app.html             # Main HTML template
├── supabase/
│   ├── functions/           # Edge functions
│   └── migrations/          # Database migration files
├── expo/                    # React Native mobile app
├── static/                  # Static assets
└── tests/                   # Test files
```

## Key Components

### Story Editor
The main editing interface allows users to:
- Create and arrange story pages
- Add text, image, and audio elements
- Configure element properties and animations
- Preview stories in different orientations
- Manage interactive triggers and branching logic

### Media Library
Centralized asset management featuring:
- File upload with automatic optimization
- Tagging and categorization system
- Search and filter capabilities
- Usage tracking and analytics

### Authentication System
Secure user management with:
- Email/password authentication
- Role-based permissions
- Profile management
- Session handling

## Database Schema

The application uses the following main tables:
- **users**: User accounts and profiles
- **stories**: Story metadata and settings
- **story_pages**: Individual story pages with content
- **media_assets**: Uploaded files and media
- **analytics_events**: User interaction tracking

All tables include Row Level Security (RLS) policies to ensure data privacy and security.

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Type checking and linting
- `npm test`: Run tests

### Testing
The project includes:
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and database interaction testing
- **E2E Tests**: Full user workflow testing with Playwright

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## Deployment

### Web Application
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel: Connect your repository for automatic deployments
   - Netlify: Drag and drop the `dist` folder
   - Custom server: Serve the built files with a web server

### Mobile Application
1. **Build for production**
   ```bash
   cd expo
   expo build:android  # or expo build:ios
   ```

2. **Submit to app stores**
   - Follow Expo's documentation for app store submissions
   - Use EAS Build for advanced build configurations

## Troubleshooting

### Supabase Edge Function Deployment Issues

If you encounter a "401 Unauthorized" error when deploying edge functions:

1. **Ensure you're logged in to Supabase CLI**:
   ```bash
   supabase login
   ```

2. **Verify your project is linked**:
   ```bash
   supabase projects list
   supabase link --project-ref your-project-ref
   ```

3. **For CI/CD environments**, set the `SUPABASE_ACCESS_TOKEN` environment variable:
   - Generate an access token from your Supabase dashboard
   - Add it to your CI/CD environment variables
   - Use it in your deployment scripts:
     ```bash
     export SUPABASE_ACCESS_TOKEN=your-access-token
     supabase functions deploy
     ```

4. **Check your project permissions**:
   - Ensure you have the necessary permissions to deploy functions
   - Verify you're deploying to the correct project

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

Optional for advanced features:
- `VITE_OPENAI_API_KEY`: For AI-generated content
- `VITE_ANALYTICS_ID`: For advanced analytics tracking

For CI/CD deployment:
- `SUPABASE_ACCESS_TOKEN`: For automated edge function deployment

## Support

For support and questions:
- Check the [Issues](../../issues) page for known problems
- Create a new issue for bug reports or feature requests
- Review the documentation for detailed usage instructions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Svelte](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)
- Mobile development with [Expo](https://expo.dev/)