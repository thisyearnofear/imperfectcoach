
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

export function ApiKeySettings() {
    const [keys, setKeys] = useState({ gemini: '', openai: '', anthropic: '' });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        try {
            const storedKeys = JSON.parse(localStorage.getItem('user-api-keys') || '{}');
            if (storedKeys) {
                setKeys(prev => ({ ...prev, ...storedKeys }));
            }
        } catch (error) {
            console.error("Failed to parse API keys from localStorage", error);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        localStorage.setItem('user-api-keys', JSON.stringify(keys));
        toast.success("API Keys saved successfully!");
    };
    
    if (!isClient) {
        return null; // Don't render on the server
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input id="gemini-key" name="gemini" type="password" value={keys.gemini} onChange={handleChange} placeholder="Enter your Gemini key" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input id="openai-key" name="openai" type="password" value={keys.openai} onChange={handleChange} placeholder="Enter your OpenAI key" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <Input id="anthropic-key" name="anthropic" type="password" value={keys.anthropic} onChange={handleChange} placeholder="Enter your Anthropic key" />
            </div>
            <Button onClick={handleSave} className="w-full">Save Keys</Button>
        </div>
    );
}
