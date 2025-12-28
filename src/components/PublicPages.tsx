import React from 'react';
import { Button } from './ui/button';
import { Mail, Shield, FileText, Info } from 'lucide-react';

interface PublicPageProps {
    onBack: () => void;
    onNavigate?: (view: any) => void;
}

const PublicLayout: React.FC<{ title: string; children: React.ReactNode; onBack: () => void; onNavigate?: (v: any) => void }> = ({ title, children, onBack, onNavigate }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
                    <img src="/logo.png" alt="Quizapo AI" className="h-8 w-auto" />
                    <span className="font-bold text-xl text-gray-900">Quizapo AI</span>
                </div>
                <Button variant="outline" onClick={onBack}>Back to App</Button>
            </div>
        </div>
        <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>
                <div className="prose prose-blue max-w-none text-gray-600">
                    {children}
                </div>
            </div>
        </main>
        <footer className="bg-white border-t py-8 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <div className="flex justify-center gap-6 mb-4 text-sm font-medium text-gray-600">
                    <button onClick={() => onNavigate?.('about')} className="hover:text-blue-600">About</button>
                    <button onClick={() => onNavigate?.('team')} className="hover:text-blue-600">Team</button>
                    <button onClick={() => onNavigate?.('contact')} className="hover:text-blue-600">Contact</button>
                    <button onClick={() => onNavigate?.('privacy')} className="hover:text-blue-600">Privacy</button>
                    <button onClick={() => onNavigate?.('terms')} className="hover:text-blue-600">Terms</button>
                </div>
                <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Quizapo AI. All rights reserved.</p>
            </div>
        </footer>
    </div>
);

export const AboutPage: React.FC<PublicPageProps> = ({ onBack, onNavigate }) => (
    <PublicLayout title="About Us" onBack={onBack} onNavigate={onNavigate}>
        <p className="lead">Quizapo AI is an advanced assessment platform designed to revolutionize the way students and faculty interact with educational content.</p>
        <div className="my-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
                <Info className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-bold text-gray-900 mb-1">Our Mission</h3>
                <p className="text-sm">To empower educators with AI-driven tools that simplify assessment creation and analysis.</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
                <Shield className="w-8 h-8 text-indigo-600 mb-2" />
                <h3 className="font-bold text-gray-900 mb-1">Integrity First</h3>
                <p className="text-sm">We prioritize academic honesty with robust proctoring and violation detection features.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
                <FileText className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-bold text-gray-900 mb-1">Detailed Analytics</h3>
                <p className="text-sm">Providing deep insights into student performance to drive better learning outcomes.</p>
            </div>
        </div>
        <p>Founded with a passion for education technology, Quizapo AI combines cutting-edge generative AI models with a user-friendly interface.</p>
        <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => onNavigate?.('team')}>Meet the Team</Button>
        </div>
    </PublicLayout>
);

export const ContactPage: React.FC<PublicPageProps> = ({ onBack, onNavigate }) => (
    <PublicLayout title="Contact Us" onBack={onBack} onNavigate={onNavigate}>
        <p>We'd love to hear from you. For support, feedback, or inquiries, please reach out to us.</p>
        <div className="mt-8 p-6 bg-gray-100 rounded-xl flex items-center gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm">
                <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900">Email Support</h3>
                <p className="text-blue-600 font-medium">support@quizapo.ai</p>
            </div>
        </div>
        <div className="mt-6">
            <h3 className="font-bold mb-2">Office Address</h3>
            <address className="not-italic text-gray-600">
                Quizapo AI HQ<br />
                123 Innovation Drive, Tech Park<br />
                Chennia, Tamil Nadu 600001
            </address>
        </div>
    </PublicLayout>
);

export const PrivacyPage: React.FC<PublicPageProps> = ({ onBack, onNavigate }) => (
    <PublicLayout title="Privacy Policy" onBack={onBack} onNavigate={onNavigate}>
        <p>Last updated: December 17, 2025</p>
        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, create content, or communicate with us.</p>
        <h3>2. How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services, including to process transactions and send you related information.</p>
        <h3>3. Data Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access.</p>
    </PublicLayout>
);

export const TermsPage: React.FC<PublicPageProps> = ({ onBack, onNavigate }) => (
    <PublicLayout title="Terms and Conditions" onBack={onBack} onNavigate={onNavigate}>
        <p>Welcome to Quizapo AI.</p>
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our services.</p>
        <h3>2. Use of Service</h3>
        <p>You agree to use the service only for lawful purposes and in accordance with these Terms.</p>
        <h3>3. Intellectual Property</h3>
        <p>The service and its original content, features, and functionality are and will remain the exclusive property of Quizapo AI.</p>
    </PublicLayout>
);
