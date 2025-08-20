import React, { useState, useEffect } from 'react';
import SymptomTrendChart from './SymptomTrendChart';

// AI Analysis Metrics Component
const AnalysisMetrics = ({ analysisData }) => {
  if (!analysisData || Object.keys(analysisData).length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>AI</div>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>No analysis data available</div>
        <div style={{ fontSize: '12px' }}>
          AI analysis will appear here once clinical notes are processed
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '16px'
    }}>
      {/* Documentation Completeness */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderLeft: '4px solid #10b981',
        borderRadius: '6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '16px' }}></span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Avg. Completeness
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
          {analysisData.avgCompleteness || '--'}%
        </div>
      </div>

      {/* Risk Flags */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderLeft: '4px solid #ef4444',
        borderRadius: '6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '16px' }}></span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Risk Flags
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
          {analysisData.riskFlags || 0}
        </div>
      </div>

      {/* Trend Analysis */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderLeft: '4px solid #3b82f6',
        borderRadius: '6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '16px' }}></span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Trends Detected
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
          {analysisData.trendsDetected || 0}
        </div>
      </div>

      {/* Care Gaps */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '16px' }}></span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Care Gaps
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
          {analysisData.careGaps || 0}
        </div>
      </div>
    </div>
  );
};

// Recent Recommendations Component
const RecentRecommendations = ({ recommendations = [] }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px'
      }}>
        No recent recommendations available
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        Recent AI Recommendations
      </h4>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {recommendations.slice(0, 5).map((rec, index) => {
          // Handle both old string format and new object format
          const isObjectFormat = typeof rec === 'object';
          const recommendationText = isObjectFormat ? rec.recommendation : rec;
          const patientId = isObjectFormat ? rec.patient_id : null;
          const contentSnippet = isObjectFormat ? rec.content_snippet : null;
          const score = isObjectFormat ? rec.score : null;
          const timestamp = isObjectFormat ? new Date(rec.timestamp).toLocaleDateString() : null;
          
          return (
            <div
              key={index}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderLeft: '3px solid #3b82f6',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.4',
                color: 'var(--text-primary)'
              }}
            >
              {/* Main Recommendation */}
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {recommendationText}
              </div>
              
              {/* Patient and Note Context */}
              {isObjectFormat && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ fontWeight: '500' }}>Patient:</span> {patientId || 'Unknown'}
                    {score && (
                      <span style={{ marginLeft: '8px' }}>
                        <span style={{ fontWeight: '500' }}>Score:</span> {Math.round(score * 100)}%
                      </span>
                    )}
                  </div>
                  {contentSnippet && (
                    <div style={{ 
                      fontStyle: 'italic', 
                      opacity: 0.8,
                      marginTop: '3px',
                      padding: '3px 6px',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '3px'
                    }}>
                      "{contentSnippet}"
                    </div>
                  )}
                  {timestamp && (
                    <div style={{ marginTop: '2px', fontSize: '10px', opacity: 0.7 }}>
                      {timestamp}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {recommendations.length > 5 && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          Showing 5 of {recommendations.length} recommendations
        </div>
      )}
    </div>
  );
};

// AI Analysis Overview Component
const AIAnalysisOverview = ({ onOpenClinicalWorkflow }) => {
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentRecommendations, setRecentRecommendations] = useState([]);

  // Load AI analysis data from backend
  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Fetch dashboard metrics from AI analysis API
      const response = await fetch('http://localhost:5000/api/ai-analysis/dashboard-metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data.metrics);
        
        // Also load recent recommendations
        loadRecentRecommendations();
      } else {
        setError(data.error || 'Failed to load AI analysis data');
        // Set fallback data structure
        setAnalysisData({
          avgCompleteness: null,
          riskFlags: 0,
          trendsDetected: 0,
          careGaps: 0,
          analysisSystemStatus: {
            ollamaConnected: false,
            modelsLoaded: false,
            analysisReady: false,
            error: data.error
          }
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading AI analysis data:', err);
      setError('Failed to connect to AI analysis service');
      setAnalysisData({
        avgCompleteness: null,
        riskFlags: 0,
        trendsDetected: 0,
        careGaps: 0,
        analysisSystemStatus: {
          ollamaConnected: false,
          modelsLoaded: false,
          analysisReady: false,
          error: 'Connection failed'
        }
      });
      setLoading(false);
    }
  };

  // Load recent recommendations from backend
  const loadRecentRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5000/api/ai-analysis/recent-recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setRecentRecommendations(data.recommendations);
      }
    } catch (err) {
      console.log('Recent recommendations not available:', err);
      // Fail silently - recommendations are optional
    }
  };

  useEffect(() => {
    loadAnalysisData();
    // Refresh every 5 minutes when AI analysis is active
    const interval = setInterval(loadAnalysisData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="system-status" style={{ minHeight: '200px' }}>
        <h3>AI Clinical Analysis</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100px',
          color: 'var(--text-muted)'
        }}>
          <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></div>
          Analyzing clinical data...
        </div>
      </div>
    );
  }

  return (
    <div className="system-status" style={{ minHeight: '200px' }}>
      <h3>AI Clinical Analysis</h3>
      <p>Automated insights from clinical documentation</p>
      
      {error && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '3px solid #ef4444',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      <div className="status-grid">
        <AnalysisMetrics analysisData={analysisData} />
        
        {/* Symptom Trends Visualization */}
        <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
          <SymptomTrendChart 
            timeRange="7d"
            className="clinical-dashboard-chart"
          />
        </div>
        
        {/* Development Notice */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}></span>
            <strong>AI Analysis Features In Development</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            • Documentation completeness scoring<br/>
            • Symptom tracking and extraction<br/>
            • Risk flag detection<br/>
            • Care gap identification<br/>
            • Clinical trend analysis
          </div>
        </div>
        
        {/* Recent Recommendations Section */}
        <RecentRecommendations recommendations={recentRecommendations} />
      </div>

      <div className="last-checked">
        Last analysis: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AIAnalysisOverview;