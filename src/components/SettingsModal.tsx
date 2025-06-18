import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Bug } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { Separator } from "@/components/ui/separator";

interface SettingsModalProps {
    isHighContrast: boolean;
    onHighContrastChange: (enabled: boolean) => void;
    isAudioFeedbackEnabled: boolean;
    onAudioFeedbackChange: (enabled: boolean) => void;
    isRecordingEnabled: boolean;
    onRecordingChange: (enabled: boolean) => void;
    isDebugMode: boolean;
    onDebugChange: (enabled: boolean) => void;
}

const SettingsModal = ({
    isHighContrast,
    onHighContrastChange,
    isAudioFeedbackEnabled,
    onAudioFeedbackChange,
    isRecordingEnabled,
    onRecordingChange,
    isDebugMode,
    onDebugChange,
}: SettingsModalProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Appearance Settings */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Appearance</h4>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme-toggle">Theme</Label>
                            <ThemeToggle />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="high-contrast">High Contrast Mode</Label>
                            <Switch 
                                id="high-contrast" 
                                checked={isHighContrast} 
                                onCheckedChange={onHighContrastChange} 
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Feedback Settings */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Feedback & Recording</h4>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="audio-feedback">Audio Feedback</Label>
                            <Switch 
                                id="audio-feedback" 
                                checked={isAudioFeedbackEnabled} 
                                onCheckedChange={onAudioFeedbackChange} 
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="recording">Enable Recording</Label>
                            <Switch 
                                id="recording" 
                                checked={isRecordingEnabled} 
                                onCheckedChange={onRecordingChange} 
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Developer Settings */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Developer</h4>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="debug-mode" className="flex items-center gap-2">
                                <Bug className="h-4 w-4" />
                                Debug Mode
                            </Label>
                            <Switch 
                                id="debug-mode" 
                                checked={isDebugMode} 
                                onCheckedChange={onDebugChange} 
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* API Settings */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Custom API Keys</h4>
                        <p className="text-xs text-muted-foreground">
                            Optionally provide your own API keys. They are stored only in your browser.
                        </p>
                        <ApiKeySettings />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
