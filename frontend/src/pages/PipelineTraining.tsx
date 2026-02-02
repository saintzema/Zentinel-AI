import { ChevronRight, Upload, Play, CheckCircle2, AlertCircle, Info, Database, TrafficCone, ShieldAlert, Shield, Pipette, ListChecks, Settings2, Cloud, ExternalLink, FileCode } from 'lucide-react';
import { useState } from 'react';

interface TrainingCase {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    instructions: string[];
}

const trainingCases: TrainingCase[] = [
    {
        id: 'mall_cctv',
        title: 'Mall Security & Retail',
        description: 'Suspicious activity detection, loitering analysis, and shoplifting prevention.',
        icon: ShieldAlert,
        color: 'text-red-500',
        instructions: [
            'Upload CCTV footage from supermarket aisles.',
            'Maintain view of high-value shelves.',
            'Focus on "dwell time" (loitering) labels.',
            'Include samples of "concealment" vs "normal shopping".'
        ]
    },
    {
        id: 'traffic',
        title: 'Traffic Intelligence',
        description: 'Optimized for vehicle counting, speed detection, and license plate recognition.',
        icon: TrafficCone,
        color: 'text-blue-500',
        instructions: [
            'Upload video from a stationary high-angle camera.',
            'Ensure vehicles are fully visible (no heavy occlusions).',
            'Minimum resolution: 1080p for plate recognition.',
            'Label at least 50 frames of heavy traffic.'
        ]
    },
    {
        id: 'industrial',
        title: 'Industrial Pipeline Monitoring',
        description: 'Specialized in detecting leaks, structural anomalies, and peripheral intrusions.',
        icon: Pipette,
        color: 'text-amber-500',
        instructions: [
            'Use thermographic or high-res IR footage if possible.',
            'Maintain consistent focal length across datasets.',
            'Include samples of normal state vs anomaly state.',
            'Label "intrusion" vs "wildlife" separately.'
        ]
    },
    {
        id: 'perimeter',
        title: 'Home Perimeter',
        icon: Shield,
        description: 'Virtual tripwires & intrusion detection',
        color: 'text-red-400',
        instructions: [
            'Use wide-angle field of view (FOV).',
            'Vary lighting conditions (day, night, overcast).',
            'Focus labels on person attributes (bag, weapon, uniform).',
            'Exclude internal staff based on provided facial hashes.'
        ]
    },
    {
        id: 'security',
        title: 'Perimeter Security',
        description: 'Generalized surveillance for human-pattern detection and abandoned object alerts.',
        icon: ShieldAlert,
        color: 'text-emerald-500',
        instructions: [
            'Use wide-angle field of view (FOV).',
            'Vary lighting conditions (day, night, overcast).',
            'Focus labels on person attributes (bag, weapon, uniform).',
            'Exclude internal staff based on provided facial hashes.'
        ]
    }
];

// Sound Generator for "CIA Computer" effect
const playProcessingSound = () => {
    // Check for AudioContext support
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return () => { };

    const ctx = new AudioContext();
    let isPlaying = true;
    let timeoutId: any = null;

    let beepCount = 0;
    const playBeep = () => {
        if (!isPlaying || ctx.state === 'closed') return;
        if (beepCount >= 4) return; // Stop after 1 "TIRIRI" cycle

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Match "TIRIRI" arpeggio from activation sound
        const i = beepCount % 4;
        beepCount++;

        osc.type = 'square'; // Fast computer-like tone
        const baseFreq = 800;
        osc.frequency.setValueAtTime(baseFreq + (i % 2 === 0 ? 0 : 400) + (i * 100), ctx.currentTime);

        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);

        // Fast "TIRIRI" speed (80ms)
        timeoutId = setTimeout(playBeep, 80);
    };

    playBeep();

    return () => {
        isPlaying = false;
        if (timeoutId) clearTimeout(timeoutId);
        // Gentle close
        setTimeout(() => {
            if (ctx.state !== 'closed') ctx.close();
        }, 100);
    };
};

export default function PipelineTraining() {
    const [activeMode, setActiveMode] = useState<'guided' | 'cloud'>('guided');
    const [step, setStep] = useState(1);
    const [selectedCase, setSelectedCase] = useState<TrainingCase | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);

    const startTraining = async () => {
        setIsTraining(true);
        const stopSound = playProcessingSound(); // Start CIA sound

        // Simulate training progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    stopSound(); // Stop sound
                    setIsTraining(false);
                    setStep(4);
                    return 100;
                }
                return prev + 5;
            });
        }, 500);

        try {
            await fetch('/api/v1/training/label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseId: selectedCase?.id, timestamp: Date.now() })
            });
        } catch (err) {
            console.error('Training submission failed:', err);
        }
    };

    const handleDeploy = async () => {
        if (!selectedCase) return;
        try {
            const res = await fetch(`/api/v1/use-case/switch?use_case=${selectedCase.id}`, {
                method: 'POST'
            });
            if (res.ok) {
                alert(`Engine deployed: ${selectedCase.title} is now active.`);
            }
        } catch (err) {
            console.error('Deployment failed:', err);
        }
    };

    const handleModelUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const stopSound = playProcessingSound();
        try {
            // Simulate upload delay
            await new Promise(r => setTimeout(r, 1500));

            const res = await fetch('/api/v1/models/upload', {
                method: 'POST',
                body: formData
            });

            stopSound();
            if (res.ok) {
                alert("Model Uploaded & Deployed Successfully!");
            } else {
                alert("Upload failed.");
            }
        } catch (e) {
            stopSound();
            console.error(e);
            alert("Error uploading model");
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-slate-950">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Database className="text-emerald-500" />
                        PIPELINE OPTIMIZER_V2
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-mono">
                        Custom Model Synthesis & Dataset Refinement
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button
                        onClick={() => setActiveMode('guided')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeMode === 'guided' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Guided Pipeline
                    </button>
                    <button
                        onClick={() => setActiveMode('cloud')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeMode === 'cloud' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Cloud size={14} /> Cloud Studio
                    </button>
                </div>
            </div>

            {/* CLOUD STUDIO MODE */}
            {activeMode === 'cloud' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                    {/* 1. Google Colab Section */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-700/50 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
                                    <FileCode size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Google Colab Training Notebook</h3>
                                    <p className="text-slate-400 text-sm">Train custom YOLOv8 models using Free T4 GPUs on Google Cloud.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 text-sm text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">1</div>
                                        <p>Open the notebook and connect to a GPU Runtime.</p>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">2</div>
                                        <p>Import your labeled dataset (Roboflow/CVAT format).</p>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">3</div>
                                        <p>Run the training cell and download the <code className="bg-slate-800 px-1 py-0.5 rounded text-orange-400">best.pt</code> file.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center gap-4 border-l border-slate-800 pl-8">
                                    <a
                                        href="https://colab.research.google.com/drive/16jcaJ0aps6_rWe6kFeEP3W5-0-C?usp=sharing"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)]"
                                    >
                                        <ExternalLink size={18} /> Launch Notebook
                                    </a>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">External Link • Google Account Required</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Model Upload Section */}
                    <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-8 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <Upload className="text-blue-500" />
                            Deploy Custom Model
                        </h3>

                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:bg-slate-800/50 transition-all group cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pt, .pth"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    if (e.target.files) handleModelUpload(e.target.files[0]);
                                }}
                            />
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-600">
                                <Database size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Drop 'best.pt' File Here</h4>
                            <p className="text-slate-400 text-sm">Upload your trained YOLOv8 model weights to instanty hot-swap the inference engine.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* GUIDED PIPELINE MODE (Legacy) */}
            {activeMode === 'guided' && (
                <>
                    {/* Stepper HUD */}
                    <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center gap-4 group shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono transition-all ${step === s ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                                    step > s ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-500'
                                    }`}>
                                    {step > s ? <CheckCircle2 size={20} /> : s}
                                </div>
                                <div className="hidden md:block">
                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${step === s ? 'text-white' : 'text-slate-500'}`}>
                                        {s === 1 ? 'Selection' : s === 2 ? 'Analysis' : s === 3 ? 'Synthesis' : 'Deployment'}
                                    </div>
                                </div>
                                {s < 4 && <ChevronRight className="text-slate-800" size={20} />}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-8 backdrop-blur-sm min-h-[400px]">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold text-white mb-2">Select Target Use-Case</h3>
                                <p className="text-slate-400 text-sm mb-8">Choose the operational environment for model optimization.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {trainingCases.map(tc => (
                                        <button
                                            key={tc.id}
                                            onClick={() => setSelectedCase(tc)}
                                            className={`p-6 rounded-xl border text-left transition-all group ${selectedCase?.id === tc.id
                                                ? 'bg-emerald-500/10 border-emerald-500 ring-4 ring-emerald-500/5'
                                                : 'bg-slate-800/20 border-slate-700 hover:border-slate-500'
                                                }`}
                                        >
                                            <tc.icon className={`mb-4 transition-transform group-hover:scale-110 ${selectedCase?.id === tc.id ? tc.color : 'text-slate-500'}`} size={32} />
                                            <div className="text-md font-bold text-white mb-2">{tc.title}</div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{tc.description}</p>
                                            <div className={`text-[10px] font-bold uppercase tracking-tighter ${selectedCase?.id === tc.id ? 'text-emerald-500' : 'text-slate-600'}`}>
                                                {selectedCase?.id === tc.id ? 'Asset Locked' : 'Select Case'}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        disabled={!selectedCase}
                                        onClick={() => setStep(2)}
                                        className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all flex items-center gap-2"
                                    >
                                        Build Dataset <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && selectedCase && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col lg:flex-row gap-12">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                            <ListChecks className="text-emerald-500" />
                                            Labeling Requirements: {selectedCase.title}
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedCase.instructions.map((inst, i) => (
                                                <div key={i} className="flex gap-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                                    <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold font-mono">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed">{inst}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-96">
                                        <div className="relative group/upload">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        // Start sound
                                                        const stopSound = playProcessingSound();

                                                        // Mock upload delay for realism
                                                        const btn = e.target.parentElement?.querySelector('.upload-status') as HTMLElement;
                                                        if (btn) btn.innerText = "UPLOADING: " + file.name + "...";

                                                        setTimeout(() => {
                                                            stopSound(); // Stop sound
                                                            if (btn) btn.innerText = "DATASET INGESTED: " + file.name;
                                                            // Auto-advance after upload
                                                            setTimeout(() => setStep(3), 1000);
                                                        }, 1500);
                                                    }
                                                }}
                                            />
                                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4 group-hover/upload:scale-110 group-hover/upload:bg-emerald-500 group-hover/upload:text-white transition-all">
                                                <Upload size={24} />
                                            </div>
                                            <h4 className="text-sm font-bold text-white mb-2 upload-status">Ingest Training Data</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-4">MP4, AVI, JPEG_STREAM (MAX 500MB)</p>
                                            <button className="text-[10px] font-bold text-emerald-500 uppercase underline tracking-widest">Browse Local Storage</button>
                                        </div>
                                        <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                            <div className="flex gap-3 text-amber-500 mb-2">
                                                <Info size={16} />
                                                <span className="text-[10px] font-bold uppercase">Data Compliance</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">By uploading, you confirm that PII masking is enabled per GDPR/Sovereign law.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-between">
                                    <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Back</button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all"
                                    >
                                        Initiate Synthesis
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-700">
                                <div className="relative mb-12">
                                    <div className="w-48 h-48 rounded-full border-4 border-slate-800 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                                        <div className="flex flex-col items-center">
                                            <Settings2 className="text-emerald-500 mb-2 animate-pulse" size={48} />
                                            <div className="text-2xl font-mono text-white">{progress}%</div>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">AI Neural Synthesis in Progress</h3>
                                <p className="text-slate-500 text-sm mb-12 font-mono uppercase tracking-widest">Optimizing Weights for {selectedCase?.title}...</p>

                                {!isTraining && progress === 0 ? (
                                    <button
                                        onClick={startTraining}
                                        className="px-12 py-4 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-3 transition-active active:scale-95"
                                    >
                                        <Play size={20} /> Launch Optimizer
                                    </button>
                                ) : (
                                    <div className="w-full max-w-md space-y-4">
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                            <span>BATCH: 08/12</span>
                                            <span>ACCURACY: 0.942</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-1000">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Synthesis Complete</h3>
                                <p className="text-slate-400 max-w-sm mb-10 leading-relaxed">The model has been optimized and is ready for edge deployment. Weights are synchronized across your decentralized network.</p>

                                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                    <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1">Model Precision</div>
                                        <div className="text-lg font-mono text-emerald-400">98.4%</div>
                                    </div>
                                    <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                        <div className="text-[10px] text-slate-500 uppercase mb-1">Latency (Edge)</div>
                                        <div className="text-lg font-mono text-blue-400">12ms</div>
                                    </div>
                                </div>

                                <div className="mt-12 flex gap-4">
                                    <button onClick={() => setStep(1)} className="px-8 py-3 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Restart</button>
                                    <button
                                        onClick={handleDeploy}
                                        className="px-8 py-3 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                                    >
                                        Deploy to Edge
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Warning HUD */}
                    <div className="mt-10 p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex gap-4 items-center">
                        <AlertCircle className="text-red-500" size={24} />
                        <div>
                            <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Operational Advisory</h4>
                            <p className="text-[10px] text-slate-500 italic">Models trained on low-light datasets may require active IR illumination for nighttime precision above 90%.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
