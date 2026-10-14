/** Angle of view in radians across a sensor dimension (mm) at a focal length (mm). */
export const angleOfView = (sensorSize, focal) => 2 * Math.atan(sensorSize / (2 * focal));
