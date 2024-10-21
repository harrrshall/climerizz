'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, ChevronRight, ChevronDown, X, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AWS from 'aws-sdk';


interface FileType {
  name: string;
  type: string;
  s3Key?: string;
  file?: File;
}

interface AnalysisResults {
  compliantStandards: string[];
  nonCompliantStandards: string[];
  safeguards: SafeguardDetail[];
  recommendations: string[];
}

interface SafeguardDetail {
  name: string;
  score: number;
  analysis: string;
  justification: string;
  positiveFindings: string[];
  negativeFindings: string[];
}

interface SafeguardValue {
  Percentage?: string;
  score?: number;
  Analysis?: string;
  analysis?: string;
  Justification?: string;
  justification?: string;
  List_Specific_Findings?: {
    Positive: string | string[];
    Negative: string[];
  };
  list_specific_findings?: {
    Positive: string | string[];
    Negative: string[];
  };
}

const DocumentAnalysis = () => {
  const [files, setFiles] = useState<FileType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSafeguards, setExpandedSafeguards] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);



  AWS.config.update({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_AWS_REGION
  });
  const s3 = new AWS.S3({
    params: { Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    const validFiles = uploadedFiles.filter(file => file.type === 'application/pdf');

    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    const useS3 = totalSize > 4 * 1024 * 1024; // Check if total size > 4MB
    if (useS3) {
      setIsUploading(true);
    }
    const processedFiles = await Promise.all(validFiles.map(async file => {
      if (useS3) {
        const uploadResult = await uploadToS3(file);
        return { name: file.name, type: file.type, s3Key: uploadResult.Key };
      } else {
        return { name: file.name, type: file.type, file: file };
      }
    }));
    setIsUploading(false);
    setFiles([...files, ...processedFiles]);
    setShowResults(false);
    setAnalysisComplete(false);
    setResults(null);
  };

  const uploadToS3 = async (file: File) => {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: `uploads/${Date.now()}-${file.name}`,
      Body: file
    };

    try {
      const result = await s3.upload(params).promise();
      return result;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const toggleSafeguardExpansion = (safeguardName: string) => {
    setExpandedSafeguards(prev =>
      prev.includes(safeguardName)
        ? prev.filter(name => name !== safeguardName)
        : [...prev, safeguardName]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const startAnalysis = async () => {
    console.log('Starting analysis');
    setIsAnalyzing(true);
    setShowResults(false);

    if (files.length === 0 || !selectedStandard) {
      console.error('No files to analyze or standard not selected');
      setIsAnalyzing(false);
      toast.error('No files to analyze or standard not selected');
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file: FileType) => {
        if (file.s3Key) {
          formData.append('s3Keys', file.s3Key);
        } else if (file.file) {
          formData.append('files', file.file);
        }
      });
      formData.append('standard', selectedStandard);

      const response = await fetch('/api/generate_report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }

      const fileHash = response.headers.get('X-File-Hash');
      const cacheHit = response.headers.get('X-Cache-Hit');

      const responseData = await response.json();
      console.log('Response data:', responseData);

      const transformedResults = transformResults(responseData);

      setResults(transformedResults);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      setShowResults(true);

      // Only cache if it wasn't a cache hit
      if (cacheHit === 'false' && fileHash) {
        await fetch('/api/cache-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileHash, response: JSON.stringify(responseData) }),
        });
      }

    } catch (error) {
      console.error('Error during analysis:', error);
      setIsAnalyzing(false);
      toast.error(`Something went wrong, please try again`);
    }
  };

  const transformResults = (rawResults: Record<string, SafeguardValue>): AnalysisResults => {
    console.log('Transforming raw results:', rawResults);
    const transformedResults: AnalysisResults = {
      compliantStandards: [],
      nonCompliantStandards: [],
      recommendations: [],
      safeguards: []
    };

    const processSafeguard = (key: string, value: SafeguardValue): SafeguardDetail | null => {
      if (typeof value !== 'object' || value === null) {
        console.warn(`Invalid safeguard data for ${key}:`, value);
        return null;
      }

      const safeguard: SafeguardDetail = {
        name: key.replace(/_/g, ' '),
        score: typeof value.Percentage === 'string' ? parseInt(value.Percentage) :
          typeof value.score === 'number' ? value.score : 0,
        analysis: value.Analysis || value.analysis || '',
        justification: value.Justification || value.justification || '',
        positiveFindings: [],
        negativeFindings: []
      };

      const findings = value.List_Specific_Findings || value.list_specific_findings;
      if (findings && typeof findings === 'object') {
        safeguard.positiveFindings = Array.isArray(findings.Positive)
          ? findings.Positive.filter(Boolean)
          : findings.Positive ? [findings.Positive] : [];
        safeguard.negativeFindings = Array.isArray(findings.Negative)
          ? findings.Negative.filter(Boolean)
          : findings.Negative ? [findings.Negative] : [];
      }

      return safeguard;
    };

    if (typeof rawResults === 'object' && rawResults !== null) {
      if (Array.isArray(rawResults)) {
        transformedResults.safeguards = rawResults
          .map(item => processSafeguard(item.name || 'Unknown', item))
          .filter((safeguard): safeguard is SafeguardDetail => safeguard !== null);
      } else if ('safeguards' in rawResults && Array.isArray(rawResults.safeguards)) {
        transformedResults.safeguards = rawResults.safeguards
          .map(item => processSafeguard(item.name || 'Unknown', item))
          .filter((safeguard): safeguard is SafeguardDetail => safeguard !== null);
      } else {
        transformedResults.safeguards = Object.entries(rawResults)
          .map(([key, value]) => processSafeguard(key, value))
          .filter((safeguard): safeguard is SafeguardDetail => safeguard !== null);
      }

      transformedResults.safeguards = transformedResults.safeguards.filter(safeguard =>
        safeguard.analysis ||
        safeguard.justification ||
        safeguard.positiveFindings.length > 0 ||
        safeguard.negativeFindings.length > 0
      );

      transformedResults.compliantStandards = transformedResults.safeguards
        .filter(safeguard => safeguard.score >= 80)
        .map(safeguard => safeguard.name);
      transformedResults.nonCompliantStandards = transformedResults.safeguards
        .filter(safeguard => safeguard.score < 80)
        .map(safeguard => safeguard.name);
    }

    return transformedResults;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
      <header className="fixed top-0 left-0 right-0 bg-white z-50 transition-all duration-300 shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">C</span>
              </div>
              <span className="font-extrabold text-3xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                climerizz
              </span>
            </Link>

            <Link href="/">
              <Button
                className="hidden md:flex bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-full px-6 py-2"
              >Home
              </Button>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white shadow-lg"
            >
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 font-semibold mb-4">
            Document Analysis
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Analyze Your Project&apos;s{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Social Safeguards
              </span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200 opacity-30 z-0"></span>
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your project documents and receive an instant analysis of compliance with social and environmental safeguards.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <Upload className="h-6 w-6" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="group cursor-pointer block"
                  >
                    <div className="relative border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-12 transition-all duration-300 group-hover:border-emerald-400 group-hover:bg-emerald-50">
                      <div className="text-center">
                        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse group-hover:bg-emerald-200"></div>
                          <Upload className="relative h-10 w-10 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-emerald-700 mb-2 group-hover:text-emerald-800">
                          Drop your documents here
                        </h3>
                        <p className="text-emerald-600/80">
                          or <span className="underline font-medium">browse</span> to choose files
                        </p>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0">
                        <div className="flex items-center justify-center gap-4 text-sm text-emerald-600/70">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>PDF</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Choose your project standard for analysis:
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="standard"
                        value="Verra"
                        checked={selectedStandard === 'Verra'}
                        onChange={(e) => setSelectedStandard(e.target.value)}
                      />
                      <span className="ml-2">Verra</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="standard"
                        value="Gold_Standard"
                        checked={selectedStandard === 'Gold_Standard'}
                        onChange={(e) => setSelectedStandard(e.target.value)}
                      />
                      <span className="ml-2">Gold Standard</span>
                    </label>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">{file.name}</span>
                            <p className="text-sm text-gray-500">
                              {file.type === 'application/pdf' ? 'PDF Document' : 'Word Document'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-300"
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={startAnalysis}
                  disabled={files.length === 0 || !selectedStandard || isAnalyzing || isUploading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading Files...</span>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Analyzing Documents...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Start Analysis</span>
                    </div>
                  )}
                </Button>

              </div>
            </CardContent>
          </Card>

          {showResults && (
            <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <CheckCircle className="h-6 w-6" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {!analysisComplete && (
                  <div className="text-center text-gray-500 py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg">Upload your documents to see the analysis results</p>
                  </div>
                )}

                {analysisComplete && results && (
                  <div className="space-y-6">
                    {results.safeguards.map((safeguard) => (
                      <div key={safeguard.name} className="border rounded-lg p-4">
                        <button
                          onClick={() => toggleSafeguardExpansion(safeguard.name)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSafeguards.includes(safeguard.name) ?
                              <ChevronDown className="h-5 w-5" /> :
                              <ChevronRight className="h-5 w-5" />
                            }
                            <span className="font-medium">{safeguard.name}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full ${getScoreColor(safeguard.score)}`}>
                            {safeguard.score}%
                          </span>
                        </button>

                        {expandedSafeguards.includes(safeguard.name) && (
                          <div className="mt-4 pl-6 space-y-4">
                            <div>
                              <h4 className="font-semibold">Analysis</h4>
                              <p>{safeguard.analysis}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold">Justification</h4>
                              <p>{safeguard.justification}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold">Positive Findings</h4>
                              <ul className="list-disc pl-5">
                                {safeguard.positiveFindings.map((finding, index) => (
                                  <li key={index}>{finding}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold">Negative Findings</h4>
                              <ul className="list-disc pl-5">
                                {safeguard.negativeFindings.map((finding, index) => (
                                  <li key={index}>{finding}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default DocumentAnalysis;
