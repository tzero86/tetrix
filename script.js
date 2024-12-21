const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');

    const grid = 20;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const gridWidth = canvasWidth / grid;
    const gridHeight = canvasHeight / grid;

    const colors = [
      null,
      'red',
      'blue',
      'green',
      'yellow',
      'purple',
      'orange',
      'cyan'
    ];

    const shapes = [
      [],
      [[1, 1, 1, 1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[0, 1, 0], [1, 1, 1]],
      [[1, 1], [1, 1]]
    ];

    let board = [];
    let currentPiece = null;
    let score = 0;
    let gameRunning = false;
    let isPaused = false;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let linesToRemove = [];
    let animationFrame = 0;

    function resetBoard() {
      board = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    }

    function getRandomShape() {
      return Math.floor(Math.random() * (shapes.length - 1)) + 1;
    }

    function createPiece(shapeIndex) {
      const shape = shapes[shapeIndex];
      return {
        x: Math.floor(gridWidth / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        shape: shape,
        color: colors[shapeIndex]
      };
    }

    function drawPiece() {
      if (!currentPiece) return;
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillStyle = currentPiece.color;
            ctx.fillRect((currentPiece.x + x) * grid, (currentPiece.y + y) * grid, grid, grid);
          }
        });
      });
    }

    function drawBoard() {
      board.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillStyle = value;
            ctx.fillRect(x * grid, y * grid, grid, grid);
          }
        });
      });
    }

    function drawGrid() {
      ctx.strokeStyle = '#ccc';
      for (let x = 0; x <= canvasWidth; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= canvasHeight; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
    }

    function clearCanvas() {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    function collision(x, y, shape) {
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const boardX = x + col;
            const boardY = y + row;
            if (boardX < 0 || boardX >= gridWidth || boardY >= gridHeight || (boardY >= 0 && board[boardY][boardX])) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function rotate(shape) {
      const rows = shape.length;
      const cols = shape[0].length;
      const rotatedShape = Array(cols).fill(null).map(() => Array(rows).fill(0));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          rotatedShape[col][rows - 1 - row] = shape[row][col];
        }
      }
      return rotatedShape;
    }

    function movePiece(dx, dy) {
      if (!currentPiece) return;
      const newX = currentPiece.x + dx;
      const newY = currentPiece.y + dy;
      if (!collision(newX, newY, currentPiece.shape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
      }
    }

    function rotatePiece() {
      if (!currentPiece) return;
      const rotatedShape = rotate(currentPiece.shape);
      if (!collision(currentPiece.x, currentPiece.y, rotatedShape)) {
        currentPiece.shape = rotatedShape;
      }
    }

    function dropPiece() {
      if (!currentPiece) return;
      movePiece(0, 1);
      if (collision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        freezePiece();
        removeLines();
        currentPiece = createPiece(getRandomShape());
        if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
          gameOver();
        }
      }
    }

    function freezePiece() {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
          }
        });
      });
    }

    function removeLines() {
      linesToRemove = [];
      for (let y = gridHeight - 1; y >= 0;) {
        if (board[y].every(value => value)) {
          linesToRemove.push(y);
          board.splice(y, 1);
          board.unshift(Array(gridWidth).fill(0));
          score += 10;
          scoreElement.textContent = score;
        } else {
          y--;
        }
      }
      if (linesToRemove.length > 0) {
        animateLines();
      }
    }

    function animateLines() {
      animationFrame = 0;
      isPaused = true;
      function animate() {
        clearCanvas();
        drawGrid();
        drawBoard();
        drawPiece();
        ctx.fillStyle = 'white';
        linesToRemove.forEach(y => {
          ctx.fillRect(0, y * grid, canvasWidth, grid);
        });
        if (animationFrame < 10) {
          animationFrame++;
          requestAnimationFrame(animate);
        } else {
          isPaused = false;
          linesToRemove = [];
          update();
        }
      }
      animate();
    }

    function drawGhostPiece() {
      if (!currentPiece) return;
      let ghostY = currentPiece.y;
      while (!collision(currentPiece.x, ghostY + 1, currentPiece.shape)) {
        ghostY++;
      }
      ctx.fillStyle = currentPiece.color;
      ctx.globalAlpha = 0.3;
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillRect((currentPiece.x + x) * grid, (ghostY + y) * grid, grid, grid);
          }
        });
      });
      ctx.globalAlpha = 1;
    }

    function gameOver() {
      gameRunning = false;
      pauseButton.style.display = 'none';
      alert('Game Over! Score: ' + score);
      resetGame();
    }

    function resetGame() {
      resetBoard();
      currentPiece = null;
      score = 0;
      scoreElement.textContent = score;
      dropCounter = 0;
      lastTime = 0;
      gameRunning = false;
      isPaused = false;
      startButton.textContent = 'Start';
    }

    function update(time = 0) {
      if (!gameRunning || isPaused) return;
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) {
        dropPiece();
        dropCounter = 0;
      }
      clearCanvas();
      drawGrid();
      drawBoard();
      drawGhostPiece();
      drawPiece();
      requestAnimationFrame(update);
    }

    function startGame() {
      if (gameRunning) return;
      gameRunning = true;
      isPaused = false;
      startButton.textContent = 'Restart';
      pauseButton.style.display = 'inline-block';
      pauseButton.textContent = 'Pause';
      resetBoard();
      currentPiece = createPiece(getRandomShape());
      update();
    }

    function togglePause() {
      if (!gameRunning) return;
      isPaused = !isPaused;
      pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
      if (!isPaused) {
        update();
      }
    }

    document.addEventListener('keydown', (e) => {
      if (!gameRunning || isPaused) return;
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          dropPiece();
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
      }
    });

    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
