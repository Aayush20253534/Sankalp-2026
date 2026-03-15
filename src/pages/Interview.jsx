import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  MessageSquare,
  Mic,
  MicOff,
  VideoOff,
  Send,
  Sparkles,
  Clock,
  ChevronRight,
  Lightbulb,
  MoreVertical,
  RotateCcw
} from 'lucide-react';

import Sidebar from '../components/sidebar';
import Header from '../components/header';

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: "bg-white/10 text-slate-300",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl ${className}`}>
    {children}
  </div>
);

const WebcamPreview = ({ videoStreamRef, startRecording }) => {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  useEffect(() => {
    let stream = null;

    if (isCameraOn || isMicOn) {
      navigator.mediaDevices.getUserMedia({ video: isCameraOn, audio: isMicOn })
        .then(s => {
          stream = s
          videoStreamRef.current = s
          if (videoRef.current) videoRef.current.srcObject = s

          startRecording()
        })
        .catch(err => console.error("Media error:", err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn, isMicOn]);

  return (
    <GlassCard className="relative overflow-hidden aspect-video bg-black flex items-center justify-center">
      {isCameraOn ? (
        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <VideoOff size={48} strokeWidth={1.5} />
          <span className="text-sm">Camera is off</span>
        </div>
      )}

      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <motion.div
          animate={{ opacity: isCameraOn ? [1, 0.5, 1] : 0.2 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-red-500' : 'bg-slate-500'}`}
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
          {isCameraOn ? 'Live Recording' : 'Paused'}
        </span>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        <button
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`p-3 rounded-full transition-all ${isCameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-400'}`}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-400'}`}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
      </div>
    </GlassCard>
  );
};
const AnalysisDisplay = ({ analysis }) => {

  const lines = analysis.split("\n")

  const scoreLine = lines.find(line => line.toLowerCase().includes("score"))
  const otherLines = lines.filter(line => !line.toLowerCase().includes("score"))

  return (
    <div className="space-y-3">

      {scoreLine && (
        <div className="text-3xl font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg inline-block">
          {scoreLine}
        </div>
      )}

      <div className="text-xs text-slate-300 whitespace-pre-wrap">
        {otherLines.join("\n")}
      </div>

    </div>
  )
}

export default function InterviewSimulator() {

  const [mode, setMode] = useState('video');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [answer, setAnswer] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [videoFeedback, setVideoFeedback] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [nextQuestionNumber, setNextQuestionNumber] = useState(null);
  const [nextDifficulty, setNextDifficulty] = useState("")
  const [nextQuestion, setNextQuestion] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const mediaRecorderRef = useRef(null)
  const [interviewFinished, setInterviewFinished] = useState(false)
  const recordedChunks = useRef([])
  const videoStreamRef = useRef(null)
  const startRecording = () => {

    if (!videoStreamRef.current) return

    const recorder = new MediaRecorder(videoStreamRef.current)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data)
      }
    }

    recorder.start()
  }
  const startInterview = async () => {

    const res = await fetch("http://localhost:8000/interview/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "Frontend Engineer",
        difficulty: "Medium"
      })
    })

    const data = await res.json()

    setSessionId(data.session_id)
    setQuestion(data.question)
    setDifficulty(data.difficulty)
    setQuestionNumber(data.question_number)

  }
  useEffect(() => {
    startInterview()
  }, [])
  const submitAnswer = async () => {
    await new Promise(resolve => {
      mediaRecorderRef.current.onstop = resolve
      mediaRecorderRef.current.stop()
    })

    const videoBlob = new Blob(recordedChunks.current, { type: "video/webm" })
    recordedChunks.current = []

    setIsAnalyzing(true)

    const formData = new FormData()
    formData.append("session_id", sessionId)
    formData.append("answer", answer)
    formData.append("video", videoBlob, "recording.webm")

    const res = await fetch("http://localhost:8000/interview/submit", {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    setAnalysis(data.analysis)
    setVideoFeedback(data.video_feedback)

    setNextQuestion(data.next_question)
    setNextQuestionNumber(data.question_number)
    setNextDifficulty(data.difficulty)

    setIsAnalyzing(false)
    setShowNextButton(true)
  }
  const goToNextQuestion = () => {

    if (!nextQuestion) return

    // stop interview at 8 questions
    if (questionNumber >= 8) {
      setInterviewFinished(true)
      return
    }

    setQuestion(nextQuestion)
    setQuestionNumber(nextQuestionNumber)
    setDifficulty(nextDifficulty)

    setAnswer("")
    setAnalysis(null)
    setVideoFeedback(null)
    setShowNextButton(false)

    startRecording()
  }



  return (
    <div className="flex min-h-screen bg-[#050b14] text-slate-200 font-sans">

      <Sidebar />

      <main
        style={{ marginLeft: "var(--sidebar-width)" }}
        className="flex-1 flex flex-col"
      >


        <div className="p-8 flex-1 overflow-y-auto">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">AI Interview Simulator</h1>
              <p className="text-slate-400 text-sm">Real-time technical assessment environment.</p>
            </div>

            <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/5">
              {['video', 'text'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {m === 'video' ? <Video size={16} /> : <MessageSquare size={16} />} {m} Mode
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'video' ? (
              <motion.div
                key="video-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-12 gap-6"
              >

                <div className="col-span-4 flex flex-col gap-6">
                  <WebcamPreview
                    videoStreamRef={videoStreamRef}
                    startRecording={startRecording}
                  />
                  <GlassCard className="p-5 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4 text-slate-300 font-medium text-sm">
                      <Lightbulb size={16} className="text-amber-400" />
                      AI Coaching
                    </div>
                    <ul className="space-y-4 text-xs text-slate-400 leading-relaxed">
                      {videoFeedback ? (
                        videoFeedback
                          .split("\n")
                          .map(line => line.trim())
                          .filter(line => line.length > 0)
                          .map((line, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="text-emerald-400 font-mono">{String(i + 1).padStart(2, '0')}.</span>
                              {line}
                            </li>
                          ))
                      ) : (
                        <li className="flex gap-3">
                          <span className="text-emerald-400 font-mono">01.</span>
                          AI will analyze your body language after submission.
                        </li>
                      )}
                    </ul>
                  </GlassCard>
                </div>

                <div className="col-span-5 flex flex-col gap-6">
                  <GlassCard className="p-6 relative">
                    <div className="absolute top-6 right-6">
                      <Badge
                        variant={
                          difficulty === "Easy"
                            ? "success"
                            : difficulty === "Medium"
                              ? "warning"
                              : "default"
                        }
                      >
                        {difficulty}
                      </Badge>
                    </div>
                    <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.2em] mb-2 block">Question {questionNumber}/08</span>
                    <h2 className="text-lg font-medium text-white leading-snug pr-16">
                      {question || "Loading interview question..."}
                    </h2>
                    <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500 border-t border-white/5 pt-4">
                      <span className="flex items-center gap-1"><Clock size={12} /> 01:45</span>
                      <span className="flex items-center gap-1"><RotateCcw size={12} /> 1 Retake Left</span>
                    </div>
                  </GlassCard>

                  <GlassCard className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transcribed Answer</span>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-500/80">Listening...</span>
                      </div>
                    </div>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="flex-1 bg-transparent p-6 outline-none resize-none text-sm leading-relaxed text-slate-300 placeholder:text-slate-600"
                      placeholder="Your speech will appear here, or you can type to refine..."
                    />
                    <div className="p-4 bg-white/[0.02] border-t border-white/5">

                      {isAnalyzing ? (

                        <div className="flex items-center justify-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <Sparkles size={16} className="text-emerald-400 animate-spin" />
                          <span className="text-xs font-medium text-emerald-400">
                            Analyzing response...
                          </span>
                        </div>

                      ) : showNextButton ? (

                        interviewFinished ? (

                          <div className="w-full py-3 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl text-center border border-emerald-500/30">
                            Interview Completed 🎉
                          </div>

                        ) : (

                          <button
                            onClick={goToNextQuestion}
                            className="w-full py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                          >
                            Next Question <ChevronRight size={16} />
                          </button>

                        )

                      ) : (

                        <button
                          onClick={submitAnswer}
                          disabled={!sessionId || questionNumber > 8}
                          className="w-full py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          Submit Answer <ChevronRight size={16} />
                        </button>


                      )}

                    </div>

                    {analysis && (
                      <div className="p-4 mt-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300">
                        {analysis && (
                          <AnalysisDisplay analysis={analysis} />
                        )}
                      </div>
                    )}
                  </GlassCard>
                </div>

                <div className="col-span-3">
                  <GlassCard className="h-full flex flex-col">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Scratchpad</span>
                      <button className="text-slate-500 hover:text-white"><MoreVertical size={16} /></button>
                    </div>
                    <textarea
                      className="flex-1 bg-transparent p-5 outline-none resize-none text-xs leading-relaxed text-slate-400 placeholder:text-slate-600"
                      placeholder="Sketch out your logic here..."
                    />
                  </GlassCard>
                </div>
              </motion.div>
            ) : (

              <motion.div
                key="text-mode"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-12 gap-6"
              >
                <div className="col-span-8 flex flex-col gap-4 overflow-hidden">
                  <GlassCard className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Sparkles size={16} />
                      </div>
                      <div className="bg-white/[0.05] p-4 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%]">
                        <p className="text-sm leading-relaxed text-slate-300">
                          Excellent breakdown. To follow up, how would you handle state synchronization across multiple browser tabs?
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <div className="relative">
                    <textarea
                      className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-6 pr-20 outline-none focus:border-emerald-500/50 transition-colors text-sm text-slate-300 placeholder:text-slate-600 resize-none"
                      placeholder="Type your technical response..."
                    />
                    <button className="absolute bottom-6 right-6 p-3 bg-white text-black rounded-xl hover:bg-slate-200 transition-all">
                      <Send size={18} />
                    </button>
                  </div>
                </div>

                <div className="col-span-4 space-y-6">
                  <GlassCard className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Competency Map</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span>Technical Depth</span>
                          <span className="text-emerald-400">85%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span>Communication</span>
                          <span className="text-cyan-400">72%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} className="h-full bg-cyan-400" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {['BroadcastChannel', 'LocalStorage', 'SharedWorker', 'PubSub'].map(tag => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}