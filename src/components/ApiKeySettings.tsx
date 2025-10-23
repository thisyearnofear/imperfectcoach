
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from "sonner";

export function ApiKeySettings() {
    const [keys, setKeys] = useState({ gemini: '', openai: '', anthropic: '' });
    const [isClient, setIsClient] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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

    // Listen for global event to open API key settings
    useEffect(() => {
        const handleOpenSettings = () => {
            setIsOpen(true);
        };
        window.addEventListener('open-api-key-settings', handleOpenSettings);
        return () => {
            window.removeEventListener('open-api-key-settings', handleOpenSettings);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        localStorage.setItem('user-api-keys', JSON.stringify(keys));
        toast.success("API Keys saved successfully!");
        setIsOpen(false);
    };
    
    if (!isClient) {
        return null; // Don't render on the server
    }

    // Render both the inline version (for SettingsModal) and the standalone dialog
    const content = (
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

    return (
        <>
            {content}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>API Key Settings</DialogTitle>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        </>
    );
}
