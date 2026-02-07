export class ExponentialMovingAverage {
  private value: number | null = null;
  constructor(private alpha: number) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error('alpha must be in (0, 1]');
    }
  }

  update(input: number): number {
    if (this.value === null) {
      this.value = input;
    } else {
      this.value = this.alpha * input + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset(next?: number) {
    this.value = typeof next === 'number' ? next : null;
  }

  get current(): number {
    return this.value ?? 0;
  }
}
