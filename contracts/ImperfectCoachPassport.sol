// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// Inline Base64 library to avoid import issues
library Base64 {
    string internal constant TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return '';
        
        string memory table = TABLE;
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            let dataPtr := add(data, 0x20)
            let endPtr := add(dataPtr, mload(data))
            
            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 2), 0x3d)
                mstore8(sub(resultPtr, 1), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
            
            mstore(result, encodedLen)
        }
        
        return result;
    }
}

contract ImperfectCoachPassport is ERC721, Ownable, Pausable, Initializable {
    using Strings for uint256;

    uint256 private _nextTokenId = 1; // Start from 1 to avoid 0 conflicts

    // Packed struct for gas optimization (fits in 2 storage slots)
    struct PassportData {
        uint32 level;                    // 4 bytes
        uint32 totalPullups;            // 4 bytes  
        uint32 totalJumps;              // 4 bytes
        uint32 pullupPersonalBest;      // 4 bytes
        uint32 jumpPersonalBest;        // 4 bytes
        uint32 currentStreak;           // 4 bytes
        uint32 longestStreak;           // 4 bytes
        uint32 lastWorkoutDay;          // 4 bytes (day since epoch)
        uint64 totalWorkoutSessions;    // 8 bytes
        uint64 firstWorkoutTimestamp;   // 8 bytes
    }

    // Achievement flags packed into uint256 for gas efficiency
    struct Achievements {
        uint256 flags; // Each bit represents a different achievement
    }

    mapping(uint256 => PassportData) private _passportData;
    mapping(uint256 => Achievements) private _achievements;
    mapping(address => uint256) private _addressToTokenId;
    
    // Achievement constants
    uint256 public constant FIRST_WORKOUT = 1;
    uint256 public constant CENTURY_PULLUPS = 2;
    uint256 public constant THOUSAND_JUMPS = 4;
    uint256 public constant WEEK_STREAK = 8;
    uint256 public constant MONTH_STREAK = 16;
    uint256 public constant LEVEL_10 = 32;
    uint256 public constant CONSISTENT_ATHLETE = 64; // 100 workout sessions

    address public coachOperator;

    event PassportMinted(address indexed user, uint256 indexed tokenId);
    event PassportUpdated(uint256 indexed tokenId, PassportData data);
    event AchievementUnlocked(uint256 indexed tokenId, uint256 achievement);
    event StreakUpdated(uint256 indexed tokenId, uint32 newStreak, bool streakBroken);
    event CoachOperatorSet(address indexed operator);

    modifier onlyCoachOperator() {
        require(msg.sender == coachOperator, "Caller is not the authorized operator");
        _;
    }

    constructor() ERC721("Imperfect Coach Passport", "ICP") Ownable(msg.sender) {}

    function initialize() public initializer {
        // For future upgrades if needed
    }

    function setCoachOperator(address _operator) public onlyOwner {
        require(_operator != address(0), "Invalid operator address");
        coachOperator = _operator;
        emit CoachOperatorSet(_operator);
    }

    function mint(address to) public onlyCoachOperator whenNotPaused {
        require(_addressToTokenId[to] == 0, "Passport already exists");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _addressToTokenId[to] = tokenId;
        
        // Initialize passport with first workout achievement
        PassportData storage passport = _passportData[tokenId];
        passport.level = 1;
        passport.firstWorkoutTimestamp = uint64(block.timestamp);
        
        _unlockAchievement(tokenId, FIRST_WORKOUT);
        
        emit PassportMinted(to, tokenId);
    }

    function updatePassport(
        address user,
        uint32 level,
        uint32 totalPullups,
        uint32 totalJumps,
        uint32 pullupPersonalBest,
        uint32 jumpPersonalBest,
        bool isNewWorkout
    ) public onlyCoachOperator whenNotPaused {
        uint256 tokenId = _addressToTokenId[user];
        require(tokenId != 0, "Passport not found");

        PassportData storage passport = _passportData[tokenId];
        
        // Update basic stats
        passport.level = level;
        passport.totalPullups = totalPullups;
        passport.totalJumps = totalJumps;
        passport.pullupPersonalBest = pullupPersonalBest;
        passport.jumpPersonalBest = jumpPersonalBest;
        
        if (isNewWorkout) {
            passport.totalWorkoutSessions++;
            _updateStreak(tokenId);
        }
        
        // Check for achievements
        _checkAchievements(tokenId);
        
        emit PassportUpdated(tokenId, passport);
    }

    function _updateStreak(uint256 tokenId) internal {
        PassportData storage passport = _passportData[tokenId];
        uint32 currentDay = uint32(block.timestamp / 86400); // Days since epoch
        
        if (passport.lastWorkoutDay == 0) {
            // First workout
            passport.currentStreak = 1;
            passport.longestStreak = 1;
        } else if (currentDay == passport.lastWorkoutDay + 1) {
            // Consecutive day
            passport.currentStreak++;
            if (passport.currentStreak > passport.longestStreak) {
                passport.longestStreak = passport.currentStreak;
            }
        } else if (currentDay > passport.lastWorkoutDay + 1) {
            // Streak broken
            emit StreakUpdated(tokenId, passport.currentStreak, true);
            passport.currentStreak = 1;
        }
        // Same day workout doesn't affect streak
        
        passport.lastWorkoutDay = currentDay;
        emit StreakUpdated(tokenId, passport.currentStreak, false);
    }

    function _checkAchievements(uint256 tokenId) internal {
        PassportData memory passport = _passportData[tokenId];
        
        if (passport.totalPullups >= 100) {
            _unlockAchievement(tokenId, CENTURY_PULLUPS);
        }
        
        if (passport.totalJumps >= 1000) {
            _unlockAchievement(tokenId, THOUSAND_JUMPS);
        }
        
        if (passport.currentStreak >= 7) {
            _unlockAchievement(tokenId, WEEK_STREAK);
        }
        
        if (passport.currentStreak >= 30) {
            _unlockAchievement(tokenId, MONTH_STREAK);
        }
        
        if (passport.level >= 10) {
            _unlockAchievement(tokenId, LEVEL_10);
        }
        
        if (passport.totalWorkoutSessions >= 100) {
            _unlockAchievement(tokenId, CONSISTENT_ATHLETE);
        }
    }

    function _unlockAchievement(uint256 tokenId, uint256 achievement) internal {
        Achievements storage achievements = _achievements[tokenId];
        if ((achievements.flags & achievement) == 0) {
            achievements.flags |= achievement;
            emit AchievementUnlocked(tokenId, achievement);
        }
    }

    function getPassportData(address user) public view returns (PassportData memory) {
        uint256 tokenId = _addressToTokenId[user];
        require(tokenId != 0, "Passport not found");
        return _passportData[tokenId];
    }

    function getAchievements(address user) public view returns (uint256) {
        uint256 tokenId = _addressToTokenId[user];
        require(tokenId != 0, "Passport not found");
        return _achievements[tokenId].flags;
    }

    function hasAchievement(address user, uint256 achievement) public view returns (bool) {
        uint256 tokenId = _addressToTokenId[user];
        if (tokenId == 0) return false;
        return (_achievements[tokenId].flags & achievement) != 0;
    }

    // Fixed: Added missing function for getting token ID by address
    function getTokenId(address owner) public view returns (uint256) {
        return _addressToTokenId[owner];
    }

    // Fixed: Updated _exists to use _ownerOf
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        PassportData memory data = _passportData[tokenId];
        uint256 achievementFlags = _achievements[tokenId].flags;

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "Imperfect Coach Passport #', tokenId.toString(), '",',
                    '"description": "Your dynamic, on-chain fitness journey with achievements and streaks.",',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(buildSVG(data, achievementFlags))), '",',
                    '"attributes": [',
                        '{"trait_type": "Level", "value": ', uint256(data.level).toString(), '},',
                        '{"trait_type": "Total Pull-ups", "value": ', uint256(data.totalPullups).toString(), '},',
                        '{"trait_type": "Total Jumps", "value": ', uint256(data.totalJumps).toString(), '},',
                        '{"trait_type": "Pull-up PB", "value": ', uint256(data.pullupPersonalBest).toString(), '},',
                        '{"trait_type": "Jump PB", "value": ', uint256(data.jumpPersonalBest).toString(), '},',
                        '{"trait_type": "Current Streak", "value": ', uint256(data.currentStreak).toString(), '},',
                        '{"trait_type": "Longest Streak", "value": ', uint256(data.longestStreak).toString(), '},',
                        '{"trait_type": "Total Sessions", "value": ', uint256(data.totalWorkoutSessions).toString(), '},',
                        '{"trait_type": "Achievement Count", "value": ', _countAchievements(achievementFlags).toString(), '}',
                    ']}'
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function buildSVG(PassportData memory data, uint256 achievementFlags) internal pure returns (string memory) {
        // Calculate progress bars
        uint256 pullupProgress = (uint256(data.totalPullups) * 100) / 1000;
        if (pullupProgress > 100) pullupProgress = 100;
        
        uint256 jumpProgress = (uint256(data.totalJumps) * 100) / 2000;
        if (jumpProgress > 100) jumpProgress = 100;
        
        // Level-based color scheme
        string memory primaryColor = "#3B82F6";
        string memory secondaryColor = "#1E40AF";
        
        if (data.level >= 20) {
            primaryColor = "#DC2626"; // Red for expert
            secondaryColor = "#991B1B";
        } else if (data.level >= 10) {
            primaryColor = "#7C3AED"; // Purple for advanced
            secondaryColor = "#5B21B6";
        } else if (data.level >= 5) {
            primaryColor = "#059669"; // Green for intermediate
            secondaryColor = "#047857";
        }
        
        string memory achievementBadges = _buildAchievementBadges(achievementFlags);
        
        string memory svg = string.concat(
            '<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">',
            // Background with gradient
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:', primaryColor, ';stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:', secondaryColor, ';stop-opacity:1" />',
            '</linearGradient>',
            '<linearGradient id="progress" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#059669;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            
            // Background
            '<rect width="100%" height="100%" fill="url(#bg)"/>',
            
            // Border frame
            '<rect x="20" y="20" width="360" height="460" fill="none" stroke="white" stroke-width="3" rx="15"/>',
            
            // Header section
            '<rect x="30" y="30" width="340" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>',
            '<text x="200" y="55" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">IMPERFECT COACH</text>',
            '<text x="200" y="85" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">LEVEL ', uint256(data.level).toString(), '</text>',
            
            // Streak section
            '<rect x="30" y="120" width="340" height="40" fill="rgba(255,255,255,0.05)" rx="8"/>',
            '<text x="50" y="140" font-family="Arial, sans-serif" font-size="14" fill="white">Current Streak: ', uint256(data.currentStreak).toString(), ' days</text>',
            '<text x="350" y="140" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="end">Best: ', uint256(data.longestStreak).toString(), '</text>',
            '<text x="50" y="155" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.6)">Total Sessions: ', uint256(data.totalWorkoutSessions).toString(), '</text>',
            
            // Stats section
            '<text x="50" y="190" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">PULL-UPS</text>',
            '<text x="350" y="190" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="end">', uint256(data.totalPullups).toString(), '</text>',
            '<text x="50" y="210" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">Personal Best: ', uint256(data.pullupPersonalBest).toString(), '</text>',
            
            // Pullup progress bar
            '<rect x="50" y="220" width="300" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>',
            '<rect x="50" y="220" width="', (pullupProgress * 3).toString(), '" height="8" fill="url(#progress)" rx="4"/>',
            
            '<text x="50" y="250" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">JUMPS</text>',
            '<text x="350" y="250" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="end">', uint256(data.totalJumps).toString(), '</text>',
            '<text x="50" y="270" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">Personal Best: ', uint256(data.jumpPersonalBest).toString(), '</text>',
            
            // Jump progress bar
            '<rect x="50" y="280" width="300" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>',
            '<rect x="50" y="280" width="', (jumpProgress * 3).toString(), '" height="8" fill="url(#progress)" rx="4"/>',
            
            achievementBadges,
            
            // Footer
            '<text x="200" y="470" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.6)" text-anchor="middle">Your Fitness Journey on Chain</text>',
            
            '</svg>'
        );
        
        return svg;
    }

    function _buildAchievementBadges(uint256 achievementFlags) internal pure returns (string memory) {
        string memory badges = '<text x="200" y="320" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">ACHIEVEMENTS</text>';
        
        uint256 badgeY = 340;
        uint256 badgeX = 80;
        
        if ((achievementFlags & FIRST_WORKOUT) != 0) {
            badges = string.concat(badges, '<circle cx="', badgeX.toString(), '" cy="', badgeY.toString(), '" r="20" fill="rgba(255,255,255,0.2)" stroke="#10B981" stroke-width="2"/><text x="', badgeX.toString(), '" y="', (badgeY + 5).toString(), '" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">&#x1F3AF;</text>');
            badgeX += 60;
        }
        
        if ((achievementFlags & CENTURY_PULLUPS) != 0) {
            badges = string.concat(badges, '<circle cx="', badgeX.toString(), '" cy="', badgeY.toString(), '" r="20" fill="rgba(255,255,255,0.2)" stroke="#10B981" stroke-width="2"/><text x="', badgeX.toString(), '" y="', (badgeY + 5).toString(), '" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">&#x1F4AA;</text>');
            badgeX += 60;
        }
        
        if ((achievementFlags & WEEK_STREAK) != 0) {
            badges = string.concat(badges, '<circle cx="', badgeX.toString(), '" cy="', badgeY.toString(), '" r="20" fill="rgba(255,255,255,0.2)" stroke="#10B981" stroke-width="2"/><text x="', badgeX.toString(), '" y="', (badgeY + 5).toString(), '" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">&#x1F525;</text>');
            badgeX += 60;
        }
        
        if ((achievementFlags & LEVEL_10) != 0) {
            badges = string.concat(badges, '<circle cx="', badgeX.toString(), '" cy="', badgeY.toString(), '" r="20" fill="rgba(255,255,255,0.2)" stroke="#FFD700" stroke-width="2"/><text x="', badgeX.toString(), '" y="', (badgeY + 5).toString(), '" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">&#x1F451;</text>');
        }
        
        return badges;
    }

    function _countAchievements(uint256 flags) internal pure returns (uint256) {
        uint256 count = 0;
        uint256 temp = flags;
        while (temp != 0) {
            count += temp & 1;
            temp >>= 1;
        }
        return count;
    }

    // Emergency functions
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Soulbound: prevent transfers (updated for newer OpenZeppelin version)
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // But prevent transfers between accounts
        require(from == address(0) || to == address(0), "Soulbound: transfers disabled");
        
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
