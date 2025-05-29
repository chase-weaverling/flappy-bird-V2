export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const checkRectCollision = (rect1: Rect, rect2: Rect): boolean => {
  // Check if one rectangle is to the left of the other
  if (rect1.x + rect1.width < rect2.x || rect2.x + rect2.width < rect1.x) {
    return false;
  }
  // Check if one rectangle is above the other
  if (rect1.y + rect1.height < rect2.y || rect2.y + rect2.height < rect1.y) {
    return false;
  }
  // If none of the above, the rectangles overlap
  return true;
};

export const checkBoundaryCollision = (
  character: Rect,
  canvasHeight: number,
  canvasWidth: number // Though typically bird only hits top/bottom
): boolean => {
  // Check top boundary
  if (character.y < 0) {
    return true;
  }
  // Check bottom boundary
  if (character.y + character.height > canvasHeight) {
    return true;
  }
  // Check left/right boundaries (optional, depending on game design)
  // if (character.x < 0 || character.x + character.width > canvasWidth) {
  //   return true;
  // }
  return false;
}; 