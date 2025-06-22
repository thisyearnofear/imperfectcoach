// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./ImperfectCoachPassport.sol";
import "./ExerciseLeaderboard.sol";

contract CoachOperator is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    ImperfectCoachPassport public passport;
    
    mapping(bytes32 => address) public leaderboards;
    mapping(bytes32 => bool) public activeExercises;
    mapping(address => bool) public authorizedValidators;
    mapping(address => uint256) public userNonces;
    
    // User cooldowns and daily submission tracking
    mapping(address => mapping(bytes32 => uint256)) public userLastSubmission;
    mapping(address => mapping(bytes32 => mapping(uint256 => uint256))) public dailySubmissions; // user => exercise => day => count
    
    // Batch operation limits
    uint256 public constant MAX_BATCH_SIZE = 50;
    uint256 public constant MAX_SCORE_PER_EXERCISE = 10000;
    
    // Signature verification
    bool public requireSignatures = false;
    uint256 public signatureValidityPeriod = 300; // 5 minutes
    
    struct WorkoutSession {
        bytes32[] exercises;
        uint32[] scores;
        uint256 timestamp;
        uint256 nonce;
        bytes signature;
    }

    struct ExerciseConfig {
        uint32 maxScore;
        uint32 cooldown; // seconds between submissions
        uint32 maxDailySubmissions;
        bool active;
    }

    mapping(bytes32 => ExerciseConfig) public exerciseConfigs;
    bytes32[] public exerciseList;

    // New events for better tracking
    event LeaderboardAdded(bytes32 indexed exercise, address leaderboardAddress);
    event LeaderboardRemoved(bytes32 indexed exercise);
    event ScoreSubmitted(address indexed user, bytes32 indexed exercise, uint32 score, uint256 timestamp);
    event BatchScoresSubmitted(address indexed user, uint256 sessionCount, uint256 timestamp);
    event PassportMinted(address indexed user, uint256 tokenId);
    event ValidatorAuthorized(address indexed validator, bool authorized);
    event ExerciseConfigUpdated(bytes32 indexed exercise, ExerciseConfig config);
    event EmergencyAction(string action, address indexed target);
    event CooldownViolation(address indexed user, bytes32 indexed exercise, uint256 remainingTime);
    event DailyLimitReached(address indexed user, bytes32 indexed exercise, uint256 currentCount);

    modifier onlyAuthorizedValidator() {
        require(authorizedValidators[msg.sender] || msg.sender == owner(), "Not authorized validator");
        _;
    }

    modifier validExercise(bytes32 exercise) {
        require(activeExercises[exercise], "Exercise not active");
        _;
    }

    modifier respectsCooldown(address user, bytes32 exercise) {
        ExerciseConfig memory config = exerciseConfigs[exercise];
        if (config.cooldown > 0) {
            uint256 lastSubmission = userLastSubmission[user][exercise];
            uint256 timeSinceLastSubmission = block.timestamp - lastSubmission;
            if (lastSubmission > 0 && timeSinceLastSubmission < config.cooldown) {
                emit CooldownViolation(user, exercise, config.cooldown - timeSinceLastSubmission);
                revert("Cooldown period not met");
            }
        }
        _;
    }

    modifier respectsDailyLimit(address user, bytes32 exercise) {
        ExerciseConfig memory config = exerciseConfigs[exercise];
        if (config.maxDailySubmissions > 0) {
            uint256 currentDay = block.timestamp / 86400;
            uint256 currentCount = dailySubmissions[user][exercise][currentDay];
            if (currentCount >= config.maxDailySubmissions) {
                emit DailyLimitReached(user, exercise, currentCount);
                revert("Daily submission limit reached");
            }
        }
        _;
    }

    constructor(address _passportAddress) Ownable(msg.sender) {
        require(_passportAddress != address(0), "Invalid passport address");
        passport = ImperfectCoachPassport(_passportAddress);
        authorizedValidators[msg.sender] = true;
    }

    function addLeaderboard(
        bytes32 exercise,
        address leaderboardAddress,
        ExerciseConfig calldata config
    ) external onlyOwner {
        require(leaderboardAddress != address(0), "Invalid address");
        require(!activeExercises[exercise], "Exercise already exists");
        require(config.maxScore > 0 && config.maxScore <= MAX_SCORE_PER_EXERCISE, "Invalid max score");
        
        leaderboards[exercise] = leaderboardAddress;
        activeExercises[exercise] = true;
        exerciseConfigs[exercise] = config;
        exerciseList.push(exercise);
        
        emit LeaderboardAdded(exercise, leaderboardAddress);
        emit ExerciseConfigUpdated(exercise, config);
    }

    function removeLeaderboard(bytes32 exercise) external onlyOwner {
        require(activeExercises[exercise], "Exercise not found");
        
        delete leaderboards[exercise];
        activeExercises[exercise] = false;
        
        // Remove from exercise list
        for (uint256 i = 0; i < exerciseList.length; i++) {
            if (exerciseList[i] == exercise) {
                exerciseList[i] = exerciseList[exerciseList.length - 1];
                exerciseList.pop();
                break;
            }
        }
        
        emit LeaderboardRemoved(exercise);
    }

    function submitScore(bytes32 exercise, uint32 score) 
        external 
        whenNotPaused 
        nonReentrant 
        validExercise(exercise)
        respectsCooldown(msg.sender, exercise)
        respectsDailyLimit(msg.sender, exercise)
    {
        _submitScoreInternal(msg.sender, exercise, score, true);
    }

    function submitScoreWithSignature(
        bytes32 exercise,
        uint32 score,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata signature
    ) external whenNotPaused nonReentrant validExercise(exercise) {
        if (requireSignatures) {
            require(
                _verifyScoreSignature(msg.sender, exercise, score, timestamp, nonce, signature),
                "Invalid signature"
            );
            require(block.timestamp <= timestamp + signatureValidityPeriod, "Signature expired");
            require(nonce > userNonces[msg.sender], "Invalid nonce");
            userNonces[msg.sender] = nonce;
        }
        
        // Check cooldown and daily limits
        _checkCooldownAndLimits(msg.sender, exercise);
        
        _submitScoreInternal(msg.sender, exercise, score, true);
    }

    function submitWorkoutSession(WorkoutSession calldata session) external whenNotPaused nonReentrant {
        require(session.exercises.length == session.scores.length, "Array length mismatch");
        require(session.exercises.length > 0 && session.exercises.length <= MAX_BATCH_SIZE, "Invalid batch size");
        
        if (requireSignatures) {
            require(
                _verifyWorkoutSignature(msg.sender, session),
                "Invalid workout signature"
            );
            require(block.timestamp <= session.timestamp + signatureValidityPeriod, "Session expired");
            require(session.nonce > userNonces[msg.sender], "Invalid nonce");
            userNonces[msg.sender] = session.nonce;
        }

        // Ensure user has passport
        _ensurePassportExists(msg.sender);
        
        bool isNewWorkout = false;
        
        for (uint256 i = 0; i < session.exercises.length; i++) {
            bytes32 exercise = session.exercises[i];
            uint32 score = session.scores[i];
            
            require(activeExercises[exercise], "Exercise not active");
            require(score <= exerciseConfigs[exercise].maxScore, "Score too high");
            
            if (score > 0) {
                // Check individual exercise constraints
                _checkCooldownAndLimits(msg.sender, exercise);
                
                address leaderboardAddress = leaderboards[exercise];
                ExerciseLeaderboard(leaderboardAddress).addScore(msg.sender, score);
                
                // Update tracking
                userLastSubmission[msg.sender][exercise] = block.timestamp;
                uint256 currentDay = block.timestamp / 86400;
                dailySubmissions[msg.sender][exercise][currentDay]++;
                
                isNewWorkout = true;
                
                emit ScoreSubmitted(msg.sender, exercise, score, block.timestamp);
            }
        }
        
        if (isNewWorkout) {
            _updatePassport(msg.sender, true);
        }
        
        emit BatchScoresSubmitted(msg.sender, session.exercises.length, block.timestamp);
    }

    function _submitScoreInternal(address user, bytes32 exercise, uint32 score, bool isNewWorkout) internal {
        require(score > 0 && score <= exerciseConfigs[exercise].maxScore, "Invalid score");
        
        _ensurePassportExists(user);
        
        address leaderboardAddress = leaderboards[exercise];
        ExerciseLeaderboard(leaderboardAddress).addScore(user, score);
        
        // Update tracking
        userLastSubmission[user][exercise] = block.timestamp;
        uint256 currentDay = block.timestamp / 86400;
        dailySubmissions[user][exercise][currentDay]++;
        
        _updatePassport(user, isNewWorkout);
        
        emit ScoreSubmitted(user, exercise, score, block.timestamp);
    }

    function _checkCooldownAndLimits(address user, bytes32 exercise) internal view {
        ExerciseConfig memory config = exerciseConfigs[exercise];
        
        // Check cooldown
        if (config.cooldown > 0) {
            uint256 lastSubmission = userLastSubmission[user][exercise];
            if (lastSubmission > 0 && block.timestamp - lastSubmission < config.cooldown) {
                revert("Cooldown period not met");
            }
        }
        
        // Check daily limit
        if (config.maxDailySubmissions > 0) {
            uint256 currentDay = block.timestamp / 86400;
            uint256 currentCount = dailySubmissions[user][exercise][currentDay];
            if (currentCount >= config.maxDailySubmissions) {
                revert("Daily submission limit reached");
            }
        }
    }

    function _ensurePassportExists(address user) internal {
        // A user's passport is represented by a tokenId. If the tokenId is 0, it means they don't have one.
        if (passport.getTokenId(user) == 0) {
            // Mint a new passport by calling the function on the passport contract instance.
            passport.mint(user);
            uint256 tokenId = passport.getTokenId(user);
            emit PassportMinted(user, tokenId);
        }
    }

    function _updatePassport(address user, bool isNewWorkout) internal {
        ImperfectCoachPassport.PassportData memory currentData = passport.getPassportData(user);
        
        // Calculate new totals and personal bests
        uint32 newTotalPullups = 0;
        uint32 newTotalJumps = 0;
        uint32 newPullupPB = currentData.pullupPersonalBest;
        uint32 newJumpPB = currentData.jumpPersonalBest;
        
        // Get updated scores from leaderboards
        bytes32 pullupsExercise = keccak256("pullups");
        bytes32 jumpsExercise = keccak256("jumps");
        
        if (activeExercises[pullupsExercise]) {
            try ExerciseLeaderboard(leaderboards[pullupsExercise]).getUserScore(user) returns (
                ExerciseLeaderboard.Score memory pullupScore
            ) {
                newTotalPullups = uint32(pullupScore.totalScore);
                // Fixed: Properly cast uint256 to uint32 with bounds checking
                if (pullupScore.bestSingleScore > type(uint32).max) {
                    newPullupPB = type(uint32).max; // Cap at uint32 max value
                } else if (uint32(pullupScore.bestSingleScore) > newPullupPB) {
                    newPullupPB = uint32(pullupScore.bestSingleScore);
                }
            } catch {
                newTotalPullups = currentData.totalPullups;
            }
        }
        
        if (activeExercises[jumpsExercise]) {
            try ExerciseLeaderboard(leaderboards[jumpsExercise]).getUserScore(user) returns (
                ExerciseLeaderboard.Score memory jumpScore
            ) {
                newTotalJumps = uint32(jumpScore.totalScore);
                // Fixed: Properly cast uint256 to uint32 with bounds checking
                if (jumpScore.bestSingleScore > type(uint32).max) {
                    newJumpPB = type(uint32).max; // Cap at uint32 max value
                } else if (uint32(jumpScore.bestSingleScore) > newJumpPB) {
                    newJumpPB = uint32(jumpScore.bestSingleScore);
                }
            } catch {
                newTotalJumps = currentData.totalJumps;
            }
        }
        
        // Calculate new level (every 100 total exercises)
        uint32 totalExercises = newTotalPullups + newTotalJumps;
        uint32 newLevel = (totalExercises / 100) + 1;
        
        passport.updatePassport(
            user,
            newLevel,
            newTotalPullups,
            newTotalJumps,
            newPullupPB,
            newJumpPB,
            isNewWorkout
        );
    }

    function _verifyScoreSignature(
        address user,
        bytes32 exercise,
        uint32 score,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(
            user,
            exercise,
            score,
            timestamp,
            nonce,
            address(this)
        ));
        
        bytes32 ethSignedMessageHash = hash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        return authorizedValidators[signer];
    }

    function _verifyWorkoutSignature(
        address user,
        WorkoutSession calldata session
    ) internal view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(
            user,
            keccak256(abi.encodePacked(session.exercises)),
            keccak256(abi.encode(session.scores)),
            session.timestamp,
            session.nonce,
            address(this)
        ));
        
        bytes32 ethSignedMessageHash = hash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(session.signature);
        
        return authorizedValidators[signer];
    }

    // Batch operations for efficiency
    function batchMintPassports(address[] calldata users) external onlyOwner {
        require(users.length <= MAX_BATCH_SIZE, "Batch too large");
        
        for (uint256 i = 0; i < users.length; i++) {
            try passport.getPassportData(users[i]) {
                // User already has passport, skip
                continue;
            } catch {
                passport.mint(users[i]);
                uint256 tokenId = passport.getTokenId(users[i]);
                emit PassportMinted(users[i], tokenId);
            }
        }
    }

    function batchUpdatePassports(address[] calldata users) external onlyAuthorizedValidator {
        require(users.length <= MAX_BATCH_SIZE, "Batch too large");
        
        for (uint256 i = 0; i < users.length; i++) {
            _updatePassport(users[i], false);
        }
    }

    // Admin functions
    function updateExerciseConfig(bytes32 exercise, ExerciseConfig calldata config) external onlyOwner {
        require(activeExercises[exercise], "Exercise not found");
        require(config.maxScore > 0 && config.maxScore <= MAX_SCORE_PER_EXERCISE, "Invalid max score");
        
        exerciseConfigs[exercise] = config;
        emit ExerciseConfigUpdated(exercise, config);
    }

    function setAuthorizedValidator(address validator, bool authorized) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        authorizedValidators[validator] = authorized;
        emit ValidatorAuthorized(validator, authorized);
    }

    function setRequireSignatures(bool _requireSignatures) external onlyOwner {
        requireSignatures = _requireSignatures;
    }

    function setSignatureValidityPeriod(uint256 _period) external onlyOwner {
        require(_period >= 60 && _period <= 3600, "Invalid period"); // 1 min to 1 hour
        signatureValidityPeriod = _period;
    }

    function setPassportAddress(address _passportAddress) external onlyOwner {
        require(_passportAddress != address(0), "Invalid address");
        passport = ImperfectCoachPassport(_passportAddress);
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
        emit EmergencyAction("pause", address(this));
    }

    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyAction("unpause", address(this));
    }

    function emergencyPauseLeaderboard(bytes32 exercise) external onlyOwner {
        require(activeExercises[exercise], "Exercise not found");
        ExerciseLeaderboard(leaderboards[exercise]).pause();
        emit EmergencyAction("pauseLeaderboard", leaderboards[exercise]);
    }

    function emergencyUnpauseLeaderboard(bytes32 exercise) external onlyOwner {
        require(activeExercises[exercise], "Exercise not found");
        ExerciseLeaderboard(leaderboards[exercise]).unpause();
        emit EmergencyAction("unpauseLeaderboard", leaderboards[exercise]);
    }

    // View functions
    function getActiveExercises() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < exerciseList.length; i++) {
            if (activeExercises[exerciseList[i]]) {
                activeCount++;
            }
        }
        
        bytes32[] memory active = new bytes32[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < exerciseList.length; i++) {
            if (activeExercises[exerciseList[i]]) {
                active[index] = exerciseList[i];
                index++;
            }
        }
        
        return active;
    }

    function getLeaderboard(bytes32 exercise) external view returns (address) {
        return leaderboards[exercise];
    }

    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }

    function isValidValidator(address validator) external view returns (bool) {
        return authorizedValidators[validator];
    }

    function getExerciseConfig(bytes32 exercise) external view returns (ExerciseConfig memory) {
        return exerciseConfigs[exercise];
    }

    function getAllExercises() external view returns (bytes32[] memory) {
        return exerciseList;
    }

    function getUserCooldownStatus(address user, bytes32 exercise) external view returns (bool canSubmit, uint256 remainingTime) {
        ExerciseConfig memory config = exerciseConfigs[exercise];
        if (config.cooldown == 0) {
            return (true, 0);
        }
        
        uint256 lastSubmission = userLastSubmission[user][exercise];
        if (lastSubmission == 0) {
            return (true, 0);
        }
        
        uint256 timeSinceLastSubmission = block.timestamp - lastSubmission;
        if (timeSinceLastSubmission >= config.cooldown) {
            return (true, 0);
        } else {
            return (false, config.cooldown - timeSinceLastSubmission);
        }
    }

    function getUserDailySubmissions(address user, bytes32 exercise) external view returns (uint256 todayCount, uint256 maxAllowed) {
        uint256 currentDay = block.timestamp / 86400;
        uint256 todaySubmissions = dailySubmissions[user][exercise][currentDay];
        uint256 maxDaily = exerciseConfigs[exercise].maxDailySubmissions;
        
        return (todaySubmissions, maxDaily);
    }
}