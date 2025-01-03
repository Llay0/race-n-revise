# Race 'N Revise

Race 'N Revise is an educational racing game where players answer quadratic equation questions while racing. The game is built using JavaScript, HTML, and CSS, and leverages Alpine.js for interactivity.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Game Controls](#game-controls)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/race-n-revise.git
    ```
2. Navigate to the project directory:
    ```sh
    cd race-n-revise
    ```
3. Open `game.html` in your preferred web browser.

## Usage

- Start the game by clicking the "Play" button.
- Answer the quadratic equation questions by selecting the correct lane using the `Q` key.
- Use the WASD keys to control the car and navigate through the lanes.

## Game Controls

- **W**: Accelerate
- **A**: Move Left
- **S**: Decelerate
- **D**: Move Right
- **Q**: Select Answer

## Project Structure

```
.
├── alpinegame.js
├── common.css
├── common.js
├── game.html
├── game.js
├── images/
│   ├── background/
│   ├── sprites/
│   ├── background.js
│   └── sprites.js
├── music/
│   └── track.js
└── track.js
```

- **alpinegame.js**: Contains the main game logic and Alpine.js components.
- **common.css**: Styles for the game.
- **common.js**: Utility functions and DOM manipulation.
- **game.html**: Main HTML file for the game.
- **game.js**: Core game loop and rendering logic.
- **images/**: Contains image assets and related JavaScript files.
- **music/**: Contains music assets and related JavaScript files.
- **track.js**: Track generation and segment management.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
