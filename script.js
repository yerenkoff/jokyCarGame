const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth < 800 ? window.innerWidth : 800;
canvas.height = window.innerHeight < 800 ? window.innerHeight : 800;

// Game variables
const leftTrack = { radius: 200, x: canvas.width / 3, y: canvas.height / 2 };
const rightTrack = { radius: 200, x: (2 * canvas.width) / 3, y: canvas.height / 2 };
const car = { angle: 0, radius: leftTrack.radius - 20, width: 20, height: 40, speed: 0.02, boost: 0.04, boosting: false };
const traffic = [];
let gameOver = false;
let score = 0;
let trafficSpeed = 0.01;
let paused = false; 
let bomb = null; // Bomb object
let bombActiveTime = 0; // Time bomb is visible
let bombCollected = false; // If bomb is collected

// Function to create traffic cars
function createTraffic() {
    if (traffic.length < 5) {
        const angle = Math.random() * Math.PI * 2;
        traffic.push({ angle, radius: rightTrack.radius - 20, width: 20, height: 20 });
    }
}

// Function to draw the tracks
function drawTrack(track, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;

    // Outer circle
    ctx.beginPath();
    ctx.arc(track.x, track.y, track.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(track.x, track.y, track.radius - 40, 0, Math.PI * 2);
    ctx.stroke();
}

// Function to draw the car (as a circle now)
function drawCar() {
    const carX = leftTrack.x + car.radius * Math.cos(car.angle);
    const carY = leftTrack.y + car.radius * Math.sin(car.angle);

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(car.angle + Math.PI / 2);

    // Change car color if bomb is collected
    ctx.fillStyle = bombCollected ? 'orange' : 'red'; // Orange if bomb collected, red otherwise
    ctx.beginPath();
    ctx.arc(0, 0, car.width / 2, 0, Math.PI * 2);  // Draw a circle instead of rectangle
    ctx.fill();
    ctx.restore();
}

// Function to draw traffic cars
function drawTraffic() {
    ctx.fillStyle = 'black';
    traffic.forEach(vehicle => {
        const vehicleX = rightTrack.x + vehicle.radius * Math.cos(vehicle.angle);
        const vehicleY = rightTrack.y + vehicle.radius * Math.sin(vehicle.angle);
        ctx.beginPath();
        ctx.arc(vehicleX, vehicleY, vehicle.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Function to update traffic car movement
function updateTraffic() {
    for (let i = traffic.length - 1; i >= 0; i--) {
        traffic[i].angle += trafficSpeed;

        // Check for collision with the car
        const vehicleX = rightTrack.x + traffic[i].radius * Math.cos(traffic[i].angle);
        const vehicleY = rightTrack.y + traffic[i].radius * Math.sin(traffic[i].angle);
        const carX = leftTrack.x + car.radius * Math.cos(car.angle);
        const carY = leftTrack.y + car.radius * Math.sin(car.angle);

        const dx = vehicleX - carX;
        const dy = vehicleY - carY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (traffic[i].width + car.width) / 2) {
            gameOver = true;
        }
    }
}

// Function to draw the score
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
}

// Function to draw pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText('Game Paused', canvas.width / 2 - 80, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Press P to Resume', canvas.width / 2 - 100, canvas.height / 2 + 40);
}

// Function to draw the game over screen
function drawGameOverScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 40);
    ctx.fillText('Press R to Restart', canvas.width / 2 - 100, canvas.height / 2 + 80);
}

// Function to reset the game
function resetGame() {
    gameOver = false;
    car.angle = 0;
    traffic.length = 0;
    trafficSpeed = 0.01;
    paused = false;
    score = 0;
    bombCollected = false;
    bomb = null;
    resetBomb();
    updateGame();
}

// Function to reset bomb position and active time
function resetBomb() {
    const angle = Math.random() * Math.PI * 2;
    bomb = { angle, radius: leftTrack.radius - 20, diameter: 40 };
    bombActiveTime = Date.now() + 2000; // Bomb visible for 2 seconds
}

// Function to draw bomb if it is active
function drawBomb() {
    if (bomb && bombActiveTime > Date.now()) {
        ctx.fillStyle = 'orange';
        const bombX = leftTrack.x + bomb.radius * Math.cos(bomb.angle);
        const bombY = leftTrack.y + bomb.radius * Math.sin(bomb.angle);
        ctx.beginPath();
        ctx.arc(bombX, bombY, bomb.diameter / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Function to check bomb collection
function checkBombCollection() {
    if (bomb && bombActiveTime > Date.now()) {
        const carX = leftTrack.x + car.radius * Math.cos(car.angle);
        const carY = leftTrack.y + car.radius * Math.sin(car.angle);

        const bombX = leftTrack.x + bomb.radius * Math.cos(bomb.angle);
        const bombY = leftTrack.y + bomb.radius * Math.sin(bomb.angle);

        const dx = carX - bombX;
        const dy = carY - bombY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If the car touches the bomb
        if (distance < (car.width / 2 + bomb.diameter / 2)) {
            bombCollected = true; // Bomb collected
            bomb = null; // Remove bomb after collection
        }
    }
}

// Function to handle key down events
function handleKeyDown(event) {
    if (event.code === 'Space') {
        car.boosting = true;
    }
    if (event.code === 'KeyR') {
        resetGame(); // Reset the game
    }
    if (event.code === 'KeyP') {
        paused = !paused; // Toggle pause
        if (!paused) {
            updateGame();  // Resume the game
        }
    }
    if (event.code === 'KeyB' && bombCollected) {
        // Reset traffic after bomb collection
        traffic.length = 0;
        bombCollected = false; // Reset bomb collection status
    }
}

// Function to handle key up events
function handleKeyUp(event) {
    if (event.code === 'Space') {
        car.boosting = false;
    }
}

// Function to update the game (called repeatedly)
function updateGame() {
    if (gameOver) {
        drawGameOverScreen();
        return;
    }

    if (paused) {
        drawPauseScreen();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tracks
    drawTrack(rightTrack, 'lightgray');
    drawTrack(leftTrack, 'gray');

    // Draw car and traffic
    drawCar();
    drawTraffic();
    drawScore();
    drawBomb(); // Draw the bomb if active

    // Update traffic movement
    updateTraffic();

    // Update car movement and score
    car.angle += car.boosting ? car.boost : car.speed;
    score++;

    // Gradually increase traffic speed over time
    trafficSpeed += 0.00001;

    // Check bomb collection
    checkBombCollection();

    requestAnimationFrame(updateGame);
}

// Function to spawn traffic periodically
setInterval(createTraffic, 3000); // Traffic spawns every 3 seconds

// Function to spawn bomb periodically (every 10 seconds)
setInterval(() => {
    if (!bomb || bombActiveTime < Date.now()) {
        resetBomb(); // Reset bomb when previous one has expired
    }
}, 10000); // Bomb appears every 10 seconds

// Add event listeners for key events
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Start the game loop
updateGame();
