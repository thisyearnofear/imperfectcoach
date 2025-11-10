import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Eye, 
  Users, 
  Lock,
  Globe,
  User,
  Trophy,
  Settings as SettingsIcon
} from "lucide-react";
import { useMemoryIdentity } from "@/hooks/useMemoryIdentity";
import { useAccount } from "wagmi";

interface PrivacySettingsProps {
  compact?: boolean;
}

const PrivacySettings = ({ compact = false }: PrivacySettingsProps) => {
  const { address } = useAccount();
  const { identityGraph } = useMemoryIdentity(address);
  const [settings, setSettings] = useState({
    shareWorkouts: true,
    shareAchievements: true,
    showInLeaderboards: true,
    allowFriendRequests: true,
    shareSocialConnections: false,
    publicProfile: false,
  });

  // Get user's social identities
  const socialIdentities = (identityGraph?.identities && Array.isArray(identityGraph.identities))
    ? identityGraph.identities.filter(identity =>
        identity && ['farcaster', 'twitter', 'github', 'lens', 'zora'].includes(identity.platform)
      )
    : [];

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = () => {
    // In a real implementation, this would save to a database or API
    console.log("Privacy settings saved:", settings);
    // Show success message
  };

  return (
    <Card className={compact ? "h-fit" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Share Workouts</h3>
                <p className="text-sm text-muted-foreground">
                  Show your workout activities to friends
                </p>
              </div>
            </div>
            <Switch
              checked={settings.shareWorkouts}
              onCheckedChange={() => handleSettingChange('shareWorkouts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium">Share Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Display your achievements to your network
                </p>
              </div>
            </div>
            <Switch
              checked={settings.shareAchievements}
              onCheckedChange={() => handleSettingChange('shareAchievements')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Show in Leaderboards</h3>
                <p className="text-sm text-muted-foreground">
                  Appear in public and friend leaderboards
                </p>
              </div>
            </div>
            <Switch
              checked={settings.showInLeaderboards}
              onCheckedChange={() => handleSettingChange('showInLeaderboards')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Allow Friend Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Let others send you friend requests
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allowFriendRequests}
              onCheckedChange={() => handleSettingChange('allowFriendRequests')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Eye className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">Share Social Connections</h3>
                <p className="text-sm text-muted-foreground">
                  Show your connected social profiles
                </p>
              </div>
            </div>
            <Switch
              checked={settings.shareSocialConnections}
              onCheckedChange={() => handleSettingChange('shareSocialConnections')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Lock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium">Public Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to everyone
                </p>
              </div>
            </div>
            <Switch
              checked={settings.publicProfile}
              onCheckedChange={() => handleSettingChange('publicProfile')}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button className="w-full" onClick={saveSettings}>
            Save Privacy Settings
          </Button>
        </div>

        {/* Connected Profiles Info */}
        {socialIdentities.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Connected Profiles
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              You have {socialIdentities.length} social profiles connected. 
              Privacy settings apply to all connected accounts.
            </p>
            <div className="flex flex-wrap gap-2">
              {socialIdentities.map((identity) => (
                <div 
                  key={identity.id} 
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs"
                >
                  {identity.platform === 'farcaster' && '🟣'}
                  {identity.platform === 'twitter' && '🐦'}
                  {identity.platform === 'github' && '💻'}
                  {identity.platform === 'lens' && '👁️'}
                  {identity.platform === 'zora' && '🎨'}
                  <span>{identity.username || identity.id.substring(0, 8)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;