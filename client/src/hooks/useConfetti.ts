import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const triggerConfetti = () => {
    // Create a colorful burst effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'],
      startVelocity: 30,
      gravity: 0.8,
      ticks: 100
    });
  };

  return { triggerConfetti };
};
