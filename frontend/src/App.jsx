import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file || !jd) return alert("Please provide both a Resume and a Job Description!");
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jd", jd);

    try {
      const response = await axios.post("http://localhost:8081/api/matcher/match", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Backend returns a string (AI response), parse it to extract structured data
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      // Try to extract JSON from the response
      let parsedData = null;
      try {
        // Look for JSON object in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, try to parse the whole response
          parsedData = JSON.parse(responseText);
        }
      } catch (e) {
        // If parsing fails, try to extract information from text
        console.log("Could not parse JSON, attempting text extraction");
        
        // Extract percentage from text (look for patterns like "85%", "85 percent", etc.)
        const percentMatch = responseText.match(/(\d+)%|(\d+)\s*percent|match[:\s]*(\d+)/i);
        const percentage = percentMatch ? parseInt(percentMatch[1] || percentMatch[2] || percentMatch[3]) : null;
        
        // Extract tips (look for numbered lists, bullet points, etc.)
        const tips = [];
        const tipPatterns = [
          /(?:tip|suggestion|recommendation)[\s\d:.-]*([^0-9\n]{20,200})/gi,
          /(?:^|\n)[\s]*[-•*]\s*([^\n]{20,200})/gm,
          /(?:^|\n)[\s]*\d+[.)]\s*([^\n]{20,200})/gm
        ];
        
        for (const pattern of tipPatterns) {
          const matches = responseText.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && tips.length < 3) {
              tips.push(match[1].trim());
            }
          }
        }
        
        parsedData = {
          matchPercentage: percentage || 0,
          topTips: tips.length > 0 ? tips : ["Analysis completed. Please review the full response for details."]
        };
      }
      
      // Ensure we have the expected structure
      if (!parsedData.matchPercentage && parsedData.matchPercentage !== 0) {
        parsedData.matchPercentage = 0;
      }
      if (!parsedData.topTips || !Array.isArray(parsedData.topTips)) {
        parsedData.topTips = [responseText.substring(0, 200) + "..."];
      }
      
      setData(parsedData);
    } catch (err) {
      console.error("Backend error:", err);
      let errorMessage = "An error occurred";
      
      if (err.response) {
        // Backend returned an error response
        const status = err.response.status;
        const data = err.response.data;
        errorMessage = typeof data === 'string' 
          ? `Error (${status}): ${data}`
          : `Error (${status}): ${JSON.stringify(data)}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Backend connection failed! Make sure the Spring Boot server is running on port 8081.";
      } else {
        // Something else happened
        errorMessage = err.message || "An unexpected error occurred";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Light blue background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-black text-blue-900 drop-shadow-lg mb-2">
            AI Resume Matcher <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">4.0</span>
          </h1>
          <p className="text-blue-800/80 mt-2 text-lg font-medium">Powered by Spring Boot 4 & Gemini AI</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* INPUT SECTION */}
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/10 p-6 rounded-3xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <label className="block text-sm font-bold text-blue-900 mb-4">1. Upload Resume (PDF)</label>
              <div className="relative border-2 border-dashed border-blue-400/50 rounded-2xl p-8 text-center hover:border-blue-500/70 transition-all duration-300 backdrop-blur-sm bg-white/5">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} accept=".pdf" />
                <Upload className="mx-auto text-blue-700 mb-2" size={32} />
                <p className="text-sm text-blue-800 font-medium">{file ? file.name : "Drop PDF here or click to browse"}</p>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 p-6 rounded-3xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <label className="block text-sm font-bold text-blue-900 mb-2">2. Job Description</label>
              <textarea 
                className="w-full h-64 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-blue-300/50 text-blue-900 placeholder-blue-600/60 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 transition-all resize-none"
                placeholder="Paste the job requirements here..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Run AI Analysis"}
              </button>
            </div>
          </div>

          {/* RESULTS SECTION */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col items-center justify-center min-h-[500px]">
            {!data ? (
              <div className="text-center">
                <FileText size={80} className="mx-auto text-blue-400 mb-4" />
                <p className="text-blue-800 text-lg font-medium">Waiting for analysis...</p>
              </div>
            ) : typeof data === 'string' ? (
              <div className="w-full">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">Analysis Result</h2>
                </div>
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-2xl text-sm text-blue-900 whitespace-pre-wrap max-h-96 overflow-y-auto border border-blue-300/50">
                  {data}
                </div>
              </div>
            ) : (
              <div className="w-full text-center">
                {data.matchPercentage !== undefined && data.matchPercentage !== null ? (
                  <>
                    <div className="inline-flex items-center justify-center p-10 rounded-full border-4 border-blue-500/50 backdrop-blur-xl bg-gradient-to-br from-green-400/40 to-emerald-500/40 shadow-2xl mb-6">
                      <span className="text-6xl font-black text-blue-900 drop-shadow-lg">{data.matchPercentage}%</span>
                    </div>
                    <h2 className="text-3xl font-bold text-blue-900 mb-6">Match Score</h2>
                  </>
                ) : null}
                
                <div className="text-left space-y-4">
                  <h3 className="font-bold text-blue-900 flex items-center text-lg">
                    <CheckCircle2 className="text-green-600 mr-2" size={24} /> AI Recommendations:
                  </h3>
                  {data.topTips && Array.isArray(data.topTips) && data.topTips.length > 0 ? (
                    <ul className="space-y-3">
                      {data.topTips.map((tip, i) => (
                        <li key={i} className="backdrop-blur-sm bg-white/10 p-4 rounded-xl text-sm text-blue-900 border-l-4 border-blue-600 shadow-lg hover:bg-white/20 transition-all">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl text-sm text-blue-900 border border-blue-300/50">
                      {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}