import React, { useState } from 'react';
import { Copy, Check, Share2, Users } from 'lucide-react';

interface ShareTestModalProps {
    testName: string;
    testId: string;
    onClose: () => void;
}

export const ShareTestModal: React.FC<ShareTestModalProps> = ({ testName, testId, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareLink = `${window.location.origin}?testId=${testId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">

                {/* Background blobs for visual appeal */}
                <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                    <Share2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>

                <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                    Test Published!
                </h3>

                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">"{testName}"</span> is is now live.
                </p>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-800/50 p-2 rounded-full">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Followers Notified</p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400">Your followers have received this test.</p>
                    </div>
                </div>

                <div className="space-y-2 text-left">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Share Link</label>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={shareLink}
                            className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-green-500/20 transition-all font-mono"
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 group"
                            title="Copy Link"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-8 w-full py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Done
                </button>
            </div>
        </div>
    );
};
