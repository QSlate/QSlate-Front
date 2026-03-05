export const calculateProgress = (
    value: number,
    min: number,
    max: number,
    inverse: boolean = false
): number => {
    if (max === min) return 0;

    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    const clampedValue = Math.max(lower, Math.min(upper, value));

    let percentage = ((clampedValue - lower) / (upper - lower)) * 100;

    if (inverse) {
        percentage = 100 - percentage;
    }

    return percentage;
};
