const yesterdaysTime = new Date(Date.now() - 86400000).toISOString();
const todaysTime = new Date(Date.now()).toISOString();

const mockLocalStorage = {
  Virtual_IoT_Device_9999: [
    {
      time: yesterdaysTime,
      temperature: { unit: "celsius", amount: 19.166435105317095 },
      relative_humidity: { unit: "percentage", amount: 31.210460883139397 },
      pm_2_5: { unit: "µg/m3", amount: 8.254460634073293 },
      pm_10: { unit: "µg/m3", amount: 13.34156061961045 },
      tvoc: { unit: "µg/m3", amount: 278.82333287634873 },
      ozone: { unit: "µg/m3", amount: 86.55259083352318 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.640386109162613 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.74266746019684 },
      carbon_monoxide: { unit: "µg/m3", amount: 31.389560076393803 },
    },
    {
      time: yesterdaysTime,
      temperature: { unit: "celsius", amount: 19.208027006236154 },
      relative_humidity: { unit: "percentage", amount: 30.295170828254417 },
      pm_2_5: { unit: "µg/m3", amount: 7.676749764056405 },
      pm_10: { unit: "µg/m3", amount: 12.63098060237153 },
      tvoc: { unit: "µg/m3", amount: 281.54785633410864 },
      ozone: { unit: "µg/m3", amount: 87.25366924076224 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.907546081732521 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.77897807585838 },
      carbon_monoxide: { unit: "µg/m3", amount: 28.563567593676716 },
    },
  ],
  Virtual_IoT_Device_1111: [
    {
      time: todaysTime,
      temperature: { unit: "celsius", amount: 20.838418262806062 },
      relative_humidity: { unit: "percentage", amount: 30.10671678315981 },
      pm_2_5: { unit: "µg/m3", amount: 7.985578355624856 },
      pm_10: { unit: "µg/m3", amount: 12.601870035493002 },
      tvoc: { unit: "µg/m3", amount: 303.0677939686842 },
      ozone: { unit: "µg/m3", amount: 94.43245150313669 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.130064358122132 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.56127327440764 },
      carbon_monoxide: { unit: "µg/m3", amount: 31.147149639352968 },
    },
    {
      time: todaysTime,
      temperature: { unit: "celsius", amount: 20.278795461410276 },
      relative_humidity: { unit: "percentage", amount: 31.0814300598815 },
      pm_2_5: { unit: "µg/m3", amount: 8.25544125376347 },
      pm_10: { unit: "µg/m3", amount: 12.714512500379149 },
      tvoc: { unit: "µg/m3", amount: 302.3061039347534 },
      ozone: { unit: "µg/m3", amount: 92.25559231904862 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.256807612870919 },
      sulfur_dioxide: { unit: "µg/m3", amount: 33.95862316636702 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.894097630443873 },
    },
  ],
};

const mockDataToUpload = {
  Virtual_IoT_Device_9999: [
    {
      time: yesterdaysTime,
      temperature: { unit: "celsius", amount: 19.166435105317095 },
      relative_humidity: { unit: "percentage", amount: 31.210460883139397 },
      pm_2_5: { unit: "µg/m3", amount: 8.254460634073293 },
      pm_10: { unit: "µg/m3", amount: 13.34156061961045 },
      tvoc: { unit: "µg/m3", amount: 278.82333287634873 },
      ozone: { unit: "µg/m3", amount: 86.55259083352318 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.640386109162613 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.74266746019684 },
      carbon_monoxide: { unit: "µg/m3", amount: 31.389560076393803 },
    },
    {
      time: yesterdaysTime,
      temperature: { unit: "celsius", amount: 19.208027006236154 },
      relative_humidity: { unit: "percentage", amount: 30.295170828254417 },
      pm_2_5: { unit: "µg/m3", amount: 7.676749764056405 },
      pm_10: { unit: "µg/m3", amount: 12.63098060237153 },
      tvoc: { unit: "µg/m3", amount: 281.54785633410864 },
      ozone: { unit: "µg/m3", amount: 87.25366924076224 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.907546081732521 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.77897807585838 },
      carbon_monoxide: { unit: "µg/m3", amount: 28.563567593676716 },
    },
  ],
};

const mockDataToKeep = {
  Virtual_IoT_Device_1111: [
    {
      time: todaysTime,
      temperature: { unit: "celsius", amount: 20.838418262806062 },
      relative_humidity: { unit: "percentage", amount: 30.10671678315981 },
      pm_2_5: { unit: "µg/m3", amount: 7.985578355624856 },
      pm_10: { unit: "µg/m3", amount: 12.601870035493002 },
      tvoc: { unit: "µg/m3", amount: 303.0677939686842 },
      ozone: { unit: "µg/m3", amount: 94.43245150313669 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.130064358122132 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.56127327440764 },
      carbon_monoxide: { unit: "µg/m3", amount: 31.147149639352968 },
    },
    {
      time: todaysTime,
      temperature: { unit: "celsius", amount: 20.278795461410276 },
      relative_humidity: { unit: "percentage", amount: 31.0814300598815 },
      pm_2_5: { unit: "µg/m3", amount: 8.25544125376347 },
      pm_10: { unit: "µg/m3", amount: 12.714512500379149 },
      tvoc: { unit: "µg/m3", amount: 302.3061039347534 },
      ozone: { unit: "µg/m3", amount: 92.25559231904862 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.256807612870919 },
      sulfur_dioxide: { unit: "µg/m3", amount: 33.95862316636702 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.894097630443873 },
    },
  ],
};

const mockDataEntry = {
  Birthday_IoT_Device_0202: [
    {
      time: "2000-02-02T07:43:53.517Z",
      temperature: { unit: "celsius", amount: 19.166435105317095 },
      relative_humidity: { unit: "percentage", amount: 31.210460883139397 },
      pm_2_5: { unit: "µg/m3", amount: 8.254460634073293 },
      pm_10: { unit: "µg/m3", amount: 13.34156061961045 },
      tvoc: { unit: "µg/m3", amount: 278.82333287634873 },
      ozone: { unit: "µg/m3", amount: 86.55259083352318 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.640386109162613 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.74266746019684 },
      carbon_monoxide: { unit: "µg/m3", amount: 31.389560076393803 },
    },
    {
      time: "2000-02-02T07:43:53.517Z",
      temperature: { unit: "celsius", amount: 19.208027006236154 },
      relative_humidity: { unit: "percentage", amount: 30.295170828254417 },
      pm_2_5: { unit: "µg/m3", amount: 7.676749764056405 },
      pm_10: { unit: "µg/m3", amount: 12.63098060237153 },
      tvoc: { unit: "µg/m3", amount: 281.54785633410864 },
      ozone: { unit: "µg/m3", amount: 87.25366924076224 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.907546081732521 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.77897807585838 },
      carbon_monoxide: { unit: "µg/m3", amount: 28.563567593676716 },
    },
  ],
};

module.exports = { mockLocalStorage, mockDataToKeep, mockDataToUpload, mockDataEntry };
