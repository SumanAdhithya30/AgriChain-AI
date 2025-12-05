"use client";
import { useState } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { locationData } from '../../constants/locationData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function YieldPrediction() {
  const [formData, setFormData] = useState({
    State: 'Tamil Nadu',
    District: 'Madurai',
    Crop: 'Rice',
    Season: 'Kharif',
    Area: '',
    Rainfall: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  // Mock average yields for comparison (Tonnes/Acre)
  const averageYields = {
    'Rice': 3.2,
    'Maize': 2.8,
    'Groundnut': 1.8,
    'Cotton': 1.2
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          Area: parseFloat(formData.Area),
          Rainfall: formData.Rainfall ? parseFloat(formData.Rainfall) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }

      const data = await response.json();
      setPrediction(data.predicted_yield);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    const districts = locationData[newState] || [];
    setFormData({
      ...formData,
      State: newState,
      District: districts.length > 0 ? districts[0] : ''
    });
  };

  // Prepare Chart Data
  const chartData = prediction ? {
    labels: ['Your Predicted Yield', 'District Average', 'Max Potential'],
    datasets: [
      {
        label: 'Yield (Tonnes/Acre)',
        data: [
          prediction, 
          averageYields[formData.Crop] || 2.0, 
          (averageYields[formData.Crop] || 2.0) * 1.5 // Mock max potential
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for prediction
          'rgba(59, 130, 246, 0.6)', // Blue for average
          'rgba(234, 179, 8, 0.6)', // Yellow for potential
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(234, 179, 8, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: `Yield Comparison for ${formData.Crop}`,
        color: 'white'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'gray' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'gray' },
        grid: { display: false }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto"> {/* Increased width for chart */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-gray-700">
            <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              AI Yield Prediction Engine
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Enter your farm details below to get an accurate yield forecast using our XGBoost model.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <select
                    name="State"
                    value={formData.State}
                    onChange={handleStateChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    {Object.keys(locationData).sort().map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">District</label>
                  <select
                    name="District"
                    value={formData.District}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    {(locationData[formData.State] || []).sort().map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* Crop */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Crop</label>
                  <input
                    type="text"
                    name="Crop"
                    value={formData.Crop}
                    onChange={handleChange}
                    placeholder="e.g. Rice"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Season */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Season</label>
                  <select
                    name="Season"
                    value={formData.Season}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Whole Year">Whole Year</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="Autumn">Autumn</option>
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Area (Hectares)</label>
                  <input
                    type="number"
                    name="Area"
                    value={formData.Area}
                    onChange={handleChange}
                    placeholder="e.g. 1000"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Rainfall (Optional/If available in model) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rainfall (mm) - Optional</label>
                  <input
                    type="number"
                    name="Rainfall"
                    value={formData.Rainfall}
                    onChange={handleChange}
                    placeholder="e.g. 850"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Predict Yield'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-center">
                {error}
              </div>
            )}

            {prediction !== null && (
              <div className="mt-8 animate-fade-in space-y-8">
                {/* Result Card */}
                <div className="p-6 bg-green-500/20 border border-green-500 rounded-xl text-center">
                  <h2 className="text-xl text-green-300 mb-2">Estimated Yield</h2>
                  <div className="text-5xl font-bold text-white mb-2">
                    {prediction.toFixed(2)} <span className="text-2xl font-normal text-gray-300">Tonnes/Acre</span>
                  </div>
                  <p className="text-green-200/80 text-sm">Based on historical data and current conditions</p>
                </div>

                {/* Chart Section */}
                <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
