const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
console.log("API KEY:", import.meta.env.VITE_OPENWEATHER_API_KEY);


  
  // Get weather by coordinates
  export async function loadWeatherByCoords(lat, lon, units = "metric") {
    try {
      const response = await fetch(
        `${BASE_URL}?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
      );
  
      if (!response.ok) throw new Error("Weather fetch failed");
  
      const data = await response.json();
  
      return {
        summary: data.weather[0].description,
        temp: data.main.temp,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        city: data.name
      };
    } catch (error) {
      console.error("Weather API Error:", error);
      return {
        summary: "Unavailable",
        temp: "--",
        humidity: "--",
        wind: "--",
        icon: "",
        city: "Unknown"
      };
    }
  }
  
