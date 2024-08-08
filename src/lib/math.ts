import { PartialNodeInfo, Particle } from "./types";

export function isPointInsideRectangle(
  point: { x: number; y: number },
  rect: { position: { x: number; y: number }; length: number; height: number },
): boolean {
  return (
    point.x >= rect.position.x - rect.length * 0.5 &&
    point.x <= rect.position.x + rect.length * 0.5 &&
    point.y >= rect.position.y - rect.height * 0.5 &&
    point.y <= rect.position.y + rect.height * 0.5
  );
}

export function remap(num: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) {
  const epsilon = 0.01; // small constant to avoid division by zero
  return ((num - inputMin) / (inputMax - inputMin + epsilon)) * (outputMax - outputMin) + outputMin;
}

export function normalizePositions(
  positions: number[][],
  indeces: number[],
  records: PartialNodeInfo[],
  sideGutter: number,
) {
  const inputMinX = positions.map((x) => x[0]).reduce((a, b) => Math.min(a, b));
  const inputMaxX = positions.map((x) => x[0]).reduce((a, b) => Math.max(a, b));
  const inputMinY = positions.map((x) => x[1]).reduce((a, b) => Math.min(a, b));
  const inputMaxY = positions.map((x) => x[1]).reduce((a, b) => Math.max(a, b));

  const outputMinX = sideGutter;
  const outputMaxX = window.innerWidth - sideGutter;
  const outputMinY = sideGutter;
  const outputMaxY = window.innerHeight - sideGutter;

  const normalizedPositions = positions.map((x, i) => {
    const newX = remap(x[0], inputMinX, inputMaxX, outputMinX, outputMaxX);
    const newY = remap(x[1], inputMinY, inputMaxY, outputMinY, outputMaxY);
    const index = indeces[i];
    return { ...records[index], x: newX, y: newY };
  });
  return normalizedPositions;
}

export function normalizePositionsOnly(positions: number[][], sideGutter: number) {
  const inputMinX = positions.map((x) => x[0]).reduce((a, b) => Math.min(a, b));
  const inputMaxX = positions.map((x) => x[0]).reduce((a, b) => Math.max(a, b));
  const inputMinY = positions.map((x) => x[1]).reduce((a, b) => Math.min(a, b));
  const inputMaxY = positions.map((x) => x[1]).reduce((a, b) => Math.max(a, b));

  const outputMinX = sideGutter;
  const outputMaxX = window.innerWidth - sideGutter;
  const outputMinY = sideGutter;
  const outputMaxY = window.innerHeight - sideGutter;

  const normalizedPositions = positions.map((x, i) => {
    const newX = remap(x[0], inputMinX, inputMaxX, outputMinX, outputMaxX);
    const newY = remap(x[1], inputMinY, inputMaxY, outputMinY, outputMaxY);
    return { x: newX, y: newY };
  });
  return normalizedPositions;
}

export function normalizePositions_(records: PartialNodeInfo[], sideGutter: number) {
  const positions = records.map((x) => [x.x, x.y]);
  const indeces = records.map((x, i) => i);
  return normalizePositions(positions, indeces, records, sideGutter);
}

export function separateParticles(particles: (Particle | PartialNodeInfo)[], multiplier = 1.12) {
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
        const minDistance = (particles[i].radius + particles[j].radius) * multiplier;
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

export function separateParticlesVertically(particles: PartialNodeInfo[], sideGutter: number) {
  const inputMinY = particles.map((x) => x.radius).reduce((a, b) => Math.min(a, b));
  const inputMaxY = particles.map((x) => x.radius).reduce((a, b) => Math.max(a, b));
  const positions = particles.map((x) => [x.x, x.y]);
  const indeces = particles.map((x, i) => i);
  const outputMinY = sideGutter;
  const outputMaxY = window.innerHeight - sideGutter;
  const outputMinX = sideGutter;
  const outputMaxX = window.innerWidth - sideGutter;

  const inputMinX = positions.map((x) => x[0]).reduce((a, b) => Math.min(a, b));
  const inputMaxX = positions.map((x) => x[0]).reduce((a, b) => Math.max(a, b));

  const normalizedPositions = positions.map((x, i) => {
    const newY = remap(particles[i].radius, inputMaxY, inputMinY, outputMinY, outputMaxY);
    const newX = remap(x[0], inputMinX, inputMaxX, outputMinX, outputMaxX);
    const index = indeces[i];
    return { ...particles[index], x: newX, y: newY };
  });

  return normalizedPositions;
}

export function createRadialArrangements(particles: PartialNodeInfo[], sideGutter: number) {
  const rings = 5;
  const innerRingElements = Math.ceil(particles.length / rings);

  const outputMinX = sideGutter;
  const outputMaxX = window.innerWidth - sideGutter;
  const outputMinY = sideGutter;
  const outputMaxY = window.innerHeight - sideGutter;

  const centerX = (outputMinX + outputMaxX) / 2;
  const centerY = (outputMinY + outputMaxY) / 2;
  const maxRadius = Math.min(centerX - outputMinX, centerY - outputMinY);

  const normalizedPositions = [];

  const outerRingElements = Math.ceil((particles.length - innerRingElements) / rings);
  const increment = Math.ceil(outerRingElements / rings);

  let particleIndex = 0;
  const innerRingRadius = maxRadius / (rings + 1); // Ensure the first ring is not at the center

  let eperRing = innerRingElements;

  for (let ring = 1; ring <= rings; ring++) {
    const radius = innerRingRadius * ring;
    const angleStep = (2 * Math.PI) / eperRing;

    for (let i = 0; i < eperRing && particleIndex < particles.length; i++, particleIndex++) {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      normalizedPositions.push({ ...particles[particleIndex], x, y });
    }
    eperRing += increment;
  }

  return normalizedPositions;
}
