const getPastelColors = (numColors: number): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < numColors; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const pastelColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
        colors.push(pastelColor);
    }
    return colors;
};

export default getPastelColors;