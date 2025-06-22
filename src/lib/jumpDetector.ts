class CircularArray<T> extends Array<T> {
    maxLength: number;

    constructor(maxLength: number) {
        super();
        this.maxLength = maxLength;
    }

    push(...elements: T[]): number {
        super.push(...elements);
        while (this.length > this.maxLength) {
            this.shift();
        }
        return this.length;
    }

    sum(): number {
        return this.reduce((a, b) => a + (b as number), 0);
    }

    mean(): number {
        if (this.length === 0) return 0;
        return this.sum() / this.length;
    }

    std(): number {
        if (this.length < 2) return 0; // Standard deviation requires at least 2 points
        const mean = this.mean();
        const variance = this.map(val => Math.pow((val as number) - mean, 2)).reduce((a, b) => a + b, 0) / this.length;
        return Math.sqrt(variance);
    }
}

export class JumpDetector {
    private y: CircularArray<number>;
    private filteredY: CircularArray<number>;
    private signals: CircularArray<number>;
    private lag: number;
    private threshold: number;
    private influence: number;

    constructor(lag: number, threshold: number, influence: number) {
        this.lag = lag;
        this.threshold = threshold;
        this.influence = influence;
        this.y = new CircularArray<number>(lag);
        this.signals = new CircularArray<number>(lag);
        this.filteredY = new CircularArray<number>(lag);
    }

    public update(newValue: number): number {
        this.y.push(newValue);

        if (this.y.length < this.lag) {
            return 0; // Not enough data to produce a signal
        }

        const leadSlice = this.y.slice(0, this.y.length - 1);
        const lead = new CircularArray<number>(this.lag);
        lead.push(...leadSlice);
        
        const mean = lead.mean();
        const std = lead.std();

        if (std > 0 && Math.abs(newValue - mean) > this.threshold * std) {
            const signal = (newValue > mean) ? 1 : -1;
            this.signals.push(signal);
            
            const influencedValue = this.influence * newValue + (1 - this.influence) * this.filteredY[this.filteredY.length - 1];
            this.filteredY.push(influencedValue);
        } else {
            this.signals.push(0);
            this.filteredY.push(newValue);
        }
        
        return this.signals[this.signals.length - 1];
    }
}