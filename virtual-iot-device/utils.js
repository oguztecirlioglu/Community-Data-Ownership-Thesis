function envOrDefault(KEY, defaultValue) {
  return process.env?.[KEY] || defaultValue;
}

/** Generate random AQM data.
 * Returns a JSON that has readings for:
 * PM 2.5, PM10, TVOC, Ozone, Nitrogen Dioxide, Sulfur Dioxide, Carbon Monoxide
 * @param {number} randomnessAmount - A number in [-5, 25] that determines how random the fake readings are.
 * @param {String} deviceName - Name of the IoT device producing the data.
 */
function generateRandomData(randomnessAmount, deviceName) {
  if (randomnessAmount < -5) randomnessAmount = -5;
  if (randomnessAmount > 25) randomnessAmount = 25;

  const temperature_Amount = generateRandomness(20, 5);
  const humidity_Amount = generateRandomness(30, 5);
  const pm_2_5_Amount = generateRandomness(8, 5);
  const pm_10_Amount = generateRandomness(13, 5);
  const tvoc_Amount = generateRandomness(290, 5);
  const ozone_Amount = generateRandomness(90, 5);
  const nitrogen_dioxide_Amount = generateRandomness(8, 5);
  const sulfur_dioxide_Amount = generateRandomness(35, 5);
  const carbon_monoxide_Amount = generateRandomness(30, 5);

  // WHO Tolerable / target values for pollutants:
  //pm2.5 = 10µg/m3
  //pm10=15µg/m3
  //tvoc=300µg/m3
  //ozone= 100µg/m3
  //no2 = 10µg/m3
  //so2 = 40µg/m3
  //co = 7µg/m3
  // from https://www.c40knowledgehub.org/s/article/WHO-Air-Quality-Guidelines?language=en_US
  // for tvoc=https://environment.co/acceptable-voc-levels-ppm/#:~:text=But%20there%20are%20VOC%20level,zero%20ppm%20to%200.065%20ppm.
  // tvoc limit=https://asbp.org.uk/wp-content/uploads/2020/03/Sani-Dimitroulopoulou-Public-Health-England-ASBP-Healthy-Buildings-2020.pdf

  return {
    // time: new Date().toISOString(),
    time: new Date(Date.now() - 86400000).toISOString(),
    deviceName: deviceName,
    temperature: {
      unit: "celsius",
      amount: temperature_Amount,
    },
    relative_humidity: {
      unit: "percentage",
      amount: humidity_Amount,
    },
    pm_2_5: { unit: "µg/m3", amount: pm_2_5_Amount },
    pm_10: { unit: "µg/m3", amount: pm_10_Amount },
    tvoc: { unit: "µg/m3", amount: tvoc_Amount },
    ozone: { unit: "µg/m3", amount: ozone_Amount },
    nitrogen_dioxide: { unit: "µg/m3", amount: nitrogen_dioxide_Amount },
    sulfur_dioxide: { unit: "µg/m3", amount: sulfur_dioxide_Amount },
    carbon_monoxide: { unit: "µg/m3", amount: carbon_monoxide_Amount },
  };
}

/*

*/
function generateRandomness(initialValue, variancePercentage) {
  // Calculate the lower and upper bounds
  const variance = initialValue * (variancePercentage / 100);
  const lowerBound = initialValue - variance;
  const upperBound = initialValue + variance;

  return Math.abs((upperBound - lowerBound) * Math.random() + lowerBound);
}

const utils = {
  envOrDefault,
  generateRandomData,
};

module.exports = utils;
