import { WebClient } from '@slack/web-api';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
import { compareEngagementTime } from '../utils/engagementData.js';  // Import the comparison function

const slackToken = process.env.SLACK_BOT_TOKEN;
const channelId = process.env.SLACK_CHANNEL_ID;
const slackUserId = process.env.SLACK_USER_ID;  // Add Slack user ID as an environment variable
const web = new WebClient(slackToken);

export async function sendCountryReportToSlack(newData, imagePath) {
  try {
    // Compare the new data with the stored data
    const comparison = compareEngagementTime(newData);

    // Prepare the message with Slack mention
    const indiaData = comparison['India'];
    const usaData = comparison['United States'];

    const message = `
      <@${slackUserId}> sir, the average engagement time and User count of India and USA for 28 days are as follows:

      • *India* :flag-in:
            •  Engagement Time: ${indiaData.newEngagementTime} (${indiaData.engagementTimeChange} ${indiaData.arrow})
            •  Bounce rate: ${(parseFloat(newData.find(row => row.country === 'India').bounceRate) * 100).toFixed(2)}%
            •  User Count: ${indiaData.userCount}

      • *USA* :us:
            •  Engagement Time: ${usaData.newEngagementTime} (${usaData.engagementTimeChange} ${usaData.arrow})
            •  Bounce rate: ${(parseFloat(newData.find(row => row.country === 'United States').bounceRate) * 100).toFixed(2)}%
            •  User Count: ${usaData.userCount}
    `;

    // 1. Send the Slack message with the text
    console.log('Sending Slack message...');
    await web.chat.postMessage({
      channel: channelId,
      text: message
    });

    console.log('✅ Slack message sent successfully');

    // 2. Upload the image to Slack
    const imageBuffer = fs.readFileSync(imagePath);  // Read the image file

    console.log('Uploading image to Slack...');
    await web.files.uploadV2({
      channel_id: channelId,
      file: imageBuffer,
      filename: 'country_report.png'
    });

    console.log('✅ Image uploaded to Slack successfully');

  } catch (error) {
    console.error('Error during Slack notification:', error);
  }
}
