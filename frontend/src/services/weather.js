const API_KEY = "ae4b88f07cd0b63bedb26764417741d2";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export const fetchWeather = async (city = "Madurai") => {
  try {
    const response = await fetch(`${BASE_URL}?q=${city}&units=metric&appid=${API_KEY}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenWeatherMap API Error:", response.status, response.statusText, errorData);
      throw new Error(`API Error: ${response.status} ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return {
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      description: data.weather[0].description, // e.g. "clear sky"
      city: data.name,
      country: data.sys.country,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
};

export const fetchWeatherByCoords = async (lat, lon) => {
  try {
    const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenWeatherMap API Error:", response.status, response.statusText, errorData);
      throw new Error(`API Error: ${response.status} ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return {
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      description: data.weather[0].description,
      city: data.name,
      country: data.sys.country,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error("Error fetching weather by coords:", error);
    return null;
  }
};
