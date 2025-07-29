import React, { useState, useEffect } from 'react';

// AI Analysis Metrics Component
const AnalysisMetrics = ({ analysisData }) => {
  if (!analysisData || Object.keys(analysisData).length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
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
          <span style={{ fontSize: '16px' }}>📋</span>
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
          <span style={{ fontSize: '16px' }}>⚠️</span>
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
          <span style={{ fontSize: '16px' }}>📈</span>
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
          <span style={{ fontSize: '16px' }}>🔍</span>
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

// AI Analysis Overview Component
const AIAnalysisOverview = ({ onOpenClinicalWorkflow }) => {
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load AI analysis data
  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      // This will connect to our AI analysis endpoints once implemented
      // For now, simulate loading
      setTimeout(() => {
        setAnalysisData({
          // Placeholder data - will be replaced with real AI analysis
          avgCompleteness: null,
          riskFlags: 0,
          trendsDetected: 0,
          careGaps: 0
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load AI analysis data');
      setLoading(false);
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
        <h3>🧠 AI Clinical Analysis</h3>
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
      <h3>🧠 AI Clinical Analysis</h3>
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
            <span style={{ fontSize: '16px' }}>🚧</span>
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
      </div>

      <div className="last-checked">
        Last analysis: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AIAnalysisOverview;