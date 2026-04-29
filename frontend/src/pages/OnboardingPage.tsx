import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding } from '../api';
import { Sparkles, GraduationCap, Briefcase, Heart, Rocket, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: 25,
    profession: '',
    education_level: '',
    interests: [] as string[],
    learning_goals: ''
  });
  const navigate = useNavigate();

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitOnboarding(formData);
      navigate('/');
    } catch (err) {
      console.error('Onboarding failed', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const interestOptions = [
    'AI & Machine Learning', 'Software Engineering', 'Data Science', 
    'Design', 'Business & Marketing', 'Psychology', 'History', 'Physics'
  ];

  const educationOptions = [
    'High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Self-taught'
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-500" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-yellow-400 w-6 h-6" />
                <h1 className="text-2xl font-bold text-white">Let's get started</h1>
              </div>
              <p className="text-slate-400">Tell us a bit about yourself so Lumina can adapt to your needs.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">How old are you?</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">What's your profession?</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="e.g. Student, Developer, Designer"
                      value={formData.profession}
                      onChange={e => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="text-purple-400 w-6 h-6" />
                <h1 className="text-2xl font-bold text-white">Background</h1>
              </div>
              <p className="text-slate-400">What's your highest level of education?</p>
              
              <div className="grid grid-cols-1 gap-3">
                {educationOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, education_level: option })}
                    className={clsx(
                      "text-left p-4 rounded-xl border transition-all",
                      formData.education_level === option 
                        ? "bg-purple-500/10 border-purple-500 text-purple-400" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="text-pink-400 w-6 h-6" />
                <h1 className="text-2xl font-bold text-white">Interests</h1>
              </div>
              <p className="text-slate-400">Select topics you're interested in learning about.</p>
              
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={clsx(
                      "px-4 py-2 rounded-full border transition-all text-sm font-medium",
                      formData.interests.includes(interest)
                        ? "bg-pink-500 text-white border-pink-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="text-blue-400 w-6 h-6" />
                <h1 className="text-2xl font-bold text-white">Goals</h1>
              </div>
              <p className="text-slate-400">What are you hoping to achieve with Lumina?</p>
              
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[150px] placeholder-slate-600"
                placeholder="e.g. I want to learn Python to automate my daily tasks..."
                value={formData.learning_goals}
                onChange={e => setFormData({ ...formData, learning_goals: e.target.value })}
              />
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button 
                onClick={nextStep}
                disabled={step === 2 && !formData.education_level}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Learning'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
