# Technical Context: Zula's Adventure

## Technologies Used
1. **Frontend Framework**
   - NextJS (React-based framework with TypeScript)
   - React for component-based development (using .tsx files)
   - HTML5 Canvas for game rendering
   - TypeScript for type safety and improved development experience (.ts files for logic)

2. **Styling**
   - CSS Modules or Styled Components
   - Retro pixel fonts (Google Fonts)
   - Custom CSS animations

3. **Development Tools**
   - Git for version control
   - GitHub for repository hosting
   - Vercel/Netlify for deployment

## Development Setup
1. **Local Environment**
   ```bash
   # Project initialization (assuming project root contains the 'flappy-bird-v2' app directory)
   # cd flappy-bird-v2  (if not already in this directory to run commands)
   npm run dev
   ```

2. **Required Dependencies**
   - NextJS
   - React
   - TypeScript
   - @types/react, @types/node (for TypeScript support)
   - Styled Components (optional)
   - Development dependencies for building

## Technical Constraints
1. **Browser Compatibility**
   - Modern browsers support required
   - Canvas API support needed
   - Responsive design requirements

2. **Performance Requirements**
   - 60 FPS target
   - Smooth animation
   - Low latency controls

3. **Asset Management**
   - Image optimization
   - Audio file size limits
   - Asset preloading

## Dependencies
1. **Core Dependencies**
   ```json
   {
     "next": "latest",
     "react": "latest",
     "react-dom": "latest",
     "typescript": "latest",
     "@types/react": "latest",
     "@types/node": "latest"
   }
   ```

2. **Development Dependencies**
   ```json
   {
     "eslint": "latest",
     "prettier": "latest",
     "@types/styled-components": "latest" // If using styled-components
   }
   ```

## Build and Deployment
1. **Build Process**
   ```bash
   npm run build
   ```

2. **Deployment**
   - Vercel or Netlify hosting
   - Automated deployments from GitHub
   - Environment configuration

## Development Workflow
1. **Version Control**
   - Feature branches
   - Pull requests
   - Semantic versioning

2. **Testing**
   - Manual testing
   - Cross-browser testing
   - Performance testing

3. **Code Quality**
   - ESLint configuration (with TypeScript support)
   - Prettier formatting
   - Code review process 