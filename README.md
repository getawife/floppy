# Floppy

A 2D procedural escape-the-castle game built for the web.

## Features

- **Procedural Level Generation:** Every run features a unique maze generated using Prim's algorithm with controlled loop generation, ensuring dynamic layouts and high replayability.
- **Smart Guard AI:** Guard entities utilize A\* pathfinding, BFS topological maze analysis, line-of-sight vision checks, and state transitions (`PATROL`, `CHASE`, and `SEARCH`).
- **Responsive Controls:** Fluid, collision-safe movement and physical waypoint tracking.

## Gameplay Controls

| Key                 | Action     |
| ------------------- | ---------- |
| `W` / `Up Arrow`    | Move Up    |
| `A` / `Left Arrow`  | Move Left  |
| `S` / `Down Arrow`  | Move Down  |
| `D` / `Right Arrow` | Move Right |

## How to Play

1. **Explore:** Navigate through the procedural castle corridors.
2. **Collect:** Gather all required coins scattered throughout the maze to unlock the exit.
3. **Evade:** Avoid the guards. If a guard catches sight of you, they will pursue your location and search the area if they lose visual contact.
4. **Escape:** Reach the exit tile once all coins are collected to win the stage.

## Run Locally

Clone the project:

```bash
git clone [https://github.com/SyntaxErrorSolos/floppy](https://github.com/SyntaxErrorSolos/floppy)
```

Go to the project directory:

```
cd floppy
```

Install dependencies:

```
npm install
```

Run locally

```
npm run dev
```

## License

This project is licensed under the MIT license. Please refer to the LICENSE file for more information.
