import { WebClient } from '@slack/web-api';
import generateGraph from '../graph_generator/graphGenerator.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  loadPreviousEngagements,
  saveEngagements,
  compareEngagements
} from '../utils/engagementUtils.js';

dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
const channelId = process.env.SLACK_CHANNEL_ID;
const web = new WebClient(slackToken);
const slackUserId = process.env.SLACK_USER_ID;

const periodLabels = {
  last_7_days: 'a week',
  last_14_days: '14 days',
  last_28_days: '28 days',
  last_30_days: '30 days',
  last_60_days: '60 days',
};

async function sendToSlack(allAnalyticsData) {
  const periods = Object.keys(periodLabels);
  const engagementNow = {};
  const previous = loadPreviousEngagements();
  const filesToUpload = [];

  // Generate graphs and save the engagement times
  for (const period of periods) {
    const dataset = allAnalyticsData.find(d => d.label === period);
    if (!dataset || !dataset.combined) continue;

    const fileName = `active_users_${period}.png`;
    const imagePath = path.join(process.cwd(), 'graphs', fileName);

    const engagement = generateGraph(dataset.combined, period);
    engagementNow[period] = engagement;

    // Push the image path to the filesToUpload array
    filesToUpload.push({
      path: imagePath
    });

    // await new Promise(res => setTimeout(res, 300)); // Ensuring files are flushed
  }

  // 1. Post engagement summary message first
  const summaryText = `<@${slackUserId}> sir, please find the graphs for the engagement time\n\n${compareEngagements(engagementNow, previous, periodLabels)}`;
await web.chat.postMessage({
  channel: channelId,
  text: summaryText
});

  // 2. Upload all graph images without titles or extra messages
  for (const file of filesToUpload) {
    const imageBuffer = fs.readFileSync(file.path);
    await web.files.uploadV2({
      channel_id: channelId,
      file: imageBuffer,
      filename: path.basename(file.path)
    });
    await fs.promises.unlink(file.path); // Delete image after upload
  }

  // 3. Save the new engagement times for comparison in the next cycle
  saveEngagements(engagementNow);
}

export default sendToSlack;
