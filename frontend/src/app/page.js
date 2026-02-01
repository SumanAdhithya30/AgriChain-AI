"use client";

import { useEffect, useState } from "react";
import { CloudSun, Droplets, Wind, TrendingUp, Package, ShoppingCart, Bell, Loader2 } from "lucide-react";
import { fetchWeather, fetchWeatherByCoords } from "../services/weather";

export default function Home() {
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      // 1. Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const data = await fetchWeatherByCoords(latitude, longitude);
            if (data) setWeather(data);
            setLoadingWeather(false);
          },
          async (error) => {
            console.warn("Location permission denied or error:", error);
            // Fallback to default
            const data = await fetchWeather("Madurai");
            if (data) setWeather(data);
            setLoadingWeather(false);
          }
        );
      } else {
        // Fallback if Geolocation is not supported
        const data = await fetchWeather("Madurai");
        if (data) setWeather(data);
        setLoadingWeather(false);
      }
    }
    loadWeather();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Good morning, John</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening on your farm today.</p>
        </div>
        <div className="flex bg-card p-1 rounded-lg border border-border">
            <button className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm">Overview</button>
            <button className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">Analytics</button>
        </div>
      </div>

      {/* Weather & Yield - Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Card */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm min-h-[250px] relative">
          {loadingWeather ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                Loading weather...
            </div>
          ) : weather ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Weather: {weather.city}, {weather.country}</p>
                  <div className="flex items-center mt-2">
                    {/* Using OpenWeather icon or fallback */}
                    <img 
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                        alt="Weather Icon" 
                        className="h-16 w-16 -ml-2"
                    />
                    <span className="text-5xl font-bold text-foreground">{weather.temp}°C</span>
                  </div>
                  <p className="text-foreground capitalize mt-1 font-medium">{weather.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Humidity</p>
                      <p className="font-semibold text-foreground">{weather.humidity}%</p>
                    </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-3">
                    <Wind className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Wind</p>
                      <p className="font-semibold text-foreground">{weather.windSpeed} km/h</p>
                    </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-3">
                    <CloudSun className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Precip</p>
                      <p className="font-semibold text-foreground">--</p> {/* OpenWeather free API often doesn't give precip probability directly */}
                    </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-destructive">
                Failed to load weather data.
            </div>
          )}
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                        <p className="text-2xl font-bold text-foreground">3</p>
                    </div>
                </div>
            </div>
            
             <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Open Orders</p>
                        <p className="text-2xl font-bold text-foreground">1</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Market Alerts</p>
                        <p className="text-2xl font-bold text-foreground">2</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Yield Forecast Teaser */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
         <div className="mb-4">
             <div className="flex items-center gap-2 mb-2">
                 <TrendingUp className="h-5 w-5 text-primary" />
                 <p className="text-sm font-medium text-muted-foreground">AI Yield Forecast: Corn</p>
             </div>
             <h3 className="text-2xl font-bold text-foreground">Expected Yield: +5%</h3>
         </div>
         <p className="text-muted-foreground max-w-2xl mb-6">
             Favorable rain patterns and optimal soil moisture are contributing to an above-average forecast for your corn crop.
         </p>
         <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
             View Detailed Report
         </button>
      </div>
    </div>
  );
}