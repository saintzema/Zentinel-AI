import { Video, Square, Save, FolderOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Recording {
    filename: string;
    path: string;
    size: number;
    created: string;
}

export default function RecordingControls() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState<Recording[]>([]);

    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        try {
            const res = await fetch('/api/v1/recordings');
            const data = await res.json();
            setRecordings(data);
        } catch (err) {
            console.error('Failed to fetch recordings:', err);
        }
    };

    const startRecording = async () => {
        try {
            const res = await fetch('/api/v1/record/start', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'recording_started') {
                setIsRecording(true);
            }
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    const stopRecording = async () => {
        try {
            const res = await fetch('/api/v1/record/stop', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'recording_saved') {
                setIsRecording(false);
                fetchRecordings(); // Refresh recordings list
            }
        } catch (err) {
            console.error('Failed to stop recording:', err);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Video className="text-red-500" />
                    Event Recording
                </h3>
                <div className={`text-xs font-mono px-2 py-1 rounded ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-800 text-slate-400'}`}>
                    {isRecording ? 'RECORDING' : 'STANDBY'}
                </div>
            </div>

            {/* Recording Controls */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
                        isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                >
                    {isRecording ? (
                        <>
                            <Square size={16} />
                            Stop Recording
                        </>
                    ) : (
                        <>
                            <Video size={16} />
                            Start Recording
                        </>
                    )}
                </button>
            </div>

            {/* Recordings List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
                    Saved Recordings ({recordings.length})
                </div>
                
                {recordings.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        <FolderOpen className="mx-auto mb-2 opacity-50" size={24} />
                        <div className="text-sm">No recordings yet</div>
                        <div className="text-xs mt-1">Start recording to save events</div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recordings.map((recording) => (
                            <div key={recording.filename} className="bg-slate-800/50 border border-slate-700 rounded p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="text-sm text-white font-mono">
                                            {recording.filename}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {formatDate(recording.created)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Size: {formatFileSize(recording.size)}
                                        </div>
                                    </div>
                                    <button className="text-emerald-400 hover:text-emerald-300">
                                        <Save size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recording Status */}
            {isRecording && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>Recording in progress...</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        All tracks and events are being captured
                    </div>
                </div>
            )}
        </div>
    );
}
