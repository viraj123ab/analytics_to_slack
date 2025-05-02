import getAnalyticsData from './data_fetcher/googleAnalytics.js';
import sendToSlack from './slack_notifier/slack_notifier.js';
import cron from 'node-cron';
import { fetchCountryData } from './data_fetcher/fetchCountryData.js';
import { generateCountryTableImage } from './graph_generator/generateCountryTableImage.js';
import { sendCountryReportToSlack } from './slack_notifier/sendCountryReportToSlack.js';
import express from 'express';

// Create an Express app (even though we won't be using it for HTTP requests)
const app = express();

// Basic server that listens on the provided port (Render assigns the PORT environment variable)
const port = process.env.PORT || 3000; // Render assigns the port automatically
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Schedule task to run every day at 9:30 AM (in UTC)
cron.schedule('10 10 * * *', async () => {
  try {
    console.log('Fetching data from Google Analytics...');
    const analyticsData = await getAnalyticsData();
    console.log('Generating graph...');
    await sendToSlack(analyticsData);
    console.log('Report1 sent to Slack successfully!');

    await delay(5000);

    // Step 1: Fetch country-level data from Google Analytics
    console.log('Fetching country-level data from Google Analytics...');
    const countryData = await fetchCountryData();  
    console.log('Generating country table image...');
    const imagePath = generateCountryTableImage(countryData);  
    console.log('Sending country report to Slack...');
    await sendCountryReportToSlack(countryData, imagePath);  // Pass the country data (newData) to this function

    console.log('Country report sent to Slack successfully!');

  } catch (error) {
    console.error('Error during automation:', error);
  }
});

// Delay function to pause execution for a set amount of time
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
