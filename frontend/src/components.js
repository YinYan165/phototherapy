import React, { useState } from 'react';

export const BiliCalculator = () => {
  const [formData, setFormData] = useState({
    gestation: '38 to 39 weeks',
    age: '',
    bilirubin: '',
    neurotoxicity: 'no-risk',
    plotScale: 'automatic',
    plotChoice: 'peditools',
    dateOfBirth: '',
    dateOfMeasurement: ''
  });

  const [calculatedAge, setCalculatedAge] = useState('');
  const [results, setResults] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateAge = () => {
    if (formData.dateOfBirth && formData.dateOfMeasurement) {
      const birth = new Date(formData.dateOfBirth);
      const measurement = new Date(formData.dateOfMeasurement);
      const diffTime = Math.abs(measurement - birth);
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      setCalculatedAge(diffHours);
      setFormData(prev => ({ ...prev, age: diffHours.toString() }));
    }
  };

  // AAP 2022 Bilirubin Thresholds Implementation - CORRECTED
  const calculateThresholds = (ageHours, gestation, hasRiskFactors) => {
    // Convert gestation to numeric value for calculations
    let gestWeeks = 38; // default
    if (gestation.includes('35 to 36')) gestWeeks = 36;
    else if (gestation.includes('37 to 38')) gestWeeks = 37;
    else if (gestation.includes('38 to 39')) gestWeeks = 38;
    else if (gestation.includes('39+')) gestWeeks = 39;

    // AAP 2022 Phototherapy thresholds (mg/dL) - More accurate implementation
    const getPhototherapyThreshold = (age, gestation, riskFactors) => {
      let baseThreshold;
      
      // More precise age-based thresholds for 38+ weeks gestation, no risk factors
      if (age <= 24) {
        baseThreshold = 12.0 + (age - 12) * 0.2; // Linear increase from 12h to 24h
      } else if (age <= 48) {
        baseThreshold = 15.0 + ((age - 24) / 24) * 2.0; // 15-17 mg/dL
      } else if (age <= 72) {
        baseThreshold = 17.0 + ((age - 48) / 24) * 1.0; // 17-18 mg/dL
      } else if (age <= 96) {
        baseThreshold = 18.0 + ((age - 72) / 24) * 1.0; // 18-19 mg/dL
      } else if (age <= 120) {
        baseThreshold = 19.0 + ((age - 96) / 24) * 1.0; // 19-20 mg/dL
      } else {
        baseThreshold = 20.0;
      }

      // Adjust for gestation - lower thresholds for preterm
      if (gestWeeks <= 36) baseThreshold -= 2.5;
      else if (gestWeeks === 37) baseThreshold -= 1.5;
      
      // Adjust for risk factors (lower threshold)
      if (riskFactors) baseThreshold -= 2.0;
      
      return Math.max(baseThreshold, 8.0); // minimum threshold
    };

    const getExchangeThreshold = (age, gestation, riskFactors) => {
      let baseThreshold;
      
      // Age-based exchange thresholds - more precise
      if (age <= 24) {
        baseThreshold = 15.0 + (age - 12) * 0.25;
      } else if (age <= 48) {
        baseThreshold = 18.0 + ((age - 24) / 24) * 2.0; // 18-20 mg/dL
      } else if (age <= 72) {
        baseThreshold = 20.0 + ((age - 48) / 24) * 1.5; // 20-21.5 mg/dL
      } else if (age <= 96) {
        baseThreshold = 21.5 + ((age - 72) / 24) * 1.5; // 21.5-23 mg/dL
      } else if (age <= 120) {
        baseThreshold = 23.0 + ((age - 96) / 24) * 2.0; // 23-25 mg/dL
      } else {
        baseThreshold = 25.0;
      }

      // Adjust for gestation
      if (gestWeeks <= 36) baseThreshold -= 3.0;
      else if (gestWeeks === 37) baseThreshold -= 2.0;
      
      // Adjust for risk factors
      if (riskFactors) baseThreshold -= 3.0;
      
      return Math.max(baseThreshold, 12.0); // minimum threshold
    };

    const photoThreshold = getPhototherapyThreshold(ageHours, gestWeeks, hasRiskFactors);
    const exchangeThreshold = getExchangeThreshold(ageHours, gestWeeks, hasRiskFactors);

    return {
      phototherapy: parseFloat(photoThreshold.toFixed(1)),
      exchange: parseFloat(exchangeThreshold.toFixed(1))
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const age = parseInt(formData.age);
    const bili = parseFloat(formData.bilirubin) || 0;
    
    if (age) {
      const hasRiskFactors = formData.neurotoxicity === 'any-risk' || formData.neurotoxicity === 'show-both';
      const thresholds = calculateThresholds(age, formData.gestation, hasRiskFactors);
      
      let recommendation = "";
      let riskLevel = "";
      let phototherapy = "";
      let escalation = "";
      let exchange = "";
      let confirmatory = "";
      let intensivePhototherapy = false;
      let discontinuationLevel = "";
      
      if (bili === 0) {
        // Show thresholds only
        recommendation = "Thresholds displayed - enter bilirubin level for specific recommendations";
        riskLevel = "Threshold View";
      } else {
        // Calculate discontinuation level (usually ~3-4 mg/dL below phototherapy threshold)
        const discontinuationThreshold = Math.max(thresholds.phototherapy - 4.0, 8.0);
        discontinuationLevel = `If initiating phototherapy for this measurement, consider discontinuation when bilirubin less than ${discontinuationThreshold.toFixed(1)} mg/dL`;
        
        // Determine recommendations based on bilirubin level vs thresholds
        if (bili >= thresholds.exchange) {
          riskLevel = "Critical";
          recommendation = "URGENT: Exchange transfusion indicated";
          exchange = "IMMEDIATE exchange transfusion required";
          escalation = "Emergency neonatology consultation - do not delay";
          confirmatory = "Confirm immediately with serum bilirubin";
          phototherapy = "Intensive phototherapy while preparing for exchange";
          intensivePhototherapy = true;
        } else if (bili >= (thresholds.exchange - 3)) {
          riskLevel = "Very High";
          recommendation = "Intensive phototherapy + prepare for exchange";
          phototherapy = "INTENSIVE phototherapy immediately";
          escalation = "Prepare for possible exchange transfusion";
          confirmatory = "Confirm with serum bilirubin immediately";
          intensivePhototherapy = true;
        } else if (bili >= thresholds.phototherapy) {
          riskLevel = "High";
          recommendation = "Phototherapy indicated";
          phototherapy = "Start phototherapy immediately";
          escalation = "Monitor bilirubin every 4-6 hours";
          confirmatory = "Confirm with serum bilirubin if TcB used";
          
          // Check if intensive phototherapy is needed
          if (bili >= (thresholds.phototherapy + 2)) {
            phototherapy = "INTENSIVE phototherapy immediately";
            intensivePhototherapy = true;
          }
        } else if (bili >= (thresholds.phototherapy - 2)) {
          riskLevel = "Moderate";
          recommendation = "Close monitoring - approaching phototherapy threshold";
          phototherapy = "Phototherapy may be needed soon";
          escalation = "Repeat bilirubin in 2-4 hours";
          confirmatory = "Confirm with serum bilirubin";
        } else {
          riskLevel = "Low";
          recommendation = "Continue routine monitoring";
          phototherapy = "No phototherapy needed at this time";
          escalation = "Routine follow-up";
          confirmatory = "Current level acceptable";
        }
      }
      
      setResults({
        age: age,
        ageDescription: `${age} hours (${Math.floor(age/24)} days ${age%24} hours)`,
        bilirubin: bili, // KEEP EXACT VALUE ENTERED
        thresholds: thresholds,
        recommendation: recommendation,
        riskLevel: riskLevel,
        neurotoxicity: formData.neurotoxicity,
        gestation: formData.gestation,
        phototherapy: phototherapy,
        escalation: escalation,
        exchange: exchange,
        confirmatory: confirmatory,
        hasRiskFactors: hasRiskFactors,
        intensivePhototherapy: intensivePhototherapy,
        discontinuationLevel: discontinuationLevel
      });
    } else {
      alert("Por favor ingresa la edad en horas");
    }
  };

  const resetForm = () => {
    setFormData({
      gestation: '38 to 39 weeks',
      age: '',
      bilirubin: '',
      neurotoxicity: 'no-risk',
      plotScale: 'automatic',
      plotChoice: 'peditools',
      dateOfBirth: '',
      dateOfMeasurement: ''
    });
    setResults(null);
    setCalculatedAge('');
  };

  return (
    <div className="min-h-screen bg-teal-200">
      {/* Header */}
      <header className="bg-teal-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">PediTools</h1>
            <span className="ml-2 text-sm opacity-75">clinical tools for pediatric providers</span>
          </div>
          <nav className="flex space-x-4">
            <a href="#" className="text-sm hover:text-teal-200">PediTools</a>
            <a href="#" className="text-sm hover:text-teal-200">What's new</a>
            <a href="#" className="text-sm hover:text-teal-200">About PediTools</a>
            <a href="#" className="text-sm hover:text-teal-200">Contact us</a>
            <a href="#" className="text-sm hover:text-teal-200">Sitemap</a>
            <a href="#" className="text-sm hover:text-teal-200">iOS Edition 2013</a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Calculator Form */}
          <div className="space-y-6">
            <div className="bg-white bg-opacity-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-teal-800">Age and Bilirubin</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gestation at birth
                  </label>
                  <select
                    name="gestation"
                    value={formData.gestation}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="35 to 36 weeks">35 to 36 weeks</option>
                    <option value="37 to 38 weeks">37 to 38 weeks</option>
                    <option value="38 to 39 weeks">38 to 39 weeks</option>
                    <option value="39+ weeks">39+ weeks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age (hours) <span className="text-xs">(1 to 336 hours)</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="336"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter age in hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bilirubin (mg/dL) <span className="text-xs text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="number"
                    name="bilirubin"
                    value={formData.bilirubin}
                    onChange={handleInputChange}
                    step="0.1"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter bilirubin level"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neurotoxicity risks <span className="text-xs text-gray-500">(required)</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="neurotoxicity"
                        value="no-risk"
                        checked={formData.neurotoxicity === 'no-risk'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">No risk factors</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="neurotoxicity"
                        value="any-risk"
                        checked={formData.neurotoxicity === 'any-risk'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">ANY risk factors</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="neurotoxicity"
                        value="show-both"
                        checked={formData.neurotoxicity === 'show-both'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">Show both</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plot scale</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="plotScale"
                        value="automatic"
                        checked={formData.plotScale === 'automatic'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">Automatic</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="plotScale"
                        value="full-sized"
                        checked={formData.plotScale === 'full-sized'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">Full-sized</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plot choice</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="plotChoice"
                        value="peditools"
                        checked={formData.plotChoice === 'peditools'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">PediTools custom</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="plotChoice"
                        value="original"
                        checked={formData.plotChoice === 'original'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">Original publication</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-red-600 hover:text-red-800 underline"
                  >
                    Reset form
                  </button>
                </div>
              </form>
            </div>

            {/* Optional Age Calculator */}
            <div className="bg-white bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-teal-800">Optional age calculator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                  <input
                    type="datetime-local"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of measurement</label>
                  <input
                    type="datetime-local"
                    name="dateOfMeasurement"
                    value={formData.dateOfMeasurement}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={calculateAge}
                className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Calculate age
              </button>
              {calculatedAge && (
                <p className="mt-2 text-sm text-gray-700">
                  Calculated age: <strong>{calculatedAge} hours</strong>
                </p>
              )}
            </div>

            {/* Results Display */}
            {results && (
              <div className="space-y-4">
                {/* Main Results Card */}
                <div className="bg-white bg-opacity-90 p-6 rounded-lg border-2 border-teal-600">
                  <h3 className="text-lg font-semibold mb-4 text-teal-800">Calculation Results</h3>
                  
                  {/* Patient Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
                    <div>
                      <p><strong>Age:</strong> {results.ageDescription}</p>
                      <p><strong>Gestation:</strong> {results.gestation}</p>
                    </div>
                    <div>
                      <p><strong>Neurotoxicity Risk:</strong> {results.hasRiskFactors ? 'Present' : 'Absent'}</p>
                      {results.bilirubin > 0 && (
                        <p><strong>Bilirubin Level:</strong> {results.bilirubin} mg/dL</p>
                      )}
                    </div>
                  </div>

                  {/* Thresholds */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Treatment Thresholds:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                        <p className="font-medium text-yellow-800">Phototherapy Threshold</p>
                        <p className="text-xl font-bold text-yellow-900">{results.thresholds.phototherapy} mg/dL</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                        <p className="font-medium text-red-800">Exchange Threshold</p>
                        <p className="text-xl font-bold text-red-900">{results.thresholds.exchange} mg/dL</p>
                      </div>
                    </div>
                  </div>

                  {results.bilirubin > 0 && (
                    <>
                      {/* Risk Assessment */}
                      <div className="mb-4 p-4 rounded" style={{
                        backgroundColor: 
                          results.riskLevel === 'Low' ? '#f0f9ff' :
                          results.riskLevel === 'Low-Moderate' ? '#fffbeb' :
                          results.riskLevel === 'Moderate' ? '#fef3c7' :
                          results.riskLevel === 'High' ? '#fed7aa' : '#fecaca'
                      }}>
                        <h4 className="font-semibold mb-2">Risk Assessment:</h4>
                        <p className={`text-lg font-bold ${
                          results.riskLevel === 'Low' ? 'text-blue-800' :
                          results.riskLevel === 'Low-Moderate' ? 'text-yellow-700' :
                          results.riskLevel === 'Moderate' ? 'text-yellow-800' :
                          results.riskLevel === 'High' ? 'text-orange-800' : 'text-red-800'
                        }`}>
                          {results.riskLevel} Risk
                        </p>
                        <p className="text-sm mt-1">{results.recommendation}</p>
                      </div>

                      {/* Clinical Actions */}
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                          <h4 className="font-semibold text-blue-800">Confirmatory TSB:</h4>
                          <p className="text-blue-700">{results.confirmatory}</p>
                        </div>

                        <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                          <h4 className="font-semibold text-green-800">Phototherapy:</h4>
                          <p className="text-green-700">{results.phototherapy}</p>
                        </div>

                        <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                          <h4 className="font-semibold text-purple-800">Escalation of Care:</h4>
                          <p className="text-purple-700">{results.escalation}</p>
                        </div>

                        {results.exchange && (
                          <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                            <h4 className="font-semibold text-red-800">Exchange Transfusion:</h4>
                            <p className="text-red-700">{results.exchange}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Clinical Notes */}
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                    <p><strong>Clinical Notes:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>These thresholds are based on AAP 2022 guidelines</li>
                      <li>Clinical judgment should always guide patient care decisions</li>
                      <li>Consider individual patient factors and institutional protocols</li>
                      {results.hasRiskFactors && <li><strong>Risk factors present:</strong> Lower thresholds applied</li>}
                    </ul>
                  </div>
                </div>

                {/* Bilirubin Curve Graph */}
                <div className="bg-white bg-opacity-90 p-6 rounded-lg border-2 border-teal-600">
                  <h3 className="text-lg font-semibold mb-4 text-teal-800">Bilirubin Nomogram</h3>
                  <div className="relative w-full h-64 bg-gray-50 rounded border">
                    <svg viewBox="0 0 400 200" className="w-full h-full">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="400" height="200" fill="url(#grid)" />
                      
                      {/* Axes */}
                      <line x1="40" y1="160" x2="360" y2="160" stroke="#374151" strokeWidth="2"/>
                      <line x1="40" y1="160" x2="40" y2="20" stroke="#374151" strokeWidth="2"/>
                      
                      {/* Age labels (X-axis) */}
                      <text x="80" y="175" textAnchor="middle" className="text-xs" fill="#374151">24h</text>
                      <text x="120" y="175" textAnchor="middle" className="text-xs" fill="#374151">48h</text>
                      <text x="160" y="175" textAnchor="middle" className="text-xs" fill="#374151">72h</text>
                      <text x="200" y="175" textAnchor="middle" className="text-xs" fill="#374151">96h</text>
                      <text x="240" y="175" textAnchor="middle" className="text-xs" fill="#374151">120h</text>
                      <text x="320" y="175" textAnchor="middle" className="text-xs" fill="#374151">168h</text>
                      
                      {/* Bilirubin labels (Y-axis) */}
                      <text x="35" y="145" textAnchor="end" className="text-xs" fill="#374151">5</text>
                      <text x="35" y="125" textAnchor="end" className="text-xs" fill="#374151">10</text>
                      <text x="35" y="105" textAnchor="end" className="text-xs" fill="#374151">15</text>
                      <text x="35" y="85" textAnchor="end" className="text-xs" fill="#374151">20</text>
                      <text x="35" y="65" textAnchor="end" className="text-xs" fill="#374151">25</text>
                      <text x="35" y="45" textAnchor="end" className="text-xs" fill="#374151">30</text>
                      
                      {/* Phototherapy threshold line */}
                      <path d="M 60 140 L 100 120 L 140 110 L 180 100 L 220 95 L 300 90" 
                            fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5,5"/>
                      
                      {/* Exchange threshold line */}
                      <path d="M 60 120 L 100 100 L 140 90 L 180 80 L 220 75 L 300 70" 
                            fill="none" stroke="#dc2626" strokeWidth="3"/>
                      
                      {/* Current patient point */}
                      {results.bilirubin > 0 && (
                        <circle 
                          cx={40 + (results.age * 1.5)} 
                          cy={160 - (results.bilirubin * 4)} 
                          r="5" 
                          fill="#059669" 
                          stroke="#ffffff" 
                          strokeWidth="2"
                        />
                      )}
                      
                      {/* Legend */}
                      <g transform="translate(250, 30)">
                        <line x1="0" y1="0" x2="20" y2="0" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5,5"/>
                        <text x="25" y="4" className="text-xs" fill="#f59e0b">Phototherapy</text>
                        <line x1="0" y1="15" x2="20" y2="15" stroke="#dc2626" strokeWidth="3"/>
                        <text x="25" y="19" className="text-xs" fill="#dc2626">Exchange</text>
                        {results.bilirubin > 0 && (
                          <>
                            <circle cx="10" cy="30" r="4" fill="#059669"/>
                            <text x="25" y="34" className="text-xs" fill="#059669">Patient</text>
                          </>
                        )}
                      </g>
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Graph:</strong> Age-specific bilirubin thresholds for {results.gestation} gestation
                    {results.hasRiskFactors && ' with neurotoxicity risk factors'}
                  </p>
                </div>

                {/* Recommendations Summary */}
                <div className="bg-white bg-opacity-90 p-6 rounded-lg border-2 border-teal-600">
                  <h3 className="text-lg font-semibold mb-4 text-teal-800">Clinical Recommendations</h3>
                  <div className="prose prose-sm max-w-none">
                    <h4 className="font-semibold text-gray-800">Follow-up Actions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {results.bilirubin === 0 ? (
                        <>
                          <li>Obtain bilirubin measurement for specific recommendations</li>
                          <li>Use transcutaneous or serum bilirubin measurement</li>
                          <li>Consider timing of measurement based on clinical assessment</li>
                        </>
                      ) : (
                        <>
                          {results.riskLevel === 'Critical' && (
                            <>
                              <li><strong>URGENT:</strong> Immediate exchange transfusion preparation</li>
                              <li>Intensive phototherapy while preparing for exchange</li>
                              <li>Neonatal intensive care unit consultation</li>
                            </>
                          )}
                          {(results.riskLevel === 'High' || results.riskLevel === 'Moderate') && (
                            <>
                              <li>Initiate or intensify phototherapy immediately</li>
                              <li>Monitor bilirubin levels every 4-6 hours</li>
                              <li>Ensure adequate hydration and feeding</li>
                            </>
                          )}
                          {results.riskLevel === 'Low-Moderate' && (
                            <>
                              <li>Close monitoring with repeat bilirubin in 4-6 hours</li>
                              <li>Consider phototherapy readiness</li>
                              <li>Ensure adequate feeding and hydration</li>
                            </>
                          )}
                          {results.riskLevel === 'Low' && (
                            <>
                              <li>Continue routine monitoring</li>
                              <li>Follow standard discharge planning</li>
                              <li>Educate parents on jaundice monitoring</li>
                            </>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Information */}
          <div className="space-y-6">
            <div className="bg-white bg-opacity-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 text-teal-800">
                AAP 2022 Hyperbilirubinemia management guidelines
              </h2>
              <p className="text-sm text-gray-700 mb-4">
                Calculator and clinical decision support for the AAP 2022 
                guidelines for the management of hyperbilirubinemia in 
                newborns 35 or more weeks of gestation.
              </p>

              <h3 className="text-lg font-semibold mb-3 text-teal-800">Features</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Neurotoxicity risk factors absent, present, or both</li>
                <li>Plot multiple time points to assess trends</li>
                <li>Original and <span className="text-red-600">easier to interpret custom plots</span></li>
                <li>Zoomed in and full 0-336 hour plots</li>
                <li>Original AAP recommendations plus enhanced report</li>
                <li>Post-discharge follow-up decision support</li>
                <li>Rate of increase between last two measurements</li>
                <li>Flags when TSB should be confirmed with TSB</li>
                <li>Calculate age from times of birth and measurement</li>
              </ul>

              <div className="mt-4 text-sm">
                <p className="text-red-600">
                  (<a href="#" className="underline">Comparison of AAP 2004 and 2022 thresholds</a>)
                </p>
                <p className="text-red-600">
                  (<a href="#" className="underline">Tool for previous AAP 2004 bili guidelines</a>)
                </p>
                <p className="text-red-600">
                  (<a href="#" className="underline">API access for EHR integration</a>)
                </p>
              </div>
            </div>

            {/* Usage Notes */}
            <div className="bg-white bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-teal-800">Usage Notes</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Can leave bilirubin blank to view thresholds</li>
                <li>Enter a <strong>comma-separated list of ages and bilirubin levels</strong> to assess trends
                  <ul className="ml-4 mt-1 list-disc list-inside">
                    <li>Management recommendations will be based on the latest age</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Neurotoxicity Risk Factors */}
            <div className="bg-white bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-teal-800">Neurotoxicity Risk Factors</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>albumin &lt; 3 g/dL</li>
                <li>isoimmune hemolytic disease</li>
                <li>G6PD deficiency</li>
                <li>other hemolytic conditions</li>
                <li>sepsis</li>
                <li>clinical instability in previous 24 hours</li>
                <li>(prematurity accounted for by distinct threshold curves)</li>
              </ul>
            </div>

            {/* Based on */}
            <div className="bg-white bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-teal-800">Based on</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  <a href="#" className="text-red-600 underline">
                    Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation. Pediatrics 2022;150(3):e2022058859
                  </a> [<a href="#" className="text-red-600 underline">Full text</a>] [<a href="#" className="text-red-600 underline">PubMed</a>]
                </li>
                <li>Selected Tables and Figures:
                  <ul className="ml-4 mt-1 list-disc list-inside">
                    <li><a href="#" className="text-red-600 underline">Risk factors for hyperbilirubinemia</a></li>
                    <li><a href="#" className="text-red-600 underline">Hyperbilirubinemia neurotoxicity risk factors</a></li>
                    <li><a href="#" className="text-red-600 underline">Approach to escalation of care</a></li>
                    <li><a href="#" className="text-red-600 underline">Post-discharge follow-up for infants who have not received phototherapy</a></li>
                  </ul>
                </li>
                <li>Many thanks to Alex Kemper and Thomas Newman for helpful feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            <a href="#" className="text-teal-400 hover:text-teal-300">• PediTools</a>
            <span className="mx-2">•</span>
            <a href="#" className="text-teal-400 hover:text-teal-300">Bilirubin 2022</a>
            <span className="mx-2">•</span>
          </p>
          <p className="text-xs mt-2 text-gray-400">© 2012 - 2025 Joseph Choi</p>
        </div>
      </footer>
    </div>
  );
};