import { PartialNodeInfo } from "./types";

export function isPointInsideRectangle(
    point: { x: number, y: number },
    rect: { position: { x: number, y: number }; length: number; height: number },
  ): boolean {
    return (
      point.x >= rect.position.x - rect.length * 0.5 &&
      point.x <= rect.position.x + rect.length * 0.5 &&
      point.y >= rect.position.y - rect.height * 0.5 &&
      point.y <= rect.position.y + rect.height * 0.5
    );
  }

  export function remap(num: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) {
    const epsilon = 0.1; // small constant to avoid division by zero
    return ((num - inputMin) / (inputMax - inputMin + epsilon)) * (outputMax - outputMin) + outputMin;
  }

  export function normalizePositions(positions: number[][], indeces: number[], records: PartialNodeInfo[], sideGutter: number) {

    const inputMinX = positions.map(x => x[0]).reduce((a, b) => Math.min(a, b))
    const inputMaxX = positions.map(x => x[0]).reduce((a, b) => Math.max(a, b))
    const inputMinY = positions.map(x => x[1]).reduce((a, b) => Math.min(a, b))
    const inputMaxY = positions.map(x => x[1]).reduce((a, b) => Math.max(a, b))

    const outputMinX = sideGutter
    const outputMaxX = window.innerWidth - sideGutter
    const outputMinY = sideGutter
    const outputMaxY = window.innerHeight - sideGutter

    const normalizedPositions = positions.map((x, i) => {
      const newX = remap(x[0], inputMinX, inputMaxX, outputMinX, outputMaxX)
      const newY = remap(x[1], inputMinY, inputMaxY, outputMinY, outputMaxY)
      const index = indeces[i]
      return { ...records[index], x: newX, y: newY }
    })
    return normalizedPositions;
  }

  export function separateParticles(particles: PartialNodeInfo[]) {
    const kSpringConstant = 0.1; // Spring constant
    let isOverlapping = true;
    const maxIterations = 100;
    let iteration = 0;

    while (isOverlapping && iteration < maxIterations) {
      isOverlapping = false;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (particles[i].radius + particles[j].radius) * 1.12;
          if (distance < minDistance) {
            isOverlapping = true;
            const overlap = minDistance - distance;
            const force = overlap * kSpringConstant;
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force;
            particles[i].x -= forceX;
            particles[i].y -= forceY;
            particles[j].x += forceX;
            particles[j].y += forceY;
          }
        }
      }
      iteration++;
    }

    return particles;
  }