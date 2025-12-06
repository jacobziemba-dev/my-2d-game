---
name: Project Clean and Refactor Structure
overview: Reorganize the 2D web game codebase into a clean, maintainable structure by splitting large files, organizing code into logical modules, and improving separation of concerns while maintaining all existing functionality.
todos:
  - id: create-folders
    content: Create new folder structure (core/, entities/, systems/, map/, ui/, utils/)
    status: pending
  - id: split-entities
    content: Split entities.js into separate files (Entity, Player, Enemy, Minion, Item, Particle)
    status: pending
    dependencies:
      - create-folders
  - id: extract-renderer
    content: Extract rendering logic from Game class into Renderer.js and Camera.js
    status: pending
    dependencies:
      - create-folders
  - id: extract-ui
    content: Extract UI components (ControlSelector, HUD, HubUI) from main.js and game.js
    status: pending
    dependencies:
      - create-folders
  - id: reorganize-map
    content: Split map.js into GameMap.js, BSPNode.js, and Wall.js in map/ folder
    status: pending
    dependencies:
      - create-folders
  - id: reorganize-utils
    content: Split utils.js into Rect.js and Math.js in utils/ folder
    status: pending
    dependencies:
      - create-folders
  - id: move-input
    content: Move input.js to systems/InputHandler.js
    status: pending
    dependencies:
      - create-folders
  - id: simplify-game
    content: Simplify Game.js by removing rendering and UI logic, keeping only core game logic
    status: pending
    dependencies:
      - extract-renderer
      - extract-ui
  - id: update-imports
    content: Update all import statements throughout codebase to reflect new structure
    status: pending
    dependencies:
      - split-entities
      - extract-renderer
      - extract-ui
      - reorganize-map
      - reorganize-utils
      - move-input
  - id: cleanup-docs
    content: Remove or archive CLEANUP_INSTRUCTIONS.md and CLEANUP_SUMMARY.md
    status: pending
  - id: update-main
    content: Simplify main.js and update to use new UI components
    status: pending
    dependencies:
      - extract-ui
  - id: verify-build
    content: Verify all imports work and game runs correctly after refactor
    status: pending
    dependencies:
      - update-imports
      - update-main
---

# Project Clean and Refactor Structure

## Overview

Refactor the 2D web game codebase to improve maintainability, organization, and code quality. The main focus is on better code organization with a clear folder structure and splitting large files into focused modules.

## Current Issues

- `game.js` is too large (~460 lines) and handles multiple responsibilities (game loop, rendering, UI updates, state management)
- All entity classes are in a single `entities.js` file
- No clear separation between rendering and game logic
- UI logic is mixed into game logic
- Cleanup documentation files should be removed or archived
- Flat structure makes it hard to navigate

## Proposed Structure

```
src/
├── core/
│   ├── Game.js          # Main game class (simplified)
│   └── GameLoop.js      # Game loop and update cycle
├── entities/
│   ├── Entity.js        # Base Entity class
│   ├── Player.js        # Player entity
│   ├── Enemy.js         # Enemy entity
│   ├── Minion.js        # Minion entity
│   ├── Item.js          # Item entity
│   └── Particle.js      # Particle entity
├── systems/
│   ├── Renderer.js      # All rendering logic
│   ├── InputHandler.js  # Input handling (moved from input.js)
│   ├── Camera.js        # Camera system
│   └── Collision.js     # Collision detection utilities
├── map/
│   ├── GameMap.js       # Map generation (from map.js)
│   ├── BSPNode.js       # BSP tree node
│   └── Wall.js          # Wall entity
├── ui/
│   ├── ControlSelector.js  # Control selection overlay
│   ├── HUD.js              # In-game HUD rendering
│   └── HubUI.js            # Hub screen UI
├── utils/
│   ├── Rect.js          # Rect class (from utils.js)
│   └── Math.js          # Math utilities (from utils.js)
├── constants.js         # Game constants
├── state.js            # Player state
└── main.js             # Entry point (simplified)
```

## Implementation Steps

### 1. Create New Folder Structure

- Create `src/core/`, `src/entities/`, `src/systems/`, `src/map/`, `src/ui/`, `src/utils/` directories

### 2. Split entities.js

- Extract `Entity` base class to `src/entities/Entity.js`
- Extract `Player` to `src/entities/Player.js`
- Extract `Enemy` to `src/entities/Enemy.js`
- Extract `Minion` to `src/entities/Minion.js`
- Extract `Item` to `src/entities/Item.js`
- Extract `Particle` to `src/entities/Particle.js`
- Update all imports accordingly

### 3. Extract Rendering System

- Create `src/systems/Renderer.js` with all drawing methods from `Game` class:
  - `drawDungeon()`, `drawHub()`, `drawHUD()`, `drawOverlay()`, `drawText()`
- Move camera-related logic to `src/systems/Camera.js`
- Update `Game` class to use `Renderer` and `Camera`

### 4. Extract UI Components

- Create `src/ui/ControlSelector.js` for control selection overlay logic (from `main.js`)
- Create `src/ui/HUD.js` for in-game HUD rendering
- Create `src/ui/HubUI.js` for hub screen rendering
- Simplify `main.js` to just initialize the game

### 5. Reorganize Map System

- Move `BSPNode` class to `src/map/BSPNode.js`
- Move `Wall` class to `src/map/Wall.js`
- Keep `GameMap` in `src/map/GameMap.js` (rename from `map.js`)

### 6. Reorganize Utilities

- Move `Rect` class to `src/utils/Rect.js`
- Move math utilities to `src/utils/Math.js`
- Move `InputHandler` to `src/systems/InputHandler.js` (rename from `input.js`)

### 7. Simplify Game Class

- Remove rendering methods (moved to `Renderer`)
- Remove UI update logic (moved to UI components)
- Keep core game logic: state management, entity updates, game flow
- Reduce `game.js` from ~460 lines to ~200-250 lines

### 8. Update All Imports

- Update all import statements throughout the codebase to reflect new structure
- Ensure all exports are properly configured

### 9. Clean Up Documentation

- Remove `CLEANUP_INSTRUCTIONS.md` and `CLEANUP_SUMMARY.md` (or move to `docs/` if needed for reference)

### 10. Update Entry Point

- Simplify `main.js` to handle control selection and game initialization
- Move control selection logic to `src/ui/ControlSelector.js`

## Files to Modify

### Files to Split/Create:

- `src/game.js` → Split into `src/core/Game.js`, `src/systems/Renderer.js`, `src/systems/Camera.js`
- `src/entities.js` → Split into 6 separate files in `src/entities/`
- `src/map.js` → Split into `src/map/GameMap.js`, `src/map/BSPNode.js`, `src/map/Wall.js`
- `src/utils.js` → Split into `src/utils/Rect.js`, `src/utils/Math.js`
- `src/input.js` → Move to `src/systems/InputHandler.js`
- `src/main.js` → Simplify, move UI logic to `src/ui/ControlSelector.js`

### Files to Remove:

- `CLEANUP_INSTRUCTIONS.md`
- `CLEANUP_SUMMARY.md`

### Files to Keep (with updates):

- `index.html` - Update script imports if needed
- `style.css` - No changes needed
- `src/constants.js` - No changes needed
- `src/state.js` - No changes needed

## Benefits

- **Better Organization**: Clear separation of concerns with logical folder structure
- **Maintainability**: Smaller, focused files are easier to understand and modify
- **Scalability**: Easy to add new entities, systems, or UI components
- **Testability**: Isolated modules are easier to test
- **Readability**: Developers can quickly find relevant code

## Notes

- All functionality will be preserved - this is purely a structural refactor
- No changes to game logic or behavior
- All imports will be updated to maintain working state
- The refactor maintains the existing ES6 module system