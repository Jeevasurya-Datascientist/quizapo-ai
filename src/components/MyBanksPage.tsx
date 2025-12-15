import React, { useState, useEffect } from 'react';
import {
    Plus, Search, MoreVertical, Edit2, Trash2,
    FileText, Calendar, Database, Play
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { QuestionBank, AppUser } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface MyBanksPageProps {
    currentUser: AppUser;
    onNavigate: (view: any, bankId?: string) => void;
    onCreateTest: (bank: QuestionBank) => void;
}

export const MyBanksPage: React.FC<MyBanksPageProps> = ({ currentUser, onNavigate, onCreateTest }) => {
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBanks();
    }, [currentUser]);

    const fetchBanks = async () => {
        try {
            const q = query(
                collection(db, "questionBanks"),
                where("facultyId", "==", currentUser.id)
                // orderBy("createdAt", "desc") // Requires index, skipping for now to avoid error
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => d.data() as QuestionBank);
            // Client-side sort to avoid index needed error during dev
            data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setBanks(data);
        } catch (err) {
            console.error("Error fetching banks:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question bank? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "questionBanks", id));
            setBanks(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error("Error deleting bank:", err);
            alert("Failed to delete.");
        }
    };

    const filteredBanks = banks.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Question Banks
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your generated content and create tests.
                    </p>
                </div>
                <Button
                    onClick={() => onNavigate('createBank')}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Bank
                </Button>
            </div>

            {/* --- SEARCH --- */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search your banks..."
                    className="pl-9 bg-white dark:bg-zinc-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* --- GRID --- */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : filteredBanks.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Database className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Question Banks Found</h3>
                    <p className="text-sm text-muted-foreground mb-6">Generated questions will appear here.</p>
                    <Button variant="outline" onClick={() => onNavigate('createBank')}>Create your first one</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBanks.map((bank) => (
                        <Card key={bank.id} className="group hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">
                                            {bank.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <Calendar className="w-3 h-3" /> {new Date(bank.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onNavigate('editBank', bank.id)}>
                                                <Edit2 className="w-4 h-4 mr-2" /> Edit Questions
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCreateTest(bank)}>
                                                <Play className="w-4 h-4 mr-2" /> Create Test
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(bank.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                        {bank.description || "No description provided."}
                                    </p>
                                    <div className="flex items-center justify-between pt-2">
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                                            {bank.questions.length} Questions
                                        </Badge>
                                        <Button size="sm" variant="outline" className="text-xs" onClick={() => onNavigate('editBank', bank.id)}>
                                            View Bank
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
