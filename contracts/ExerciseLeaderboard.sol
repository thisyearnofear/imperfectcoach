// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ExerciseLeaderboard is Ownable, Pausable, ReentrancyGuard {
    struct Score {
        uint256 totalScore;           // Cumulative score for the user
        uint256 bestSingleScore;      // Best single submission score
        uint256 submissionCount;      // Number of submissions
        uint256 lastSubmissionTime;   // Timestamp of last submission
        uint256 firstSubmissionTime;  // Timestamp of first submission
    }

    struct LeaderboardEntry {
        address user;
        uint256 totalScore;
        uint256 bestSingleScore;
        uint256 submissionCount;
        uint256 lastSubmissionTime;
    }

    // User data storage
    mapping(address => Score) private userScores;
    
    // Sorted leaderboard for efficient querying
    address[] private sortedUsers;
    mapping(address => uint256) private userSortedIndex; // 1-based indexing (0 means not in leaderboard)
    
    // Contract configuration
    string public exerciseName;
    uint256 public totalParticipants;
    uint256 public totalSubmissions;
    
    // Events
    event ScoreAdded(
        address indexed user, 
        uint256 scoreAdded, 
        uint256 newTotalScore, 
        uint256 newBestScore,
        uint256 timestamp
    );
    event LeaderboardUpdated(address indexed user, uint256 newRank);

    constructor(string memory _exerciseName) Ownable(msg.sender) {
        exerciseName = _exerciseName;
    }

    function addScore(address user, uint32 score) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(user != address(0), "Invalid user address");
        require(score > 0, "Score must be positive");
        require(msg.sender == user, "Can only submit your own score");
        
        Score storage userScore = userScores[user];
        bool isNewUser = (userScore.submissionCount == 0);
        
        // Update user score data
        userScore.totalScore += score;
        userScore.submissionCount++;
        userScore.lastSubmissionTime = block.timestamp;
        
        if (isNewUser) {
            userScore.firstSubmissionTime = block.timestamp;
            totalParticipants++;
        }
        
        // Update best single score if this is better
        if (score > userScore.bestSingleScore) {
            userScore.bestSingleScore = score;
        }
        
        totalSubmissions++;
        
        // Update sorted leaderboard
        _updateLeaderboard(user);
        
        emit ScoreAdded(
            user, 
            score, 
            userScore.totalScore, 
            userScore.bestSingleScore,
            block.timestamp
        );
    }

    function _updateLeaderboard(address user) internal {
        uint256 currentIndex = userSortedIndex[user];
        uint256 userTotalScore = userScores[user].totalScore;
        
        if (currentIndex == 0) {
            // New user - add to leaderboard
            sortedUsers.push(user);
            userSortedIndex[user] = sortedUsers.length;
            currentIndex = sortedUsers.length;
        }
        
        // Bubble up the user to correct position
        uint256 newIndex = currentIndex;
        while (newIndex > 1) {
            address aboveUser = sortedUsers[newIndex - 2]; // Convert to 0-based index
            if (userScores[aboveUser].totalScore >= userTotalScore) {
                break; // Correct position found
            }
            
            // Swap positions
            sortedUsers[newIndex - 1] = aboveUser;
            sortedUsers[newIndex - 2] = user;
            userSortedIndex[aboveUser] = newIndex;
            userSortedIndex[user] = newIndex - 1;
            newIndex--;
        }
        
        if (newIndex != currentIndex) {
            emit LeaderboardUpdated(user, newIndex);
        }
    }

    // View Functions
    function getUserScore(address user) external view returns (Score memory) {
        return userScores[user];
    }
    
    function getUserRank(address user) external view returns (uint256) {
        return userSortedIndex[user]; // Returns 0 if user not found
    }
    
    function getTopUsers(uint256 count) external view returns (LeaderboardEntry[] memory) {
        if (count > sortedUsers.length) {
            count = sortedUsers.length;
        }
        
        LeaderboardEntry[] memory topUsers = new LeaderboardEntry[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address user = sortedUsers[i];
            Score memory score = userScores[user];
            
            topUsers[i] = LeaderboardEntry({
                user: user,
                totalScore: score.totalScore,
                bestSingleScore: score.bestSingleScore,
                submissionCount: score.submissionCount,
                lastSubmissionTime: score.lastSubmissionTime
            });
        }
        
        return topUsers;
    }
    
    function getLeaderboardPage(uint256 offset, uint256 limit) 
        external 
        view 
        returns (LeaderboardEntry[] memory) 
    {
        require(offset < sortedUsers.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > sortedUsers.length) {
            end = sortedUsers.length;
        }
        
        uint256 pageSize = end - offset;
        LeaderboardEntry[] memory page = new LeaderboardEntry[](pageSize);
        
        for (uint256 i = 0; i < pageSize; i++) {
            address user = sortedUsers[offset + i];
            Score memory score = userScores[user];
            
            page[i] = LeaderboardEntry({
                user: user,
                totalScore: score.totalScore,
                bestSingleScore: score.bestSingleScore,
                submissionCount: score.submissionCount,
                lastSubmissionTime: score.lastSubmissionTime
            });
        }
        
        return page;
    }
    
    function getLeaderboardSize() external view returns (uint256) {
        return sortedUsers.length;
    }
    
    function getStats() external view returns (
        uint256 _totalParticipants,
        uint256 _totalSubmissions,
        uint256 _averageScore,
        address _topUser,
        uint256 _topScore
    ) {
        _totalParticipants = totalParticipants;
        _totalSubmissions = totalSubmissions;
        
        if (totalParticipants > 0) {
            // Calculate average score across all participants
            uint256 totalScore = 0;
            for (uint256 i = 0; i < sortedUsers.length; i++) {
                totalScore += userScores[sortedUsers[i]].totalScore;
            }
            _averageScore = totalScore / totalParticipants;
            
            // Get top user
            if (sortedUsers.length > 0) {
                _topUser = sortedUsers[0];
                _topScore = userScores[_topUser].totalScore;
            }
        }
    }

    // Admin Functions - Emergency only
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency function to rebuild leaderboard if needed
    function rebuildLeaderboard() external onlyOwner {
        // Clear current sorted list
        delete sortedUsers;
        
        // Reset user indices
        for (uint256 i = 0; i < sortedUsers.length; i++) {
            userSortedIndex[sortedUsers[i]] = 0;
        }
        
        // This function would need to be called with a list of users to rebuild
        // In practice, you might want to implement this differently based on your needs
    }

    // Function to check if user exists in leaderboard
    function userExists(address user) external view returns (bool) {
        return userScores[user].submissionCount > 0;
    }

    // Get user's position details
    function getUserDetails(address user) external view returns (
        uint256 totalScore,
        uint256 bestSingleScore,
        uint256 submissionCount,
        uint256 rank,
        uint256 lastSubmissionTime,
        uint256 firstSubmissionTime
    ) {
        Score memory score = userScores[user];
        return (
            score.totalScore,
            score.bestSingleScore,
            score.submissionCount,
            userSortedIndex[user],
            score.lastSubmissionTime,
            score.firstSubmissionTime
        );
    }
}