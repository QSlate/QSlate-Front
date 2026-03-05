export const calculateProgress = (
    value: number,
    min: number,
    max: number,
    inverse: boolean = false
): number => {
    if (max === min) return 0;

    const clampedValue = Math.max(min, Math.min(max, value));

    let percentage = ((clampedValue - min) / (max - min)) * 100;

    if (inverse) {
        percentage = 100 - percentage;
    }

    return percentage;
};
