import { useState } from 'react';
import { CoachModel, SessionSummaries, ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquarePlus } from 'lucide-react';

interface AIChatProps {
    summaries: SessionSummaries;
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string, model: CoachModel) => Promise<void>;
}

const coachName = (model: string) => model.charAt(0).toUpperCase() + model.slice(1);

export function AIChat({ summaries, messages, isLoading, onSendMessage }: AIChatProps) {
    const [input, setInput] = useState('');
    const coachOptions = Object.keys(summaries) as CoachModel[];
    const [selectedCoach, setSelectedCoach] = useState<CoachModel>(coachOptions[0]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input, selectedCoach);
        setInput('');
    };
    
    if (coachOptions.length === 0) return null;

    return (
        <div className="w-full pt-4 mt-4 border-t border-border/50">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Follow-up with a Coach
            </h4>
            
            {messages.length > 0 && (
                <div className="space-y-3 mb-3">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm break-words ${
                               msg.role === 'user' 
                               ? 'bg-primary text-primary-foreground' 
                               : 'bg-muted'
                           }`}>
                               {msg.content}
                           </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                           <div className="rounded-lg px-3 py-2 bg-muted text-sm animate-pulse">
                               Thinking...
                           </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex gap-2">
                <Select value={selectedCoach} onValueChange={(v) => setSelectedCoach(v as CoachModel)}>
                    <SelectTrigger className="w-[120px] flex-shrink-0">
                        <SelectValue placeholder="Select Coach" />
                    </SelectTrigger>
                    <SelectContent>
                        {coachOptions.map(model => (
                            <SelectItem key={model} value={model}>{coachName(model)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input 
                    placeholder={`Ask ${coachName(selectedCoach)}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="flex-shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
