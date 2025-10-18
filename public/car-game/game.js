const gameCont = document.getElementById("game-container");
const playerCar = document.getElementById("player-car");
const copCar = document.getElementById("cop-car");
const scoreDisplay = document.getElementById("score");
const gameOverModal = document.getElementById("game-over-modal");
const finalScoreDisplay = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-button");
const startBtn = document.getElementById("start-button");

// Constants
const IMG_SOURCE = "/global/assets/imgs";
const CAR_OFFSET = playerCar.clientWidth / 2;
const LANE_WIDTH = gameContainer.clientWidth / 6;
const LANES = [
  LANE_WIDTH - CAR_OFFSET,
  LANE_WIDTH * 3 - CAR_OFFSET,
  LANE_WIDTH * 5 - CAR_OFFSET,
];
const STATIC_OBSTACLES = [
  `<img src="${IMG_SOURCE}/road-block-obj.png" alt="Road Block"/>`,
  `<img src="${IMG_SOURCE}/wood-obj.png" alt="Wood Log"/>`,
];
const DYN_OBSTACLES = [
  `<img src="${IMG_SOURCE}/sedan-obj.png" alt="Driving Car"/>`,
  `<img src=${IMG_SOURCE}/smi-truck-obj.png" alt="Semi Truck"/>`,
];
const POWERUPS = [];

// Game State
let score = 0;
let baseGameSpeed = 4;
let gameSpeed = 4;
let isGameOver = true;
let playerLane = 1;
let copLane = 1;
let copDistance = -100;
let gameLoopInterval;
let objectInterval;
let powerupTimeout;
