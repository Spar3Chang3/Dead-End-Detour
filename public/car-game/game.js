document.addEventListener("DOMContentLoaded", () => {
  const gameCont = document.getElementById("game-container");
  const playerCar = document.getElementById("player-car");
  const playerCarImg = document.getElementById("player-car-img");
  const copCar = document.getElementById("cop-car");
  const scoreDisplay = document.getElementById("score");
  const gameOverModal = document.getElementById("game-over-modal");
  const finalScoreDisplay = document.getElementById("final-score");
  const restartBtn = document.getElementById("restart-button");
  const startBtn = document.getElementById("start-button");
  const lanes = document.querySelectorAll(".lane-line");
  const multiplierText = document.getElementById("multiplier");

  // Constants
  const SURF_SOUND = "/global/assets/data/surf.mp3";
  const SIREN_SOUND = "/global/assets/data/police-siren.mp3";
  const BASE_DIFF_INC = 5;
  const BASE_SPEED = 5;
  const BASE_LANE = 1;
  const BASE_MULTIPLIER = 1;
  const BASE_SHIELD_LVL = 0;
  const BASE_COP_DIST = -100;
  const LANE_ARR_MAX = 2;
  const LANE_ARR_MIN = 0;
  const IMG_SOURCE = "/global/assets/imgs";
  const LANE_WIDTH = gameCont.clientWidth / 6;
  const CAR_OFFSET = 20;
  const POWERUP_LIFETIME = 10000;
  const LANES = [LANE_WIDTH, LANE_WIDTH * 3, LANE_WIDTH * 5];
  const SHIELD_COLORS = ["transparent", "#5EC8FA", "#3FE3C6", "#7FF971"];
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
  const POWERUP_TYPES = {
    list: ["invincible", "shield", "multiply"],
    invincible: "invincible",
    shield: "shield",
    multiply: "multiply",
    na: "not_applicable",
  };
  const DYN_TYPES = {
    list: ["sedan", "semi"],
    sedan: "sedan",
    semi: "semi",
  };
  const EFFECT_TYPES = {
    explode: `<img src="${IMG_SOURCE}/fire-effect.gif" alt="Explosion"/>`,
  };

  // Game State
  let score = 0;
  let scoreDiffIncrease = 8;
  let gameSpeed = 5;
  let isGameOver = true;
  let shieldLevel = 0;
  let lastInvincibleTime = Date.now();
  let invincible = false;
  let endingGame = false;
  let intro = true;
  let playerLane = 1;
  let copLane = 1;
  let copDistance = -100;
  let multiplier = 1;

  let objectInterval = 4000;
  let pointInterval = null;
  let multiplierTimes = [];
  let lastObjAdd = Date.now();

  let objects = new Map();

  let surfMusic = new Audio(SURF_SOUND);
  let copMusic = new Audio(SIREN_SOUND);

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
    isGameOver = false;
    invincible = false;
    endingGame = false;
    gameSpeed = BASE_SPEED;
    playerLane = BASE_LANE;
    copLane = BASE_LANE;
    copDistance = BASE_COP_DIST;
    multiplier = BASE_MULTIPLIER;
    shieldLevel = BASE_SHIELD_LVL;
    scoreDiffIncrease = BASE_DIFF_INC;
    lastObjAdd = Date.now();

    playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    copCar.style.left = `${LANES[copLane] - CAR_OFFSET}px`;
    copCar.style.bottom = `${copDistance}px`;

    gameOverModal.classList.add("hidden");
    startBtn.disabled = "true";
    scoreDisplay.textContent = "Score: 0";

    intro = true;
    copMusic.play();
    surfMusic.play();
    surfMusic.loop = true;
    multiplier.textContent = "x1";

    pointInterval = setInterval(() => (score += multiplier), 2000);

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
    const objEl = document.createElement("div");
    objEl.classList.add("object");
    objEl.id = id;

    let objRefIndex = 0; // Yes, this is used across different ifs of varying array sizes. BUT, I figured it would be like 0.01ms faster

    const objProps = {
      element: objEl,
      time: 1000,
      dispatch: lastObjAdd, // Default, will be turned into Date.now()
      speed: gameSpeed,
      callback: function () {},
      cleanup: function () {},
    };

    // > 0.2 makes bad object
    if (Math.random() > 0.2) {
      // Either dynamic or static
      if (Math.random() > 0.5) {
        // DYNAMIC:
        objRefIndex = Math.floor(Math.random() * DYNAMIC_OBSTACLES.length);
        objProps.time = 2000;
        const dynType = DYN_TYPES.list[objRefIndex];

        switch (dynType) {
          case DYN_TYPES.sedan:
            objEl.classList.add("sedan");
            objEl.innerHTML = DYNAMIC_OBSTACLES[objRefIndex];
            break;
          case DYN_TYPES.semi:
            objEl.classList.add("semi");
            objEl.innerHTML = DYNAMIC_OBSTACLES[objRefIndex];
            break;
          default:
            console.err(
              `Dynamic type ${dynType} from index ${objRefIndex} does not match within the list of length ${DYN_TYPES.list.length}`,
            );
        }
        objEl.style.left = `${LANES[randomLane] - CAR_OFFSET}px`; // TODO: change this to reflect both semi and sedan offsets properly
        objEl.style.animation = `obj-animation ${objProps.speed * 2}s linear forwards`;
      } else {
        objRefIndex = Math.floor(Math.random() * STATIC_OBSTACLES.length);
        objEl.innerHTML = STATIC_OBSTACLES[objRefIndex];
        objEl.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
        objEl.style.animation = `obj-animation ${objProps.speed}s linear forwards`;
      }

      // Add applicable functions
      objProps.callback = function callback() {
        runFireEffect(objEl);
        if (!invincible) {
          if (shieldLevel > 0) {
            decrementShield();
          } else {
            isGameOver = true;
          }
        }
        setTimeout(() => {
          objEl.remove();
        }, 250); // TODO: STOP USING SETTIMEOUT YOU FUCKING NIMROD
      };

      objProps.cleanup = function cleanup() {
        objEl.remove();
        score += multiplier;
        objects.delete(id);
      };

      // Otherwise, do this shit for powerups
    } else {
      const objRefIndex = Math.floor(Math.random() * POWERUPS.length);
      objEl.innerHTML = POWERUPS[objRefIndex];
      objEl.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
      objEl.style.animation = `obj-animation ${objProps.speed}s linear forwards`;
      objEl.classList.add("powerup");

      const powerupType = POWERUP_TYPES.list[objRefIndex];
      switch (powerupType) {
        case POWERUP_TYPES.invincible:
          objProps.callback = function callback() {
            objEl.remove();
            activateInvincible();
            objects.delete(id);
          };
          break;
        case POWERUP_TYPES.shield:
          objProps.callback = function callback() {
            objEl.remove();
            incrementShield();
            objects.delete(id);
          };
          break;
        case POWERUP_TYPES.multiply:
          objProps.callback = function callback() {
            objEl.remove();
            addMultiply();
            objects.delete(id);
          };
          break;
        default:
          console.err(
            `Powerup type ${objProps.powerup} from index ${objRefIndex} does not match within the list of length ${POWERUP_TYPES.list.length}`,
          );
          break;
      }

      objProps.cleanup = function cleanup() {
        objEl.remove();
        objects.delete(id);
      };
    }

    gameCont.appendChild(objEl);

    objProps.dispatch = Date.now();
    objects.set(id, objProps);
  }

  function moveCop() {
    if (copLane !== playerLane) {
      copLane = playerLane;
      copCar.style.left = `${LANES[copLane] - CAR_OFFSET}px`;
    }
    if (copDistance > BASE_COP_DIST) {
      copDistance -= 0.15;
      copCar.style.bottom = `${copDistance}px`;
    }
  }

  function activateInvincible() {
    invincible = true;
    lastInvincibleTime = Date.now();
    playerCarImg.style.animation = "invincible-animation 10s infinite linear";
  }

  function deactivateInvincible() {
    invincible = false;
    playerCarImg.style.animation = "none";
  }

  function addMultiply() {
    multiplier *= 2;
    multiplierTimes.push(Date.now());
  }

  function removeMultiply() {
    multiplier /= 2;
    multiplierTimes.shift();
  }

  function decrementShield() {
    if (!invincible) {
      shieldLevel -= 1;
    }
    const shieldIndex = Math.min(shieldLevel, SHIELD_COLORS.length - 1);
    playerCarImg.style.border = `0.${shieldIndex}rem solid ${SHIELD_COLORS[shieldIndex]}`;
    playerCar.style.boxShadow = `0px 0px 8px ${SHIELD_COLORS[shieldIndex]}`;
  }

  function incrementShield() {
    shieldLevel += 1;
    const shieldIndex = Math.min(shieldLevel, SHIELD_COLORS.length - 1);
    playerCarImg.style.border = `0.${shieldIndex}rem solid ${SHIELD_COLORS[shieldIndex]}`;
    playerCar.style.boxShadow = `0px 0px 8px ${SHIELD_COLORS[shieldIndex]}`;
  }

  function runFireEffect(element) {
    element.classList.add("exploding");
    element.innerHTML = EFFECT_TYPES.explode;
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
    const now = Date.now();

    if (intro) {
      copDistance = 0;
      copCar.style.bottom = `${copDistance}px`;
      intro = false;
    }

    if (isGameOver && !invincible && shieldLevel === 0 && !endingGame) {
      endingGame = true;
      endGame();
    }

    if (checkCollision(playerCar, copCar)) {
      endingGame = true;
      isGameOver = true;
      endGame();
    }

    moveCop();

    objects.forEach((obj, id) => {
      if (checkCollision(playerCar, obj.element)) {
        obj.callback();
      }
      if (now - obj.dispatch >= obj.time * obj.speed) {
        obj.cleanup();
      }
    });

    if (invincible && now - lastInvincibleTime >= POWERUP_LIFETIME) {
      deactivateInvincible();
    }

    if (multiplierTimes.length > 0) {
      if (
        now - multiplierTimes[multiplierTimes.length - 1] >=
        POWERUP_LIFETIME
      ) {
        removeMultiply();
      }
    }

    if (score >= scoreDiffIncrease) {
      scoreDiffIncrease += 8;
      gameSpeed = Math.max(gameSpeed - 1, 0.5); // Yes, this is bad. Come up with a better approach and do it for me :)
      objectInterval = gameSpeed * 1000;

      lanes.forEach((el) => {
        el.style.animation = `road-animation 0.${gameSpeed}s linear infinite`;
      });

      if (gameSpeed === 0.5) {
        scoreDiffIncrease = 99999999; // Keeps score from triggering again after final stage, yes, this is 0 iq. Thank you for insulting me
      }
    }

    if (now - lastObjAdd >= objectInterval) {
      createObject();
      lastObjAdd = Date.now();
    }

    scoreDisplay.textContent = `Score: ${score}`;
    multiplierText.textContent = `x${multiplier}`;
  }

  function endGame() {
    clearInterval(pointInterval);
    gameOverModal.classList.remove("hidden");
    startBtn.classList.remove("hidden");

    finalScoreDisplay.textContent = `Last Game: ${score}`;

    objects.forEach((obj, id) => {
      obj.cleanup();
    });

    shieldLevel = 0;
    multiplier = 1;
    scoreDiffIncrease = 8;
    gameSpeed = 5;

    lanes.forEach((el) => {
      el.style.animation = `road-animation 0.${gameSpeed}s linear infinite`;
    });

    surfMusic.pause();
    surfMusic.currentTime = 0;

    endingGame = false;
    return;
  }

  init();
});
