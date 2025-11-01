document.addEventListener("DOMContentLoaded", () => {
  const gameCont = document.getElementById("game-container");
  const playerCar = document.getElementById("player-car");
  const playerCarImg = document.getElementById("player-car-img");
  const copCarImg = document.getElementById("cop-car-img");
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
  const EXP_SOUND = "/global/assets/data/explosion.mp3";
  const BASE_DIFF_INC = 8;
  const BASE_SPEED = 5;
  const MAX_SPEED = 0.8; // Technically less and BASE_SPEED, but that's just how I have the game coded right now <3
  const BASE_LANE = 1;
  const BASE_MULTIPLIER = 1;
  const BASE_SHIELD_LVL = 0;
  const BASE_COP_DIST = -100;
  const BASE_OBJ_INTERVAL = 4000;
  const SCORE_INTERVAL = 2000;
  const LANE_ARR_MAX = 2;
  const LANE_ARR_MIN = 0;
  const IMG_SOURCE = "/global/assets/imgs";
  const MULTIPLIER_TEXT = "&times;";
  const LANE_WIDTH = gameCont.clientWidth / 6;
  const CAR_OFFSET = 20;
  const POWERUP_LIFETIME = 10000;
  const LANES = [LANE_WIDTH, LANE_WIDTH * 3, LANE_WIDTH * 5];
  const SHIELD_COLORS = ["transparent", "#5EC8FA", "#3FE3C6", "#7FF971"];
  const STATIC_OBSTACLES = [
    { src: `${IMG_SOURCE}/road-block-obj.png`, alt: "Road Block" },
    { src: `${IMG_SOURCE}/wood-obj.png`, alt: "Wood Log" },
    { src: `${IMG_SOURCE}/tire-obj.png`, alt: "Tire" },
  ];
  const DYNAMIC_OBSTACLES = [
    { src: `${IMG_SOURCE}/sedan-obj.png`, alt: "Driving Car" },
    { src: `${IMG_SOURCE}/semi-truck-obj.png`, alt: "Semi Truck" },
  ];
  const POWERUPS = [
    { src: `${IMG_SOURCE}/star-obj.png`, alt: "Star" },
    { src: `${IMG_SOURCE}/shield-obj.png`, alt: "Shield" },
    { src: `${IMG_SOURCE}/multiplier-obj.png`, alt: "Multiplier" },
  ];
  const EFFECT_TYPES = {
    explode: {
      src: `${IMG_SOURCE}/fire-effect.gif`,
      alt: "Explosion",
    },
  };
  const CONTACT_TYPES = {
    hit: "hit",
    crash: "crash",
    miss: "miss",
  };
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

  // JavaScript ANIMATIONS????
  const swerve = playerCar.animate(
    [
      { transform: "rotate(0deg)" },
      { transform: "rotate(75deg)", offset: 0.25 },
      { transform: "rotate(0deg)", offset: 0.5 },
      { transform: "rotate(-75deg)", offset: 0.75 },
      { transform: "rotate(0deg)" },
    ],
    {
      duration: 1500,
      easing: "ease",
      iterations: 1,
    },
  );

  // TODO: add people plus points and animals insta lose - Viktor <3
  // TODO: make trajectory diagonal - Josh <3

  // Game State
  let score = 0;
  let scoreDiffIncrease = 8;
  let gameSpeed = 5;
  let isGameOver = true;
  let invincible = false;
  let intro = true;
  let shieldLevel = 0;
  let playerLane = 1;
  let copLane = 1;
  let copDistance = -100;
  let multiplier = 1;
  let gameLoopIterator = 0; // Dumbest optimization I've ever made
  let laneIterator = 0;
  let animIterator = 0;
  let playerRect = playerCarImg.getBoundingClientRect();

  let objectInterval = 4000;
  let pointInterval = null;
  let multiplierTimes = [];
  let lastInvincibleTime = Date.now();
  let lastObjAdd = Date.now();

  let laneObjects = [new Map(), new Map(), new Map()];
  let laneElements = {
    std: [],
    rainbow: [],
  }; // Instantite on resetValues();

  let surfMusic = new Audio(SURF_SOUND);
  let copMusic = new Audio(SIREN_SOUND);
  let expMusic = new Audio(EXP_SOUND);

  function init() {
    playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    copCar.style.left = `${LANES[copLane] - CAR_OFFSET}px`;
    copCar.style.bottom = `${copDistance}px`;

    for (laneIterator = 0; laneIterator < lanes.length; laneIterator++) {
      const stdAnim = lanes[laneIterator].animate(
        [{ backgroundPosition: "0 0" }, { backgroundPosition: "0 80px" }],
        {
          duration: BASE_SPEED * 100, // for millis
          iterations: Infinity,
          easing: "linear",
        },
      );
      const rainbowAnim = lanes[laneIterator].animate(
        [{ filter: "hue-rotate(0deg)" }, { filter: "hue-rotate(360deg)" }],
        {
          duration: POWERUP_LIFETIME,
          iterations: Infinity,
          easing: "linear",
        },
      );
      laneElements.std.push(stdAnim);
      laneElements.rainbow.push(rainbowAnim);

      stdAnim.play();
    }

    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

    document.addEventListener("keydown", handleKeyPress);
    // TODO: implement proper touch
  }

  function resetValues() {
    score = 0;
    scoreDiffIncrease = BASE_DIFF_INC;
    gameSpeed = BASE_SPEED;
    isGameOver = false;
    invincible = false;
    intro = true;
    shieldLevel = BASE_SHIELD_LVL;
    gameSpeed = BASE_SPEED;
    playerLane = BASE_LANE;
    copLane = BASE_LANE;
    copDistance = BASE_COP_DIST;
    multiplier = BASE_MULTIPLIER;

    objectInterval = BASE_OBJ_INTERVAL;
    multiplierTimes = [];

    for (
      gameLoopIterator = 0;
      gameLoopIterator < laneObjects.length;
      gameLoopIterator++
    ) {
      laneObjects[gameLoopIterator].clear();
    }

    for (laneIterator = 0; laneIterator < lanes.length; laneIterator++) {
      laneElements.rainbow[laneIterator].cancel();
      laneElements.std[laneIterator].effect.updateTiming({
        duration: BASE_SPEED * 100,
      });
      laneElements.std[laneIterator].play();
    }

    playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    copCar.style.left = `${LANES[copLane] - CAR_OFFSET}px`;
    copCar.style.bottom = `${copDistance}px`;

    multiplier.innerHTML = `${MULTIPLIER_TEXT}${BASE_MULTIPLIER}`;

    // Do these last, though it reasonably doesn't matter
    const now = Date.now();
    lastInvincibleTime = now;
    lastObjAdd = now;
  }

  function startGame() {
    resetValues();

    gameOverModal.classList.add("hidden");
    startBtn.disabled = "true";
    scoreDisplay.textContent = "Score: 0";

    copMusic.play();
    surfMusic.play();
    surfMusic.loop = true;

    pointInterval = setInterval(() => increaseScore(), SCORE_INTERVAL);
    renderScore();

    gameLoop();
  }

  // Player Controls
  function handleKeyPress(e) {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
        movePlayer(-1);
        break;
      case "ArrowRight":
      case "d":
        movePlayer(1);
        break;
      case "y":
        startGame();
        break;
      case "Enter":
        if (isGameOver) startGame;
        break;
      default:
        // Do Nothing
        break;
    }
  }

  // TODO: touch functions

  function movePlayer(direction) {
    const nextLane = playerLane + direction;

    if (nextLane < LANE_ARR_MIN || nextLane > LANE_ARR_MAX) {
      pentalize(); // Hit the wall
      return;
    }

    playerRect = playerCarImg.getBoundingClientRect();
    let blockedByObject = null;

    for (const obj of laneObjects[nextLane].values()) {
      const objRect = obj.element.getBoundingClientRect();
      const verticalOverlap = !(
        playerRect.top > objRect.bottom || playerRect.bottom < objRect.top
      );

      if (verticalOverlap && !obj.isPowerup) {
        blockedByObject = obj;
        break; // Found a blocking object
      }
    }

    if (blockedByObject) {
      blockedByObject.callback(CONTACT_TYPES.hit);
    } else {
      playerLane = nextLane;
      playerCar.style.left = `${LANES[playerLane] - CAR_OFFSET}px`;
    }
  }

  // Game Mechanics
  function pentalize() {
    copDistance += 60;
    copCar.style.bottom = `${copDistance}px`;

    swerve.cancel();
    swerve.play();
  }

  function createObject() {
    if (isGameOver) return;

    const randomLane = Math.floor(Math.random() * LANES.length);
    const id = `obj-${Date.now()}`;
    const objEl = document.createElement("div");
    objEl.classList.add("object");
    const img = new Image();
    img.id = id;
    objEl.appendChild(img);

    let objRefIndex = 0; // Yes, this is used across different ifs of varying array sizes. BUT, I figured it would be like 0.01ms faster
    const isPowerup = !(Math.random() > 0.2);

    const objProps = {
      element: img,
      id: id,
      time: 1000,
      dispatch: lastObjAdd, // Default, will be turned into Date.now()
      speed: gameSpeed,
      isPowerup: isPowerup,
      callback: function (type) {},
      cleanup: function () {
        objEl.remove();
        increaseScore();
        laneObjects[randomLane].delete(id);
      },
    };

    // > 0.2 makes bad object
    if (!isPowerup) {
      // Either dynamic or static
      if (Math.random() > 0.5) {
        // DYNAMIC:
        objRefIndex = Math.floor(Math.random() * DYNAMIC_OBSTACLES.length);
        objProps.time = 2000;
        const dynType = DYN_TYPES.list[objRefIndex];

        switch (dynType) {
          case DYN_TYPES.sedan:
            objEl.classList.add("sedan");
            break;
          case DYN_TYPES.semi:
            objEl.classList.add("semi");
            break;
          default:
            console.err(
              `Dynamic type ${dynType} from index ${objRefIndex} does not match within the list of length ${DYN_TYPES.list.length}`,
            );
        }
        img.src = DYNAMIC_OBSTACLES[objRefIndex].src;
        img.alt = DYNAMIC_OBSTACLES[objRefIndex].alt;
        objEl.style.left = `${LANES[randomLane] - CAR_OFFSET}px`; // TODO: change this to reflect both semi and sedan offsets properly
        objEl.style.animation = `obj-animation ${objProps.speed * 2}s linear forwards`;
      } else {
        objRefIndex = Math.floor(Math.random() * STATIC_OBSTACLES.length);
        img.src = STATIC_OBSTACLES[objRefIndex].src;
        img.alt = STATIC_OBSTACLES[objRefIndex].alt;
        objEl.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
        objEl.style.animation = `obj-animation ${objProps.speed}s linear forwards`;
      }

      // Add applicable functions
      objProps.callback = function callback(type) {
        switch (type) {
          case CONTACT_TYPES.hit:
            pentalize(); // "Bounce" off the object
            break;
          case CONTACT_TYPES.crash:
            runFireEffect(img);
            decreaseScore();
            if (!invincible) {
              if (shieldLevel > 0) {
                decrementShield();
              } else {
                endGame();
              }
            }
            setTimeout(() => {
              objEl.remove();
            }, 250);
            laneObjects[randomLane].delete(id); // Delete on crash
            break;
        }
      };
      // Otherwise, do this shit for powerups
    } else {
      const objRefIndex = Math.floor(Math.random() * POWERUPS.length);
      img.src = POWERUPS[objRefIndex].src;
      img.alt = POWERUPS[objRefIndex].alt;
      objEl.style.left = `${LANES[randomLane] - CAR_OFFSET}px`;
      objEl.style.animation = `obj-animation ${objProps.speed}s linear forwards`;
      objEl.classList.add("powerup");

      const powerupType = POWERUP_TYPES.list[objRefIndex];
      switch (powerupType) {
        case POWERUP_TYPES.invincible:
          objProps.callback = function callback(type) {
            objEl.remove();
            activateInvincible();
            laneObjects[randomLane].delete(id);
          };
          break;
        case POWERUP_TYPES.shield:
          objProps.callback = function callback(type) {
            objEl.remove();
            incrementShield();
            laneObjects[randomLane].delete(id);
          };
          break;
        case POWERUP_TYPES.multiply:
          objProps.callback = function callback(type) {
            objEl.remove();
            addMultiply();
            laneObjects[randomLane].delete(id);
          };
          break;
        default:
          console.err(
            `Powerup type ${powerupType} from index ${objRefIndex} does not match within the list of length ${POWERUP_TYPES.list.length}`,
          );
          break;
      }
    }

    gameCont.appendChild(objEl);

    objProps.dispatch = Date.now();
    laneObjects[randomLane].set(id, objProps);
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

  function increaseScore() {
    score += multiplier;
    renderScore();
  }

  function decreaseScore() {
    score--;
    renderScore();
  }

  function renderScore() {
    scoreDisplay.textContent = `Score: ${score}`;
  }

  function activateInvincible() {
    invincible = true;
    lastInvincibleTime = Date.now();
    for (animIterator = 0; animIterator < lanes.length; animIterator++) {
      lanes[animIterator].classList.add("invincible");
      // laneElements.std[animIterator].cancel();
      laneElements.rainbow[animIterator].play();
    }
    playerCarImg.style.animation = "invincible-animation 10s infinite linear";
  }

  function deactivateInvincible() {
    invincible = false;
    for (animIterator = 0; animIterator < lanes.length; animIterator++) {
      lanes[animIterator].classList.remove("invincible");
      laneElements.rainbow[animIterator].cancel();
      // laneElements.std[animIterator].play();
    }
    playerCarImg.style.animation = "none";
  }

  function addMultiply() {
    multiplier *= 2;
    multiplierTimes.push(Date.now());
    renderMultiply();
  }

  function removeMultiply() {
    multiplier /= 2;
    multiplierTimes.shift();
    renderMultiply();
  }

  function renderMultiply() {
    multiplierText.innerHTML = `${MULTIPLIER_TEXT}${multiplier}`;
  }

  function decrementShield() {
    if (!invincible) {
      shieldLevel--;
    }
    const shieldIndex = Math.min(shieldLevel, SHIELD_COLORS.length - 1);
    playerCarImg.style.border = `0.${shieldIndex}rem solid ${SHIELD_COLORS[shieldIndex]}`;
    playerCar.style.boxShadow = `0px 0px 8px ${SHIELD_COLORS[shieldIndex]}`;
  }

  function incrementShield() {
    shieldLevel++;
    const shieldIndex = Math.min(shieldLevel, SHIELD_COLORS.length - 1);
    playerCarImg.style.border = `0.${shieldIndex}rem solid ${SHIELD_COLORS[shieldIndex]}`;
    playerCar.style.boxShadow = `0px 0px 8px ${SHIELD_COLORS[shieldIndex]}`;
  }

  function runFireEffect(element) {
    element.src = EFFECT_TYPES.explode.src;
    element.alt = EFFECT_TYPES.explode.alt;
    element.parentElement.classList.add("exploding");
    expMusic.play();
  }

  function isColliding(rectA, rectB) {
    return !(
      rectA.top > rectB.bottom || // A is below B
      rectA.bottom < rectB.top || // A is above B
      rectA.left > rectB.right || // A is to the right of B
      rectA.right < rectB.left // A is to the left of B
    );

    // This too WAYYYYY too long to perfect because I'm an idiot
  }

  function checkCopCollision() {
    const copRect = copCarImg.getBoundingClientRect();
    const playerRect = playerCarImg.getBoundingClientRect();
    return !(copRect.top > playerRect.bottom);
  }

  function gameLoop() {
    if (isGameOver) return;

    requestAnimationFrame(gameLoop);

    if (intro) {
      copDistance = 0;
      copCar.style.bottom = `${copDistance}px`;
      intro = false;
    }

    if (checkCopCollision()) {
      isGameOver = true;
      endGame();
    }

    moveCop();

    playerRect = playerCarImg.getBoundingClientRect();
    const now = Date.now();

    for (
      gameLoopIterator = 0;
      gameLoopIterator < laneObjects.length;
      gameLoopIterator++
    ) {
      laneObjects[gameLoopIterator].forEach((obj, id) => {
        if (gameLoopIterator === playerLane) {
          if (isColliding(playerRect, obj.element.getBoundingClientRect())) {
            obj.callback(CONTACT_TYPES.crash);
          }
        }
        if (now - obj.dispatch >= obj.time * obj.speed) {
          obj.cleanup();
        }
      });
    }

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
      if (gameSpeed - 1 < MAX_SPEED) {
        gameSpeed = MAX_SPEED;
        scoreDiffIncrease = Number.MAX_VALUE; // I'm just too lazy to add another bool
      } else {
        gameSpeed--;
        scoreDiffIncrease += 8;
        for (laneIterator = 0; laneIterator < lanes.length; laneIterator++) {
          laneElements.std[laneIterator].effect.updateTiming({
            duration: gameSpeed * 100,
          });
        }
      }

      objectInterval = gameSpeed * 800;
    }

    if (now - lastObjAdd >= objectInterval) {
      createObject();
      lastObjAdd = Date.now();
    }
  }

  function endGame() {
    clearInterval(pointInterval);
    gameOverModal.classList.remove("hidden");
    startBtn.classList.remove("hidden");

    finalScoreDisplay.textContent = `Your Score: ${score}`;

    for (
      gameLoopIterator = 0;
      gameLoopIterator < laneObjects.length;
      gameLoopIterator++
    ) {
      laneObjects[gameLoopIterator].forEach((obj, id) => {
        obj.cleanup();
      });
    }

    for (laneIterator = 0; laneIterator < lanes.length; laneIterator++) {
      laneElements.std[laneIterator].cancel();
      laneElements.rainbow[laneIterator].cancel();
    }

    surfMusic.pause();
    surfMusic.currentTime = 0;

    isGameOver = true;
  }

  init();
});
