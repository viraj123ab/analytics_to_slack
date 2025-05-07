import fs from 'fs';
import path from 'path';

// Path for storing engagement data
const engagementDataPath = path.join(process.cwd(), './engagement_data.json');

// Read stored data from the JSON file
export function getStoredEngagementData() {
    if (fs.existsSync(engagementDataPath)) {
        const data = fs.readFileSync(engagementDataPath, 'utf-8');
        return JSON.parse(data);
    }
    return {};  // Return an empty object if no data exists
}

// Store new engagement data in the JSON file
export function storeEngagementData(data) {
    fs.writeFileSync(engagementDataPath, JSON.stringify(data, null, 4), 'utf-8');
}

// Format engagement time as minutes and seconds
function formatEngagementTime(seconds) {
    if (seconds === 0) return '0 sec';  // Handle zero case specifically
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return minutes > 0 ? `${minutes} min ${remainingSeconds} sec` : `${remainingSeconds} sec`;
}

// Compare new data with stored data and return the change
export function compareEngagementTime(newData) {
    const storedData = getStoredEngagementData();
    const result = {};

    // Define a threshold for "no change"
    const CHANGE_THRESHOLD = 0.5; // 0.5 seconds

    newData.forEach((row) => {
        const country = row.country;

        // Ensure engagementDuration and activeUsers are valid numbers
        const activeUsers = parseFloat(row.activeUsers) || 0;
        const engagementDuration = parseFloat(row.userEngagementDuration) || 0;

        // Calculate avgEngagedTimePerUser, ensuring no NaN issues
        const avgEngagedTimePerUser = (isNaN(engagementDuration) || isNaN(activeUsers) || activeUsers === 0)
            ? 0
            : engagementDuration / activeUsers;

        const newEngagementTime = avgEngagedTimePerUser;

        // Retrieve the stored engagement time
        const storedEngagementTime = storedData[country]?.avgEngagementTime || 0;
        const change = newEngagementTime - storedEngagementTime;

        // Format the change
        let changeText = 'no change';
        let arrow = '';
        if (Math.abs(change) > CHANGE_THRESHOLD) {
            if (change > 0) {
                changeText = `+${Math.round(change)} sec`;
                arrow = ':up-arrow:';
            } else if (change < 0) {
                changeText = `${Math.round(change)} sec`;
                arrow = ':down-arrow:';
            }
        }

        // Format the new engagement time for display (e.g., 1 min, 45 sec)
        const formattedNewEngagementTime = formatEngagementTime(newEngagementTime);

        result[country] = {
            engagementTimeChange: changeText,
            arrow: arrow,
            newEngagementTime: formattedNewEngagementTime,
            userCount: row.activeUsers,
            bounceRate: (parseFloat(row.bounceRate) * 100).toFixed(2) // Assuming bounceRate is part of newData
        };

        // Update the stored data with the new engagement time
        storedData[country] = { avgEngagementTime: newEngagementTime }; // Store as float for precision
    });

    // Store the updated data
    storeEngagementData(storedData);

    return result;
}
