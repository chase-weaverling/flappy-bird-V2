export const GRAVITY = 0.07;
export const JUMP_STRENGTH = -3;
export const ZULA_START_X_FRACTION = 0.25; // Proportion of canvas width
export const ZULA_START_Y_FRACTION = 0.5; // Proportion of canvas height
export const ZULA_WIDTH = 50; // Example width, adjust as needed
export const ZULA_HEIGHT = 40; // Example height, adjust as needed

// Obstacle Constants
export const OBSTACLE_WIDTH = 80; // Width of the tower obstacles
export const OBSTACLE_GAP = 215; // Increased from 200 for more vertical space
export const OBSTACLE_SPEED = 2; // Reduced from 3 for slower obstacle movement
export const OBSTACLE_SPAWN_INTERVAL = 1500; // Increased from 1500ms for more time between obstacles
export const MIN_OBSTACLE_HEIGHT_FRACTION = 0.15; // Minimum height of the top obstacle as a fraction of canvas height
export const MAX_OBSTACLE_HEIGHT_FRACTION = 0.65; // Maximum height of the top obstacle as a fraction of canvas height
export const MIN_PIPE_VISIBLE_PX = 20; // Minimum pixel height for any visible part of a pipe 