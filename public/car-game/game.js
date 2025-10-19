document.addEventListener("DOMContentLoaded", () => {
  const gameCont = document.getElementById("game-container");
  const playerCar = document.getElementById("player-car");
  const copCar = document.getElementById("cop-car");
  const scoreDisplay = document.getElementById("score");
  const gameOverModal = document.getElementById("game-over-modal");
  const finalScoreDisplay = document.getElementById("final-score");
  const restartBtn = document.getElementById("restart-button");
  const startBtn = document.getElementById("start-button");
  const lanes = document.querySelectorAll(".lane-line");

  // Constants
  const SURF_SOUND = "/global/assets/data/surf.mp3";
  const BASE_SPEED = 6;
  const BASE_LANE = 1;
  const BASE_COP_DIST = -100;
  const LANE_ARR_MAX = 2;
  const LANE_ARR_MIN = 0;
  const IMG_SOURCE = "/global/assets/imgs";
  const LANE_WIDTH = gameCont.clientWidth / 6;
  const CAR_OFFSET = 20;
  const LANES = [LANE_WIDTH, LANE_WIDTH * 3, LANE_WIDTH * 5];
  const STATIC_OBSTACLES = [
    `<img src="${IMG_SOURCE}/road-block-obj.png" alt="Road Block"/>`,
    `<img src="${IMG_SOURCE}/wood-obj.png" alt="Wood Log"/>`,
    `<img src="${IMG_SOURCE}/tire-obj.png" alt="Tire"/>`,
  ];
  const DYNAMIC_OBSTACLES = [
    `<img src="${IMG_SOURCE}/sedan-obj.png" alt="Driving Car"/>`,
    `<img src="${IMG_SOURCE}/semi-truck-obj.png" alt="Semi Truck"/>`,
  ];
  const POWERUPS = [
    `<img src="${IMG_SOURCE}/star-obj.png" alt="Star"/>`,
    `<img src="${IMG_SOURCE}/shield-obj.png" alt="Shield"/>`,
    `<img src="${IMG_SOURCE}/multiplier-obj.png" alt="Multiplier"/>`,
  ];
  const POWERUP_TYPES = ["invincibility", "shield", "multiplier"];

  // Game State
  let score = 0;
  let incrementScore = 5;
  let gameSpeed = 5;
  let isGameOver = true;
  let shieldLevel = 0;
  let invincible = false;
  let endingGame = false;
  let playerLane = 1;
  let copLane = 1;
  let copDistance = -100;
  let multiplier = 1;

  let objectInterval = 4000;
  let lastObjAdd = Date.now();

  let objects = new Map();
  let powerupIntervals = [];

  let surfMusic = new Audio(SURF_SOUND);

  function init() {
    playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    copCar.style.left = `${LANES[copLane] - CAR_OFFSET}px`;
    copCar.style.bottom = `${copDistance}px`;
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);
    document.addEventListener("keydown", handleKeyPress);
    // TODO: implement proper touch
  }

  function startGame() {
    score = 0;
    gameSpeed = BASE_SPEED;
    isGameOver = false;
    playerLane = BASE_LANE;
    copLane = BASE_LANE;
    copDistance = BASE_COP_DIST;

    playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    copCar.style.left = `${LANES[copLane] - CAR_OFFSET}px`;
    copCar.style.bottom = `${copDistance}px`;

    gameOverModal.classList.add("hidden");
    startBtn.disabled = "true";
    scoreDisplay.textContent = "Score: 0";

    surfMusic.play();
    gameLoop();
  }

  // Player Controls
  function handleKeyPress(e) {
    if (isGameOver) return;

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
      movePlayer(-1);
    } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      movePlayer(1);
    }
  }

  // TODO: touch functions

  function movePlayer(direction) {
    // INTEGER
    const nextLane = playerLane + direction;

    if (nextLane < LANE_ARR_MIN || nextLane > LANE_ARR_MAX) {
      pentalize();
    } else {
      playerLane = nextLane;
      playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    }
  }

  // Game Mechanics
  function pentalize() {
    copDistance += 60;
    copCar.style.bottom = `${copDistance}px`;

    playerCar.style.transform = "rotate(75deg)";
    setTimeout(() => {
      playerCar.style.transform = "rotate(-75deg)";
    }, 500);
    setTimeout(() => {
      playerCar.style.transform = "rotate(0deg)";
    }, 1000);
  }

  function createObject() {
    if (isGameOver) return;

    const randomLane = Math.floor(Math.random() * LANES.length);
    const id = `obj-${Date.now()}`;

    // > 0.2 makes bad object
    if (Math.random() > 0.2) {
      const obstacle = document.createElement("div");
      obstacle.classList.add("object");
      obstacle.id = id;
      obstacle.style.top = "-50px";

      if (Math.random() > 0.5) {
        const dynObj = Math.floor(Math.random() * DYNAMIC_OBSTACLES.length);
        obstacle.innerHTML = DYNAMIC_OBSTACLES[dynObj];
        if (dynObj === 1) {
          obstacle.classList.add("semi");
        }
        obstacle.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
        gameCont.appendChild(obstacle);
        runDynamicObject(obstacle);
      } else {
        obstacle.innerHTML =
          STATIC_OBSTACLES[Math.floor(Math.random() * STATIC_OBSTACLES.length)];
        obstacle.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
        gameCont.appendChild(obstacle);
        runStaticObject(obstacle);
      }

      objects.set(id, {
        element: obstacle,
        callback() {
          if (invincible) return;
          if (shieldLevel > 0) {
            obstacle.remove();
            decrementShield();
          } else {
            isGameOver = true;
          }
        },
      });
    } else {
      const powerup = document.createElement("div");
      const powerupType = Math.floor(Math.random() * POWERUPS.length);
      powerup.classList.add("object");
      powerup.id = id;
      powerup.innerHTML = POWERUPS[powerupType];
      powerup.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
      gameCont.appendChild(powerup);
      runStaticObject(powerup);

      objects.set(id, {
        element: powerup,
        powerupType: POWERUP_TYPES[powerupType],
        callback() {
          powerup.remove();
          activatePowerup(powerupType);
          console.log("called activatePowerup with type ", powerupType);
        },
      });
    }
  }

  function runDynamicObject(obstacle, id) {
    obstacle.style.animation = `obj-animation ${gameSpeed * 2}s linear forwards`;
    setTimeout(() => {
      obstacle.remove();
      score += 1 * multiplier;
      objects.delete(id);
    }, gameSpeed * 2000);
  }

  function runStaticObject(object, id) {
    object.style.animation = `obj-animation ${gameSpeed}s linear forwards`;
    setTimeout(() => {
      object.remove();
      score += 1 * multiplier;
      objects.delete(id);
    }, gameSpeed * 1000);
  }

  function moveCop() {
    if (copLane !== playerLane) {
      copLane = playerLane;
      copCar.style.left = `${LANES[copLane]}px`;
    }
    if (copDistance > BASE_COP_DIST) {
      copDistance -= 0.15;
      copCar.style.bottom = `${copDistance}px`;
    }
  }

  function decrementShield() {
    if (!invincible) {
      shieldLevel -= 1;
    }
    switch (shieldLevel) {
      case 0:
        playerCar.style.border = "0.1rem solid transparent";
        break;
      case 1:
        playerCar.style.border = "0.1rem solid lightblue";
        break;
      case 2:
        playerCar.style.border = "0.1rem solid lightgreen";
        break;
      case 3:
        playerCar.style.border = "0.1rem solid pink";
        break;
      default:
        playerCar.style.border = "0.1rem solid red";
        break;
    }
  }

  function incrementShield() {
    shieldLevel += 1;
    switch (shieldLevel) {
      case 0:
        playerCar.style.border = "0.1rem solid transparent";
        break;
      case 1:
        playerCar.style.border = "0.1rem solid lightblue";
        break;
      case 2:
        playerCar.style.border = "0.1rem solid lightgreen";
        break;
      case 3:
        playerCar.style.border = "0.1rem solid pink";
        break;
      default:
        playerCar.style.border = "0.1rem solid red";
        break;
    }
  }

  function activatePowerup(powerupType) {
    switch (powerupType) {
      case 0:
        invincible = true;
        playerCar.querySelector("img").style.animation =
          "invincible-animation 10s infinite linear";
        const interval = setTimeout(() => {
          invincible = false;
          playerCar.querySelector("img").style.animation = "none";
        }, 10000);
        powerupIntervals.push(interval);
        break;
      case 1:
        incrementShield();
        break;
      case 2:
        multiplier *= 2;
        const fuck_you_javascript_for_not_allowing_the_same_names_even_though_its_always_a_break =
          setTimeout(() => {
            multiplier /= 2;
          }, 10000);
        powerupIntervals.push(
          fuck_you_javascript_for_not_allowing_the_same_names_even_though_its_always_a_break,
        );
        break;
      default:
        break;
    }
  }

  function checkCollision(a, b) {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    return !(
      rectA.top > rectB.bottom ||
      rectA.bottom < rectB.top ||
      rectA.left > rectB.right ||
      rectA.right < rectB.left
    );
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (isGameOver && !invincible && shieldLevel === 0 && !endingGame) {
      endingGame = true;
      endGame();
    }

    if (checkCollision(playerCar, copCar)) {
      isGameOver = true;
    }

    moveCop();

    objects.forEach((obj, id) => {
      if (checkCollision(playerCar, obj.element)) {
        obj.callback();
      }
    });

    if (score >= incrementScore) {
      incrementScore += 5;
      gameSpeed - 1 >= 1 ? gameSpeed-- : (gameSpeed = 1);
      objectInterval = gameSpeed * 1000;

      for (const el of lanes) {
        el.style.animation = `road-animation 0.${gameSpeed}s linear infinite`;
      }
    }

    if (Date.now() - lastObjAdd > objectInterval) {
      createObject();
      lastObjAdd = Date.now();
    }

    scoreDisplay.textContent = `Score: ${score}`;
  }

  function endGame() {
    clearInterval(objectInterval);
    for (let i = 0; i < powerupIntervals.length; i++) {
      clearTimeout(powerupIntervals[i]);
    }
    powerupIntervals = [];
    gameOverModal.classList.remove("hidden");
    startBtn.classList.remove("hidden");

    finalScoreDisplay.textContent = `Last Game: ${score}`;

    shieldLevel = 0;

    surfMusic.pause();
    surfMusic.currentTime = 0;

    endingGame = false;
    return;
  }

  init();
});
