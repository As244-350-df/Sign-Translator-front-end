import { useState } from "react";
import { X, CheckCircle2, ChevronRight, ChevronLeft, Hand, Eye, Move, Sparkles, BookOpen } from "lucide-react";
const SignKeyboardTutorialModal = ({
  isOpen,
  onClose,
  settings
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  if (!isOpen) return null;
  const steps = [
    {
      title: "1. Handshape (DEZ - Designator)",
      icon: Hand,
      subtitle: "The precise geometric configuration of the fingers and thumb.",
      content: 'In sign languages like ASL & BSL, minor differences in finger curvature (like the difference between an "A" fist and an "S" fist) completely alter the meaning of a word. Always maintain relaxed, steady knuckle joints without excessive muscle tension.',
      tip: "Practice holding your hand in front of your chest within a comfortable 12-inch signing window.",
      example: 'Example: "Sorry" uses an A-handshape fist rubbed on the chest, while "Please" uses a flat open palm in the exact same location.'
    },
    {
      title: "2. Palm Orientation (TAB - Tabula)",
      icon: Eye,
      subtitle: "Which direction your palm faces relative to your body or the viewer.",
      content: "A sign may face inward toward your body, outward toward the conversation partner, upward toward the sky, or downward toward the ground. For example, numbers 1-5 face palm-inward for counting in ASL, but palm-outward when communicating phone numbers or addresses.",
      tip: "Never tilt your wrist at uncomfortable strain angles\u2014keep forearm and wrist aligned naturally.",
      example: 'Example: "Mine" (flat hand pressed inward against chest) vs "Yours" (flat hand pushed outward toward the other person).'
    },
    {
      title: "3. Location & Spatial Anchor (SIG - Signation)",
      icon: Move,
      subtitle: "Where the sign is executed on or near the body.",
      content: 'The "signing space" extends from the top of your head to your waist, and approximately one foot out in front. Male-related signs (father, grandfather, boy) typically occur near the forehead/upper face, while female-related signs (mother, grandmother, girl) anchor near the chin and lower cheek.',
      tip: "Do not sign too far to the left or right of your shoulders, as it forces the viewer\u2019s peripheral vision to strain.",
      example: 'Example: "Father" (thumb at forehead) vs "Mother" (thumb at chin).'
    },
    {
      title: "4. Kinetic Movement & Repetition",
      icon: Sparkles,
      subtitle: "The path, speed, and repetition of the sign motion.",
      content: "Movement distinguishes nouns from verbs in sign language. In ASL, nouns typically use a double, smaller bounce motion, whereas verbs use a single, smooth, continuous stroke.",
      tip: "Speed matters: Sharp, fast movements convey intensity or urgency, while slow, elongated motions convey calmness or duration.",
      example: 'Example: "Chair" (noun: double tap downward) vs "Sit" (verb: single downward placement).'
    },
    {
      title: "5. Non-Manual Signals (NMS) & Facial Grammars",
      icon: Eye,
      subtitle: "Facial expressions, head tilts, and eyebrow position that constitute grammar.",
      content: "Facial expressions in sign language are not optional emotion modifiers\u2014they are strict grammatical punctuation! Raised eyebrows denote Yes/No questions, while lowered/furrowed eyebrows denote Wh-questions (Who, What, Where, When, Why).",
      tip: "Remember to look at the signer\u2019s face and chest area, rather than fixating solely on their hands.",
      example: 'Example: Signing "Understand" with a head nod means "I understand", but signing it with a head shake means "I don\u2019t understand".'
    }
  ];
  const current = steps[currentStep];
  const Icon = current.icon;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {
    /* Close Button */
  }
        <button
    onClick={onClose}
    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  >
          <X className="w-5 h-5" />
        </button>

        {
    /* Step Header Badge */
  }
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Sign Language Linguistics Guide • Step {currentStep + 1} of {steps.length}</span>
        </div>

        {
    /* Icon & Title */
  }
        <div className="flex items-center space-x-4 my-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {current.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {current.subtitle}
            </p>
          </div>
        </div>

        {
    /* Content Body */
  }
        <div className="space-y-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {current.content}
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
            <span className="font-bold block mb-1">💡 Professional Signing Tip:</span>
            <span>{current.tip}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
            {current.example}
          </div>
        </div>

        {
    /* Pagination Dots & Navigation Footer */
  }
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5">
            {steps.map((_, idx) => <span
    key={idx}
    onClick={() => setCurrentStep(idx)}
    className={`h-2 rounded-full cursor-pointer transition-all ${currentStep === idx ? "w-6 bg-indigo-600 dark:bg-indigo-400" : "w-2 bg-slate-300 dark:bg-slate-700"}`}
  />)}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 0 && <button
    onClick={() => setCurrentStep((prev) => prev - 1)}
    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
  >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>}

            {currentStep < steps.length - 1 ? <button
    onClick={() => setCurrentStep((prev) => prev + 1)}
    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-xs"
  >
                <span>Next Rule</span>
                <ChevronRight className="w-4 h-4" />
              </button> : <button
    onClick={onClose}
    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-xs"
  >
                <CheckCircle2 className="w-4 h-4" />
                <span>Got It, Start Practice</span>
              </button>}
          </div>
        </div>

      </div>
    </div>;
};
export {
  SignKeyboardTutorialModal
};
