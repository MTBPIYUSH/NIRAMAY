import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  TrendingUp,
  Shield,
  Zap,
  Users,
  FileText,
  Award,
  ShoppingBag,
  Bell,
  Activity
} from 'lucide-react';
import { runHealthCheck } from '../lib/databaseAnalysis';
import { runDataIntegrityCheck as runIntegrityCheck, IntegrityCheckResult, autoFixIntegrityIssues } from '../lib/dataIntegrityService';

interface DatabaseHealthDashboardProps {
  onClose: () => void;
}

export const DatabaseHealthDashboard: React.FC<DatabaseHealthDashboardProps> = ({ onClose }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [integrityResults, setIntegrityResults] = useState<IntegrityCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'integrity' | 'performance' | 'security'>('overview');
  const [autoFixing, setAutoFixing] = useState(false);

  useEffect(() => {
    runHealthAnalysis();
  }, []);

  const runHealthAnalysis = async () => {
    setLoading(true);
    try {
      const [health, integrity] = await Promise.all([
        runHealthCheck(),
        runIntegrityCheck()
      ]);
      
      setHealthData(health);
      setIntegrityResults(integrity);
    } catch (error) {
      console.error('Error running health analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async () => {
    setAutoFixing(true);
    try {
      const fixResults = await autoFixIntegrityIssues(integrityResults);
      console.log('Auto-fix results:', fixResults);
      
      // Re-run integrity check after fixes
      const updatedIntegrity = await runIntegrityCheck();
      setIntegrityResults(updatedIntegrity);
    } catch (error) {
      console.error('Error during auto-fix:', error);
    } finally {
      setAutoFixing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalIssues = integrityResults.reduce((sum, result) => sum + result.issuesFound, 0);
  const criticalIssues = integrityResults.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.severity === 'critical').length, 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Database size={32} className="mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Database Health Dashboard</h2>
                <p className="text-blue-100">Comprehensive system analysis and monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={runHealthAnalysis}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'integrity', label: 'Data Integrity', icon: Shield },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'security', label: 'Security', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Running comprehensive analysis...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && healthData && (
                <div className="space-y-6">
                  {/* Overall Health Status */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Overall System Health</h3>
                        <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${getHealthColor(healthData.overallHealth)}`}>
                          {healthData.overallHealth === 'excellent' && <CheckCircle size={16} className="mr-2" />}
                          {healthData.overallHealth === 'critical' && <XCircle size={16} className="mr-2" />}
                          {!['excellent', 'critical'].includes(healthData.overallHealth) && <AlertTriangle size={16} className="mr-2" />}
                          {healthData.overallHealth.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Last Check</div>
                        <div className="font-semibold">{new Date(healthData.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-800">{healthData.analysis.tables.length}</div>
                          <div className="text-sm text-gray-600">Tables</div>
                        </div>
                        <Database className="text-blue-600" size={24} />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-800">{totalIssues}</div>
                          <div className="text-sm text-gray-600">Total Issues</div>
                        </div>
                        <AlertTriangle className="text-yellow-600" size={24} />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
                          <div className="text-sm text-gray-600">Critical Issues</div>
                        </div>
                        <XCircle className="text-red-600" size={24} />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {Object.values(healthData.functionality).filter((f: any) => f.success).length}
                          </div>
                          <div className="text-sm text-gray-600">Working Features</div>
                        </div>
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Functionality Status */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Feature Status</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(healthData.functionality).map(([feature, status]: [string, any]) => (
                        <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {feature === 'authentication' && <Users size={16} className="mr-2 text-blue-600" />}
                            {feature === 'reporting' && <FileText size={16} className="mr-2 text-green-600" />}
                            {feature === 'assignments' && <Settings size={16} className="mr-2 text-orange-600" />}
                            {feature === 'rewards' && <Award size={16} className="mr-2 text-yellow-600" />}
                            {feature === 'ecoStore' && <ShoppingBag size={16} className="mr-2 text-purple-600" />}
                            {feature === 'notifications' && <Bell size={16} className="mr-2 text-indigo-600" />}
                            <span className="font-medium capitalize">{feature}</span>
                          </div>
                          {status.success ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <XCircle size={16} className="text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Integrity Tab */}
              {activeTab === 'integrity' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Data Integrity Analysis</h3>
                    <button
                      onClick={handleAutoFix}
                      disabled={autoFixing || totalIssues === 0}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {autoFixing ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Fixing Issues...
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="mr-2" />
                          Auto-Fix Issues
                        </>
                      )}
                    </button>
                  </div>

                  {integrityResults.map(result => (
                    <div key={result.table} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 capitalize">
                          {result.table.replace('_', ' ')} Table
                        </h4>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {result.recordsChecked} records checked
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            result.issuesFound === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.issuesFound} issues
                          </span>
                        </div>
                      </div>

                      {result.issues.length > 0 ? (
                        <div className="space-y-3">
                          {result.issues.map((issue, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity.toUpperCase()}
                                  </span>
                                  <span className="ml-3 font-medium text-gray-800">{issue.type.replace('_', ' ')}</span>
                                </div>
                                <span className="text-xs text-gray-500">ID: {issue.recordId}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{issue.description}</p>
                              <p className="text-sm text-blue-600">💡 {issue.suggestedFix}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-green-600">
                          <CheckCircle size={24} className="mx-auto mb-2" />
                          <span className="font-medium">No integrity issues found</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && healthData && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Performance Analysis</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Database Indexes</h4>
                      <div className="space-y-3">
                        {healthData.analysis.indexes.map((index: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{index.name}</div>
                              <div className="text-sm text-gray-600">{index.tableName} ({index.columns.join(', ')})</div>
                            </div>
                            <CheckCircle size={16} className="text-green-600" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h4>
                      <div className="space-y-3">
                        {healthData.analysis.recommendations.slice(0, 5).map((rec: string, i: number) => (
                          <div key={i} className="flex items-start p-3 bg-blue-50 rounded-lg">
                            <TrendingUp size={16} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-blue-800">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && healthData && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Security Analysis</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">RLS Policies</h4>
                      <div className="space-y-3">
                        {healthData.analysis.policies.map((policy: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{policy.policyName}</div>
                              <div className="text-sm text-gray-600">{policy.tableName} - {policy.command}</div>
                            </div>
                            {policy.isValid ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <XCircle size={16} className="text-red-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Security Issues</h4>
                      <div className="space-y-3">
                        {healthData.analysis.issues
                          .filter((issue: any) => issue.category === 'security')
                          .map((issue: any, i: number) => (
                            <div key={i} className="p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                  {issue.severity.toUpperCase()}
                                </span>
                                <span className="ml-2 font-medium text-red-800">{issue.description}</span>
                              </div>
                              <p className="text-sm text-red-600">💡 {issue.recommendation}</p>
                            </div>
                          ))}
                        {healthData.analysis.issues.filter((issue: any) => issue.category === 'security').length === 0 && (
                          <div className="text-center py-4 text-green-600">
                            <Shield size={24} className="mx-auto mb-2" />
                            <span className="font-medium">No security issues detected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};