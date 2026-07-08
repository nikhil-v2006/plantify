
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Bot, Loader2, User, Volume2, CornerDownLeft, Languages } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { assistant } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Message = {
  role: 'user' | 'model';
  text: string;
};

const supportedLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'ml-IN', name: 'Malayalam' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
];

export default function AssistantPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState('en-US');

  const speechRecognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({ variant: 'destructive', title: 'Speech Error', description: `An error occurred: ${event.error}` });
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSubmit(transcript);
      };
      speechRecognitionRef.current = recognition;
    } else {
        toast({
            variant: 'destructive',
            title: 'Not Supported',
            description: 'Speech recognition is not supported in this browser.',
        });
    }
  }, [toast]);
  
  useEffect(() => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.lang = language;
      }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSubmit = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (isListening) {
      speechRecognitionRef.current?.stop();
    }

    const userMessage: Message = { role: 'user', text: trimmedText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const responseText = await assistant(trimmedText, language);
      const modelMessage: Message = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
      await playAudio(responseText);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [language, isListening]);

  const handleMicClick = () => {
    if (!speechRecognitionRef.current) {
      return;
    }
    
    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      setInput('');
      speechRecognitionRef.current.start();
    }
  };

  const playAudio = async (text: string) => {
    if (!text || isPlaying) return;
    setIsPlaying(true);
    try {
        const response = await textToSpeech(text);
        if (response.media && audioRef.current) {
            audioRef.current.src = response.media;
            audioRef.current.play();
        } else {
            throw new Error("No media returned from text-to-speech service.");
        }
    } catch (e: any) {
        console.error('Error playing audio:', e);
        toast({ variant: 'destructive', title: 'Playback Error', description: e.message || 'Could not play audio.' });
        setIsPlaying(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="flex items-center gap-2"><Bot /> AI Advisory</CardTitle>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-muted-foreground"/>
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {supportedLanguages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Mic className="w-16 h-16 mb-4"/>
                <p>Click the microphone or type below to ask me anything about your farm.</p>
                <p className="text-sm mt-4">Examples: "What was my last checkup result?" or "Which pesticide for leaf spot?"</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
              <div className={`rounded-lg p-3 max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.role === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
           {isThinking && (
                <div className="flex items-start gap-4">
                    <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                    <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin"/>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t relative">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message or use the microphone..."
                className="pr-20"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(input);
                    }
                }}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <Button type="submit" size="icon" variant="ghost" onClick={() => handleSubmit(input)} disabled={isThinking || !input.trim()}>
                    <CornerDownLeft />
                </Button>
                <Button type="button" size="icon" variant={isListening ? 'destructive' : 'default'} onClick={handleMicClick} disabled={isThinking}>
                    <Mic />
                </Button>
                 <Button type="button" size="icon" variant="outline" onClick={() => playAudio(messages[messages.length - 1]?.text)} disabled={isPlaying || messages.length === 0 || messages[messages.length - 1]?.role !== 'model'}>
                    <Volume2 />
                </Button>
            </div>
        </div>
      </Card>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden"/>
    </div>
  );
}
