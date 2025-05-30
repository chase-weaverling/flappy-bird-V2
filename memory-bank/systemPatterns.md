# System Patterns: Zula's Adventure

## System Architecture
The game follows a component-based architecture using NextJS. The main application code, along with project documentation and IDE-specific settings, is contained within the `flappy-bird-v2` directory at the project root.

```
flappy-bird-v2/  // Main application and project directory
├── .cursor/              # Cursor IDE specific settings and journal
│   └── rules/
│       └── journal.mdc
├── memory-bank/          # Project documentation and context
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md # This file
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
├── components/
│   ├── GameCanvas.tsx     # Main game canvas component (TypeScript)
│   ├── Score.tsx          # Score display component (TypeScript)
│   └── GameOver.tsx       # Game over screen component (TypeScript)
├── pages/
│   └── index.tsx          # Main game page (TypeScript)
├── public/
│   └── assets/
│       ├── characters/   # Character sprites
│       ├── towers/       # Obstacle assets
│       └── audio/        # Sound effects
├── styles/               # CSS modules or styled components
└── utils/
    ├── collision.ts      # Collision detection (TypeScript)
    ├── physics.ts        # Game physics (TypeScript)
    └── messages.ts       # Game messages (TypeScript)
```

## Key Technical Decisions
1. **Framework Choice**
   - NextJS for modern React development (using TypeScript with .tsx for components and .ts for logic)
   - HTML5 Canvas for game rendering
   - CSS Modules/Styled Components for styling

2. **Game Engine**
   - Custom game loop implementation
   - Canvas-based rendering
   - RequestAnimationFrame for smooth animation

3. **State Management**
   - React state for game status
   - Local storage for high scores
   - Component-level state management

## Design Patterns
1. **Game Loop Pattern**
   - Update game state
   - Render frame
   - Handle input
   - Check collisions

2. **Component Pattern**
   - Reusable game components
   - Separation of concerns
   - Props for component communication

3. **Observer Pattern**
   - Event handling for game events
   - Score updates
   - Game state changes

## Component Relationships
1. **GameCanvas**
   - Manages game loop
   - Handles rendering
   - Controls game state
   - Coordinates other components

2. **Score Component**
   - Displays current score
   - Updates on successful passes
   - Persists high score

3. **GameOver Component**
   - Shows game over screen
   - Displays final score
   - Handles restart functionality

## Performance Considerations
1. **Rendering**
   - Canvas optimization
   - Sprite management
   - Frame rate control

2. **Memory Management**
   - Asset preloading
   - Resource cleanup
   - Object pooling for obstacles

3. **State Updates**
   - Efficient state management
   - Minimal re-renders
   - Optimized collision detection 