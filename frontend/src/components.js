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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock calculation logic
    const age = parseInt(formData.age);
    const bili = parseFloat(formData.bilirubin) || 0;
    
    if (age) {
      // Mock results based on age and bilirubin level
      let recommendation = "Continue observation";
      let riskLevel = "Low";
      let message = "";
      
      if (bili === 0) {
        // If no bilirubin provided, show thresholds
        message = "Thresholds displayed - enter bilirubin level for specific recommendations";
        recommendation = "View age-specific bilirubin thresholds";
        riskLevel = "Threshold View";
      } else {
        // Calculate based on bilirubin level
        if (bili > 25) {
          recommendation = "Consider exchange transfusion - urgent consultation required";
          riskLevel = "Very High";
        } else if (bili > 20) {
          recommendation = "Initiate phototherapy";
          riskLevel = "High";
        } else if (bili > 15) {
          recommendation = "Consider phototherapy";
          riskLevel = "Moderate";
        } else {
          recommendation = "Continue observation";
          riskLevel = "Low";
        }
      }
      
      // Adjust recommendations based on neurotoxicity risk
      let riskAdjustment = "";
      if (formData.neurotoxicity === 'any-risk') {
        riskAdjustment = " (Risk factors present - lower thresholds apply)";
      }
      
      setResults({
        age: age,
        bilirubin: bili,
        recommendation: recommendation + riskAdjustment,
        riskLevel: riskLevel,
        neurotoxicity: formData.neurotoxicity,
        message: message,
        gestation: formData.gestation
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
                    <option value="35 to 40+ weeks">35 to 40+ weeks</option>
                    <option value="38 to 39 weeks">38 to 39 weeks</option>
                    <option value="37 to 38 weeks">37 to 38 weeks</option>
                    <option value="35 to 37 weeks">35 to 37 weeks</option>
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
              <div className="bg-white bg-opacity-70 p-6 rounded-lg border-2 border-teal-600">
                <h3 className="text-lg font-semibold mb-4 text-teal-800">Calculation Results</h3>
                <div className="space-y-2">
                  <p><strong>Age:</strong> {results.age} hours</p>
                  <p><strong>Bilirubin Level:</strong> {results.bilirubin} mg/dL</p>
                  <p><strong>Risk Level:</strong> <span className={`font-semibold ${
                    results.riskLevel === 'Low' ? 'text-green-600' :
                    results.riskLevel === 'Moderate' ? 'text-yellow-600' :
                    results.riskLevel === 'High' ? 'text-orange-600' : 'text-red-600'
                  }`}>{results.riskLevel}</span></p>
                  <p><strong>Recommendation:</strong> {results.recommendation}</p>
                  <p><strong>Neurotoxicity Risk:</strong> {results.neurotoxicity === 'no-risk' ? 'No risk factors' : 
                                                         results.neurotoxicity === 'any-risk' ? 'ANY risk factors' : 'Both shown'}</p>
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